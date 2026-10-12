import { describe, expect, it } from "vitest";
import {
  bookingProviderId,
  countsInFigures,
  experienceCountByProvider,
  hotelExperienceProviderId,
  linkedTo,
  monthlyStats,
  providerNetOf,
  splitByDate,
  type BookingCostInput,
} from "./compute";
import type { ProviderBooking, ProviderLinks } from "./types";

const links: ProviderLinks = {
  standalone: [
    { id: "s1", title: "Cuisine", status: "published", isBoat: false, providerId: "citrus", supplierProviderIds: [] },
    { id: "s2", title: "Catamaran", status: "published", isBoat: true, providerId: "balaguna", supplierProviderIds: ["balaguna", "mark"] },
    { id: "s3", title: "Sans prestataire", status: "draft", isBoat: false, providerId: null, supplierProviderIds: [] },
  ],
  hotels: [
    { id: "h1", name: "Hôtel du lac", status: "published", providerId: "lac", commissionRate: 18 },
    { id: "h2", name: "Hôtel sans lien", status: "draft", providerId: null, commissionRate: null },
  ],
  hotelExperiences: [
    { id: "e1", title: "Nuit au lac", status: "published", hotelId: "h1", ownProviderId: null },
    { id: "e2", title: "Massage au lac", status: "published", hotelId: "h1", ownProviderId: "spa" },
    { id: "e3", title: "Orpheline", status: "draft", hotelId: "h2", ownProviderId: null },
  ],
  mustHaves: [{ id: "m1", name: "Cours de cuisine", status: "signe", categoryId: "c1", providerId: "citrus" }],
};

describe("liaisons", () => {
  it("une expérience hôtel prend le prestataire de son hôtel, sauf si elle a le sien", () => {
    expect(hotelExperienceProviderId(links.hotelExperiences[0], links.hotels)).toBe("lac");
    expect(hotelExperienceProviderId(links.hotelExperiences[1], links.hotels)).toBe("spa");
    expect(hotelExperienceProviderId(links.hotelExperiences[2], links.hotels)).toBeNull();
  });

  it("compte les expériences liées, y compris pour un prestataire secondaire de bateau", () => {
    const counts = experienceCountByProvider(links);
    expect(counts.get("citrus")).toBe(1);
    expect(counts.get("balaguna")).toBe(1);
    expect(counts.get("mark")).toBe(1);
    expect(counts.get("lac")).toBe(1);
    expect(counts.get("spa")).toBe(1);
  });

  it("rassemble tout ce qui est relié à un prestataire", () => {
    const linked = linkedTo("citrus", links);
    expect(linked.standalone.map((e) => e.id)).toEqual(["s1"]);
    expect(linked.mustHaves.map((m) => m.id)).toEqual(["m1"]);
    expect(linkedTo("lac", links).hotelExperiences.map((e) => e.id)).toEqual(["e1"]);
  });
});

describe("prestataire d'une réservation", () => {
  const primary = new Map<string, string | null>([["s1", "citrus"]]);

  it("garde celui noté sur la réservation", () => {
    expect(bookingProviderId({ providerId: "mark", experienceId: "s1" }, primary)).toBe("mark");
  });

  it("sinon le déduit du prestataire principal de l'expérience", () => {
    expect(bookingProviderId({ providerId: null, experienceId: "s1" }, primary)).toBe("citrus");
    expect(bookingProviderId({ providerId: null, experienceId: null }, primary)).toBeNull();
  });
});

describe("réservations qui comptent", () => {
  it("seulement les réservations payées et non annulées", () => {
    expect(countsInFigures({ paymentStatus: "paid", cancelled: false })).toBe(true);
    expect(countsInFigures({ paymentStatus: "deposit_paid", cancelled: false })).toBe(true);
    expect(countsInFigures({ paymentStatus: "pending", cancelled: false })).toBe(false);
    expect(countsInFigures({ paymentStatus: "failed", cancelled: false })).toBe(false);
    expect(countsInFigures({ paymentStatus: "refunded", cancelled: false })).toBe(false);
    expect(countsInFigures({ paymentStatus: "paid", cancelled: true })).toBe(false);
  });
});

