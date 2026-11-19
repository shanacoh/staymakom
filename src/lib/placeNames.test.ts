import { describe, expect, it } from "vitest";
import { PLACE_NAMES, placeName } from "./placeNames";
import { localizedName, legacyRegionText } from "./regionList/labels";

describe("noms de lieux (affichage es / ru / de)", () => {
  it("traduit un lieu connu, sans tenir compte des majuscules ni des espaces", () => {
    expect(placeName("Jerusalem", "es")).toBe("Jerusalén");
    expect(placeName(" tsfat ", "ru")).toBe("Цфат");
    expect(placeName("Sea of Galilee", "de")).toBe("See Genezareth");
  });

  it("laisse tel quel en anglais, français, hébreu, et pour un lieu inconnu", () => {
    expect(placeName("Jerusalem", "en")).toBe("Jerusalem");
    expect(placeName("Jerusalem", "fr")).toBe("Jerusalem");
    expect(placeName("ירושלים", "he")).toBe("ירושלים");
    expect(placeName("Somewhere New", "ru")).toBe("Somewhere New");
    expect(placeName(null, "ru")).toBeNull();
  });

  it("russe en cyrillique, aucune langue avec tiret long", () => {
    for (const [en, names] of Object.entries(PLACE_NAMES)) {
      expect(names.ru, en).not.toMatch(/[A-Za-z]/);
      for (const v of Object.values(names)) expect(v, en).not.toMatch(/—/);
    }
  });

  it("les libellés de région suivent la langue de la page sans toucher aux données", () => {
    const region = { name: "Upper Galilee", name_fr: "Haute Galilée", name_he: "הגליל העליון" };
    expect(localizedName(region, "ru")).toBe("Верхняя Галилея");
    expect(localizedName(region, "fr")).toBe("Haute Galilée");
    expect(localizedName(region, "en")).toBe("Upper Galilee");
    expect(region.name).toBe("Upper Galilee");
    expect(legacyRegionText({ region: "Negev" } as never, "de")).toBe("Negev");
    expect(legacyRegionText({ region: "Darom" } as never, "es")).toBe("Sur");
  });
});
