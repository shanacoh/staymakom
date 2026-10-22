import { describe, expect, it } from "vitest";
import {
  buildCancellationPatch,
  cancellationDefaults,
  cancellationError,
  cancellationMargin,
  isCancellation,
  type CancellationInput,
} from "./cancellation";
import type { ReservationRow } from "./types";

const NOW = new Date("2026-10-22T10:00:00Z");

function row(overrides: Partial<ReservationRow>): ReservationRow {
  return {
    key: "booking:1",
    id: "1",
    source: "booking",
    ref: "6993",
    type: "experience",
    status: "passee",
    client: "Sarah Toledano",
    product: "Dégustation de vin dans le Néguev",
    partner: null,
    date: "2026-08-14",
    receivedAt: null,
    pax: "2",
    amount: 240,
    currency: "ILS",
    collected: 240,
    clientPayment: "paid",
    supplierCost: 220,
    supplierPayment: "paid",
    channelKey: "whatsapp",
    channelLabel: "Manuel · WhatsApp",
    isOnline: false,
    notes: null,
    sentToProviderAt: null,
    depositDue: null,
    missingCosts: 0,
    supplierDue: null,
    detailPath: null,
    providerId: null,
    refundAmount: null,
    refundStatus: "none",
    refundMethod: null,
    keptAmount: null,
    supplierRefundStatus: "none",
    supplierRefundAmount: null,
    supplierCreditOpen: false,
    flagged: false,
    checkNote: null,
    ...overrides,
  };
}

const input = (overrides: Partial<CancellationInput>): CancellationInput => ({
  paid: 240,
  refundChoice: "none",
  refundAmount: null,
  refundMethod: null,
  refundDone: false,
  supplierChoice: "none",
  supplierAmount: null,
  notifyProvider: false,
  ...overrides,
});

describe("annulations : les cas réels d'août", () => {
  it("dégustation Néguev : 180 ₪ à rendre au client, 220 ₪ à récupérer au domaine", () => {
    const entry = input({ refundChoice: "partial", refundAmount: 180, refundMethod: "revolut_business", supplierChoice: "a_recuperer", supplierAmount: 220 });
    const patch = buildCancellationPatch(row({}), entry, NOW);
    expect(patch).toMatchObject({
      status: "cancelled",
      is_cancelled: true,
      payment_status: "refund_pending",
      refund_amount: 180,
      deposit_kept: 60,
      supplier_refund_status: "a_recuperer",
      supplier_refund_amount: 220,
      provider_cancel_notified_at: NOW.toISOString(),
    });
    const saved = row({ status: "annulee", refundAmount: 180, refundStatus: "todo", keptAmount: 60, supplierRefundStatus: "a_recuperer", supplierRefundAmount: 220 });
    expect(cancellationMargin(saved)).toBe(60);
  });

  it("cours de cuisine : client remboursé depuis le compte perso, le prestataire garde 540 ₪ en avoir", () => {
    const base = row({ amount: 651, collected: 651, supplierCost: 540 });
    const patch = buildCancellationPatch(base, input({ paid: 651, refundChoice: "total", refundMethod: "revolut_perso", refundDone: true, supplierChoice: "avoir", supplierAmount: 540 }), NOW);
    expect(patch).toMatchObject({ payment_status: "refunded", refund_amount: 651, refund_method: "revolut_perso", deposit_kept: 0, supplier_refund_status: "avoir" });
    const saved = { ...base, status: "annulee" as const, clientPayment: "refunded" as const, refundAmount: 651, refundStatus: "done" as const, keptAmount: 0, supplierRefundStatus: "avoir" as const, supplierRefundAmount: 540, supplierCreditOpen: true };
    expect(cancellationMargin(saved)).toBe(0);
  });

  it("bateau annulé avant paiement du prestataire : l'acompte de 500 ₪ est gardé", () => {
    const base = row({ amount: 3000, collected: 500, clientPayment: "deposit", supplierCost: 2000, supplierPayment: "todo" });
    const patch = buildCancellationPatch(base, input({ paid: 500 }), NOW);
    expect(patch).toMatchObject({ deposit_kept: 500, refund_amount: null, supplier_refund_status: "none" });
    expect(patch).not.toHaveProperty("payment_status");
    expect(cancellationMargin({ ...base, status: "annulee", keptAmount: 500 })).toBe(500);
  });

  it("remboursement noté avant ce suivi (Boat Day remboursé) : tout a été rendu, coût inconnu", () => {
    const legacy = row({ status: "confirmee", amount: 3900, collected: 0, clientPayment: "refunded", supplierCost: null, supplierPayment: "todo" });
    expect(isCancellation(legacy)).toBe(true);
    expect(cancellationMargin(legacy)).toBe(0);
    expect(cancellationDefaults(legacy)).toMatchObject({ paid: 3900, refundChoice: "total", refundDone: true });
  });
});

describe("annulations : garde-fous", () => {
  it("un remboursement partiel reste entre 0 et ce que le client a payé, avec un moyen", () => {
    const base = row({});
    expect(cancellationError(base, input({ refundChoice: "partial", refundAmount: 240, refundMethod: "especes" }))).not.toBeNull();
    expect(cancellationError(base, input({ refundChoice: "partial", refundAmount: 100 }))).toBe("Choisis le moyen de remboursement");
    expect(cancellationError(base, input({ refundChoice: "partial", refundAmount: 100, refundMethod: "especes" }))).toBeNull();
  });

  it("le prestataire prévenu par email garde son email, une ligne déjà annulée ne le redéclenche pas", () => {
    expect(buildCancellationPatch(row({}), input({ notifyProvider: true }), NOW)).not.toHaveProperty("provider_cancel_notified_at");
    expect(buildCancellationPatch(row({ status: "annulee" }), input({}), NOW)).not.toHaveProperty("cancelled_at");
  });

  it("un avoir déjà utilisé ne se modifie plus", () => {
    const used = row({ status: "annulee", supplierRefundStatus: "avoir", supplierRefundAmount: 540, supplierCreditOpen: false });
    expect(cancellationError(used, input({ supplierChoice: "recupere", supplierAmount: 540 }))).not.toBeNull();
    expect(cancellationError(used, input({ supplierChoice: "avoir", supplierAmount: 540 }))).toBeNull();
  });

  it("retirer un remboursement noté par erreur ne remet jamais la ligne en « payé »", () => {
    const refunded = row({ status: "annulee", refundStatus: "todo", refundAmount: 100, keptAmount: 140 });
    expect(buildCancellationPatch(refunded, input({}), NOW)).toMatchObject({ payment_status: "pending", refund_amount: null });
    expect(buildCancellationPatch({ ...refunded, source: "hotel" }, input({}), NOW)).toMatchObject({ payment_status: "unpaid" });
  });
});
