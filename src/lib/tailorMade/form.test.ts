import { describe, expect, it } from "vitest";
import { emptyForm, fullPhone, isStepComplete, toPayload, type TailorMadeForm } from "./form";

const filled = (overrides: Partial<TailorMadeForm> = {}): TailorMadeForm => ({
  ...emptyForm("fr"),
  stayType: "romantic_getaway",
  dateStart: "2026-12-01",
  dateEnd: "2026-12-05",
  budget: "1000_2000",
  regions: ["tlv"],
  firstTrip: true,
  firstName: "Laura",
  phone: "06 12 34 56 78",
  ...overrides,
});

describe("isStepComplete", () => {
  it("étape 1 : il faut un type, des dates cohérentes et l'âge de chaque enfant", () => {
    expect(isStepComplete(1, emptyForm("fr"))).toBe(false);
    expect(isStepComplete(1, filled())).toBe(true);
    expect(isStepComplete(1, filled({ dateEnd: "2026-11-30" }))).toBe(false);
    expect(isStepComplete(1, filled({ stayType: "autre" }))).toBe(false);
    expect(isStepComplete(1, filled({ stayType: "autre", stayTypeOther: "Bar mitsva" }))).toBe(true);
    expect(isStepComplete(1, filled({ children: 2, childrenAges: ["4", ""] }))).toBe(false);
    expect(isStepComplete(1, filled({ children: 2, childrenAges: ["4", "9"] }))).toBe(true);
  });

  it("étape 1 : dates flexibles = un mois et un nombre de nuits", () => {
    expect(isStepComplete(1, filled({ datesMode: "flexibles", dateStart: "", dateEnd: "" }))).toBe(false);
    expect(isStepComplete(1, filled({ datesMode: "flexibles", month: "2027-03", nights: 4 }))).toBe(true);
  });

  it("étape 2 : budget, régions (ou Surprenez-moi) et premier voyage obligatoires, envies facultatives", () => {
    expect(isStepComplete(2, filled())).toBe(true);
    expect(isStepComplete(2, filled({ regions: [] }))).toBe(false);
    expect(isStepComplete(2, filled({ regions: [], surpriseMe: true }))).toBe(true);
    expect(isStepComplete(2, filled({ firstTrip: null }))).toBe(false);
  });

  it("étape 3 : prénom et WhatsApp obligatoires, email facultatif mais valide s'il est donné", () => {
    expect(isStepComplete(3, filled())).toBe(true);
    expect(isStepComplete(3, filled({ phone: "12" }))).toBe(false);
    expect(isStepComplete(3, filled({ email: "pas-un-email" }))).toBe(false);
    expect(isStepComplete(3, filled({ email: "laura@example.com" }))).toBe(true);
  });
});

describe("toPayload", () => {
  it("numéro complet avec indicatif, sans le zéro initial", () => {
    expect(fullPhone(filled())).toBe("+33612345678");
  });

  it("n'envoie que les champs du mode de dates choisi, et joint la source de la visite", () => {
    const payload = toPayload(filled({ datesMode: "flexibles", month: "2027-03", nights: 4 }), { utm_source: "instagram" });
    expect(payload).toMatchObject({ dates_mode: "flexibles", mois: "2027-03", nb_nuits: 4, source: { utm_source: "instagram" } });
    expect(payload).not.toHaveProperty("date_debut");
  });

  it("« Surprenez-moi » remplace la liste des régions", () => {
    expect(toPayload(filled({ surpriseMe: true }), {})).toMatchObject({ regions: [], surprenez_moi: true });
  });
});
