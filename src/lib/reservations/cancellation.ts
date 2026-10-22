// Annulations, remboursements et avoirs, sans accès à la base ni à l'écran : ce qu'une annulation
// rapporte ou coûte, et ce qu'il faut écrire quand on la saisit.
//
// Marge d'une annulation = (payé par le client − remboursé au client)
//                        − (coût prestataire − ce qu'il rend ou garde en avoir).

import type { RefundMethod, ReservationRow, SupplierRefundStatus } from "./types";

export const REFUND_METHOD_OPTIONS: { value: RefundMethod; label: string }[] = [
  { value: "revolut_business", label: "Revolut Business" },
  { value: "revolut_perso", label: "Compte perso" },
  { value: "especes", label: "Espèces" },
  { value: "avoir_client", label: "Avoir client (déduit d'une autre prestation)" },
  { value: "autre", label: "Autre" },
];

export const SUPPLIER_REFUND_OPTIONS: { value: SupplierRefundStatus; label: string }[] = [
  { value: "none", label: "Rien à récupérer" },
  { value: "a_recuperer", label: "À récupérer" },
  { value: "recupere", label: "Récupéré" },
  { value: "avoir", label: "Gardé en avoir" },
];

/** Ligne annulée, ou remboursée (même partiellement) : elle suit les règles d'annulation. */
export const isCancellation = (row: ReservationRow) =>
  row.status === "annulee" || row.clientPayment === "refunded" || row.refundStatus !== "none";

/** Ce que le client avait payé avant l'annulation. */
export function paidBeforeCancellation(row: ReservationRow): number {
  if (row.keptAmount !== null) return row.keptAmount + (row.refundAmount ?? 0);
  // Remboursement noté avant ce suivi : tout ce qui avait été payé a été rendu.
  if (row.clientPayment === "refunded") return row.refundAmount ?? row.amount ?? 0;
  return row.collected;
}

/** Ce que Staymakom garde de ce que le client a payé. */
export function keptByStaymakom(row: ReservationRow): number {
  if (row.keptAmount !== null) return row.keptAmount;
  const paid = paidBeforeCancellation(row);
  // Sans montant noté, un remboursement ancien a tout rendu.
  const refunded = row.refundAmount ?? (row.clientPayment === "refunded" ? paid : 0);
  return Math.max(paid - refunded, 0);
}

const SUPPLIER_GIVES_BACK: SupplierRefundStatus[] = ["a_recuperer", "recupere", "avoir"];

/**
 * Marge d'une annulation. Le coût compte s'il a été payé au prestataire ; pas payé et rien à
 * récupérer, il n'y a rien à lui verser. Coût payé mais inconnu : marge inconnue.
 */
export function cancellationMargin(row: ReservationRow): number | null {
  const supplierPaid = row.supplierPayment === "paid" || SUPPLIER_GIVES_BACK.includes(row.supplierRefundStatus);
  const cost = supplierPaid ? row.supplierCost : 0;
  if (cost === null) return null;
  const givenBack = SUPPLIER_GIVES_BACK.includes(row.supplierRefundStatus) ? (row.supplierRefundAmount ?? 0) : 0;
  return keptByStaymakom(row) - (cost - givenBack);
}

export type RefundChoice = "none" | "partial" | "total";

export interface CancellationInput {
  paid: number;
  refundChoice: RefundChoice;
  // Montant d'un remboursement partiel.
  refundAmount: number | null;
  refundMethod: RefundMethod | null;
  refundDone: boolean;
  supplierChoice: SupplierRefundStatus;
  supplierAmount: number | null;
  // Envoyer au prestataire l'email automatique d'annulation (réservations d'expérience).
  notifyProvider: boolean;
}

export function refundOf(input: CancellationInput): number {
  if (input.refundChoice === "total") return input.paid;
  if (input.refundChoice === "partial") return input.refundAmount ?? 0;
  return 0;
}

