// Contrôle de forme de l'article renvoyé par le rédacteur : champs obligatoires, longueurs,
// nombre de sections / questions / fiches, liens internes existants.
// Un échec ici déclenche une nouvelle tentative, puis le statut « bloqué ».
import type { GeneratedArticle, ListingContext, TopicType } from "./types.ts";
import { bodyWordCount, countWords, extractLinks, normalizePath, articleText } from "./text.ts";

export const SEO_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 155;

/** Longueur attendue du corps, avec ~10 % de tolérance au-dessus et au-dessous de la consigne. */
export function wordRange(type: TopicType): [number, number] {
  return type === "pilier" || type === "guide" ? [900, 1800] : [630, 1150];
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

/** Remet en forme la réponse brute (types, espaces). Ne corrige jamais le fond. */
export function coerceArticle(raw: unknown): GeneratedArticle {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sections = Array.isArray(r.sections) ? r.sections : [];
  const faq = Array.isArray(r.faq) ? r.faq : [];
  return {
    slug: str(r.slug),
    seo_title: str(r.seo_title),
    meta_description: str(r.meta_description),
    h1: str(r.h1),
    intro: str(r.intro),
    sections: sections.map((s) => {
      const o = (s || {}) as Record<string, unknown>;
      const bullets = strArr(o.bullets);
      return { heading: str(o.heading), paragraphs: strArr(o.paragraphs), ...(bullets.length ? { bullets } : {}) };
    }),
    booking_intro: str(r.booking_intro),
    booking_listing_ids: strArr(r.booking_listing_ids),
    faq: faq.map((f) => {
      const o = (f || {}) as Record<string, unknown>;
      return { question: str(o.question), answer: str(o.answer) };
    }),
    conclusion: str(r.conclusion),
    cover_listing_id: str(r.cover_listing_id),
    cover_alt: str(r.cover_alt),
    secondary_keywords: strArr(r.secondary_keywords).slice(0, 8),
    to_verify: strArr(r.to_verify),
  };
}

export interface ValidationContext {
  topicType: TopicType;
  listings: ListingContext[];
  /** Chemins autorisés en plus des fiches (articles publiés de la même langue, pages de moods...). */
  extraAllowedPaths: string[];
}

export function validateArticle(a: GeneratedArticle, ctx: ValidationContext): string[] {
  const errors: string[] = [];
  for (const key of ["slug", "seo_title", "meta_description", "h1", "intro", "conclusion", "cover_alt", "booking_intro"] as const) {
    if (!a[key]) errors.push(`Champ obligatoire vide : ${key}`);
  }
  if (a.seo_title.length > SEO_TITLE_MAX) errors.push(`Titre SEO trop long (${a.seo_title.length} > ${SEO_TITLE_MAX} caractères)`);
  if (a.meta_description.length > META_DESCRIPTION_MAX) {
    errors.push(`Meta description trop longue (${a.meta_description.length} > ${META_DESCRIPTION_MAX} caractères)`);
  }
  const introWords = countWords(a.intro);
  if (introWords < 35 || introWords > 70) errors.push(`Intro de ${introWords} mots (attendu 40 à 60)`);
  if (a.sections.length < 4 || a.sections.length > 7) errors.push(`${a.sections.length} sections H2 (attendu 4 à 7)`);
  a.sections.forEach((s, i) => {
    if (!s.heading) errors.push(`Section ${i + 1} sans titre`);
    if (!s.paragraphs.length) errors.push(`Section ${i + 1} sans paragraphe`);
  });
  if (a.faq.length < 4 || a.faq.length > 6) errors.push(`${a.faq.length} questions dans la FAQ (attendu 4 à 6)`);
  a.faq.forEach((f, i) => {
    if (!f.question || !f.answer) errors.push(`Question ${i + 1} de la FAQ incomplète`);
  });

  // Chaque élément vérifié en ligne porte l'adresse de sa source (décision du 25/11/2026).
  const unsourced = a.to_verify.filter((item) => !/https?:\/\/\S+/.test(item) && !/date cl[ée] v[ée]rifi[ée]e/i.test(item));
  if (unsourced.length) errors.push(`Point(s) à vérifier sans URL de source : ${unsourced.slice(0, 3).join(" | ")}`);

  const [min, max] = wordRange(ctx.topicType);
  const words = bodyWordCount(a);
  if (words < min || words > max) errors.push(`Longueur de ${words} mots (attendu ${min} à ${max})`);

  const listingIds = new Set(ctx.listings.map((l) => l.id));
  const uniqueBooking = [...new Set(a.booking_listing_ids)];
  if (uniqueBooking.length < 2 || uniqueBooking.length > 4) {
    errors.push(`${uniqueBooking.length} fiche(s) dans le bloc « À réserver » (attendu 2 à 4)`);
  }
  for (const id of uniqueBooking) if (!listingIds.has(id)) errors.push(`Fiche inconnue dans le bloc « À réserver » : ${id}`);
  if (!listingIds.has(a.cover_listing_id)) errors.push(`Photo de couverture : fiche inconnue (${a.cover_listing_id || "vide"})`);

  // Liens internes : uniquement vers les fiches fournies, les articles publiés et les pages autorisées.
  const allowed = new Set([...ctx.listings.map((l) => l.path), ...ctx.extraAllowedPaths].map(normalizePath));
  const links = extractLinks(articleText(a));
  for (const href of links) {
    if (/^https?:\/\//i.test(href) && !/staymakom\.com/i.test(href)) {
      errors.push(`Lien externe interdit : ${href}`);
      continue;
    }
    if (!allowed.has(normalizePath(href))) errors.push(`Lien vers une page inconnue ou non publiée : ${href}`);
  }
  const listingLinks = new Set(links.map(normalizePath).filter((p) => ctx.listings.some((l) => l.path === p)));
  if (listingLinks.size < 2) errors.push(`Seulement ${listingLinks.size} lien(s) vers des fiches dans le texte (attendu 2 à 4)`);
  if (listingLinks.size > 4) errors.push(`${listingLinks.size} liens vers des fiches dans le texte (attendu 2 à 4)`);
  return errors;
}
