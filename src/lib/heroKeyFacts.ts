// Sprint 5D — textes courts de la bande « infos clés » du haut de fiche
// (Info clé / Annulation pour une expérience seule, ou Séjour / Pension / Annulation).
// Affichage uniquement : aucun prix ni aucune disponibilité n'est calculé ici.

import { CANCELLATION_TEMPLATES, type CancellationTemplateId } from "@/constants/cancellationTemplates";
import { normalizeBoardPreference, type BoardType } from "@/lib/boardTypePreference";
import { t, uiRecord } from "@/lib/translations";
import type { Locale } from "@/lib/locale";

/** Langue de la page (en, fr, he, es, ru, de). */
export type HeroLang = Locale;

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

// Textes dans src/lib/translations.ts, dans la langue reçue (en, fr, he, es, ru, de).
const hours = (n: string, lang: HeroLang): string => t(lang, "durationHours")(n);
const days = (n: string, lang: HeroLang): string => t(lang, "durationDays")(n);
const nonRefundable = (lang: HeroLang) =>
  t(lang, "heroKeyFactsNonRefundable");

const TEMPLATE_SUMMARY: Record<Exclude<CancellationTemplateId, "custom">, (lang: HeroLang) => string> = {
  free_48h: (lang) => hours("48", lang),
  free_24h: (lang) => hours("24", lang),
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

/** « 2 nuits » (nombre de nuits minimum du séjour). */
export function formatMinNights(minNights: number | null | undefined, lang: HeroLang): string | null {
  if (!minNights || minNights <= 0) return null;
  return t(lang, "minNights")(minNights);
}

const BOARD_SHORT_LABELS: Record<BoardType, Record<HeroLang, string>> = {
  RO: uiRecord("heroKeyFactsRoomOnly"),
  BB: uiRecord("heroKeyFactsBreakfast"),
  HB: uiRecord("heroKeyFactsHalfBoard"),
  FB: uiRecord("heroKeyFactsFullBoard"),
  AI: uiRecord("heroKeyFactsAllInclusive"),
};

/** Libellé court de la pension de la fiche (null si aucune pension n'est renseignée). */
export function formatBoard(boardType: unknown, lang: HeroLang): string | null {
  const board = normalizeBoardPreference(boardType);
  return board ? BOARD_SHORT_LABELS[board][lang] : null;
}

const LABELS = {
  cancellation: uiRecord("heroKeyFactsCancellation"),
  stay: uiRecord("heroKeyFactsStay"),
  board: uiRecord("heroKeyFactsBoard"),
  minAge: uiRecord("heroKeyFactsMinAge"),
  groups: uiRecord("heroKeyFactsGroups"),
  privateOnly: uiRecord("heroKeyFactsPrivateOnly"),
} as const;

/**
 * Expérience seule : case choisie par getHeroHighlight (lib/heroHighlight) / Annulation, puis les
 * règles du partenaire quand elles sont renseignées : âge minimum (« 12+ ») et groupes privés uniquement.
 */
export function buildStandaloneKeyFacts(
  input: CancellationTexts & { highlight: HeroKeyFact | null; minAge?: number | null; privateGroupsOnly?: boolean | null },
  lang: HeroLang,
): HeroKeyFact[] {
  return [
    ...(input.highlight ? [input.highlight] : []),
    { key: "cancellation", label: LABELS.cancellation[lang], value: summarizeCancellation(input, lang) },
    { key: "min_age", label: LABELS.minAge[lang], value: input.minAge && input.minAge > 0 ? `${input.minAge}+` : null },
    { key: "private_only", label: LABELS.groups[lang], value: input.privateGroupsOnly ? LABELS.privateOnly[lang] : null },
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
