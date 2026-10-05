// Sprint 5D — textes courts de la bande « infos clés » du haut de fiche
// (Durée / Groupe / Annulation, ou Séjour / Pension / Annulation).
// Affichage uniquement : aucun prix ni aucune disponibilité n'est calculé ici.

import { CANCELLATION_TEMPLATES, type CancellationTemplateId } from "@/constants/cancellationTemplates";
import { normalizeBoardPreference, type BoardType } from "@/lib/boardTypePreference";

export type HeroLang = "en" | "fr" | "he";

export interface HeroKeyFact {
  key: string;
  label: string;
  /** Vide ou null = la case est masquée. */
  value: string | null;
}

interface CancellationTexts {
  cancellation_policy?: string | null;
  cancellation_policy_fr?: string | null;
  cancellation_policy_he?: string | null;
}

const hours = (n: string, lang: HeroLang) => (lang === "he" ? `${n} שעות` : `${n} h`);
const days = (n: string, lang: HeroLang) =>
  lang === "he" ? `${n} ימים` : lang === "fr" ? `${n} j` : `${n} days`;
const nonRefundable = (lang: HeroLang) =>
  lang === "he" ? "ללא החזר" : lang === "fr" ? "Non remboursable" : "Non-refundable";

const TEMPLATE_SUMMARY: Record<Exclude<CancellationTemplateId, "custom">, (lang: HeroLang) => string> = {
  free_48h: (lang) => hours("48", lang),
  free_7d: (lang) => days("7", lang),
  non_refundable: nonRefundable,
};

const NON_REFUNDABLE_RE = /non[\s-]?refundable|non[\s-]?remboursable|pas remboursable|אינה ניתנת לביטול|ללא החזר/i;
const HOURS_RE = /(\d+)\s*(?:h\b|hours?|heures?|שעות)/i;
const DAYS_RE = /(\d+)\s*(?:days?|jours?|ימים)/i;

/**
 * Résumé court de la politique d'annulation : « 48 h », « 7 j », « Non remboursable ».
 * 1. Si le texte enregistré est l'un des modèles du back-office : résumé exact du modèle.
 * 2. Sinon (texte libre) : premier délai lisible dans le texte.
 * 3. Si rien n'est reconnaissable : null, et la case n'est pas affichée (on ne devine pas).
 */
export function summarizeCancellation(texts: CancellationTexts, lang: HeroLang): string | null {
  const candidates = [texts.cancellation_policy, texts.cancellation_policy_fr, texts.cancellation_policy_he]
    .map((t) => (t ?? "").trim())
    .filter(Boolean);
  if (candidates.length === 0) return null;

  const template = CANCELLATION_TEMPLATES.find((t) =>
    candidates.some((text) => text === t.en || text === t.fr || text === t.he)
  );
  if (template && template.id !== "custom") return TEMPLATE_SUMMARY[template.id](lang);

  for (const text of candidates) {
    if (NON_REFUNDABLE_RE.test(text)) return nonRefundable(lang);
    const h = text.match(HOURS_RE);
    if (h) return hours(h[1], lang);
    const d = text.match(DAYS_RE);
    if (d) return days(d[1], lang);
  }
  return null;
}

/** « 1 à 10 » (ou « 10 » si min = max). */
export function formatGroupRange(min: number | null | undefined, max: number | null | undefined, lang: HeroLang): string | null {
  if (!max || max <= 0) return null;
  const from = min && min > 0 ? min : 1;
  if (from >= max) return String(max);
  return lang === "he" ? `${from} עד ${max}` : lang === "fr" ? `${from} à ${max}` : `${from} to ${max}`;
}

/** « 2 nuits » (nombre de nuits minimum du séjour). */
export function formatMinNights(minNights: number | null | undefined, lang: HeroLang): string | null {
  if (!minNights || minNights <= 0) return null;
  if (lang === "he") return minNights === 1 ? "לילה אחד" : `${minNights} לילות`;
  if (lang === "fr") return `${minNights} nuit${minNights > 1 ? "s" : ""}`;
  return `${minNights} night${minNights > 1 ? "s" : ""}`;
}

const BOARD_SHORT_LABELS: Record<BoardType, Record<HeroLang, string>> = {
  RO: { fr: "Sans repas", en: "Room only", he: "לינה בלבד" },
  BB: { fr: "Petit-déj.", en: "Breakfast", he: "ארוחת בוקר" },
  HB: { fr: "Demi-pension", en: "Half board", he: "חצי פנסיון" },
  FB: { fr: "Pension complète", en: "Full board", he: "פנסיון מלא" },
  AI: { fr: "Tout inclus", en: "All inclusive", he: "הכל כלול" },
};

/** Libellé court de la pension de la fiche (null si aucune pension n'est renseignée). */
export function formatBoard(boardType: unknown, lang: HeroLang): string | null {
  const board = normalizeBoardPreference(boardType);
  return board ? BOARD_SHORT_LABELS[board][lang] : null;
}

const LABELS = {
  duration: { fr: "Durée", en: "Duration", he: "משך" },
  group: { fr: "Groupe", en: "Group", he: "קבוצה" },
  cancellation: { fr: "Annulation", en: "Cancellation", he: "ביטול" },
  stay: { fr: "Séjour", en: "Stay", he: "שהייה" },
  board: { fr: "Pension", en: "Board", he: "פנסיון" },
} as const;

/** Expérience seule : Durée / Groupe / Annulation. */
export function buildStandaloneKeyFacts(
  input: CancellationTexts & { duration: string | null; minParty?: number | null; maxParty?: number | null },
  lang: HeroLang,
): HeroKeyFact[] {
  return [
    { key: "duration", label: LABELS.duration[lang], value: input.duration },
    { key: "group", label: LABELS.group[lang], value: formatGroupRange(input.minParty, input.maxParty, lang) },
    { key: "cancellation", label: LABELS.cancellation[lang], value: summarizeCancellation(input, lang) },
  ];
}

/** Hôtel + expérience : Séjour / Pension / Annulation. */
export function buildHotelKeyFacts(
  input: CancellationTexts & { minNights?: number | null; boardType?: unknown },
  lang: HeroLang,
): HeroKeyFact[] {
  return [
    { key: "stay", label: LABELS.stay[lang], value: formatMinNights(input.minNights, lang) },
    { key: "board", label: LABELS.board[lang], value: formatBoard(input.boardType, lang) },
    { key: "cancellation", label: LABELS.cancellation[lang], value: summarizeCancellation(input, lang) },
  ];
}
