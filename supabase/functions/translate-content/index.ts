// translate-content : traduit automatiquement le contenu public (anglais) vers ES / RU / DE.
//
// Appelée par :
//  - la tâche planifiée de nuit (secret « x-cron-secret »), sans connexion au back-office ;
//  - un admin connecté (bouton « Mettre à jour ES / RU / DE maintenant », script initial).
//
// Corps de la requête (tout est facultatif) :
//  - mode : "changed" (défaut : seulement ce qui manque ou a changé) | "all" (retraduit tout l'auto)
//  - entity_type / entity_id : limiter à une fiche (ou à un type de fiche)
//  - locales : sous-ensemble de langues, ex. ["ru"]
//  - dry_run : true = ne traduit rien, compte seulement ce qui serait fait
//  - trigger : "script" pour le journal (sinon déduit de l'appelant)
//  - only_after_israel_hour : ne rien faire avant cette heure d'Israël (tâche de nuit : 3)
//  - continue_until_done : (tâche planifiée seulement) relance un passage tant qu'il reste du travail
//
// Règles (voir _shared/translations/plan.ts) : une traduction « vérifiée » n'est jamais
// écrasée ; si l'anglais change, elle est marquée « source modifiée ».
// La fonction s'arrête proprement avant la limite de temps et indique ce qui reste (remaining) :
// il suffit de la rappeler pour continuer.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.127.0";
import { getAdminEmail, isInternalCron } from "../_shared/internal-auth.ts";
import {
  AUTO_LOCALES,
  childEntityTypes,
  isAutoLocale,
  isEntityType,
  rootEntityTypes,
  TRANSLATABLE_ENTITIES,
  type AutoLocale,
  type EntityType,
  type FieldKind,
  type TranslatableEntity,
} from "../_shared/translations/catalog.ts";
import {
  decideFieldAction,
  hashSource,
  hasLongDash,
  normalizeSource,
  type ExistingTranslation,
  type TranslationMode,
} from "../_shared/translations/plan.ts";
import { buildReviewSystemPrompt, buildTranslationSystemPrompt } from "../_shared/translations/prompt.ts";
import { extractBlockTexts, rebuildBlocks } from "../_shared/translations/blocks.ts";

