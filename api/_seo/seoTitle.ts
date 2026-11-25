// Règle UNIQUE du titre Google (balise <title>) d'une fiche expérience, partagée par le
// site (src/pages/Experience2.tsx, StandaloneExperience.tsx) et le guichet robots
// (api/_seo/resolvers.ts). Fichier sans aucune dépendance : le site peut l'importer,
// et il respecte la règle « api/ n'importe rien de src/ ».
//
// 1. Le titre SEO saisi dans le back-office (par langue) est la source du <title>.
// 2. S'il est vide, ou s'il ne fait que recopier le titre éditorial (« SOURCES SECRÈTES
//    DU NÉGUEV »), on fabrique un titre descriptif : « Titre | Lieu | STAYMAKOM »,
//    jamais en majuscules, jamais le nom du prestataire (ni de l'hôtel), 60 caractères max.
// Le titre éditorial affiché sur la page, lui, ne change pas.

export const SEO_TITLE_MAX = 60;
const BRAND_SUFFIX = " | STAYMAKOM";

const SMALL_WORDS = new Set([
  // anglais
  "a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with", "from",
  // français
  "à", "au", "aux", "d", "de", "des", "du", "en", "et", "l", "la", "le", "les", "sur", "dans", "par", "pour",
  // espagnol / allemand courants
  "y", "el", "los", "las", "del", "con", "und", "der", "die", "das", "im", "am",
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s*[|\-–]\s*staymakom\s*$/i, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** true = un titre écrit en majuscules (« GOLDEN HOUR DINNER »), pas un nom propre. */
function isShouting(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^\p{Lu}]/gu, "").length;
  return upper / letters.length > 0.8;
}

/** « SOURCES SECRÈTES DU NÉGUEV » → « Sources Secrètes du Néguev ». Les autres titres restent tels quels. */
export function softenCaps(text: string): string {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!isShouting(clean)) return clean;
  return clean
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      const bare = word.replace(/[^\p{L}]/gu, "");
      if (index > 0 && SMALL_WORDS.has(bare)) return word;
      // Capitalise la première lettre (en gardant « l'» / « d'» en minuscule devant).
      return word.replace(/^([ldLD][’']|[^\p{L}]*)(\p{L})/u, (_m, prefix: string, letter: string) => prefix + letter.toUpperCase());
    })
    .join(" ");
}

/** Le titre SEO saisi est utilisable : rempli et différent du simple titre éditorial. */
export function isUsableSeoTitle(seoTitle: string | null | undefined, editorialTitle: string | null | undefined): boolean {
  if (!seoTitle || !seoTitle.trim()) return false;
  if (!editorialTitle || !editorialTitle.trim()) return true;
  return normalize(seoTitle) !== normalize(editorialTitle);
}

function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : text.slice(0, max)).replace(/[\s,|:;-]+$/, "");
}

/** Titre par défaut : « Titre | Lieu | STAYMAKOM », raccourci pour tenir en 60 caractères. */
export function defaultExperienceSeoTitle(editorialTitle: string, place?: string | null): string {
  const title = softenCaps(editorialTitle);
  const where = String(place || "").trim();
  const candidates = [
    where ? `${title} | ${where}${BRAND_SUFFIX}` : `${title}${BRAND_SUFFIX}`,
    where ? `${title} | ${where}` : title,
  ];
  for (const candidate of candidates) if (candidate.length <= SEO_TITLE_MAX) return candidate;
  return where ? `${cut(title, SEO_TITLE_MAX - where.length - 3)} | ${where}` : cut(title, SEO_TITLE_MAX);
}

/** Titre Google final d'une fiche expérience (avec ou sans hôtel). */
export function experienceSeoTitle(params: {
  seoTitle?: string | null;
  editorialTitle: string;
  place?: string | null;
}): string {
  if (isUsableSeoTitle(params.seoTitle, params.editorialTitle)) return params.seoTitle!.trim();
  return defaultExperienceSeoTitle(params.editorialTitle, params.place);
}

/** Nom du Product (données structurées) : le titre Google sans la signature « | STAYMAKOM ». */
export function productNameFromSeoTitle(seoTitle: string): string {
  return seoTitle.replace(/\s*\|\s*STAYMAKOM\s*$/i, "").trim();
}
