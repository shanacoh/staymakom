// Case de gauche du haut de fiche standalone (la case « Annulation » reste à droite).
// Choix manuel dans le back-office (colonne hero_highlight), sinon choix selon la catégorie.
// Pour ajouter un type : l'ajouter à HERO_HIGHLIGHT_TYPES, à LABELS et à VALUE_BUILDERS.

import { normalizeLegacyPracticalInfo } from "@/lib/standaloneBadges";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";
import type { HeroKeyFact, HeroLang } from "@/lib/heroKeyFacts";

export const HERO_HIGHLIGHT_TYPES = ["duration", "ages", "group", "kosher", "languages", "private"] as const;
export type HeroHighlightType = (typeof HERO_HIGHLIGHT_TYPES)[number];

export interface HeroHighlightExperience {
  hero_highlight?: string | null;
  /** Catégorie principale. */
  category_id?: string | null;
  duration?: string | null;
  duration_fr?: string | null;
  duration_he?: string | null;
  max_party?: number | null;
  languages?: string[] | null;
  practical_info?: unknown;
  /** Capacités des formules de prix (standalone_experience_price_variants). */
  price_variants?: { max_capacity: number | null; is_active: boolean | null }[] | null;
}

// Catégorie principale (par id, lisible même quand la catégorie est en brouillon hors saison)
// → type affiché par défaut. Toute autre catégorie : durée.
const CATEGORY_DEFAULTS: Record<string, HeroHighlightType> = {
  [BOATS_CATEGORY_ID]: "group", // On the Water
  "381b9fcd-d8d8-4ec9-b8d7-619d702c42d6": "ages", // Family Fun
  "1478887c-aca7-433c-bbb5-4f1101505db2": "kosher", // Foody Discovery
  "3f9e36d1-00d6-4777-87c2-0385439e89c9": "languages", // Land of Stories
};

const LABELS: Record<HeroHighlightType, Record<HeroLang, string>> = {
  duration: { en: "Duration", fr: "Durée", he: "משך" },
  ages: { en: "Ages", fr: "Âge", he: "גילאים" },
  group: { en: "Group", fr: "Groupe", he: "קבוצה" },
  kosher: { en: "Kosher", fr: "Kasher", he: "כשרות" },
  languages: { en: "Languages", fr: "Langues", he: "שפות" },
  private: { en: "Format", fr: "Format", he: "פורמט" },
};

const pick = (lang: HeroLang, en: string, fr: string, he: string) => (lang === "he" ? he : lang === "fr" ? fr : en);

/** « Tous âges », « Dès 6 ans », « Adultes uniquement », ou null si l'âge n'est pas renseigné. */
export function formatAges(practicalInfo: unknown, lang: HeroLang): string | null {
  const raw = (practicalInfo ?? {}) as { adult_only?: unknown };
  const { kids } = normalizeLegacyPracticalInfo(practicalInfo);
  if (kids.status === "no" || raw.adult_only === true) return pick(lang, "Adults only", "Adultes uniquement", "למבוגרים בלבד");
  if (kids.status !== "yes") return null;
  if (kids.from_age == null) return pick(lang, "All ages", "Tous âges", "לכל הגילאים");
  const age = kids.from_age;
  return pick(lang, `From ${age} yrs`, `Dès ${age} ans`, `מגיל ${age}`);
}

/** Capacité max : la plus haute des formules de prix actives, sinon max_party. */
export function maxGroupSize(experience: HeroHighlightExperience): number | null {
  const capacities = (experience.price_variants ?? [])
    .filter((v) => v.is_active && v.max_capacity && v.max_capacity > 0)
    .map((v) => v.max_capacity as number);
  if (capacities.length > 0) return Math.max(...capacities);
  return experience.max_party && experience.max_party > 0 ? experience.max_party : null;
}

const VALUE_BUILDERS: Record<HeroHighlightType, (e: HeroHighlightExperience, lang: HeroLang) => string | null> = {
  duration: (e, lang) => {
    const localized = lang === "fr" ? e.duration_fr : lang === "he" ? e.duration_he : e.duration;
    return localized?.trim() || e.duration?.trim() || null;
  },
  ages: (e, lang) => formatAges(e.practical_info, lang),
  group: (e, lang) => {
    const max = maxGroupSize(e);
    return max ? pick(lang, `Up to ${max}`, `Jusqu'à ${max} pers.`, `עד ${max} משתתפים`) : null;
  },
  kosher: (e, lang) => {
    const { kosher } = normalizeLegacyPracticalInfo(e.practical_info);
    if (kosher === "yes") return pick(lang, "Kosher", "Kasher", "כשר");
    if (kosher === "no") return pick(lang, "Not kosher", "Non kasher", "לא כשר");
    return null;
  },
  languages: (e) => {
    const codes = (e.languages ?? []).filter(Boolean);
    return codes.length > 0 ? codes.map((c) => c.toUpperCase()).join(" · ") : null;
  },
  private: (_e, lang) => pick(lang, "Private", "Privé", "פרטי"),
};

const isHeroHighlightType = (v: unknown): v is HeroHighlightType =>
  typeof v === "string" && (HERO_HIGHLIGHT_TYPES as readonly string[]).includes(v);

/**
 * Case de gauche du haut de fiche : choix manuel, sinon défaut de la catégorie.
 * Si le champ correspondant est vide : durée. Si la durée est vide aussi : null
 * (la case Annulation s'affiche alors seule, jamais de case vide).
 */
export function getHeroHighlight(experience: HeroHighlightExperience, lang: HeroLang): HeroKeyFact | null {
  const chosen: HeroHighlightType = isHeroHighlightType(experience.hero_highlight)
    ? experience.hero_highlight
    : CATEGORY_DEFAULTS[experience.category_id ?? ""] ?? "duration";

  for (const type of chosen === "duration" ? ["duration" as const] : [chosen, "duration" as const]) {
    const value = VALUE_BUILDERS[type](experience, lang);
    if (value) return { key: type, label: LABELS[type][lang], value };
  }
  return null;
}
