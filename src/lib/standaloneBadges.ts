import type { Language } from "@/hooks/useLanguage";
import { ALL_LOCALES, type Locale } from "@/lib/locale";
import { ruPlural } from "@/lib/uiTranslations/ru";

export type TriState = "yes" | "no" | "not_relevant" | null;

export interface PracticalBadgesInfo {
  kosher: TriState;
  synagogue: TriState;
  pool: "yes" | "no" | null;
  kids: { status: "yes" | "no" | null; from_age: number | null };
  parking: { status: "yes" | "no" | null; price_type: "free" | "paid" | null; price_amount: string | null };
  fitness: TriState;
  spa: TriState;
}

export const defaultPracticalBadgesInfo: PracticalBadgesInfo = {
  kosher: null,
  synagogue: null,
  pool: null,
  kids: { status: null, from_age: null },
  parking: { status: null, price_type: null, price_amount: null },
  fitness: null,
  spa: null,
};

interface RawPracticalInfo {
  kosher?: unknown;
  synagogue?: unknown;
  pool?: unknown;
  spa?: unknown;
  fitness?: unknown;
  kids?: { status?: unknown; from_age?: unknown };
  parking?: { status?: unknown; price_type?: unknown; price_amount?: unknown; enabled?: unknown; price?: unknown };
}

const toTriState = (v: unknown): TriState =>
  v === true || v === "yes" ? "yes" : v === false || v === "no" ? "no" : v === "not_relevant" ? "not_relevant" : null;

/**
 * Convertit l'ancienne forme de practical_info (booléens simples, adults_only)
 * vers la nouvelle forme structurée. Les champs sans équivalent direct (ex:
 * adults_only) redeviennent "non répondu" plutôt que d'être mappés à tort.
 */
export function normalizeLegacyPracticalInfo(raw: unknown): PracticalBadgesInfo {
  if (!raw || typeof raw !== "object") return { ...defaultPracticalBadgesInfo };
  const r = raw as RawPracticalInfo;

  const isNewKidsShape = !!r.kids && typeof r.kids === "object" && "from_age" in r.kids;
  const isNewParkingShape = !!r.parking && typeof r.parking === "object" && "status" in r.parking;

  const toBinary = (v: unknown): "yes" | "no" | null =>
    v === true || v === "yes" ? "yes" : v === false || v === "no" ? "no" : null;

  return {
    kosher: toTriState(r.kosher),
    synagogue: toTriState(r.synagogue),
    pool: toBinary(r.pool),
    kids: isNewKidsShape
      ? { status: (r.kids?.status as "yes" | "no" | null) ?? null, from_age: (r.kids?.from_age as number | null) ?? null }
      : { status: null, from_age: null }, // adults_only (ancienne forme) n'a pas d'équivalent direct
    parking: isNewParkingShape
      ? {
          status: (r.parking?.status as "yes" | "no" | null) ?? null,
          price_type: (r.parking?.price_type as "free" | "paid" | null) ?? null,
          price_amount: (r.parking?.price_amount as string | null) ?? null,
        }
      : {
          status: r.parking?.enabled === true ? "yes" : r.parking?.enabled === false ? "no" : null,
          price_type: null,
          price_amount: (r.parking?.price as string) || null,
        },
    fitness: toTriState(r.fitness),
    spa: toTriState(r.spa),
  };
}

interface AutoBadge {
  key: string;
  label: string;
}

const LABELS: Record<string, Record<Locale, string>> = {
  kosher: { en: "Kosher", he: "כשר", fr: "Casher", es: "Kosher", ru: "Кошерно", de: "Koscher" },
  synagogue: { en: "Synagogue nearby", he: "בית כנסת בסביבה", fr: "Synagogue à proximité", es: "Sinagoga cerca", ru: "Синагога рядом", de: "Synagoge in der Nähe" },
  pool: { en: "Swimming pool", he: "בריכת שחייה", fr: "Piscine", es: "Piscina", ru: "Бассейн", de: "Schwimmbad" },
  fitness: { en: "Fitness center", he: "חדר כושר", fr: "Centre fitness", es: "Gimnasio", ru: "Фитнес-зал", de: "Fitnessstudio" },
  spa: { en: "Spa", he: "ספא", fr: "Spa", es: "Spa", ru: "Спа", de: "Spa" },
  parking_free: { en: "Free parking", he: "חניה חינם", fr: "Parking gratuit", es: "Aparcamiento gratuito", ru: "Бесплатная парковка", de: "Kostenloses Parken" },
  parking_paid: { en: "Paid parking", he: "חניה בתשלום", fr: "Parking payant", es: "Aparcamiento de pago", ru: "Платная парковка", de: "Kostenpflichtiges Parken" },
};

export const kidsLabel = (age: number, lang: Locale): string => {
  if (lang === "fr") return `Dès ${age} ans`;
  if (lang === "he") return `מגיל ${age}`;
  if (lang === "es") return `Desde ${age} ${age === 1 ? "año" : "años"}`;
  if (lang === "ru") return `С ${age} ${ruPlural(age, "года", "лет", "лет")}`;
  if (lang === "de") return `Ab ${age} ${age === 1 ? "Jahr" : "Jahren"}`;
  return `From ${age}`;
};

export interface AutoBadgeTag {
  id: string;
  slug: string;
  label_en: string;
  label_he: string | null;
  label_fr: string | null;
  // Langues traduites automatiquement (les badges calculés ne passent pas par la base).
  label_es?: string | null;
  label_ru?: string | null;
  label_de?: string | null;
}

