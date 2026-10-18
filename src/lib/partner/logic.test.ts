import { describe, expect, it } from "vitest";
import {
  addTimeSlot,
  bookedDates,
  changedFields,
  displayText,
  initialPartnerLang,
  isDateOpen,
  isPartnerSpacePath,
  monthCells,
  monthlyRevenue,
  normalizeTimeSlot,
  ownText,
  removeTimeSlot,
  revenueTotals,
  splitBookings,
  toggleDate,
  toggleWeekday,
  weekdayNumber,
} from "./logic";
import type { PartnerAvailability, PartnerBooking } from "./types";

const availability = (patch: Partial<PartnerAvailability> = {}): PartnerAvailability => ({
  availability_mode: "blacklist",
  available_days: [1, 2, 3, 4, 5, 6, 7],
  blocked_dates: [],
  whitelisted_dates: [],
  has_time_slots: false,
  time_slots: [],
  ...patch,
});

const booking = (patch: Partial<PartnerBooking>): PartnerBooking => ({
  id: "b",
  ref: "SM-1",
  experience_id: null,
  experience_title: "Exp",
  experience_title_fr: null,
  experience_title_he: null,
  booking_date: "2026-10-20",
  time_slot: null,
  party_size: 2,
  adults: 2,
  children: 0,
  customer_first_name: "Dana",
  customer_last_initial: "L",
  customer_language: "fr",
  special_requests: null,
  provider_amount: 400,
  currency: "ILS",
  settled: false,
  settled_at: null,
  settlement_reference: null,
  ...patch,
});

describe("isPartnerSpacePath", () => {
  it("ne confond pas l'espace partenaire avec les pages publiques voisines", () => {
    expect(isPartnerSpacePath("/partner")).toBe(true);
    expect(isPartnerSpacePath("/partner/bookings")).toBe(true);
    expect(isPartnerSpacePath("/partners")).toBe(false);
    expect(isPartnerSpacePath("/partner-exp")).toBe(false);
    expect(isPartnerSpacePath("/admin/partenaires")).toBe(false);
  });
});

describe("langue", () => {
  it("prend la langue du prestataire, sinon celle du navigateur, sinon l'anglais", () => {
    expect(initialPartnerLang("he", "fr-FR")).toBe("he");
    expect(initialPartnerLang(null, "fr-FR")).toBe("fr");
    expect(initialPartnerLang("Hébreu", "iw")).toBe("he");
    expect(initialPartnerLang(null, "es-ES")).toBe("en");
  });

  it("lit un texte dans sa langue, et retombe sur une autre seulement pour l'affichage", () => {
    const fiche = { title: "Morning", title_fr: "  ", title_he: "בוקר" };
    expect(ownText(fiche, "title", "fr")).toBe("");
    expect(displayText(fiche, "title", "fr")).toBe("Morning");
    expect(displayText(fiche, "title", "he")).toBe("בוקר");
    expect(displayText({ title_he: "רק עברית" }, "title", "fr")).toBe("רק עברית");
  });
});

describe("calendrier", () => {
  it("numérote les jours comme la fiche : 1 = lundi, 7 = dimanche", () => {
    expect(weekdayNumber("2026-10-12")).toBe(1); // lundi
    expect(weekdayNumber("2026-10-18")).toBe(7); // dimanche
  });

  it("commence le mois sur la bonne colonne (semaine du dimanche)", () => {
    const cells = monthCells(2026, 9); // octobre 2026 commence un jeudi
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
    expect(cells[cells.length - 1]).toBe("2026-10-31");
  });
});

