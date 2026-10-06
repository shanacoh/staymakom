import { describe, expect, it } from "vitest";
import { buildCellUpdate, canDeleteRow, cellMode, computeTotals } from "./entryGrid";
import type { ReservationRow } from "./types";

function row(overrides: Partial<ReservationRow>): ReservationRow {
  return {
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
    detailPath: null,
    ...overrides,
  };
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
      row({ key: "b3", status: "annulee" }),
    ]);
    expect(totals.amount).toEqual({ ILS: 2000 });
    expect(totals.collected).toEqual({ ILS: 1000 });
    expect(totals.costs).toEqual({ ILS: 600 });
    expect(totals.knownMargin).toEqual({ ILS: 400 });
  });
});

describe("canDeleteRow", () => {
  it("autorise la saisie manuelle et les demandes, jamais le paiement en ligne, l'hôtel ou le dossier", () => {
    expect(canDeleteRow(row({}))).toBe(true);
    expect(canDeleteRow(row({ source: "request", status: "demande" }))).toBe(true);
    expect(canDeleteRow(row({ isOnline: true }))).toBe(false);
    expect(canDeleteRow(row({ source: "hotel" }))).toBe(false);
    expect(canDeleteRow(row({ source: "dossier" }))).toBe(false);
  });
});