const ALLOWED_ORIGINS = [
  "https://staymakom.com",
  "https://www.staymakom.com",
  "https://stay-makom-experiences.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

const DEFAULT_MODEL = "claude-sonnet-5-5";
const AI_TIMEOUT_MS = 300_000;
/**
 * Réponse reçue d'un seul bloc (pas au fil de l'eau) : la plateforme n'accorde que 2 secondes de
 * calcul par passage, et lire une réponse morceau par morceau les consomme très vite.
 */
const MAX_OUTPUT_TOKENS = 16_000;
/** Lots traités au plus par passage ; la suite est enchaînée dans un nouveau passage. */
const MAX_JOBS_PER_RUN = 12;
/**
 * On n'entame plus de nouveau lot après ce délai. La plateforme coupe vers 400 s, et un lot
 * déjà commencé (traduction + relecture d'un long article) peut prendre encore 2 à 3 minutes.
 */
const TIME_BUDGET_MS = 200_000;
/** Nombre d'appels à l'IA menés en parallèle. */
const CONCURRENCY = 4;
/** Les petites fiches (régions, étiquettes...) sont regroupées dans un même appel jusqu'à ces limites. */
const GROUP_MAX_CHARS = 6_000;
const GROUP_MAX_ENTRIES = 60;

// deno-lint-ignore no-explicit-any
type Db = any;
type Row = Record<string, unknown> & { id: string };

/** Un champ d'une fiche, avec son texte anglais et son empreinte. */
interface SourceUnit {
  entityType: EntityType;
  entityId: string;
  field: string;
  kind: FieldKind;
  source: string;
  hash: string;
}

/** Un lot à traduire : une fiche (ou plusieurs petites) dans une langue. */
interface Job {
  locale: AutoLocale;
  units: SourceUnit[];
}

interface Stats {
  translated: number;
  skipped: number;
  staleMarked: number;
  errors: number;
  remaining: number;
  errorDetails: string[];
}

const unitKey = (u: { entityType: string; entityId: string; field: string }) => `${u.entityType}|${u.entityId}|${u.field}`;

// ---------------------------------------------------------------------------
// Lecture du contenu publié
// ---------------------------------------------------------------------------

function applyPublishedRules(query: Db, entity: TranslatableEntity) {
  let q = query;
  for (const rule of entity.published) q = q.eq(rule.column, rule.equals);
  return q;
}

async function fetchRows(db: Db, entityType: EntityType, filter: { ids?: string[]; parentIds?: string[] }): Promise<Row[]> {
  const entity: TranslatableEntity = TRANSLATABLE_ENTITIES[entityType];
  const columns = ["id", ...entity.fields.map((f) => f.column)];
  if (entity.parent) columns.push(entity.parent.foreignKey);
  const rows: Row[] = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    let q = db.from(entity.table).select([...new Set(columns)].join(",")).order("id").range(from, from + PAGE - 1);
    q = applyPublishedRules(q, entity);
    if (filter.ids) q = q.in("id", filter.ids);
    if (filter.parentIds && entity.parent) q = q.in(entity.parent.foreignKey, filter.parentIds);
    const { data, error } = await q;
    if (error) throw new Error(`Lecture ${entity.table} : ${error.message}`);
    rows.push(...(data as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function unitsForRow(entityType: EntityType, row: Row): Promise<SourceUnit[]> {
  const entity: TranslatableEntity = TRANSLATABLE_ENTITIES[entityType];
  const units: SourceUnit[] = [];
  for (const field of entity.fields) {
    const source = normalizeSource(row[field.column], field.kind);
    if (source === null) continue;
    units.push({ entityType, entityId: row.id, field: field.column, kind: field.kind, source, hash: await hashSource(source) });
  }
  return units;
}

/** Toutes les fiches publiées à traiter, chacune avec ses sous-lignes (inclus, extras...). */
async function collectFiches(
  db: Db,
  rootTypes: EntityType[],
  entityId: string | null,
): Promise<SourceUnit[][]> {
  const fiches: SourceUnit[][] = [];
  for (const rootType of rootTypes) {
    const roots = await fetchRows(db, rootType, entityId ? { ids: [entityId] } : {});
    if (roots.length === 0) continue;
    const byRoot = new Map<string, SourceUnit[]>();
    for (const root of roots) byRoot.set(root.id, await unitsForRow(rootType, root));

    const rootIds = roots.map((r) => r.id);
    for (const childType of childEntityTypes(rootType)) {
      const fk = (TRANSLATABLE_ENTITIES[childType] as TranslatableEntity).parent!.foreignKey;
      for (let i = 0; i < rootIds.length; i += 100) {
        const children = await fetchRows(db, childType, { parentIds: rootIds.slice(i, i + 100) });
        for (const child of children) {
          byRoot.get(String(child[fk]))?.push(...(await unitsForRow(childType, child)));
        }
      }
    }
    for (const units of byRoot.values()) if (units.length > 0) fiches.push(units);
  }
  return fiches;
}

async function fetchExisting(db: Db, units: SourceUnit[], locales: AutoLocale[]): Promise<Map<string, ExistingTranslation>> {
  const existing = new Map<string, ExistingTranslation>();
  const ids = [...new Set(units.map((u) => u.entityId))];
  // Supabase renvoie au plus 1 000 lignes par lecture : on lit page par page. Sans cela, les
  // traductions au-delà de la 1 000e ligne semblaient manquantes et étaient refaites à chaque passage.
  const PAGE = 1000;
  for (let i = 0; i < ids.length; i += 150) {
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db
        .from("content_translations")
        .select("id,entity_type,entity_id,field,locale,source_hash,status,stale")
        .in("entity_id", ids.slice(i, i + 150))
        .in("locale", locales)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`Lecture des traductions existantes : ${error.message}`);
      for (const r of data ?? []) {
        existing.set(`${r.locale}|${r.entity_type}|${r.entity_id}|${r.field}`, {
          source_hash: r.source_hash,
          status: r.status,
          stale: r.stale,
        });
      }
      if (!data || data.length < PAGE) break;
    }
  }
  return existing;
}

// ---------------------------------------------------------------------------
// Appel à Claude
// ---------------------------------------------------------------------------

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          text: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["key", "text", "items"],
        additionalProperties: false,
      },
    },
  },
  required: ["translations"],
  additionalProperties: false,
};