/** Valeurs de départ du panneau, d'après ce qui est déjà noté sur la ligne. */
export function cancellationDefaults(row: ReservationRow): CancellationInput {
  const paid = paidBeforeCancellation(row);
  const refund = row.refundAmount ?? (row.clientPayment === "refunded" ? paid : 0);
  return {
    paid,
    refundChoice: refund <= 0 ? "none" : refund >= paid ? "total" : "partial",
    refundAmount: refund > 0 ? refund : null,
    refundMethod: row.refundMethod,
    refundDone: row.refundStatus === "done" || row.clientPayment === "refunded",
    supplierChoice: row.supplierRefundStatus,
    supplierAmount: row.supplierRefundAmount ?? (row.supplierPayment === "paid" ? row.supplierCost : null),
    // Une date déjà passée a été réglée de vive voix avec le prestataire : pas d'email par défaut.
    notifyProvider: row.date !== null && row.date >= new Date().toISOString().slice(0, 10),
  };
}

/** Raison pour laquelle la saisie est refusée, ou null si elle est valide. */
export function cancellationError(row: ReservationRow, input: CancellationInput): string | null {
  if (!(input.paid >= 0)) return "Montant payé par le client invalide";
  if (input.refundChoice === "partial") {
    const amount = input.refundAmount;
    if (amount === null || !(amount > 0) || amount >= input.paid) {
      return "Un remboursement partiel est supérieur à 0 et inférieur à ce que le client a payé";
    }
  }
  if (input.refundChoice !== "none" && input.paid <= 0) return "Le client n'a rien payé : rien à rembourser";
  if (input.refundChoice !== "none" && !input.refundMethod) return "Choisis le moyen de remboursement";
  if (input.supplierChoice !== "none" && !(input.supplierAmount !== null && input.supplierAmount > 0)) {
    return "Indique le montant côté prestataire";
  }
  const creditUsed = row.supplierRefundStatus === "avoir" && !row.supplierCreditOpen;
  if (creditUsed && (input.supplierChoice !== "avoir" || input.supplierAmount !== row.supplierRefundAmount)) {
    return "Cet avoir a déjà été utilisé sur une autre réservation : le côté prestataire ne se modifie plus";
  }
  return null;
}

/**
 * Ce qu'il faut écrire sur la réservation (table standalone_bookings ou bookings_hg), en une seule
 * modification. Le statut de paiement n'est jamais remis à « payé » ici : ce passage déclenche les
 * emails de confirmation.
 */
export function buildCancellationPatch(row: ReservationRow, input: CancellationInput, now: Date = new Date()): Record<string, unknown> {
  const refund = refundOf(input);
  const patch: Record<string, unknown> = {
    status: "cancelled",
    is_cancelled: true,
    deposit_kept: Math.max(input.paid - refund, 0),
    supplier_refund_status: input.supplierChoice,
    supplier_refund_amount: input.supplierChoice === "none" ? null : input.supplierAmount,
  };
  if (row.status !== "annulee") patch.cancelled_at = now.toISOString();

  if (refund > 0) {
    patch.payment_status = input.refundDone ? "refunded" : "refund_pending";
    patch.refund_amount = refund;
    patch.refund_method = input.refundMethod;
    patch.refunded_at = input.refundDone ? now.toISOString() : null;
  } else {
    patch.refund_amount = null;
    patch.refund_method = null;
    patch.refunded_at = null;
    // Un remboursement noté par erreur est retiré : la ligne n'est plus « remboursée ».
    if (row.refundStatus !== "none" || row.clientPayment === "refunded") {
      patch.payment_status = row.source === "hotel" ? "unpaid" : "pending";
    }
  }

  // Le prestataire d'une expérience reçoit un email automatique à l'annulation, sauf si on le
  // marque comme déjà prévenu (annulation réglée de vive voix, date passée).
  if (row.source === "booking" && row.status !== "annulee" && !input.notifyProvider) {
    patch.provider_cancel_notified_at = now.toISOString();
  }
  return patch;
}
