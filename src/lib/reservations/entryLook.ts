// Présentation de la grille de Saisie, façon Excel de Shana, sans accès à la base ni à l'écran :
// état de chaque ligne (et sa teinte), pastilles de paiement, regroupement par mois, marge en %.
// Aucune teinte verte (DA du back-office).

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cancellationMargin, isCancellation, keptByStaymakom, paidBeforeCancellation } from "./cancellation";
import { isRequest, nextAction } from "./rules";
import type { ReservationRow } from "./types";

export type RowState = "fait" | "a_regler" | "demande" | "annule_rembourse" | "annule_pas_paye" | "annule" | "avoir";
export type Tone = "neutral" | "dark" | "amber" | "blue" | "violet" | "yellow";

export const ROW_STATE_LABELS: Record<RowState, string> = {
  fait: "FAIT",
  a_regler: "À RÉGLER",
  demande: "DEMANDE",
  annule_rembourse: "ANNULÉ-REMBOURSÉ",
  annule_pas_paye: "ANNULÉ-PAS PAYÉ",
  annule: "ANNULÉ",
  avoir: "AVOIR",
};

/**
 * État d'une ligne, calculé. Une annulation avec de l'argent encore à rendre ou à récupérer est
 * « à régler » ; un avoir encore ouvert chez le prestataire est « avoir » ; une annulation où
 * Staymakom garde un acompte sans rien rembourser est simplement « annulé ».
 */
export function rowState(row: ReservationRow): RowState {
  if (isRequest(row)) return "demande";
  if (isCancellation(row)) {
    if (row.refundStatus === "todo" || row.supplierRefundStatus === "a_recuperer") return "a_regler";
    if (row.supplierCreditOpen) return "avoir";
    if (paidBeforeCancellation(row) <= 0) return "annule_pas_paye";
    if ((row.refundAmount ?? 0) > 0 || row.clientPayment === "refunded") return "annule_rembourse";
    return "annule";
  }
  return nextAction(row) ? "a_regler" : "fait";
}

export const STATE_TONES: Record<RowState, Tone> = {
  fait: "dark",
  a_regler: "amber",
  demande: "blue",
  annule_rembourse: "violet",
  annule_pas_paye: "violet",
  annule: "violet",
  avoir: "yellow",
};

/** Teinte de la ligne entière : une ligne soldée reste blanche. */
export const rowTone = (state: RowState): Tone => (state === "fait" ? "neutral" : STATE_TONES[state]);

/** Montants barrés : annulation entièrement remboursée, rien n'est gardé. */
export const amountsStruck = (row: ReservationRow) =>
  isCancellation(row) && keptByStaymakom(row) === 0 && ((row.refundAmount ?? 0) > 0 || row.clientPayment === "refunded");

export function clientPaymentLook(row: ReservationRow): { label: string; tone: Tone } | null {
  if (isRequest(row)) return null;
  if (row.refundStatus !== "none" || row.clientPayment === "refunded") {
    return { label: row.refundStatus === "todo" ? "À rembourser" : "Remboursé", tone: "violet" };
  }
  switch (row.clientPayment) {
    case "paid":
      return { label: "Payé", tone: "dark" };
    case "deposit":
      return { label: "Acompte", tone: "blue" };
    default:
      return { label: "Non payé", tone: "amber" };
  }
}

export function supplierPaymentLook(row: ReservationRow): { label: string; tone: Tone } | null {
  if (row.supplierRefundStatus === "avoir") return { label: row.supplierCreditOpen ? "Avoir" : "Avoir utilisé", tone: "yellow" };
  if (row.supplierRefundStatus === "a_recuperer") return { label: "À récupérer", tone: "violet" };
  if (row.supplierRefundStatus === "recupere") return { label: "Récupéré", tone: "dark" };
  if (row.supplierPayment === "paid") return { label: "Payé", tone: "dark" };
  if (row.supplierPayment === "todo") return isCancellation(row) ? null : { label: "À payer", tone: "amber" };
  return null;
}

/** Marge de la ligne (marge d'annulation pour une annulation) et son pourcentage du montant. */
export function marginWithPercent(row: ReservationRow): { value: number; percent: number | null } | null {
  if (isRequest(row)) return null;
  const value = isCancellation(row)
    ? cancellationMargin(row)
    : row.amount === null || row.supplierCost === null
      ? null
      : row.amount - row.supplierCost;
  if (value === null) return null;
  const base = isCancellation(row) ? paidBeforeCancellation(row) : row.amount;
  return { value, percent: base ? Math.round((value / base) * 100) : null };
}

/** Coût fournisseur attendu mais pas saisi : la cellule est hachurée avec un « ? ». */
export const supplierCostMissing = (row: ReservationRow) =>
  !isRequest(row) && row.supplierCost === null && row.supplierPayment === "todo" && !isCancellation(row);

export interface MonthGroup {
  key: string;
  label: string;
  rows: ReservationRow[];
}

/**
 * Lignes regroupées par mois de prestation, dans l'ordre où elles arrivent (la page les trie
 * déjà par date). Une ligne sans date de prestation va dans « Sans date ».
 */
export function groupByMonth(rows: ReservationRow[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const byKey = new Map<string, MonthGroup>();
  for (const row of rows) {
    const key = row.date ? row.date.slice(0, 7) : "sans-date";
    let group = byKey.get(key);
    if (!group) {
      const label = row.date ? format(parseISO(`${key}-01`), "MMMM yyyy", { locale: fr }) : "Sans date";
      group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), rows: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}
