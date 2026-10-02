// Sprint 5A : rédige un brouillon d'expérience (standalone ou hôtel) à partir de notes, d'un lien
// et/ou d'un PDF, avec la voix STAYMAKOM (consignes copiées dans _shared/prompts/). Réservée aux
// administrateurs (même contrôle que generate-dossier-brief). Ne remplit jamais prix, disponibilités,
// prestataire ou statut : ce sont des champs métier que seule Shana décide. N'écrit rien en base,
// le brouillon est renvoyé au formulaire qui l'affiche à l'écran.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.127.0";
import { fetchPage } from "../_shared/lookup/lookup.ts";
import { htmlToText } from "../_shared/lookup/parse.ts";
import { parsePublicHttpUrl } from "../_shared/lookup/safe-url.ts";
import { STANDALONE_EXPERIENCE_PROMPT } from "../_shared/prompts/standalone-experience.ts";
import { HOTEL_EXPERIENCE_PROMPT } from "../_shared/prompts/hotel-experience.ts";

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

const AI_TIMEOUT_MS = 90_000;
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5";
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_TOKENS = 8000;

type ExperienceType = "standalone" | "hotel";

// ---------------------------------------------------------------------------
// Schéma de l'outil forcé : correspond aux champs du formulaire expérience
// standalone (src/components/forms/StandaloneExperienceForm.tsx). L'IA ne
// peut PAS produire d'autre champ que ceux-ci : prix, disponibilités et
// prestataire ne sont volontairement pas dans ce schéma.
// ---------------------------------------------------------------------------

const LANG_STRING = { type: "string" as const };

const TOOL_NAME = "fill_experience_form";

function buildToolSchema(categorySlugs: string[]) {
  return {
    name: TOOL_NAME,
    description: "Remplit les champs éditoriaux du formulaire d'expérience STAYMAKOM. Ne jamais inclure de prix, de disponibilité ou d'information prestataire.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: LANG_STRING,
        title_fr: LANG_STRING,
        title_he: LANG_STRING,
        subtitle: LANG_STRING,
        subtitle_fr: LANG_STRING,
        subtitle_he: LANG_STRING,
        long_copy: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
        long_copy_fr: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
        long_copy_he: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
        category_slugs: {
          type: "array",
          description: "1 ou 2 catégories, parmi celles fournies. La première est la catégorie principale.",
          minItems: 1,
          maxItems: 2,
          items: categorySlugs.length ? { type: "string", enum: categorySlugs } : { type: "string" },
        },
        includes: {
          type: "array",
          description: "Exactement 4 éléments.",
          minItems: 4,
          maxItems: 4,
          items: {
            type: "object",
            properties: { title: LANG_STRING, title_fr: LANG_STRING, title_he: LANG_STRING },
            required: ["title", "title_fr", "title_he"],
          },
        },
        extras: {
          type: "array",
          description: "Options payantes genuinement trouvées dans les sources, sans prix. Liste vide si aucune.",
          items: {
            type: "object",
            properties: {
              title: LANG_STRING,
              title_fr: LANG_STRING,
              title_he: LANG_STRING,
              description: LANG_STRING,
            },
            required: ["title", "title_fr", "title_he", "description"],
          },
        },
        duration: LANG_STRING,
        duration_fr: LANG_STRING,
        duration_he: LANG_STRING,
        min_party: { type: "integer", minimum: 1, maximum: 100 },
        max_party: { type: "integer", minimum: 1, maximum: 100 },
        city: LANG_STRING,
        city_fr: LANG_STRING,
        city_he: LANG_STRING,
        region: LANG_STRING,
        region_fr: LANG_STRING,
        region_he: LANG_STRING,
        address: LANG_STRING,
        address_fr: LANG_STRING,
        address_he: LANG_STRING,
        google_maps_link: LANG_STRING,
        practical_info: {
          type: "object",
          description: "Uniquement ce qui est explicitement établi par les sources, sinon laisser null.",
          properties: {
            kids: {
              type: "object",
              properties: {
                status: { type: ["string", "null"], enum: ["yes", "no", null] },
                from_age: { type: ["number", "null"] },
              },
              required: ["status", "from_age"],
            },
            kosher: { type: ["string", "null"], enum: ["yes", "no", "not_relevant", null] },
            parking: {
              type: "object",
              properties: { status: { type: ["string", "null"], enum: ["yes", "no", null] } },
              required: ["status"],
            },
          },
          required: ["kids", "kosher", "parking"],
        },
        accessibility_info: LANG_STRING,
        accessibility_info_fr: LANG_STRING,
        accessibility_info_he: LANG_STRING,
        cancellation_policy: LANG_STRING,
        cancellation_policy_fr: LANG_STRING,
        cancellation_policy_he: LANG_STRING,
        seo_title_en: LANG_STRING,
        seo_title_fr: LANG_STRING,
        seo_title_he: LANG_STRING,
        meta_description_en: LANG_STRING,
        meta_description_fr: LANG_STRING,
        meta_description_he: LANG_STRING,
        og_title_en: LANG_STRING,
        og_title_fr: LANG_STRING,
        og_title_he: LANG_STRING,
        og_description_en: LANG_STRING,
        og_description_fr: LANG_STRING,
        og_description_he: LANG_STRING,
        to_verify: {
          type: "array",
          description: "Phrases courtes en français, ex. « Prix fournisseur trouvé : 310 ₪/pers. », « Langue de l'atelier non précisée ».",
          items: { type: "string" },
        },
      },
      required: ["title", "long_copy", "includes", "to_verify"],
    },
  };
}

