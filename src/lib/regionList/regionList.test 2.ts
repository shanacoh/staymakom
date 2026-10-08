import { describe, it, expect } from "vitest";
import { countByRegion, filterByRegion, zoneSlugOf } from "./filter";
import { groupByZone, regionLabel } from "./labels";
import type { RegionList } from "./types";

const zone = (slug: string, order: number) => ({ slug, name: slug, name_fr: `${slug}-fr`, name_he: `${slug}-he`, display_order: order });
const region = (slug: string, zone_slug: string, order: number, is_active = true) => ({
  id: `id-${slug}`,
  slug,
  name: slug,
  name_fr: `${slug}-fr`,
  name_he: `${slug}-he`,
  zone_slug,
  display_order: order,
  is_active,
});

const LIST: RegionList = {
  zones: [zone("south", 4), zone("north", 1), zone("coast-center", 2), zone("jerusalem", 3)],
  regions: [
    region("tel-aviv", "coast-center", 12),
    region("sharon", "coast-center", 11),
    region("kinneret", "north", 4),
    region("eilat", "south", 21),
    region("old", "south", 22, false),
  ],
};
const EMPTY: RegionList = { zones: [], regions: [] };
const TEL_AVIV = { lat: 32.08, lng: 34.78 };

describe("regionLabel", () => {
  it("donne le nom de la liste, dans la langue demandée, quand la fiche est reliée", () => {
    const fiche = { region_id: "id-tel-aviv", region: "Sea outing", region_fr: "Sortie en mer" };
    expect(regionLabel(fiche, "en", LIST)).toBe("tel-aviv");
    expect(regionLabel(fiche, "fr", LIST)).toBe("tel-aviv-fr");
    expect(regionLabel(fiche, "he", LIST)).toBe("tel-aviv-he");
  });

  it("retombe sur l'ancien texte quand la fiche n'est pas reliée, ou que la liste est indisponible", () => {
    const fiche = { region: "Galilee", region_fr: "Galilée" };
    expect(regionLabel(fiche, "en", LIST)).toBe("Galilee");
    expect(regionLabel(fiche, "fr", LIST)).toBe("Galilée");
    expect(regionLabel(fiche, "he", LIST)).toBe("Galilee");
    expect(regionLabel({ region_id: "id-tel-aviv", region: "Tel Aviv" }, "fr", EMPTY)).toBe("Tel Aviv");
    expect(regionLabel({ region: "  " }, "en", LIST)).toBeNull();
    expect(regionLabel(null, "en", LIST)).toBeNull();
  });
});

describe("groupByZone", () => {
  it("range les régions actives par zone, dans l'ordre d'affichage, sans les zones vides", () => {
    const groups = groupByZone(LIST);
    expect(groups.map((g) => g.zone.slug)).toEqual(["north", "coast-center", "south"]);
    expect(groups[1].regions.map((r) => r.slug)).toEqual(["sharon", "tel-aviv"]);
    expect(groups[2].regions.map((r) => r.slug)).toEqual(["eilat"]);
  });

  it("peut inclure les régions désactivées (pour une fiche qui en porte encore une)", () => {
    expect(groupByZone(LIST, { includeInactive: true })[2].regions.map((r) => r.slug)).toEqual(["eilat", "old"]);
  });
});

describe("zoneSlugOf", () => {
  it("la région reliée décide de la zone, même si la position dit autre chose", () => {
    expect(zoneSlugOf({ region_id: "id-eilat", latitude: 32.08, longitude: 34.78 }, LIST)).toBe("south");
  });

  it("sans région reliée, estime la zone d'après la position puis l'ancien texte", () => {
    expect(zoneSlugOf({ latitude: 32.79, longitude: 35.53 }, LIST)).toBe("north"); // Tibériade
    expect(zoneSlugOf({ latitude: 31.78, longitude: 35.22 }, LIST)).toBe("jerusalem");
    expect(zoneSlugOf({ latitude: 30.61, longitude: 34.8 }, LIST)).toBe("south"); // Mitzpe Ramon
    expect(zoneSlugOf({ latitude: 32.73, longitude: 35.0 }, LIST)).toBe("north"); // Beit Oren
    expect(zoneSlugOf({ latitude: 32.57, longitude: 34.95 }, LIST)).toBe("coast-center"); // Zichron
    expect(zoneSlugOf({ region: "Carmel", city: "Bat Shlomo" }, LIST)).toBe("coast-center");
    expect(zoneSlugOf({ region: "Carmel" }, LIST)).toBe("north");
    expect(zoneSlugOf({ region: "Water sports" }, LIST)).toBeNull();
  });
});

describe("filterByRegion et countByRegion", () => {
  const items = [
    { id: "jaffa", region_id: "id-tel-aviv", latitude: 32.05, longitude: 34.75 },
    { id: "eilat", region_id: "id-eilat", latitude: 29.55, longitude: 34.95 },
    { id: "herzliya", region_id: "id-sharon", latitude: 32.16, longitude: 34.84 },
    { id: "non-reliee", region: "Tel Aviv" },
  ];
  const place = (i: (typeof items)[number]) => i;
  const ids = (choice: Parameters<typeof filterByRegion>[2], position = null as typeof TEL_AVIV | null) =>
    filterByRegion(items, place, choice, position, LIST).map((p) => p.item.id);

  it("sans choix, garde tout dans l'ordre", () => {
    expect(ids(null)).toEqual(items.map((i) => i.id));
  });

  it("une zone garde ses régions et les fiches non reliées qu'on sait situer", () => {
    expect(ids("zone:coast-center")).toEqual(["jaffa", "herzliya", "non-reliee"]);
  });

  it("une région ne garde que les fiches qui y sont reliées", () => {
    expect(ids("region:tel-aviv")).toEqual(["jaffa"]);
  });

  it("« Autour de moi » : du plus proche au plus lointain, sans les lieux trop loin ou sans position", () => {
    expect(ids("near", TEL_AVIV)).toEqual(["jaffa", "herzliya"]);
    expect(ids("near")).toEqual([]);
  });

  it("compte par zone et par région", () => {
    expect(countByRegion(items, place, LIST)).toEqual({
      zones: { "coast-center": 3, south: 1 },
      regions: { "tel-aviv": 1, eilat: 1, sharon: 1 },
    });
  });
});
