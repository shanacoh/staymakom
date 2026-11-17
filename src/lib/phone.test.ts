import { describe, expect, it } from "vitest";
import { composePhone, defaultDialCode, isPlausiblePhone, repairStoredPhone, splitPhone, whatsAppDigits } from "./phone";

describe("composePhone", () => {
  it("retire le 0 national et ajoute l'indicatif", () => {
    expect(composePhone("+972", "054-123 4567")).toBe("+972541234567");
    expect(composePhone("+33", "06 12 34 56 78")).toBe("+33612345678");
  });
  it("garde un numéro tapé avec son propre indicatif", () => {
    expect(composePhone("+972", "+33 6 12 34 56 78")).toBe("+33612345678");
    expect(composePhone("+972", "0033612345678")).toBe("+33612345678");
  });
  it("répare un numéro israélien tapé en « +054 »", () => {
    expect(composePhone("+33", "+054 123 4567")).toBe("+972541234567");
  });
  it("garde le 0 italien", () => {
    expect(composePhone("+39", "06 1234 5678")).toBe("+390612345678");
  });
  it("rend vide un champ vide", () => {
    expect(composePhone("+972", "  ")).toBe("");
  });
});

describe("defaultDialCode", () => {
  it("France pour le site en français, Israël sinon", () => {
    expect(defaultDialCode("fr")).toBe("+33");
    expect(defaultDialCode("en")).toBe("+972");
    expect(defaultDialCode("he")).toBe("+972");
    expect(defaultDialCode("ru")).toBe("+972");
  });
});

describe("splitPhone", () => {
  it("retrouve l'indicatif d'un numéro enregistré", () => {
    expect(splitPhone("+972541234567", "+33")).toEqual({ dialCode: "+972", local: "541234567" });
    expect(splitPhone("+33612345678", "+972")).toEqual({ dialCode: "+33", local: "612345678" });
  });
  it("garde l'indicatif par défaut pour un champ vide", () => {
    expect(splitPhone("", "+33")).toEqual({ dialCode: "+33", local: "" });
  });
  it("redonne le même numéro une fois recomposé", () => {
    for (const phone of ["+972541234567", "+33612345678", "+12125551234", "+971501234567"]) {
      const { dialCode, local } = splitPhone(phone, "+972");
      expect(composePhone(dialCode, local)).toBe(phone);
    }
  });
});

describe("isPlausiblePhone", () => {
  it("accepte des numéros complets", () => {
    expect(isPlausiblePhone("+972541234567")).toBe(true);
    expect(isPlausiblePhone("+33612345678")).toBe(true);
    expect(isPlausiblePhone("+12125551234")).toBe(true);
  });
  it("signale un numéro trop court ou mal formé", () => {
    expect(isPlausiblePhone("+97254123")).toBe(false);
    expect(isPlausiblePhone("+3361234")).toBe(false);
    expect(isPlausiblePhone("+0541234567")).toBe(false);
  });
});

describe("repairStoredPhone / whatsAppDigits", () => {
  it("convertit un portable israélien enregistré sans indicatif", () => {
    expect(repairStoredPhone("+0555009338")).toBe("+972555009338");
    expect(repairStoredPhone("055-500 9338")).toBe("+972555009338");
    expect(whatsAppDigits("+0585600332")).toBe("972585600332");
  });
  it("transforme le préfixe 00 en +", () => {
    expect(repairStoredPhone("+00972534714496")).toBe("+972534714496");
    expect(repairStoredPhone("0033612345678")).toBe("+33612345678");
  });
  it("ne devine rien pour les autres numéros", () => {
    expect(repairStoredPhone("+0468624453")).toBe("+0468624453");
    expect(repairStoredPhone("13474043292")).toBe("13474043292");
    expect(repairStoredPhone(null)).toBe("");
  });
});