// ---------------------------------------------------------------------------
// Validation/nettoyage de ce que l'IA renvoie : un champ douteux ou interdit
// est simplement vidé, jamais propagé tel quel.
// ---------------------------------------------------------------------------

const str = (v: unknown, max = 5000): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, max);
};
const int = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const triState = (v: unknown): "yes" | "no" | "not_relevant" | null =>
  v === "yes" || v === "no" || v === "not_relevant" ? v : null;
const yesNo = (v: unknown): "yes" | "no" | null => (v === "yes" || v === "no" ? v : null);
const strArray = (v: unknown, max = 15): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 300)).slice(0, max) : [];

function cleanIncludeOrExtra(raw: unknown, withDescription: boolean): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = str(o.title, 150);
  if (!title) return null;
  const entry: Record<string, string> = {
    title,
    title_fr: str(o.title_fr, 150) ?? "",
    title_he: str(o.title_he, 150) ?? "",
  };
  if (withDescription) entry.description = str(o.description, 500) ?? "";
  return entry;
}

interface ExperienceDraft {
  title: string;
  title_fr: string | null;
  title_he: string | null;
  subtitle: string | null;
  subtitle_fr: string | null;
  subtitle_he: string | null;
  long_copy: string;
  long_copy_fr: string | null;
  long_copy_he: string | null;
  category_id: string | null;
  category_ids: string[];
  category_slugs: string[];
  includes: Record<string, string>[];
  extras: Record<string, string>[];
  duration: string | null;
  duration_fr: string | null;
  duration_he: string | null;
  min_party: number | null;
  max_party: number | null;
  city: string | null;
  city_fr: string | null;
  city_he: string | null;
  region: string | null;
  region_fr: string | null;
  region_he: string | null;
  address: string | null;
  address_fr: string | null;
  address_he: string | null;
  google_maps_link: string | null;
  practical_info: {
    kids: { status: "yes" | "no" | null; from_age: number | null };
    kosher: "yes" | "no" | "not_relevant" | null;
    parking: { status: "yes" | "no" | null };
  };
  accessibility_info: string | null;
  accessibility_info_fr: string | null;
  accessibility_info_he: string | null;
  cancellation_policy: string | null;
  cancellation_policy_fr: string | null;
  cancellation_policy_he: string | null;
  seo_title_en: string | null;
  seo_title_fr: string | null;
  seo_title_he: string | null;
  meta_description_en: string | null;
  meta_description_fr: string | null;
  meta_description_he: string | null;
  og_title_en: string | null;
  og_title_fr: string | null;
  og_title_he: string | null;
  og_description_en: string | null;
  og_description_fr: string | null;
  og_description_he: string | null;
}

