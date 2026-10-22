import { describe, expect, it } from "vitest";
import { attentionSignals, matchesFocus, urgencyOf } from "./attention";
import type { ReservationRow } from "./types";

const TODAY = new Date("2026-10-22T10:00:00");

function row(overrides: Partial<ReservationRow>): ReservationRow {
  return {
    key: "booking:1",
    id: "1",
    source: "booking",
    ref: "1da9",
    type: "boat",
    status: "confirmee",
    client: "Yaniv Ohana",
    product: "Boat Day with the crew",
    partner: null,
    date: "2026-11-10",
    receivedAt: null,
    pax: "8",
    amount: 4700,
    currency: "ILS",
    collected: 4700,
    clientPayment: "paid",
    supplierCost: 3578,
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
    phone: null,
    nights: null,
    ...overrides,
  };
}

describe("vue d'ensemble : action et attention", () => {
  it("tout est en ordre et la date est à venir : à venir", () => {
    expect(urgencyOf(row({}), TODAY)).toBe("upcoming");
    expect(urgencyOf(row({ date: "2026-08-21", status: "passee" }), TODAY)).toBe("settled");
  });

  it("une action non urgente passe en « à faire maintenant » à 3 jours de la date", () => {
    const supplierToPay = { supplierPayment: "todo" as const, supplierDue: 3578 };
    expect(urgencyOf(row({ ...supplierToPay }), TODAY)).toBe("watch");
    expect(urgencyOf(row({ ...supplierToPay, date: "2026-10-24" }), TODAY)).toBe("now");
  });

  it("un remboursement à faire est urgent, un avoir ouvert est à surveiller", () => {
    expect(urgencyOf(row({ status: "annulee", refundStatus: "todo", refundAmount: 180, keptAmount: 60 }), TODAY)).toBe("now");
    const credit = row({ status: "annulee", date: "2026-08-23", clientPayment: "refunded", refundStatus: "done", refundAmount: 651, keptAmount: 0, supplierRefundStatus: "avoir", supplierRefundAmount: 540, supplierCreditOpen: true });
    expect(urgencyOf(credit, TODAY)).toBe("watch");
    expect(attentionSignals(credit)).toEqual(["credit_open"]);
  });

  it("une ligne en ordre mais marquée à vérifier, ou sans infos pratiques, est à surveiller", () => {
    expect(urgencyOf(row({ flagged: true }), TODAY)).toBe("watch");
    expect(urgencyOf(row({}), TODAY, true)).toBe("watch");
    expect(attentionSignals(row({ flagged: true, supplierPayment: "todo", missingCosts: 1, supplierCost: null }), true)).toEqual([
      "missing_cost",
      "practical_info",
      "to_check",
    ]);
  });

  it("les chiffres clés cliqués filtrent les bonnes lignes", () => {
    expect(matchesFocus(row({ clientPayment: "deposit", collected: 1000 }), "to_collect", TODAY)).toBe(true);
    expect(matchesFocus(row({}), "to_collect", TODAY)).toBe(false);
    expect(matchesFocus(row({ status: "annulee", refundStatus: "todo" }), "refunds", TODAY)).toBe(true);
    expect(matchesFocus(row({ supplierCreditOpen: true }), "to_recover", TODAY)).toBe(true);
    expect(matchesFocus(row({ status: "annulee", supplierPayment: "todo" }), "to_pay", TODAY)).toBe(false);
  });
});
