// Articles du Journal rédigés par le blog automatique (une langue par article, colonnes
// title / intro / body / faq...). Fichier sans dépendance : lu par le guichet robots ET par le
// site (src/pages/JournalPost.tsx), pour que les deux montrent exactement le même texte.
// RÈGLE : rien n'est importé de src/.

export type ArticleLang = "en" | "he" | "fr";

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface LinkedListing {
  id: string;
  kind: "experience" | "standalone" | "boat";
  path: string;
}

/** Article au nouveau format (sinon : ancien article bilingue en blocs). */
export function isGeneratedArticle(row: Record<string, unknown> | null | undefined): boolean {
  return !!row && typeof row.title === "string" && row.title.trim().length > 0 && Array.isArray(row.body);
}

export function articleLang(row: Record<string, unknown>): ArticleLang {
  return row.lang === "he" || row.lang === "fr" ? row.lang : "en";
}

/** Adresse relative d'un article : anglais = adresse nue, sinon ?lang= (règle du site). */
export function articlePath(slug: string, lang: ArticleLang): string {
  return `/journal/${slug}${lang === "en" ? "" : `?lang=${lang}`}`;
}

/**
 * Versions d'un ancien article bilingue devenues des articles à part (adresse propre) :
 * slug d'origine → langue → nouveau slug. Le guichet robots et le site redirigent (301) ;
 * vercel.json fait de même pour les visiteurs qui arrivent de l'extérieur.
 */
export const MOVED_ARTICLE_VERSIONS: Record<string, Partial<Record<ArticleLang, string>>> = {
  // 25/11/2026 : la version hébreu de l'article Hanoucca était un autre article (cadeau pour un couple).
  "hanukkah-in-israel-2026": { he: "matana-lezug-chanuka" },
};

export function movedArticleSlug(slug: string, lang: string): string | null {
  const target = MOVED_ARTICLE_VERSIONS[slug]?.[lang as ArticleLang];
  return target || null;
}

export const BOOKING_HEADING: Record<ArticleLang, string> = {
  en: "Book it with STAYMAKOM",
  fr: "À réserver avec STAYMAKOM",
  he: "להזמין עם STAYMAKOM",
};

export const FAQ_HEADING: Record<ArticleLang, string> = {
  en: "Frequently asked questions",
  fr: "Questions fréquentes",
  he: "שאלות נפוצות",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Lien interne dans la langue de l'article (les fiches s'ouvrent dans la même langue). */
export function localizeHref(href: string, lang: ArticleLang): string {
  if (!href.startsWith("/") || lang === "en" || /[?&]lang=/.test(href)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}lang=${lang}`;
}

/**
 * Texte d'un paragraphe (liens « [texte](/chemin) » et **gras** seulement) → HTML sûr.
 * Tout le reste est échappé : aucun HTML venant du rédacteur n'est interprété.
 */
export function inlineToHtml(text: string, lang: ArticleLang): string {
  let out = "";
  let last = 0;
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  for (const m of text.matchAll(re)) {
    out += boldToHtml(escapeHtml(text.slice(last, m.index)));
    const href = m[2];
    const safe = href.startsWith("/") ? localizeHref(href, lang) : null;
    out += safe ? `<a href="${escapeHtml(safe)}">${boldToHtml(escapeHtml(m[1]))}</a>` : boldToHtml(escapeHtml(m[1]));
    last = (m.index || 0) + m[0].length;
  }
  out += boldToHtml(escapeHtml(text.slice(last)));
  return out;
}

function boldToHtml(escaped: string): string {
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/** Texte brut (sans liens ni gras), pour les robots et les données structurées. */
export function inlineToText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
}

/** Données structurées « FAQPage » d'un article (un seul bloc par page). */
export function articleFaqJsonLd(faq: ArticleFaq[]): Record<string, unknown> | null {
  const items = (faq || []).filter((f) => f && f.question && f.answer);
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: inlineToText(f.question),
      acceptedAnswer: { "@type": "Answer", text: inlineToText(f.answer) },
    })),
  };
}