function parseDraft(raw: Record<string, unknown>, categoriesBySlug: Map<string, string>): { draft: ExperienceDraft; toVerify: string[] } {
  const title = str(raw.title, 150);
  if (!title) throw new Error("Titre manquant dans la réponse de l'IA");
  const longCopy = str(raw.long_copy, 8000);
  if (!longCopy) throw new Error("Description manquante dans la réponse de l'IA");

  const includes = Array.isArray(raw.includes)
    ? raw.includes.map((i) => cleanIncludeOrExtra(i, false)).filter((i): i is Record<string, string> => i !== null).slice(0, 4)
    : [];
  const extras = Array.isArray(raw.extras)
    ? raw.extras.map((e) => cleanIncludeOrExtra(e, true)).filter((e): e is Record<string, string> => e !== null)
    : [];

  const requestedSlugs = strArray(raw.category_slugs, 2);
  const unknownSlugs: string[] = [];
  const categoryIds: string[] = [];
  const resolvedSlugs: string[] = [];
  for (const slug of requestedSlugs) {
    const id = categoriesBySlug.get(slug);
    if (id) {
      categoryIds.push(id);
      resolvedSlugs.push(slug);
    } else {
      unknownSlugs.push(slug);
    }
  }

  const practicalRaw = (raw.practical_info && typeof raw.practical_info === "object" ? raw.practical_info : {}) as Record<string, unknown>;
  const kidsRaw = (practicalRaw.kids && typeof practicalRaw.kids === "object" ? practicalRaw.kids : {}) as Record<string, unknown>;
  const parkingRaw = (practicalRaw.parking && typeof practicalRaw.parking === "object" ? practicalRaw.parking : {}) as Record<string, unknown>;

  const draft: ExperienceDraft = {
    title,
    title_fr: str(raw.title_fr, 150),
    title_he: str(raw.title_he, 150),
    subtitle: str(raw.subtitle, 300),
    subtitle_fr: str(raw.subtitle_fr, 300),
    subtitle_he: str(raw.subtitle_he, 300),
    long_copy: longCopy,
    long_copy_fr: str(raw.long_copy_fr, 8000),
    long_copy_he: str(raw.long_copy_he, 8000),
    category_id: categoryIds[0] ?? null,
    category_ids: categoryIds,
    category_slugs: resolvedSlugs,
    includes,
    extras,
    duration: str(raw.duration, 100),
    duration_fr: str(raw.duration_fr, 100),
    duration_he: str(raw.duration_he, 100),
    min_party: int(raw.min_party, 1, 100),
    max_party: int(raw.max_party, 1, 100),
    city: str(raw.city, 150),
    city_fr: str(raw.city_fr, 150),
    city_he: str(raw.city_he, 150),
    region: str(raw.region, 150),
    region_fr: str(raw.region_fr, 150),
    region_he: str(raw.region_he, 150),
    address: str(raw.address, 300),
    address_fr: str(raw.address_fr, 300),
    address_he: str(raw.address_he, 300),
    google_maps_link: str(raw.google_maps_link, 500),
    practical_info: {
      kids: { status: yesNo(kidsRaw.status), from_age: int(kidsRaw.from_age, 0, 18) },
      kosher: triState(practicalRaw.kosher),
      parking: { status: yesNo(parkingRaw.status) },
    },
    accessibility_info: str(raw.accessibility_info, 1000),
    accessibility_info_fr: str(raw.accessibility_info_fr, 1000),
    accessibility_info_he: str(raw.accessibility_info_he, 1000),
    cancellation_policy: str(raw.cancellation_policy, 1000),
    cancellation_policy_fr: str(raw.cancellation_policy_fr, 1000),
    cancellation_policy_he: str(raw.cancellation_policy_he, 1000),
    seo_title_en: str(raw.seo_title_en, 60),
    seo_title_fr: str(raw.seo_title_fr, 60),
    seo_title_he: str(raw.seo_title_he, 60),
    meta_description_en: str(raw.meta_description_en, 155),
    meta_description_fr: str(raw.meta_description_fr, 155),
    meta_description_he: str(raw.meta_description_he, 155),
    og_title_en: str(raw.og_title_en, 60),
    og_title_fr: str(raw.og_title_fr, 60),
    og_title_he: str(raw.og_title_he, 60),
    og_description_en: str(raw.og_description_en, 155),
    og_description_fr: str(raw.og_description_fr, 155),
    og_description_he: str(raw.og_description_he, 155),
  };

  const toVerify = strArray(raw.to_verify, 15);
  for (const slug of unknownSlugs) {
    toVerify.push(`Catégorie proposée par l'IA (« ${slug} ») introuvable dans la liste : à choisir manuellement.`);
  }

  return { draft, toVerify };
}

