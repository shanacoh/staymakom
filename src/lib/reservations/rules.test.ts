import { describe, expect, it } from "vitest";
import { applyToolbarFilters, computeKpis, groupRows, nextAction } from "./rules";
import type { ReservationRow } from "./types";

const TODAY = new Date("2026-10-06T10:00:00");

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
    collected: 1000,
    clientPayment: "paid",
    supplierCost: 600,
    supplierPayment: "paid",
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

const request = (overrides: Partial<ReservationRow> = {}) =>
  row({ source: "request", status: "demande", collected: 0, clientPayment: "unpaid", supplierCost: null, supplierPayment: "none", ...overrides });

describe("nextAction", () => {
  it("demande pas encore envoyée : envoyer au prestataire, urgent", () => {
    expect(nextAction(request(), TODAY)).toMatchObject({ kind: "send_to_provider", urgent: true });
  });

  it("demande déjà envoyée : confirmer la dispo, pas urgent", () => {
    expect(nextAction(request({ sentToProviderAt: "2026-10-06T08:00:00Z" }), TODAY)).toMatchObject({
      kind: "confirm_availability",
      urgent: false,
    });
  });

  it("dispo OK avec règle d'acompte : lien d'acompte avec le montant", () => {
    const action = nextAction(request({ status: "dispo_ok", depositDue: 500 }), TODAY);
    expect(action).toMatchObject({ kind: "send_deposit_link", urgent: true });
    expect(action?.label).toContain("500");
  });

  it("dispo OK sans acompte : lien de paiement", () => {
    expect(nextAction(request({ status: "dispo_ok" }), TODAY)?.kind).toBe("send_payment_link");
  });

  it("acompte payé : lien de solde, urgent seulement à 2 jours ou moins", () => {
    const deposit = { clientPayment: "deposit" as const, amount: 3900, collected: 500 };
    expect(nextAction(row({ ...deposit, date: "2026-10-08" }), TODAY)).toMatchObject({ kind: "send_balance_link", urgent: true });
    expect(nextAction(row({ ...deposit, date: "2026-10-09" }), TODAY)).toMatchObject({ kind: "send_balance_link", urgent: false });
  });

  it("date passée et client non payé : confirmer l'encaissement avant le coût fournisseur", () => {
    const action = nextAction(
      row({ status: "passee", date: "2026-09-04", clientPayment: "unpaid", collected: 0, supplierCost: null, supplierPayment: "todo" }),
      TODAY,
    );
    expect(action?.kind).toBe("confirm_collection");
  });

  it("client payé, coût vide puis coût saisi", () => {
    expect(nextAction(row({ supplierCost: null, supplierPayment: "todo" }), TODAY)?.kind).toBe("enter_supplier_cost");
    expect(nextAction(row({ supplierCost: 124, supplierPayment: "todo" }), TODAY)?.label).toContain("124");
  });

  it("tout est réglé ou annulé : rien à faire", () => {
    expect(nextAction(row({}), TODAY)).toBeNull();
    expect(nextAction(row({ status: "annulee", clientPayment: "unpaid", supplierPayment: "todo" }), TODAY)).toBeNull();
  });
});

describe("groupes, filtres et chiffres clés", () => {
  const rows = [
    request({ key: "r1", amount: 3900 }),
    row({ key: "b1", type: "boat", supplierCost: null, supplierPayment: "todo" }),
    row({ key: "b2" }),
    row({ key: "b3", status: "annulee", clientPayment: "unpaid", collected: 0 }),
    row({ key: "b4", clientPayment: "unpaid", collected: 0, supplierCost: 400, supplierPayment: "todo" }),
  ];

  it("range chaque ligne dans un seul groupe", () => {
    const groups = groupRows(rows, TODAY);
    expect(groups.requests.map((r) => r.key)).toEqual(["r1"]);
    expect(groups.todo.map((r) => r.key)).toEqual(["b1", "b4"]);
    expect(groups.settled.map((r) => r.key)).toEqual(["b2", "b3"]);
  });

  it("ne compte ni les demandes ni les annulations dans les totaux d'argent", () => {
    const kpis = computeKpis(rows);
    expect(kpis.requests).toBe(1);
    expect(kpis.toCollect).toEqual({ ILS: 1000 });
    expect(kpis.toPaySuppliers).toEqual({ ILS: 400 });
    expect(kpis.knownMargin).toEqual({ ILS: 1000 });
    expect(kpis.missingCost).toBe(1);
  });

  it("filtre Bateaux et recherche sur plusieurs mots", () => {
    const base = { search: "", boatsOnly: false, payment: "all" as const, period: "all" as const, channel: "all" };
    expect(applyToolbarFilters(rows, { ...base, boatsOnly: true }, TODAY).map((r) => r.key)).toEqual(["b1"]);
    expect(applyToolbarFilters(rows, { ...base, search: "adda boat" }, TODAY)).toHaveLength(5);
    expect(applyToolbarFilters(rows, { ...base, search: "adda safari" }, TODAY)).toHaveLength(0);
  });
});