describe("disponibilités", () => {
  it("mode jours ouverts : ouvert sauf jour non coché ou date fermée", () => {
    const a = availability({ available_days: [1, 2, 3, 4, 7], blocked_dates: ["2026-10-13"] });
    expect(isDateOpen(a, "2026-10-12")).toBe(true);
    expect(isDateOpen(a, "2026-10-13")).toBe(false); // date fermée
    expect(isDateOpen(a, "2026-10-16")).toBe(false); // vendredi non coché
  });

  it("mode date par date : fermé sauf les dates ouvertes", () => {
    const a = availability({ availability_mode: "whitelist", whitelisted_dates: ["2026-11-20"] });
    expect(isDateOpen(a, "2026-11-20")).toBe(true);
    expect(isDateOpen(a, "2026-11-21")).toBe(false);
  });

  it("un appui ferme puis rouvre une date, sans toucher à un jour fermé de la semaine", () => {
    const a = availability({ available_days: [1] });
    const closed = toggleDate(a, "2026-10-12");
    expect(closed.blocked_dates).toEqual(["2026-10-12"]);
    expect(toggleDate(closed, "2026-10-12").blocked_dates).toEqual([]);
    expect(toggleDate(a, "2026-10-13")).toBe(a); // mardi fermé : rien ne change
  });

  it("un appui ouvre une date en mode date par date", () => {
    const a = availability({ availability_mode: "whitelist", whitelisted_dates: ["2026-11-21"] });
    expect(toggleDate(a, "2026-11-20").whitelisted_dates).toEqual(["2026-11-20", "2026-11-21"]);
    expect(toggleWeekday(availability({ available_days: [1, 2] }), 2).available_days).toEqual([1]);
  });

  it("remet un créneau au format HH:MM et refuse l'illisible", () => {
    expect(normalizeTimeSlot("9:30")).toBe("09:30");
    expect(normalizeTimeSlot("18h")).toBe("18:00");
    expect(normalizeTimeSlot("18h30")).toBe("18:30");
    expect(normalizeTimeSlot("25:00")).toBeNull();
    expect(normalizeTimeSlot("matin")).toBeNull();
    const withSlot = addTimeSlot(availability(), "9:30");
    expect(withSlot).toMatchObject({ has_time_slots: true, time_slots: ["09:30"] });
    expect(addTimeSlot(availability(), "nope")).toBeNull();
    expect(removeTimeSlot(withSlot!, "09:30")).toMatchObject({ has_time_slots: false, time_slots: [] });
  });
});

describe("réservations et revenus", () => {
  it("sépare à venir et passées", () => {
    const { upcoming, past } = splitBookings(
      [booking({ id: "1", booking_date: "2026-11-02" }), booking({ id: "2", booking_date: "2026-10-01" }), booking({ id: "3", booking_date: "2026-10-20" })],
      "2026-10-13",
    );
    expect(upcoming.map((b) => b.id)).toEqual(["3", "1"]);
    expect(past.map((b) => b.id)).toEqual(["2"]);
  });

  it("totalise par mois ce qui est réglé, à régler, et ce dont le montant manque", () => {
    const stats = monthlyRevenue([
      booking({ booking_date: "2026-10-05", provider_amount: 400, settled: true }),
      booking({ booking_date: "2026-10-20", provider_amount: 250.5 }),
      booking({ booking_date: "2026-10-22", provider_amount: null }),
      booking({ booking_date: "2026-09-10", provider_amount: 100 }),
    ]);
    expect(stats).toEqual([
      { month: "2026-10", currency: "ILS", count: 3, total: 650.5, settled: 400, due: 250.5, unknown: 1 },
      { month: "2026-09", currency: "ILS", count: 1, total: 100, settled: 0, due: 100, unknown: 0 },
    ]);
  });
});

describe("changedFields", () => {
  it("ne garde que les champs réellement modifiés", () => {
    expect(changedFields({ title: "A", subtitle: "B" }, { title: " A ", subtitle: "C", duration: "" })).toEqual({ subtitle: "C" });
  });
});

describe("revenueTotals", () => {
  it("additionne ce qui revient au prestataire par devise, sans les montants inconnus", () => {
    const totals = revenueTotals([
      booking({ id: "1", booking_date: "2026-09-10", provider_amount: 100, currency: "ILS", settled: true }),
      booking({ id: "2", booking_date: "2026-10-20", provider_amount: 250.5, currency: "ILS", settled: false }),
      booking({ id: "3", booking_date: "2026-10-21", provider_amount: null, currency: "ILS" }),
      booking({ id: "4", booking_date: "2026-10-22", provider_amount: 40, currency: "USD", settled: false }),
    ]);
    expect(totals).toEqual([
      { currency: "ILS", total: 350.5, due: 250.5 },
      { currency: "USD", total: 40, due: 40 },
    ]);
  });

  it("ne renvoie rien sans réservation", () => {
    expect(revenueTotals([])).toEqual([]);
  });
});

describe("bookedDates", () => {
  it("garde les dates réservées, éventuellement pour une seule expérience", () => {
    const list = [
      booking({ id: "1", booking_date: "2026-10-20", experience_id: "a" }),
      booking({ id: "2", booking_date: "2026-10-22", experience_id: "b" }),
    ];
    expect([...bookedDates(list)].sort()).toEqual(["2026-10-20", "2026-10-22"]);
    expect([...bookedDates(list, "a")]).toEqual(["2026-10-20"]);
  });
});