// ---------------------------------------------------------------------------
// Appel IA
// ---------------------------------------------------------------------------

function loadSystemPrompt(type: ExperienceType): string {
  return type === "hotel" ? HOTEL_EXPERIENCE_PROMPT : STANDALONE_EXPERIENCE_PROMPT;
}

interface GenerateInput {
  type: ExperienceType;
  notes: string | null;
  url: string | null;
  pdfBase64: string | null;
  pdfName: string | null;
}

// deno-lint-ignore no-explicit-any
async function buildUserContent(
  input: GenerateInput,
  categories: { slug: string; name: string }[],
  warnings: string[]
): Promise<any[]> {
  const parts: string[] = [];
  if (input.notes) parts.push(`Notes de Shana :\n"""\n${input.notes}\n"""`);

  if (input.url) {
    const url = parsePublicHttpUrl(input.url);
    if (!url) {
      warnings.push("Le lien fourni n'est pas une adresse web valide : ignoré.");
    } else {
      try {
        const page = await fetchPage(url, { fetchFn: fetch });
        parts.push(`Texte lu sur ${input.url} :\n"""\n${htmlToText(page.html, 6000)}\n"""`);
      } catch (error) {
        warnings.push("Le lien fourni n'a pas pu être lu : la génération continue sans lui.");
        console.warn("generate-experience-draft: lecture URL échouée", error instanceof Error ? error.message : error);
      }
    }
  }

  if (categories.length) {
    parts.push(`Catégories disponibles (choisis 1, exceptionnellement 2, par leur slug) :\n${categories.map((c) => `- ${c.slug} : ${c.name}`).join("\n")}`);
  }

  if (parts.length === 0 && !input.pdfBase64) {
    parts.push("Aucune note ni lien fourni : appuie-toi uniquement sur le PDF joint.");
  }

  const content: any[] = [];
  if (input.pdfBase64) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 },
    });
  }
  content.push({ type: "text", text: parts.join("\n\n") });
  return content;
}

const TECHNICAL_INSTRUCTIONS = `
---
Consignes techniques impératives, au-dessus de tout le reste :
- Tu ne fais pas de recherche web, tu t'appuies uniquement sur les sources fournies (notes, texte du lien, PDF).
- N'invente aucun fait : si une information manque, laisse le champ vide (chaîne vide ou null selon le champ) et ajoute une ligne dans to_verify plutôt que de deviner.
- Chaque fait concret (boisson, plat, lieu, nombre, horaire, équipement, langue) doit venir explicitement des sources fournies. Tu peux écrire avec du style et de l'émotion, mais jamais ajouter un élément concret absent des sources. En cas de doute, ne l'écris pas.
- Ne produis jamais de prix, de disponibilité, d'information sur le prestataire ou de lien de réservation : même si la source en contient, ils ne vont pas dans les champs du formulaire, seulement, si utile, mentionnés dans to_verify.
- Ne produis pas les prompts photos.
- Réponds uniquement via l'outil fourni (fill_experience_form).`;

