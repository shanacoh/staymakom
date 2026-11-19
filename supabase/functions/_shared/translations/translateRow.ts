// Côté serveur (emails) : pose les traductions espagnol / russe / allemand sur une fiche lue
// en base, avec la même règle que le site (src/lib/contentTranslations/overlay.ts) : une
// traduction n'est utilisée que si elle a été faite à partir du texte anglais ACTUEL.
// Sinon le texte anglais reste (mieux vaut l'anglais qu'une consigne ou un horaire périmé).
// Villes et régions ne sont jamais remplacées ici (repères, comme sur le site).

import { TRANSLATABLE_ENTITIES, type EntityType } from "./catalog.ts";
import { hashSource, normalizeSource } from "./plan.ts";

export type AutoLang = "es" | "ru" | "de";

const NEVER_REPLACED = new Set(["city", "region"]);

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

export interface TranslationRow {
  field: string;
  text: string;
  source_hash: string;
}

/** Fonction pure (testée) : copie de la fiche avec les traductions encore valables posées dessus. */
export async function applyRowTranslations<T extends Record<string, unknown>>(
  entityType: EntityType,
  row: T,
  translations: TranslationRow[],
): Promise<T> {
  const out: Record<string, unknown> = { ...row };
  const fields = TRANSLATABLE_ENTITIES[entityType].fields;
  for (const t of translations) {
    if (NEVER_REPLACED.has(t.field) || !(t.field in out)) continue;
    const kind = fields.find((f) => f.column === t.field)?.kind;
    if (!kind) continue;
    const source = normalizeSource(out[t.field], kind);
    if (!source || (await hashSource(source)) !== t.source_hash) continue;
    if (kind === "text" || typeof out[t.field] === "string") {
      out[t.field] = t.text;
    } else {
      try {
        out[t.field] = JSON.parse(t.text);
      } catch {
        // traduction illisible : on garde l'anglais
      }
    }
  }
  return out as T;
}

/**
 * La fiche dans la langue demandée (es / ru / de). La fiche doit contenir son `id`.
 * En cas de souci (pas de traduction, erreur de lecture), la fiche anglaise est rendue telle quelle :
 * un email ne doit jamais échouer à cause d'une traduction.
 */
export async function translateRow<T extends Record<string, unknown>>(
  serviceClient: ServiceClient,
  entityType: EntityType,
  row: T | null | undefined,
  lang: AutoLang,
): Promise<T | null | undefined> {
  if (!row || typeof row.id !== "string") return row;
  try {
    const { data, error } = await serviceClient
      .from("content_translations")
      .select("field, text, source_hash")
      .eq("entity_type", entityType)
      .eq("entity_id", row.id)
      .eq("locale", lang);
    if (error) throw error;
    return await applyRowTranslations(entityType, row, (data ?? []) as TranslationRow[]);
  } catch (err) {
    console.error(`translateRow: traduction ${lang} indisponible pour ${entityType} ${row.id}:`, err);
    return row;
  }
}