/**
 * Ce qu'on envoie réellement à l'IA pour un champ : soit un texte, soit une liste de textes
 * (liste « inclus », ou textes extraits d'un article en blocs).
 */
function itemsToSend(u: SourceUnit): string[] | null {
  if (u.kind === "list") return JSON.parse(u.source) as string[];
  if (u.kind === "blocks") return extractBlockTexts(u.source);
  return null;
}

/** Un texte (ou une liste de textes) tel que l'IA le renvoie, avant reconstruction. */
type Draft = string | string[];

function formatEntry(key: string, value: Draft): string {
  if (Array.isArray(value)) {
    return `### ${key} (liste : renvoie chaque élément dans "items", même nombre et même ordre, et "text" vide)\n${JSON.stringify(value)}`;
  }
  return `### ${key} (texte : renvoie le texte dans "text", et "items" vide)\n${value}`;
}

function sourceDraft(u: SourceUnit): Draft {
  return itemsToSend(u) ?? u.source;
}

function buildTranslateMessage(units: SourceUnit[]): string {
  const entries = units.map((u, index) => formatEntry(`k${index + 1}`, sourceDraft(u)));
  return `Traduis chacune des entrées suivantes. Renvoie une entrée par clé (k1, k2...).\n\n${entries.join("\n\n")}`;
}

function buildReviewMessage(units: SourceUnit[], drafts: Map<string, Draft>): string {
  const entries = units.flatMap((u, index) => {
    const draft = drafts.get(unitKey(u));
    if (draft === undefined) return [];
    const key = `k${index + 1}`;
    const source = sourceDraft(u);
    return [`## ${key}\nAnglais d'origine (référence pour le sens, ne pas le renvoyer) :\n${Array.isArray(source) ? JSON.stringify(source) : source}\n\nTraduction à relire :\n${formatEntry(key, draft)}`];
  });
  return `Relis chacune des traductions suivantes et renvoie sa version finale. Renvoie une entrée par clé reçue (k1, k2...).\n\n${entries.join("\n\n")}`;
}

type ParsedEntry = { key: string; text: string; items: string[] };

