// Vue d'ensemble : ce qui demande l'action ou l'attention de Shana, sans accès à la base ni à
// l'écran. Chaque ligne tombe dans un seul groupe d'urgence et porte ses signaux d'alerte.
// Les mêmes règles servent aux puces de filtre et aux chiffres clés cliquables.

import { differenceInCalendarDays, parseISO } from "date-fns";
import { isCancellation } from "./cancellation";
import { isRequest, nextAction } from "./rules";
import type { FocusFilter, ReservationRow } from "./types";

export type UrgencyGroup = "now" | "watch" | "upcoming" | "settled";

export type AttentionSignal = "refund_todo" | "to_recover" | "credit_open" | "missing_cost" | "practical_info" | "to_check";

// Une action à faire sur une prestation dans les 3 prochains jours passe en « à faire maintenant ».
const SOON_DAYS = 3;

export const URGENCY_GROUPS: { key: UrgencyGroup; label: string; hint: string }[] = [
  { key: "now", label: "À faire maintenant", hint: "demandes à traiter, liens à envoyer, remboursements, dates proches" },
  { key: "watch", label: "À surveiller", hint: "coûts à saisir, prestataires à payer, argent à récupérer, avoirs, à vérifier" },
  { key: "upcoming", label: "À venir", hint: "tout est en ordre" },
  { key: "settled", label: "Soldées", hint: "passées ou annulées, plus rien à faire" },
];

export const SIGNAL_LABELS: Record<AttentionSignal, string> = {
  refund_todo: "Remboursement à faire",
  to_recover: "Argent à récupérer chez le prestataire",
  credit_open: "Avoir ouvert chez le prestataire",
  missing_cost: "Coût fournisseur à saisir",
  practical_info: "Infos pratiques incomplètes (point de rendez-vous)",
  to_check: "À vérifier",
};

const daysUntil = (row: ReservationRow, today: Date) => (row.date ? differenceInCalendarDays(parseISO(row.date), today) : null);

/** Les alertes d'une ligne, dans l'ordre d'importance. */
export function attentionSignals(row: ReservationRow, practicalInfoIncomplete = false): AttentionSignal[] {
  const signals: AttentionSignal[] = [];
  if (row.refundStatus === "todo") signals.push("refund_todo");
  if (row.supplierRefundStatus === "a_recuperer") signals.push("to_recover");
  if (row.supplierCreditOpen) signals.push("credit_open");
  if (!isRequest(row) && !isCancellation(row) && row.supplierPayment === "todo" && row.missingCosts > 0) signals.push("missing_cost");
  if (practicalInfoIncomplete) signals.push("practical_info");
  if (row.flagged) signals.push("to_check");
  return signals;
}

export function urgencyOf(row: ReservationRow, today: Date = new Date(), practicalInfoIncomplete = false): UrgencyGroup {
  const action = nextAction(row, today);
  const days = daysUntil(row, today);
  if (action?.urgent) return "now";
  if (action && days !== null && days >= 0 && days <= SOON_DAYS) return "now";
  if (action || attentionSignals(row, practicalInfoIncomplete).length > 0) return "watch";
  if (!isCancellation(row) && days !== null && days >= 0) return "upcoming";
  return "settled";
}

export function groupByUrgency(
  rows: ReservationRow[],
  today: Date = new Date(),
  practicalInfoIncomplete: Set<string> = new Set(),
): Record<UrgencyGroup, ReservationRow[]> {
  const groups: Record<UrgencyGroup, ReservationRow[]> = { now: [], watch: [], upcoming: [], settled: [] };
  for (const row of rows) {
    groups[urgencyOf(row, today, row.source === "booking" && practicalInfoIncomplete.has(row.id))].push(row);
  }
  return groups;
}

/** Puce de filtre ou chiffre clé cliqué : la ligne en fait-elle partie ? */
export function matchesFocus(
  row: ReservationRow,
  focus: FocusFilter,
  today: Date = new Date(),
  practicalInfoIncomplete: Set<string> = new Set(),
): boolean {
  const practical = row.source === "booking" && practicalInfoIncomplete.has(row.id);
  const active = !isRequest(row) && !isCancellation(row);
  switch (focus) {
    case "requests":
      return isRequest(row);
    case "now":
    case "watch":
      return urgencyOf(row, today, practical) === focus;
    case "to_check":
      return row.flagged;
    case "to_collect":
      return active && row.amount !== null && row.amount - row.collected > 0;
    case "to_pay":
      return active && row.supplierPayment === "todo";
    case "missing_cost":
      return attentionSignals(row, practical).includes("missing_cost");
    case "refunds":
      return row.refundStatus === "todo";
    case "to_recover":
      return row.supplierRefundStatus === "a_recuperer" || row.supplierCreditOpen;
  }
}
