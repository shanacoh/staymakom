import { describe, expect, it } from "vitest";
import { partnerChoicePatch, productChoicePatch, suggestedPrice, type CatalogueExperience } from "./productChoice";
import type { ReservationRow } from "./types";

function row(overrides: Partial<ReservationRow>): ReservationRow {
  return {
    key: "booking:1",
    id: "1",
    source: "booking",
    ref: "abcd",
    type: "experience",
    status: "confirmee",
    client: "Dana",
    product: "",
    partner: null,
    date: "2026-11-02",
    receivedAt: null,
    pax: "4",
    amount: 0,
    currency: "ILS",
    collected: 0,
    clientPayment: "unpaid",
    supplierCost: null,
    supplierPayment: "todo",
    channelKey: "whatsapp",
    channelLabel: "Manuel · WhatsApp",
    isOnline: false,
    notes: null,
    sentToProviderAt: null,
    depositDue: null,
    missingCosts: 1,
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

const boat: CatalogueExperience = {
  id: "exp-boat",
  title: "Boat Day",
  currency: "ILS",
  basePrice: 3200,
  basePriceType: "fixed",
  isBoat: true,
  supplierPriceAdult: null,
};
const cooking: CatalogueExperience = {
  id: "exp-cook",
  title: "Matin en cuisine à Tel Aviv",
  currency: "ILS",
  basePrice: 325.5,
  basePriceType: "per_person",
  isBoat: false,
  supplierPriceAdult: 270,
};

describe("produit choisi dans le catalogue", () => {
  it("nouvelle ligne : prix, coût, type et devise remplis d'après la fiche", () => {
    expect(productChoicePatch(row({}), { kind: "experience", experience: cooking })).toEqual({
      ok: true,
      table: "standalone_bookings",
      patch: {
        standalone_experience_id: "exp-cook",
        custom_experience_title: null,
        product_type: "experience",
        sell_price: 1302,
        currency: "ILS",
        supplier_cost: 1080,
      },
    });
    expect(suggestedPrice(boat, 6)).toBe(3200);
  });

  it("un montant ou un coût déjà saisi n'est jamais écrasé", () => {
    const update = productChoicePatch(row({ amount: 4500, supplierCost: 2800 }), { kind: "experience", experience: boat });
    expect(update.ok && update.patch).toEqual({ standalone_experience_id: "exp-boat", custom_experience_title: null, product_type: "boat" });
  });

  it("texte libre : le produit devient un titre, sans fiche", () => {
    expect(productChoicePatch(row({}), { kind: "free", text: "Dégustation privée" })).toMatchObject({
      patch: { custom_experience_title: "Dégustation privée", standalone_experience_id: null },
    });
    expect(productChoicePatch(row({}), { kind: "free", text: "  " }).ok).toBe(false);
  });

  it("hôtel : du catalogue ou en clair", () => {
    const hotel = row({ source: "hotel", type: "hotel" });
    expect(productChoicePatch(hotel, { kind: "hotel", hotel: { id: "h1", name: "Kedma" } })).toMatchObject({
      table: "bookings_hg",
      patch: { hotel_id: "h1", hotel_name: null },
    });
    expect(productChoicePatch(hotel, { kind: "free", text: "Hôtel Montefiore" })).toMatchObject({
      patch: { hotel_id: null, hotel_name: "Hôtel Montefiore" },
    });
  });

  it("prestataire : seulement sur une réservation d'expérience", () => {
    expect(partnerChoicePatch(row({}), "p1")).toMatchObject({ patch: { provider_id: "p1", supplier_name: null } });
    expect(partnerChoicePatch(row({ source: "hotel" }), "p1").ok).toBe(false);
  });
});