async function callClaude(client: Anthropic, model: string, system: string, content: string): Promise<Map<string, ParsedEntry>> {
  // deno-lint-ignore no-explicit-any
  const response = await (client.beta.messages as any).create({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    system,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new Error("L'IA a refusé ce lot");
  if (response.stop_reason === "max_tokens") throw new Error("Réponse trop longue, coupée");
  // deno-lint-ignore no-explicit-any
  const textBlock = response.content.find((b: any) => b.type === "text");
  if (!textBlock) throw new Error("Réponse de l'IA sans texte");
  const parsed = JSON.parse(textBlock.text) as { translations?: ParsedEntry[] };
  return new Map((parsed.translations ?? []).map((t) => [t.key, t]));
}

/** Lit la réponse de l'IA pour chaque champ ; un champ incomplet (vide, liste tronquée) est rejeté. */
function readDrafts(units: SourceUnit[], byKey: Map<string, ParsedEntry>): { drafts: Map<string, Draft>; problems: Map<string, string> } {
  const drafts = new Map<string, Draft>();
  const problems = new Map<string, string>();
  units.forEach((u, index) => {
    const t = byKey.get(`k${index + 1}`);
    const sent = itemsToSend(u);
    if (sent) {
      const items = (t?.items ?? []).map((s) => s.trim());
      if (items.length === sent.length && items.every(Boolean)) drafts.set(unitKey(u), items);
      else problems.set(unitKey(u), `${items.length} éléments reçus au lieu de ${sent.length}`);
    } else if (t?.text?.trim()) {
      drafts.set(unitKey(u), t.text);
    } else {
      problems.set(unitKey(u), "texte vide");
    }
  });
  return { drafts, problems };
}

/**
 * Traduit un lot en deux passes :
 *  1. traduction depuis l'anglais ;
 *  2. relecture par un « éditeur natif » qui ne corrige que la langue (calques, grammaire, tournures).
 * Si la relecture échoue pour un champ, on garde la traduction de la passe 1 (signalé dans le journal).
 * Renvoie, pour chaque champ réussi, le texte à enregistrer.
 */
async function translateJob(
  client: Anthropic,
  model: string,
  job: Job,
): Promise<{ ok: Map<string, string>; failed: string[]; notes: string[] }> {
  const failed: string[] = [];
  /** Remarques à relire, qui ne sont pas des erreurs (le texte est bien enregistré). */
  const notes: string[] = [];
  const label = (key: string) => `${key} (${job.locale})`;

  const first = readDrafts(job.units, await callClaude(client, model, buildTranslationSystemPrompt(job.locale), buildTranslateMessage(job.units)));
  for (const [key, problem] of first.problems) failed.push(`${label(key)} : ${problem}`);

  let finals = first.drafts;
  if (first.drafts.size > 0) {
    try {
      const reviewed = readDrafts(
        job.units,
        await callClaude(client, model, buildReviewSystemPrompt(job.locale), buildReviewMessage(job.units, first.drafts)),
      );
      finals = new Map(first.drafts);
      for (const [key, value] of reviewed.drafts) if (first.drafts.has(key)) finals.set(key, value);
      for (const key of reviewed.problems.keys()) {
        if (first.drafts.has(key)) failed.push(`${label(key)} : relecture illisible, traduction non relue gardée`);
      }
    } catch (error) {
      failed.push(`${label(job.units[0].entityType + "|" + job.units[0].entityId)} : relecture impossible (${error instanceof Error ? error.message : error}), traductions non relues gardées`);
    }
  }

  const ok = new Map<string, string>();
  for (const u of job.units) {
    const rawDraft = finals.get(unitKey(u));
    if (rawDraft === undefined) continue;
    const draft = rawDraft;
    // Un tiret long laissé par l'IA n'est jamais corrigé automatiquement (une virgule crée des
    // fautes) : on enregistre le texte et on le signale dans le journal pour que Shana tranche.
    if ((Array.isArray(draft) ? draft : [draft]).some(hasLongDash)) {
      notes.push(`À trancher : tiret long dans ${label(unitKey(u))}`);
    }
    if (!Array.isArray(draft)) {
      ok.set(unitKey(u), draft);
      continue;
    }
    const value = u.kind === "blocks" ? rebuildBlocks(u.source, draft) : JSON.stringify(draft);
    if (value) ok.set(unitKey(u), value);
    else failed.push(`${label(unitKey(u))} : article impossible à reconstruire`);
  }
  return { ok, failed, notes };
}

// ---------------------------------------------------------------------------
// Découpage en lots
// ---------------------------------------------------------------------------

/** Une fiche = un appel par langue ; les toutes petites fiches sont regroupées entre elles. */
function buildJobs(fichesToTranslate: SourceUnit[][], locale: AutoLocale): Job[] {
  const jobs: Job[] = [];
  let current: SourceUnit[] = [];
  let currentChars = 0;
  const flush = () => {
    if (current.length > 0) jobs.push({ locale, units: current });
    current = [];
    currentChars = 0;
  };
  for (const units of fichesToTranslate) {
    const chars = units.reduce((n, u) => n + u.source.length, 0);
    if (chars >= GROUP_MAX_CHARS || units.length >= GROUP_MAX_ENTRIES) {
      jobs.push({ locale, units });
      continue;
    }
    if (currentChars + chars > GROUP_MAX_CHARS || current.length + units.length > GROUP_MAX_ENTRIES) flush();
    current.push(...units);
    currentChars += chars;
  }
  flush();
  return jobs;
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, shouldStart: () => boolean): Promise<number> {
  let next = 0;
  let notStarted = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      if (!shouldStart()) {
        notStarted++;
        continue;
      }
      await worker(item);
    }
  });
  await Promise.all(runners);
  return notStarted;
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

