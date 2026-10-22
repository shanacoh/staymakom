import { describe, expect, it } from "vitest";
import { buildCellUpdate, cellMode, computeTotals } from "./entryGrid";
import type { ReservationRow } from "./types";

function row(overrides: Partial<ReservationRow>): ReservationRow {
  const built: ReservationRow = {
    key: "booking:1",
    id: "1",
    source: "booking",
    ref: "77bd",
    type: "experience",
    status: "confirmee",
    client: "Margaux Adda",
    product: "Boat Day",
    partner: null,
    date: "2026-10-20",
    receivedAt: null,
    pax: "2",
    amount: 1000,
    currency: "ILS",
    collected: 500,
    clientPayment: "deposit",
    supplierCost: 600,
    supplierPayment: "todo",
    channelKey: "manual",
    channelLabel: "Manuel",
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
  // Comme la vue SQL : une réservation sans coût a un coût manquant, et doit son coût tant qu'il n'est pas payé.
  if (overrides.missingCosts === undefined) built.missingCosts = built.supplierCost === null ? 1 : 0;
  if (overrides.supplierDue === undefined) built.supplierDue = built.supplierPayment === "todo" ? built.supplierCost : null;
  return built;
}

describe("cellMode", () => {
  it("verrouille montant, encaissé et paiement client d'une réservation en ligne", () => {
    const online = row({ isOnline: true });
    expect(cellMode(online, "amount")).toBe("locked");
    expect(cellMode(online, "collected")).toBe("locked");
    expect(cellMode(online, "clientPayment")).toBe("locked");
    expect(cellMode(online, "supplierCost")).toBe("edit");
  });

  it("la marge n'est jamais modifiable, le reste d'une réservation manuelle l'est", () => {
    expect(cellMode(row({}), "margin")).toBe("readonly");
    expect(cellMode(row({}), "amount")).toBe("edit");
    expect(cellMode(row({}), "type")).toBe("edit");
  });

  it("une demande ne laisse modifier que statut, client, date et notes ; un dossier, rien", () => {
    const request = row({ source: "request", status: "demande" });
    expect(cellMode(request, "notes")).toBe("edit");
    expect(cellMode(request, "amount")).toBe("readonly");
    expect(cellMode(row({ source: "dossier" }), "notes")).toBe("readonly");
  });
});

describe("buildCellUpdate", () => {
  it("écrit dans la bonne table avec la bonne valeur", () => {
    expect(buildCellUpdate(row({}), "supplierCost", "1 300,50")).toEqual({
      ok: true,
      table: "standalone_bookings",
      patch: { supplier_cost: 1300.5 },
    });
    expect(buildCellUpdate(row({}), "clientPayment", "paid")).toMatchObject({ patch: { payment_status: "paid" } });
    expect(buildCellUpdate(row({}), "type", "boat")).toMatchObject({ patch: { product_type: "boat" } });
    expect(buildCellUpdate(row({}), "supplierCost", "")).toMatchObject({ patch: { supplier_cost: null } });
  });

  it("« Passée » se range comme une réservation confirmée, « Annulée » annule", () => {
    expect(buildCellUpdate(row({}), "status", "passee")).toMatchObject({ patch: { status: "confirmed" } });
    expect(buildCellUpdate(row({}), "status", "annulee")).toMatchObject({ patch: { status: "cancelled" } });
  });

  it("refuse une valeur invalide ou une cellule verrouillée", () => {
    expect(buildCellUpdate(row({}), "amount", "abc").ok).toBe(false);
    expect(buildCellUpdate(row({}), "client", "  ").ok).toBe(false);
    expect(buildCellUpdate(row({ isOnline: true }), "amount", "10").ok).toBe(false);
    expect(buildCellUpdate(row({}), "margin", "10").ok).toBe(false);
  });

  it("une demande repassée en « Demande » garde la trace de son envoi au prestataire", () => {
    const sent = row({ source: "request", status: "dispo_ok", sentToProviderAt: "2026-10-06T08:00:00Z" });
    expect(buildCellUpdate(sent, "status", "demande")).toMatchObject({
      table: "standalone_experience_requests",
      patch: { status: "sent_to_provider" },
    });
  });
});

describe("computeTotals", () => {
  it("ignore les demandes et les annulations", () => {
    const totals = computeTotals([
      row({}),
      row({ key: "b2", supplierCost: null }),
      row({ key: "r1", source: "request", status: "demande", amount: 3900 }),
      // Annulée, client remboursé en totalité, prestataire pas payé : marge d'annulation nulle.
      row({ key: "b3", status: "annulee", clientPayment: "refunded", collected: 0, supplierPayment: "todo" }),
    ]);
    expect(totals.amount).toEqual({ ILS: 2000 });
    expect(totals.collected).toEqual({ ILS: 1000 });
    expect(totals.costs).toEqual({ ILS: 600 });
    expect(totals.knownMargin).toEqual({ ILS: 400 });
  });
});

describe("réservation d'hôtel dans la grille", () => {
  const hotel = (overrides: Partial<ReservationRow> = {}) =>
    row({ source: "hotel", type: "hotel", supplierPayment: "none", amount: 2000, supplierCost: 1500, ...overrides });

  it("saisie à la main : modifiable, dates comprises ; synchronisée : seules les notes", () => {
    expect(cellMode(hotel(), "amount")).toBe("edit");
    expect(cellMode(hotel(), "date")).toBe("edit");
    expect(cellMode(hotel(), "partner")).toBe("readonly");
    expect(cellMode(hotel({ isOnline: true }), "client")).toBe("readonly");
    expect(cellMode(hotel({ isOnline: true }), "notes")).toBe("edit");
  });

  it("la commission suit le montant et le coût", () => {
    expect(buildCellUpdate(hotel(), "amount", "2400")).toEqual({
      ok: true,
      table: "bookings_hg",
      patch: { sell_price: 2400, commission_amount: 900 },
    });
    expect(buildCellUpdate(hotel(), "supplierCost", "1600")).toMatchObject({ patch: { net_price: 1600, commission_amount: 400 } });
    expect(buildCellUpdate(hotel(), "supplierCost", "abc").ok).toBe(false);
  });

  it("un coût vidé redevient « à saisir », sauf si l'hôtel est noté payé", () => {
    expect(buildCellUpdate(hotel({ supplierPayment: "todo" }), "supplierCost", "")).toMatchObject({
      patch: { net_price: null, commission_amount: 0 },
    });
    expect(buildCellUpdate(hotel({ supplierPayment: "paid" }), "supplierCost", "").ok).toBe(false);
  });

  it("le paiement de l'hôtel se note à la main, une fois le coût connu", () => {
    expect(cellMode(hotel({ supplierPayment: "todo" }), "supplierPayment")).toBe("edit");
    expect(buildCellUpdate(hotel({ supplierPayment: "todo" }), "supplierPayment", "paid")).toMatchObject({
      patch: { supplier_payment_status: "paid" },
    });
    expect(buildCellUpdate(hotel({ supplierPayment: "todo", supplierCost: null }), "supplierPayment", "paid").ok).toBe(false);
    expect(buildCellUpdate(hotel({ supplierPayment: "paid" }), "supplierPayment", "todo")).toMatchObject({
      patch: { supplier_payment_status: "pending", supplier_paid_at: null },
    });
  });

  it("l'arrivée et les nuits recalculent le départ", () => {
    expect(buildCellUpdate(hotel({ date: "2026-08-10", nights: 2 }), "date", "2026-08-20")).toMatchObject({
      patch: { checkin: "2026-08-20", checkout: "2026-08-22" },
    });
    expect(buildCellUpdate(hotel({ date: "2026-08-10", nights: 2 }), "nights", "3")).toMatchObject({
      patch: { nights: 3, checkout: "2026-08-13" },
    });
    expect(buildCellUpdate(hotel({ date: "2026-08-10" }), "nights", "0").ok).toBe(false);
  });

  it("l'encaissé saisi fixe le paiement : rien, acompte ou tout", () => {
    expect(buildCellUpdate(hotel(), "collected", "500")).toMatchObject({ patch: { payment_status: "deposit_paid", paid_amount: 500 } });
    expect(buildCellUpdate(hotel(), "collected", "2000")).toMatchObject({ patch: { payment_status: "paid", paid_amount: 2000 } });
    expect(buildCellUpdate(hotel(), "collected", "")).toMatchObject({ patch: { payment_status: "unpaid", paid_amount: null } });
  });

  it("l'encaissé suit le paiement client", () => {
    expect(buildCellUpdate(hotel(), "clientPayment", "paid")).toMatchObject({ patch: { payment_status: "paid", paid_amount: 2000 } });
    expect(buildCellUpdate(hotel(), "clientPayment", "unpaid")).toMatchObject({ patch: { payment_status: "unpaid", paid_amount: null } });
  });
});
