// Lecture des fiches publiées dans la base (lecture seule, clé publique du site).
import { AUTO_LANGS, type PageLang } from "./site.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

type Row = Record<string, any>;

/** Lecture stricte : lève une erreur si la base ne répond pas (jamais confondu avec « fiche absente »). */
async function fetchRows(table: string, columns: string, query: string): Promise<Row[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase non configuré");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${table} : ${res.status}`);
  return res.json();
}

/** Lecture tolérante pour les compléments (listes, avis...) : liste vide en cas de souci. */
export async function fetchMany(table: string, columns: string, query: string): Promise<Row[]> {
  try {
    return await fetchRows(table, columns, query);
  } catch {
    return [];
  }
}

/**
 * Une fiche publiée par son slug, textes mis dans la langue demandée.
 * null = la base a répondu et la fiche n'existe pas (ou n'est pas publiée) → 404.
 * Base injoignable = erreur levée → le guichet sert la page générique, jamais une 404.
 */
export async function fetchPublishedBySlug(
  table: string,
  columns: string,
  slug: string,
  lang: PageLang
): Promise<Row | null> {
  const rows = await fetchRows(table, columns, `slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`);
  const row = rows[0] || null;
  if (row) await localizeRow(table, row, lang);
  return row;
}

// Table de la base → type de fiche dans content_translations
// (même correspondance que supabase/functions/_shared/translations/catalog.ts).
const ENTITY_BY_TABLE: Record<string, string> = {
  experiences2: "experience2",
  hotels2: "hotel2",
  categories: "category",
  journal_posts: "journal_post",
  standalone_experiences: "standalone_experience",
};

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hasContent(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/**
 * Met les textes d'une fiche dans la langue demandée :
 * - français / hébreu : colonnes saisies dans le back-office (title_fr, seo_title_he, includes_fr...) ;
 * - espagnol / russe / allemand : traductions automatiques, seulement si elles ont été
 *   faites à partir du texte anglais actuel (sinon on garde l'anglais).
 */
export async function localizeRow(table: string, row: Row, lang: PageLang): Promise<void> {
  if (lang === "fr" || lang === "he") {
    for (const key of Object.keys(row)) {
      if (/_(fr|he)$/.test(key)) continue;
      const localized = row[`${key.replace(/_en$/, "")}_${lang}`];
      if (hasContent(localized)) row[key] = localized;
    }
    return;
  }
  if (!AUTO_LANGS.includes(lang) || !row.id || !ENTITY_BY_TABLE[table]) return;
  const translations = await fetchMany(
    "content_translations",
    "field,text,source_hash",
    `entity_type=eq.${ENTITY_BY_TABLE[table]}&entity_id=eq.${encodeURIComponent(row.id)}&locale=eq.${lang}`
  );
  for (const t of translations) {
    const original = row[t.field];
    if (typeof original !== "string" || !original.trim()) continue;
    if ((await sha256Hex(original)) === t.source_hash) row[t.field] = t.text;
  }
}

/** Même chose pour une liste de fiches (textes fr / he uniquement : pas d'appel en plus). */
export function localizeRowsSync(rows: Row[], lang: PageLang): Row[] {
  if (lang !== "fr" && lang !== "he") return rows;
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (/_(fr|he)$/.test(key)) continue;
      const localized = row[`${key.replace(/_en$/, "")}_${lang}`];
      if (hasContent(localized)) row[key] = localized;
    }
  }
  return rows;
}
