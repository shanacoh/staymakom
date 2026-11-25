// Titres d'onglet / de résultat Google des fiches.
// Hôtels : format de l'audit IA du 24/11/2026. Expériences : règle unique de seoTitle.ts
// (titre SEO saisi, sinon « Titre | Lieu | STAYMAKOM », sans nom de prestataire).
import { experienceSeoTitle } from "./seoTitle.js";

type Lang = "en" | "fr" | "he" | "es" | "ru" | "de";
type Row = Record<string, any>;

function isAutoTitle(seoTitle: string | null | undefined, name: string): boolean {
  if (!seoTitle || !seoTitle.trim()) return true;
  const normalized = seoTitle.trim().toLowerCase();
  return normalized === `${name} | staymakom`.toLowerCase() || normalized === `${name} - staymakom`.toLowerCase();
}

export function hotelPageTitle(name: string, city: string | null | undefined, lang: Lang, seoTitle?: string | null): string {
  if (!isAutoTitle(seoTitle, name)) return seoTitle!.trim();
  const where = city ? ` ${lang === "fr" ? "à" : lang === "he" ? "ב" : "in"}${lang === "he" ? "" : " "}${city}` : "";
  if (lang === "fr") return `${name} | Hôtel et expériences sur mesure${where} | STAYMAKOM`;
  if (lang === "he") return `${name} | מלון וחוויות נבחרות${where} | STAYMAKOM`;
  return `${name} | Hotel & Curated Experiences${where} | STAYMAKOM`;
}

/**
 * Titre SEO saisi pour la langue de la page. Les fiches passent par localizeRow, qui a déjà
 * mis seo_title_fr / seo_title_he dans seo_title_en quand ils existent : on relit donc la
 * colonne de la langue elle-même pour ne jamais servir un titre anglais à une page française.
 */
export function seoTitleForLang(row: Row, lang: Lang): string | null {
  if (lang === "fr" || lang === "he") return row[`seo_title_${lang}`] || null;
  return row.seo_title_en || null;
}

export function experiencePageTitle(row: Row, place: string | null | undefined, lang: Lang): string {
  return experienceSeoTitle({ seoTitle: seoTitleForLang(row, lang), editorialTitle: row.title, place });
}
