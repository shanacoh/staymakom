import { describe, expect, it } from "vitest";
import {
  amountsStruck,
  clientPaymentLook,
  groupByMonth,
  marginWithPercent,
  rowState,
  rowTone,
  supplierCostMissing,
  supplierPaymentLook,
} from "./entryLook";
import type { ReservationRow } from "./types";

function row(overrides: Partial<ReservationRow>): ReservationRow {
  return {
    key: "booking:1",
    id: "1",
    source: "booking",
    ref: "8436",
    type: "boat",
    status: "passee",
    client: "Lenny Nahmani",
    product: "Boat Day",
    partner: null,
    date: "2026-08-16",
    receivedAt: null,
    pax: "6",
    amount: 4500,
    currency: "ILS",
    collected: 4500,
    clientPayment: "paid",
    supplierCost: 2800,
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
    checkNote: null,
    flagged: false,
    phone: null,
    nights: null,
    ...overrides,
  };
}

describe("grille de Saisie façon Excel", () => {
  it("état et teinte : soldée blanche, reste à régler ambre, demande bleue", () => {
    expect(rowState(row({}))).toBe("fait");
    expect(rowTone(rowState(row({})))).toBe("neutral");
    const unpaidSupplier = row({ supplierPayment: "todo", supplierDue: 2800 });
    expect(rowState(unpaidSupplier)).toBe("a_regler");
    expect(rowTone(rowState(unpaidSupplier))).toBe("amber");
    expect(rowTone(rowState(row({ source: "request", status: "demande" })))).toBe("blue");
  });

  it("annulations : à rembourser = à régler, avoir ouvert = jaune, remboursée = violet barré", () => {
    const neguev = row({ status: "annulee", refundStatus: "todo", refundAmount: 180, keptAmount: 60 });
    expect(rowState(neguev)).toBe("a_regler");
    const cooking = row({ status: "annulee", clientPayment: "refunded", refundStatus: "done", refundAmount: 651, keptAmount: 0, supplierRefundStatus: "avoir", supplierRefundAmount: 540, supplierCreditOpen: true });
    expect(rowState(cooking)).toBe("avoir");
    expect(rowTone("avoir")).toBe("yellow");
    const refunded = { ...cooking, supplierCreditOpen: false };
    expect(rowState(refunded)).toBe("annule_rembourse");
    expect(rowTone(rowState(refunded))).toBe("violet");
    expect(amountsStruck(refunded)).toBe(true);
    expect(rowState(row({ status: "annulee", collected: 0, clientPayment: "unpaid", supplierPayment: "todo" }))).toBe("annule_pas_paye");
    expect(rowState(row({ status: "annulee", collected: 500, clientPayment: "deposit", keptAmount: 500, supplierPayment: "todo" }))).toBe("annule");
  });

  it("pastilles de paiement", () => {
    expect(clientPaymentLook(row({}))).toEqual({ label: "Payé", tone: "dark" });
    expect(clientPaymentLook(row({ clientPayment: "deposit" }))?.tone).toBe("blue");
    expect(clientPaymentLook(row({ refundStatus: "todo" }))).toEqual({ label: "À rembourser", tone: "violet" });
    expect(supplierPaymentLook(row({ supplierPayment: "todo" }))).toEqual({ label: "À payer", tone: "amber" });
    expect(supplierPaymentLook(row({ supplierRefundStatus: "avoir", supplierCreditOpen: true }))?.tone).toBe("yellow");
    expect(supplierPaymentLook(row({ supplierRefundStatus: "a_recuperer" }))?.tone).toBe("violet");
  });

  it("marge en valeur et en pourcentage, coût manquant signalé", () => {
    expect(marginWithPercent(row({}))).toEqual({ value: 1700, percent: 38 });
    expect(marginWithPercent(row({ supplierCost: 5000 }))?.value).toBe(-500);
    expect(supplierCostMissing(row({ supplierCost: null, supplierPayment: "todo" }))).toBe(true);
    expect(supplierCostMissing(row({ supplierCost: null, supplierPayment: "none" }))).toBe(false);
  });

  it("regroupe par mois de prestation, dans l'ordre reçu", () => {
    const groups = groupByMonth([row({ key: "a", date: "2026-09-04" }), row({ key: "b", date: "2026-08-16" }), row({ key: "c", date: "2026-08-12" }), row({ key: "d", date: null })]);
    expect(groups.map((g) => [g.label, g.rows.length])).toEqual([
      ["Septembre 2026", 1],
      ["Août 2026", 2],
      ["Sans date", 1],
    ]);
  });
});