// ---------------------------------------------------------------------------
// Mode "translate" : traduit un lot de textes FR déjà saisis par Shana vers
// EN et HE, dans la voix STAYMAKOM. Pas de recherche, pas d'invention : une
// vraie traduction du texte fourni, jamais mot à mot, HTML conservé tel quel.
// ---------------------------------------------------------------------------

const TRANSLATE_TOOL_NAME = "translate_texts";

const translateToolSchema = {
  name: TRANSLATE_TOOL_NAME,
  description: "Renvoie la traduction anglaise et hébraïque de chaque texte français fourni.",
  input_schema: {
    type: "object" as const,
    properties: {
      translations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string" },
            en: { type: "string" },
            he: { type: "string" },
          },
          required: ["key", "en", "he"],
        },
      },
    },
    required: ["translations"],
  },
};

const TRANSLATE_INSTRUCTIONS = `
---
Tâche : traduction, pas de rédaction depuis zéro.
- Pour chaque texte français fourni, produis une traduction anglaise et une traduction hébraïque naturelles, dans la voix STAYMAKOM décrite ci-dessus : jamais mot à mot, jamais mécanique.
- Si le texte contient du HTML simple (<p>, <strong>, <em>), conserve exactement la même structure HTML dans les deux traductions.
- Ne recherche rien, n'invente rien, ne complète pas ce qui manque : tu traduis uniquement ce qui est fourni.
- Renvoie une entrée par clé reçue, dans le même ordre, via l'outil fourni (translate_texts).`;

const MAX_TRANSLATE_ENTRIES = 60;

function parseTranslations(raw: unknown): Record<string, { en: string; he: string }> {
  const out: Record<string, { en: string; he: string }> = {};
  if (!Array.isArray(raw)) return out;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const key = str(o.key, 100);
    const en = str(o.en, 8000);
    const he = str(o.he, 8000);
    if (key && (en || he)) out[key] = { en: en ?? "", he: he ?? "" };
  }
  return out;
}

