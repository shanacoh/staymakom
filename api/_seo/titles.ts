// Titres d'onglet / de résultat Google des fiches, au format recommandé par l'audit IA
// du 24/11/2026. Le titre SEO saisi à la main dans le back-office reste prioritaire,
// sauf s'il n'est que le titre automatique « <Nom> | Staymakom ».

type Lang = "en" | "fr" | "he" | "es" | "ru" | "de";

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

export function experiencePageTitle(title: string, hotelName: string | null | undefined, lang: Lang, seoTitle?: string | null): string {
  if (!isAutoTitle(seoTitle, title)) return seoTitle!.trim();
  if (!hotelName) return `${title} | STAYMAKOM`;
  const at = lang === "fr" ? "à l'hôtel" : lang === "he" ? "ב" : "at";
  return lang === "he" ? `${title} ${at}${hotelName} | STAYMAKOM` : `${title} ${at} ${hotelName} | STAYMAKOM`;
}
