// Choix du produit et du prestataire dans la grille de Saisie, sans accès à la base : ce qu'il
// faut écrire sur la réservation quand on choisit une expérience du catalogue, un hôtel, ou un
// texte libre. Les montants déjà saisis ne sont jamais écrasés : le catalogue ne remplit que
// ce qui est encore vide. Le prestataire de la fiche s'affiche de lui-même (vue SQL) tant
// qu'aucun autre n'est choisi sur la réservation.

import type { ReservationRow } from "./types";

export interface CatalogueExperience {
  id: string;
  title: string;
  currency: string;
  basePrice: number | null;
  // "fixed" : prix du groupe ; sinon prix par personne.
  basePriceType: string | null;
  isBoat: boolean;
  supplierPriceAdult: number | null;
}

export interface CatalogueHotel {
  id: string;
  name: string;
}

export type ProductChoice =
  | { kind: "experience"; experience: CatalogueExperience }
  | { kind: "hotel"; hotel: CatalogueHotel }
  | { kind: "free"; text: string };

export type ChoiceUpdate = { ok: true; table: string; patch: Record<string, unknown> } | { ok: false; message: string };

const paxOf = (row: ReservationRow) => {
  const n = parseInt(row.pax, 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
};

/** Prix proposé par le catalogue pour cette ligne (groupe, ou par personne × participants). */
export function suggestedPrice(experience: CatalogueExperience, pax: number): number | null {
  if (experience.basePrice === null) return null;
  return experience.basePriceType === "fixed" ? experience.basePrice : experience.basePrice * pax;
}

export function productChoicePatch(row: ReservationRow, choice: ProductChoice): ChoiceUpdate {
  if (row.source === "hotel") {
    if (choice.kind === "hotel") return { ok: true, table: "bookings_hg", patch: { hotel_id: choice.hotel.id, hotel_name: null } };
    if (choice.kind === "free") {
      const text = choice.text.trim();
      return text ? { ok: true, table: "bookings_hg", patch: { hotel_id: null, hotel_name: text } } : { ok: false, message: "Nom d'hôtel vide" };
    }
    return { ok: false, message: "Choisis un hôtel" };
  }
  if (row.source !== "booking") return { ok: false, message: "Ce produit ne se change pas ici" };

  if (choice.kind === "free") {
    const text = choice.text.trim();
    if (!text) return { ok: false, message: "Le produit ne peut pas être vide" };
    return { ok: true, table: "standalone_bookings", patch: { custom_experience_title: text, standalone_experience_id: null } };
  }
  if (choice.kind !== "experience") return { ok: false, message: "Choisis une expérience" };

  const { experience } = choice;
  const pax = paxOf(row);
  const patch: Record<string, unknown> = {
    standalone_experience_id: experience.id,
    custom_experience_title: null,
    product_type: experience.isBoat ? "boat" : "experience",
  };
  if (!row.amount) {
    const price = suggestedPrice(experience, pax);
    if (price !== null) {
      patch.sell_price = price;
      patch.currency = experience.currency;
    }
  }
  if (row.supplierCost === null && experience.supplierPriceAdult !== null) {
    patch.supplier_cost = experience.supplierPriceAdult * pax;
  }
  return { ok: true, table: "standalone_bookings", patch };
}

/** Prestataire choisi (ou retiré) sur une réservation d'expérience. */
export function partnerChoicePatch(row: ReservationRow, providerId: string | null): ChoiceUpdate {
  if (row.source !== "booking") return { ok: false, message: "Le prestataire ne se change pas ici" };
  // L'ancien nom en clair laisse la place au prestataire choisi.
  return { ok: true, table: "standalone_bookings", patch: { provider_id: providerId, supplier_name: null } };
}