/** Les champs label_xx d'un badge calculé, pour chaque langue du site. */
function labelsFor(label: (locale: Locale) => string) {
  return Object.fromEntries(ALL_LOCALES.map((locale) => [`label_${locale}`, label(locale)])) as Pick<
    AutoBadgeTag,
    "label_en" | "label_he" | "label_fr" | "label_es" | "label_ru" | "label_de"
  >;
}

/**
 * Libellé d'un badge de carte dans la langue de la page. Badges calculés : leur champ label_xx.
 * Badges éditoriaux (base) : en es / ru / de, label_en arrive déjà traduit par la couche de
 * traduction des fiches.
 */
export function highlightTagLabel(
  tag: { label_en: string },
  locale: Locale,
): string {
  const own = (tag as Record<string, unknown>)[`label_${locale}`];
  return typeof own === "string" && own ? own : tag.label_en;
}

/**
 * Pour une expérience seule, « Kosher » ne vient que de l'interrupteur Kosher
 * des informations clés (practical_info.kosher). Le badge éditorial du même nom
 * (toujours utilisé par les expériences avec hôtel) est donc ignoré, sinon la
 * bulle apparaît deux fois ou contredit l'interrupteur.
 */
export const KOSHER_EDITORIAL_TAG_SLUG = "kosher";

export const isKosherEditorialTag = (tag: { slug: string; label_en: string }): boolean =>
  tag.slug === KOSHER_EDITORIAL_TAG_SLUG || tag.label_en.trim().toLowerCase() === "kosher";

export function getAutoBadgeTagsFromPracticalInfo(info: PracticalBadgesInfo): AutoBadgeTag[] {
  const tags: AutoBadgeTag[] = [];

  if (info.kosher === "yes") tags.push({
    id: "auto-kosher", slug: "auto-kosher",
    ...labelsFor((l) => LABELS.kosher[l]),
  });

  if (info.synagogue === "yes") tags.push({
    id: "auto-synagogue", slug: "auto-synagogue",
    ...labelsFor((l) => LABELS.synagogue[l]),
  });

  if (info.pool === "yes") tags.push({
    id: "auto-pool", slug: "auto-pool",
    ...labelsFor((l) => LABELS.pool[l]),
  });

  if (info.kids.status === "yes" && info.kids.from_age != null) {
    const age = info.kids.from_age;
    tags.push({
      id: "auto-kids", slug: "auto-kids",
      ...labelsFor((l) => kidsLabel(age, l)),
    });
  }

  if (info.parking.status === "yes") {
    const isPaid = info.parking.price_type === "paid";
    const amount = isPaid && info.parking.price_amount ? ` – ${info.parking.price_amount}` : "";
    tags.push({
      id: "auto-parking", slug: "auto-parking",
      ...labelsFor((l) => (isPaid ? LABELS.parking_paid[l] : LABELS.parking_free[l]) + amount),
    });
  }

  if (info.fitness === "yes") tags.push({
    id: "auto-fitness", slug: "auto-fitness",
    ...labelsFor((l) => LABELS.fitness[l]),
  });

  if (info.spa === "yes") tags.push({
    id: "auto-spa", slug: "auto-spa",
    ...labelsFor((l) => LABELS.spa[l]),
  });

  return tags;
}

export function getAutoBadgesFromPracticalInfo(
  info: PracticalBadgesInfo,
  lang: Language = "en"
): AutoBadge[] {
  const badges: AutoBadge[] = [];

  if (info.kosher === "yes") badges.push({ key: "kosher", label: LABELS.kosher[lang] });
  if (info.synagogue === "yes") badges.push({ key: "synagogue", label: LABELS.synagogue[lang] });
  if (info.pool === "yes") badges.push({ key: "pool", label: LABELS.pool[lang] });

  if (info.kids.status === "yes" && info.kids.from_age != null) {
    badges.push({ key: "kids", label: kidsLabel(info.kids.from_age, lang) });
  }

  if (info.parking.status === "yes") {
    const base = info.parking.price_type === "paid" ? LABELS.parking_paid[lang] : LABELS.parking_free[lang];
    const label = info.parking.price_type === "paid" && info.parking.price_amount
      ? `${base} – ${info.parking.price_amount}`
      : base;
    badges.push({ key: "parking", label });
  }

  if (info.fitness === "yes") badges.push({ key: "fitness", label: LABELS.fitness[lang] });
  if (info.spa === "yes") badges.push({ key: "spa", label: LABELS.spa[lang] });

  return badges;
}

// Libellé "Parking" pour une ligne de texte (différent des badges-chip ci-dessus) :
// masqué si le statut n'a pas été renseigné.
export function getParkingLabel(parking: PracticalBadgesInfo["parking"], lang: Language): string | null {
  if (parking.status !== "yes") return null;
  const base = parking.price_type === "paid" ? LABELS.parking_paid[lang] : LABELS.parking_free[lang];
  return parking.price_type === "paid" && parking.price_amount ? `${base} · ${parking.price_amount}` : base;
}

export function getPracticalInfoCompleteness(info: PracticalBadgesInfo): { answered: number; total: number } {
  const fields = [info.kosher !== null, info.synagogue !== null, info.pool !== null, info.kids.status !== null, info.parking.status !== null, info.fitness !== null, info.spa !== null];
  return { answered: fields.filter(Boolean).length, total: fields.length };
}
