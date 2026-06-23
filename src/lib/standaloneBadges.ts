import type { Language } from "@/hooks/useLanguage";

export type TriState = "yes" | "no" | "not_relevant" | null;

export interface PracticalBadgesInfo {
  kosher: TriState;
  kids: { status: "yes" | "no" | null; from_age: number | null };
  parking: { status: "yes" | "no" | null; price_type: "free" | "paid" | null; price_amount: string | null };
  fitness: TriState;
  spa: TriState;
}

export const defaultPracticalBadgesInfo: PracticalBadgesInfo = {
  kosher: null,
  kids: { status: null, from_age: null },
  parking: { status: null, price_type: null, price_amount: null },
  fitness: null,
  spa: null,
};

interface RawPracticalInfo {
  kosher?: unknown;
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

  return {
    kosher: toTriState(r.kosher),
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

const LABELS: Record<string, Record<Language, string>> = {
  kosher: { en: "Kosher", he: "כשר", fr: "Casher" },
  fitness: { en: "Fitness center", he: "חדר כושר", fr: "Centre fitness" },
  spa: { en: "Spa", he: "ספא", fr: "Spa" },
  parking_free: { en: "Free parking", he: "חניה חינם", fr: "Parking gratuit" },
  parking_paid: { en: "Paid parking", he: "חניה בתשלום", fr: "Parking payant" },
};

export function getAutoBadgesFromPracticalInfo(
  info: PracticalBadgesInfo,
  lang: Language = "en"
): AutoBadge[] {
  const badges: AutoBadge[] = [];

  if (info.kosher === "yes") badges.push({ key: "kosher", label: LABELS.kosher[lang] });

  if (info.kids.status === "yes" && info.kids.from_age != null) {
    badges.push({ key: "kids", label: `KIDS from ${info.kids.from_age}` });
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

export function getPracticalInfoCompleteness(info: PracticalBadgesInfo): { answered: number; total: number } {
  const fields = [info.kosher !== null, info.kids.status !== null, info.parking.status !== null, info.fitness !== null, info.spa !== null];
  return { answered: fields.filter(Boolean).length, total: fields.length };
}
