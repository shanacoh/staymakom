import { describe, it, expect } from "vitest";
import { countByRegion, distanceKm, filterByRegion, macroRegionOf } from "./regions";

const TEL_AVIV = { lat: 32.08, lng: 34.78 };

describe("macroRegionOf", () => {
  it("range un lieu d'après sa position", () => {
    expect(macroRegionOf({ latitude: 32.08, longitude: 34.78 })).toBe("tlv");
    expect(macroRegionOf({ latitude: 31.78, longitude: 35.22 })).toBe("jlm");
    expect(macroRegionOf({ latitude: 32.79, longitude: 35.53 })).toBe("gal"); // Tibériade
    expect(macroRegionOf({ latitude: 32.73, longitude: 35.0 })).toBe("car"); // Beit Oren
    expect(macroRegionOf({ latitude: 30.61, longitude: 34.8 })).toBe("neg"); // Mitzpe Ramon
    expect(macroRegionOf({ latitude: 31.2, longitude: 35.36 })).toBe("neg"); // Ein Bokek
    expect(macroRegionOf({ latitude: 31.46, longitude: 35.39 })).toBe("neg"); // Ein Gedi
    expect(macroRegionOf({ latitude: 29.55, longitude: 34.95 })).toBe("eil");
    expect(macroRegionOf({ latitude: 30.6, longitude: 35.2 })).toBe("eil"); // Arava
  });

  it("la position passe avant le texte, et accepte les nombres écrits en texte", () => {
    expect(macroRegionOf({ region: "Tsafon", latitude: "29.55", longitude: "34.95" })).toBe("eil");
  });

  it("sans position (ou avec une position hors d'Israël), se rabat sur la ville puis la région", () => {
    expect(macroRegionOf({ region: "Sea outing", city: "Herzliya" })).toBe("tlv");
    expect(macroRegionOf({ region: "Mount Carmel area, Northern Israel" })).toBe("car");
    expect(macroRegionOf({ region: "Sea of Galilee, Northern Israel", city: "Tiberias" })).toBe("gal");
    expect(macroRegionOf({ region: "Ramat HaNegev (Western Negev, near Nitzana)" })).toBe("neg");
    expect(macroRegionOf({ region: "Darom" })).toBe("neg");
    expect(macroRegionOf({ region: "Samaria, Central Israel", latitude: 1, longitude: 1 })).toBe("tlv");
  });

  it("renvoie null quand rien ne permet de situer le lieu", () => {
    expect(macroRegionOf({ region: "Water sports" })).toBeNull();
    expect(macroRegionOf(null)).toBeNull();
  });
});

describe("filterByRegion", () => {
  const items = [
    { id: "jaffa", latitude: 32.05, longitude: 34.75 },
    { id: "eilat", latitude: 29.55, longitude: 34.95 },
    { id: "herzliya", latitude: 32.16, longitude: 34.84 },
    { id: "sans-position", region: "Tel Aviv" },
  ];
  const place = (i: (typeof items)[number]) => i;

  it("sans choix, garde tout dans l'ordre", () => {
    expect(filterByRegion(items, place, null, null).map((p) => p.item.id)).toEqual(items.map((i) => i.id));
  });

  it("filtre par grande région, y compris les lieux sans position", () => {
    expect(filterByRegion(items, place, "tlv", null).map((p) => p.item.id)).toEqual(["jaffa", "herzliya", "sans-position"]);
  });

  it("« Autour de moi » : du plus proche au plus lointain, sans les lieux trop loin ou sans position", () => {
    const near = filterByRegion(items, place, "near", TEL_AVIV);
    expect(near.map((p) => p.item.id)).toEqual(["jaffa", "herzliya"]);
    expect(near[0].distanceKm).toBeLessThan(10);
  });

  it("« Autour de moi » sans position connue ne renvoie rien", () => {
    expect(filterByRegion(items, place, "near", null)).toEqual([]);
  });
});

describe("countByRegion et distanceKm", () => {
  it("compte par région et ignore les lieux non situés", () => {
    expect(countByRegion([{ city: "Eilat" }, { city: "Jaffa" }, { city: "Tel Aviv" }, { region: "?" }], (p) => p)).toEqual({ eil: 1, tlv: 2 });
  });

  it("Tel Aviv - Jérusalem fait environ 54 km", () => {
    expect(distanceKm(TEL_AVIV, { lat: 31.78, lng: 35.22 })).toBeGreaterThan(50);
    expect(distanceKm(TEL_AVIV, { lat: 31.78, lng: 35.22 })).toBeLessThan(60);
  });
});
