// Petits outils de texte pour les articles générés : adresse (slug), comptage de mots,
// liens internes écrits « [texte](/chemin) » dans les paragraphes.
import type { GeneratedArticle, JournalLang } from "./types.ts";

/** Slug dans la langue de l'article : latin sans accents (en / fr), lettres hébraïques gardées (he). */
export function slugify(raw: string, lang: JournalLang): string {
  let s = raw.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // Points de voyelle et signes de cantillation hébreux (niqqud) : retirés.
  s = s.replace(/[֑-ׇ]/g, "");
  s = s.replace(/['’"״׳]/g, "");
  const allowed = lang === "he" ? /[^a-z0-9א-ת]+/g : /[^a-z0-9]+/g;
  s = s.replace(allowed, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  return s.slice(0, 90).replace(/-+$/, "");
}

export function countWords(text: string): number {
  const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_#>]/g, " ").trim();
  return clean ? clean.split(/\s+/).length : 0;
}

/** Tout le texte lisible de l'article, dans l'ordre de la page. */
export function articleText(a: GeneratedArticle): string {
  return [
    a.h1,
    a.intro,
    ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets || [])]),
    a.booking_intro,
    ...a.faq.flatMap((f) => [f.question, f.answer]),
    a.conclusion,
  ].join("\n");
}

/** Texte compté pour la longueur (titre et métadonnées exclus). */
export function bodyWordCount(a: GeneratedArticle): number {
  return countWords(
    [a.intro, ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets || [])]), a.booking_intro, ...a.faq.flatMap((f) => [f.question, f.answer]), a.conclusion].join(" ")
  );
}

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Chemins des liens internes écrits dans le texte (« ?lang=xx » retiré). */
export function extractLinks(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(LINK_RE)) out.push(m[2]);
  return out;
}

export function normalizePath(href: string): string {
  return href.replace(/^https?:\/\/(www\.)?staymakom\.com/i, "").replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
}
