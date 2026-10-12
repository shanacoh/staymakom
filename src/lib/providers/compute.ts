// Règles métier des prestataires, sans aucun accès à la base ni à l'écran :
// ce qui est relié à qui, quelles réservations comptent dans les chiffres, et ce que touche le prestataire.

import type {
  LinkedHotel,
  LinkedHotelExperience,
  LinkedMustHave,
  LinkedStandaloneExperience,
  ProviderBooking,
  ProviderLinks,
} from "./types";

// ── Liaisons ────────────────────────────────────────────────────────────────────────────────────

/** Le prestataire d'une expérience hôtel : le sien s'il en a un, sinon celui de son hôtel. */
export function hotelExperienceProviderId(experience: LinkedHotelExperience, hotels: LinkedHotel[]): string | null {
  if (experience.ownProviderId) return experience.ownProviderId;
  return hotels.find((h) => h.id === experience.hotelId)?.providerId ?? null;
}

const worksOn = (experience: LinkedStandaloneExperience, providerId: string) =>
  experience.providerId === providerId || experience.supplierProviderIds.includes(providerId);

export interface ProviderLinked {
  standalone: LinkedStandaloneExperience[];
  hotels: LinkedHotel[];
  hotelExperiences: LinkedHotelExperience[];
  mustHaves: LinkedMustHave[];
}

/** Tout ce qui est relié à un prestataire. */
export function linkedTo(providerId: string, links: ProviderLinks): ProviderLinked {
  return {
    standalone: links.standalone.filter((e) => worksOn(e, providerId)),
    hotels: links.hotels.filter((h) => h.providerId === providerId),
    hotelExperiences: links.hotelExperiences.filter((e) => hotelExperienceProviderId(e, links.hotels) === providerId),
    mustHaves: links.mustHaves.filter((m) => m.providerId === providerId),
  };
}

/** Nombre d'expériences liées (seules et hôtel) par prestataire. */
export function experienceCountByProvider(links: ProviderLinks): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (id: string | null) => {
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  };
  for (const e of links.standalone) new Set([e.providerId, ...e.supplierProviderIds]).forEach(add);
  for (const e of links.hotelExperiences) add(hotelExperienceProviderId(e, links.hotels));
  return counts;
}

// ── Réservations ────────────────────────────────────────────────────────────────────────────────

/**
 * Le prestataire d'une réservation d'expérience : celui noté sur la réservation, sinon le
 * prestataire principal de l'expérience. Déduit à l'affichage, jamais réécrit sur la réservation.
 */
export function bookingProviderId(
  booking: { providerId: string | null; experienceId: string | null },
  primaryProviderByExperience: Map<string, string | null>,
): string | null {
  if (booking.providerId) return booking.providerId;
  return booking.experienceId ? (primaryProviderByExperience.get(booking.experienceId) ?? null) : null;
}

// Une réservation est créée avant la confirmation du paiement : elle ne compte dans les chiffres
// qu'une fois réellement payée (en entier, ou par un acompte encaissé).
const PAID_STATUSES = ["paid", "deposit_paid"];

/** Vrai si la réservation compte dans les chiffres : payée et pas annulée. */
export function countsInFigures(booking: Pick<ProviderBooking, "paymentStatus" | "cancelled">): boolean {
  return !booking.cancelled && PAID_STATUSES.includes(booking.paymentStatus ?? "");
}

export interface BookingCostInput {
  sellPrice: number;
  /** Coût fournisseur saisi sur la réservation. */
  supplierCost: number | null;
  source: string | null;
  productType: string | null;
  adults: number | null;
  children: number | null;
  hasRateOption: boolean;
  hasExtras: boolean;
}

export interface ExperienceCost {
  supplierPriceAdult: number | null;
  supplierPriceChild: number | null;
  markupPercent: number | null;
}

/**
 * Ce que touche le prestataire pour une réservation d'expérience, ou null si l'information manque.
 * 1. Le coût fournisseur saisi sur la réservation fait foi.
 * 2. Sinon, pour une réservation en ligne simple, on le recalcule avec le prix fournisseur et la
 *    marge de la fiche, et on ne le garde que s'il retombe bien sur le montant payé : si la fiche a
 *    changé de prix depuis, on préfère « à compléter » à un chiffre faux.
 */
export function providerNetOf(booking: BookingCostInput, cost: ExperienceCost | null | undefined): number | null {
  if (booking.supplierCost != null) return booking.supplierCost;
  if (booking.source !== "online" || booking.productType === "boat") return null;
  if (booking.hasRateOption || booking.hasExtras) return null;
  if (!cost || !cost.supplierPriceAdult || cost.supplierPriceAdult <= 0 || cost.markupPercent == null) return null;

  const adults = booking.adults ?? 0;
  const children = booking.children ?? 0;
  if (adults + children <= 0) return null;
  if (children > 0 && cost.supplierPriceChild == null) return null;

  const estimate = adults * cost.supplierPriceAdult + children * (cost.supplierPriceChild ?? 0);
  const expectedSellPrice = estimate * (1 + cost.markupPercent / 100);
  const tolerance = Math.max(1, booking.sellPrice * 0.01);
  if (Math.abs(expectedSellPrice - booking.sellPrice) > tolerance) return null;
  return Math.round(estimate * 100) / 100;
}

export interface MonthlyStat {
  /** Mois de la prestation, au format AAAA-MM. */
  month: string;
  currency: string;
  count: number;
  /** Chiffre d'affaires : ce que les clients ont payé. */
  revenue: number;
  /** Revenu net du prestataire et marge STAYMAKOM : null tant qu'une réservation du mois n'a pas son coût. */
  providerNet: number | null;
  margin: number | null;
  /** Nombre de réservations du mois sans coût fournisseur connu. */
  missing: number;
}

/** Chiffres par mois (le plus récent d'abord), sur les seules réservations payées. */
export function monthlyStats(bookings: ProviderBooking[]): MonthlyStat[] {
  const byKey = new Map<string, MonthlyStat & { knownNet: number }>();
  for (const booking of bookings) {
    if (!countsInFigures(booking)) continue;
    const month = booking.date.slice(0, 7);
    const key = `${month}|${booking.currency}`;
    const stat =
      byKey.get(key) ??
      { month, currency: booking.currency, count: 0, revenue: 0, providerNet: null, margin: null, missing: 0, knownNet: 0 };
    stat.count += 1;
    stat.revenue += booking.amount;
    if (booking.providerNet == null) stat.missing += 1;
    else stat.knownNet += booking.providerNet;
    byKey.set(key, stat);
  }
  return [...byKey.values()]
    .map(({ knownNet, ...stat }) =>
      stat.missing > 0 ? stat : { ...stat, providerNet: round(knownNet), margin: round(stat.revenue - knownNet) },
    )
    .map((stat) => ({ ...stat, revenue: round(stat.revenue) }))
    .sort((a, b) => b.month.localeCompare(a.month) || a.currency.localeCompare(b.currency));
}

const round = (value: number) => Math.round(value * 100) / 100;

/** Sépare les réservations non annulées en « à venir » (la plus proche d'abord) et « passées » (la plus récente d'abord). */
export function splitByDate(bookings: ProviderBooking[], today: string): { upcoming: ProviderBooking[]; past: ProviderBooking[] } {
  const live = bookings.filter((b) => !b.cancelled);
  return {
    upcoming: live.filter((b) => b.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    past: live.filter((b) => b.date < today).sort((a, b) => b.date.localeCompare(a.date)),
  };
}