function israelHour(date: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", hourCycle: "h23" }).format(date);
  return Number(hour);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée" }, 405);

  const startedAt = Date.now();
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Qui appelle ? La tâche de nuit (secret) ou un admin connecté. Personne d'autre.
  const fromCron = await isInternalCron(req, db);
  const adminEmail = fromCron ? null : await getAdminEmail(req, db);
  if (!fromCron && !adminEmail) return json(req, { error: "Réservé aux administrateurs" }, 403);

  const body = await req.json().catch(() => ({}));

  // La tâche de nuit est lancée à plusieurs heures UTC (heure d'été / d'hiver) : seuls les passages
  // à partir de l'heure demandée, en heure d'Israël, font quelque chose.
  if (typeof body?.only_after_israel_hour === "number" && israelHour(new Date()) < body.only_after_israel_hour) {
    return json(req, { skipped_window: true });
  }
  const mode: TranslationMode = body?.mode === "all" ? "all" : "changed";
  const dryRun = body?.dry_run === true;
  const trigger = fromCron ? "cron" : body?.trigger === "script" ? "script" : "admin";

  if (body?.entity_type !== undefined && !isEntityType(body.entity_type)) {
    return json(req, { error: `Type de fiche inconnu : ${body.entity_type}` }, 400);
  }
  const entityType: EntityType | null = body?.entity_type ?? null;
  if (entityType && (TRANSLATABLE_ENTITIES[entityType] as TranslatableEntity).parent) {
    return json(req, { error: "Indique la fiche principale (ex. standalone_experience), ses sous-lignes suivent." }, 400);
  }
  const entityId: string | null = typeof body?.entity_id === "string" ? body.entity_id : null;
  if (entityId && !entityType) return json(req, { error: "entity_id demande aussi entity_type" }, 400);

  const locales: AutoLocale[] = Array.isArray(body?.locales)
    ? (body.locales as unknown[]).filter(isAutoLocale)
    : [...AUTO_LOCALES];
  if (locales.length === 0) return json(req, { error: "Aucune langue valide demandée" }, 400);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey && !dryRun) return json(req, { error: "Clé IA manquante : ANTHROPIC_API_KEY n'est pas configurée." }, 500);

  const continueUntilDone = fromCron && body?.continue_until_done === true;
  const filter = { entity_type: entityType, entity_id: entityId, locales, dry_run: dryRun, by: adminEmail };

  // Un passage sur tout le site est exclusif : s'il y en a déjà un en cours, on n'en lance pas un second.
  let runId: string | null = null;
  if (!dryRun) {
    const { data, error } = await db.rpc("begin_content_translation_run", {
      p_trigger: trigger,
      p_mode: mode,
      p_filter: filter,
      p_exclusive: !entityId,
    });
    if (error) return json(req, { error: `Journal des passages : ${error.message}` }, 500);
    if (!data) return json(req, { skipped_busy: true, message: "Une traduction de tout le site est déjà en cours." });
    runId = data as string;
  }

  const stats: Stats = { translated: 0, skipped: 0, staleMarked: 0, errors: 0, remaining: 0, errorDetails: [] };

  try {
    const fiches = await collectFiches(db, entityType ? [entityType] : rootEntityTypes(), entityId);
    const allUnits = fiches.flat();
    const existing = await fetchExisting(db, allUnits, locales);

    // 1. Décider, langue par langue, ce qui est à traduire ou à signaler.
    const jobs: Job[] = [];
    const staleRows: Record<string, string>[] = [];
    let plannedChars = 0;
    for (const locale of locales) {
      const fichesToTranslate: SourceUnit[][] = [];
      for (const units of fiches) {
        const todo: SourceUnit[] = [];
        for (const u of units) {
          const action = decideFieldAction(u.hash, existing.get(`${locale}|${unitKey(u)}`), mode);
          if (action === "translate") todo.push(u);
          else if (action === "mark_stale") {
            staleRows.push({ entity_type: u.entityType, entity_id: u.entityId, field: u.field, locale, source_hash: u.hash });
          } else stats.skipped++;
        }
        if (todo.length > 0) {
          fichesToTranslate.push(todo);
          plannedChars += todo.reduce((n, u) => n + u.source.length, 0);
        }
      }
      jobs.push(...buildJobs(fichesToTranslate, locale));
    }

    // 2. Signaler « source modifiée » sur les traductions vérifiées.
    if (staleRows.length > 0 && !dryRun) {
      const { data, error } = await db.rpc("mark_reviewed_translations_stale", { p_rows: staleRows });
      if (error) throw new Error(`Signalement « source modifiée » : ${error.message}`);
      stats.staleMarked = data ?? 0;
    }

    if (dryRun) {
      const fields = jobs.reduce((n, j) => n + j.units.length, 0);
      return json(req, {
        dry_run: true,
        fiches: fiches.length,
        to_translate: { fields, calls: jobs.length, characters: plannedChars },
        to_mark_stale: staleRows.length,
        skipped: stats.skipped,
      });
    }

    // 3. Traduire, lot par lot, et enregistrer chaque lot en une seule fois.
    const workspaceId = Deno.env.get("ANTHROPIC_WORKSPACE_ID");
    const client = new Anthropic({
      apiKey,
      timeout: AI_TIMEOUT_MS,
      maxRetries: 2,
      defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
    });
    const model = Deno.env.get("TRANSLATE_CONTENT_AI_MODEL") || DEFAULT_MODEL;

    let startedJobs = 0;
    const notStarted = await runPool(
      jobs,
      async (job) => {
        try {
          const { ok, failed, notes } = await translateJob(client, model, job);
          const rows = job.units
            .filter((u) => ok.has(unitKey(u)))
            .map((u) => ({
              entity_type: u.entityType,
              entity_id: u.entityId,
              field: u.field,
              locale: job.locale,
              text: ok.get(unitKey(u)),
              source_hash: u.hash,
            }));
          if (rows.length > 0) {
            const { error } = await db.rpc("save_auto_translations", { p_rows: rows });
            if (error) throw new Error(`Enregistrement : ${error.message}`);
          }
          stats.translated += rows.length;
          stats.errors += failed.length;
          stats.errorDetails.push(...failed, ...notes);
        } catch (error) {
          stats.errors += job.units.length;
          const label = `${job.units[0].entityType}|${job.units[0].entityId} (${job.locale}, ${job.units.length} champs)`;
          const message = error instanceof Error ? error.message : String(error);
          stats.errorDetails.push(`${label} : ${message.slice(0, 300)}`);
          console.error("translate-content :", label, message);
        }
      },
      () => {
        if (Date.now() - startedAt >= TIME_BUDGET_MS || startedJobs >= MAX_JOBS_PER_RUN) return false;
        startedJobs++;
        return true;
      },
    );
    // Une fois le temps écoulé ou le nombre de lots atteint, tous les lots suivants sont sautés :
    // ce sont les derniers de la liste.
    stats.remaining = jobs.slice(jobs.length - notStarted).reduce((n, j) => n + j.units.length, 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stats.errors++;
    stats.errorDetails.push(message);
    console.error("translate-content : échec général", message);
  } finally {
    if (runId) {
      await db
        .from("content_translation_runs")
        .update({
          finished_at: new Date().toISOString(),
          translated: stats.translated,
          skipped: stats.skipped,
          stale_marked: stats.staleMarked,
          errors: stats.errors,
          remaining: stats.remaining,
          error_details: stats.errorDetails.slice(0, 100),
        })
        .eq("id", runId);
    }
  }

  console.log("translate-content :", JSON.stringify({ trigger, mode, ...stats, errorDetails: stats.errorDetails.length }));

  // Gros travail (traduction initiale, nuit chargée) : on relance un passage depuis la base pour
  // finir ce qui reste. Seulement s'il y a eu des progrès, pour ne jamais tourner en boucle sur une erreur.
  if (continueUntilDone && stats.remaining > 0 && stats.translated > 0) {
    const nextBody = { mode, continue_until_done: true, ...(entityType ? { entity_type: entityType } : {}), locales };
    const { error } = await db.rpc("queue_translate_content_continuation", { p_body: nextBody });
    if (error) console.error("translate-content : relance impossible", error.message);
  }
  return json(req, {
    mode,
    translated: stats.translated,
    skipped: stats.skipped,
    stale_marked: stats.staleMarked,
    errors: stats.errors,
    remaining: stats.remaining,
    error_details: stats.errorDetails.slice(0, 20),
  }, stats.errors > 0 && stats.translated === 0 ? 500 : 200);
});