async function handleTranslate(
  req: Request,
  client: Anthropic,
  type: ExperienceType,
  texts: Record<string, string>
): Promise<Response> {
  const entries = Object.entries(texts).filter(([, v]) => typeof v === "string" && v.trim().length > 0).slice(0, MAX_TRANSLATE_ENTRIES);
  if (entries.length === 0) return json(req, { error: "Rien à traduire : aucun texte français fourni." }, 400);

  const systemPrompt = loadSystemPrompt(type) + TRANSLATE_INSTRUCTIONS;
  const userText = entries.map(([key, value]) => `### ${key}\n${value}`).join("\n\n");

  // deno-lint-ignore no-explicit-any
  let response: any;
  try {
    response = await client.messages.create({
      model: Deno.env.get("EXPERIENCE_DRAFT_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
      tools: [translateToolSchema],
      tool_choice: { type: "tool", name: TRANSLATE_TOOL_NAME },
    } as any);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("generate-experience-draft (translate): Claude a répondu", error.status, error.message.slice(0, 300));
    } else {
      console.error("generate-experience-draft (translate): Claude injoignable", error instanceof Error ? error.message : error);
    }
    return json(req, { error: "L'IA n'a pas pu traduire, réessaie dans un instant." }, 503);
  }

  const toolUse = response.content.find((block: any) => block.type === "tool_use" && block.name === TRANSLATE_TOOL_NAME);
  if (!toolUse) {
    console.error("generate-experience-draft (translate): pas de tool_use dans la réponse", response.stop_reason);
    return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
  }

  const translations = parseTranslations((toolUse.input as Record<string, unknown>)?.translations);
  return json(req, { translations });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Réservé aux administrateurs (même contrôle que generate-dossier-brief)
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json(req, { error: "Connexion requise" }, 401);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) return json(req, { error: "Connexion requise" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json(req, { error: "Réservé aux administrateurs" }, 403);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json(req, { error: "Clé IA manquante : ANTHROPIC_API_KEY n'est pas configurée." }, 500);

    const body = await req.json().catch(() => ({}));
    const type: ExperienceType = body?.type === "hotel" ? "hotel" : "standalone";
    const mode: "draft" | "translate" = body?.mode === "translate" ? "translate" : "draft";

    const workspaceIdEarly = Deno.env.get("ANTHROPIC_WORKSPACE_ID");
    const anthropicClient = new Anthropic({
      apiKey,
      timeout: AI_TIMEOUT_MS,
      maxRetries: 1,
      defaultHeaders: workspaceIdEarly ? { "anthropic-workspace-id": workspaceIdEarly } : undefined,
    });

    if (mode === "translate") {
      const texts = body?.texts && typeof body.texts === "object" ? (body.texts as Record<string, unknown>) : {};
      const cleanTexts: Record<string, string> = {};
      for (const [key, value] of Object.entries(texts)) {
        if (typeof key === "string" && typeof value === "string") cleanTexts[key.slice(0, 100)] = value.slice(0, 8000);
      }
      return await handleTranslate(req, anthropicClient, type, cleanTexts);
    }

    const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 20_000) : null;
    const url = typeof body?.url === "string" && body.url.trim() ? body.url.trim() : null;
    const pdfBase64 = typeof body?.pdf_base64 === "string" && body.pdf_base64.trim() ? body.pdf_base64.trim() : null;
    const pdfName = typeof body?.pdf_name === "string" ? body.pdf_name : null;

    if (!notes && !url && !pdfBase64) {
      return json(req, { error: "Donne au moins des notes, un lien ou un PDF." }, 400);
    }
    if (pdfBase64) {
      const approxBytes = (pdfBase64.length * 3) / 4;
      if (approxBytes > MAX_PDF_BYTES) return json(req, { error: "Le PDF dépasse 10 Mo." }, 400);
    }

    const { data: categoriesData } = await supabase.from("categories").select("id, slug, name").order("name");
    const categories = (categoriesData ?? []).map((c) => ({ id: c.id as string, slug: c.slug as string, name: c.name as string }));
    const categoriesBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    const warnings: string[] = [];
    const userContent = await buildUserContent({ type, notes, url, pdfBase64, pdfName }, categories, warnings);

    const systemPrompt = loadSystemPrompt(type) + TECHNICAL_INSTRUCTIONS;
    const tool = buildToolSchema(categories.map((c) => c.slug));

    // deno-lint-ignore no-explicit-any
    let response: any;
    try {
      response = await anthropicClient.messages.create({
        model: Deno.env.get("EXPERIENCE_DRAFT_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
        tools: [tool],
        tool_choice: { type: "tool", name: TOOL_NAME },
      } as any);
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        console.error("generate-experience-draft: Claude a répondu", error.status, error.message.slice(0, 300));
      } else {
        console.error("generate-experience-draft: Claude injoignable", error instanceof Error ? error.message : error);
      }
      return json(req, { error: "L'IA n'a pas pu générer de brouillon, réessaie dans un instant." }, 503);
    }

    const toolUse = response.content.find((block: any) => block.type === "tool_use" && block.name === TOOL_NAME);
    if (!toolUse) {
      console.error("generate-experience-draft: pas de tool_use dans la réponse", response.stop_reason);
      return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
    }

    let draft: ExperienceDraft;
    let toVerify: string[];
    try {
      ({ draft, toVerify } = parseDraft(toolUse.input as Record<string, unknown>, categoriesBySlug));
    } catch (error) {
      console.error("generate-experience-draft: réponse IA invalide", error instanceof Error ? error.message : error);
      return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
    }

    return json(req, { draft, to_verify: toVerify, warnings });
  } catch (error) {
    console.error("generate-experience-draft: erreur inattendue", error);
    return json(req, { error: "Une erreur inattendue est survenue." }, 500);
  }
});