describe("revenu net du prestataire", () => {
  const online: BookingCostInput = {
    sellPrice: 257.04,
    supplierCost: null,
    source: "online",
    productType: "experience",
    adults: 2,
    children: 0,
    hasRateOption: false,
    hasExtras: false,
  };
  const cost = { supplierPriceAdult: 119, supplierPriceChild: null, markupPercent: 8 };

  it("le coût saisi sur la réservation fait foi", () => {
    expect(providerNetOf({ ...online, supplierCost: 200 }, cost)).toBe(200);
  });

  it("recalcule une réservation en ligne quand le prix de la fiche retombe sur le montant payé", () => {
    expect(providerNetOf(online, cost)).toBe(238);
  });

  it("préfère « à compléter » quand la fiche a changé de prix depuis", () => {
    expect(providerNetOf({ ...online, sellPrice: 300 }, cost)).toBeNull();
  });

  it("ne devine rien pour une saisie manuelle, un bateau, une option tarifaire ou un prix enfant manquant", () => {
    expect(providerNetOf({ ...online, source: "manual_admin" }, cost)).toBeNull();
    expect(providerNetOf({ ...online, productType: "boat" }, cost)).toBeNull();
    expect(providerNetOf({ ...online, hasRateOption: true }, cost)).toBeNull();
    expect(providerNetOf({ ...online, children: 1 }, cost)).toBeNull();
    expect(providerNetOf(online, null)).toBeNull();
  });
});

const booking = (overrides: Partial<ProviderBooking>): ProviderBooking => ({
  kind: "experience",
  id: "b",
  date: "2026-08-10",
  client: "Client",
  product: "Cuisine",
  partySize: 2,
  amount: 100,
  currency: "ILS",
  paymentStatus: "paid",
  cancelled: false,
  providerNet: 70,
  ...overrides,
});

describe("chiffres par mois", () => {
  it("additionne les réservations payées du mois", () => {
    const stats = monthlyStats([booking({}), booking({ id: "b2", amount: 200, providerNet: 150 })]);
    expect(stats).toEqual([{ month: "2026-08", currency: "ILS", count: 2, revenue: 300, providerNet: 220, margin: 80, missing: 0 }]);
  });

  it("ignore les réservations non payées ou annulées", () => {
    const stats = monthlyStats([booking({}), booking({ paymentStatus: "pending" }), booking({ cancelled: true })]);
    expect(stats[0].count).toBe(1);
  });

  it("n'affiche ni revenu net ni marge tant qu'un coût manque", () => {
    const [stat] = monthlyStats([booking({}), booking({ providerNet: null })]);
    expect(stat.revenue).toBe(200);
    expect(stat.providerNet).toBeNull();
    expect(stat.margin).toBeNull();
    expect(stat.missing).toBe(1);
  });

  it("sépare les mois et les devises, le plus récent d'abord", () => {
    const stats = monthlyStats([booking({}), booking({ date: "2026-09-02" }), booking({ currency: "USD" })]);
    expect(stats.map((s) => `${s.month} ${s.currency}`)).toEqual(["2026-09 ILS", "2026-08 ILS", "2026-08 USD"]);
  });
});

describe("à venir et passées", () => {
  it("range par date et écarte les annulées", () => {
    const { upcoming, past } = splitByDate(
      [booking({ id: "a", date: "2026-10-20" }), booking({ id: "b", date: "2026-10-12" }), booking({ id: "c", date: "2026-09-01" }), booking({ id: "d", date: "2026-11-01", cancelled: true })],
      "2026-10-12",
    );
    expect(upcoming.map((b) => b.id)).toEqual(["b", "a"]);
    expect(past.map((b) => b.id)).toEqual(["c"]);
  });
});
