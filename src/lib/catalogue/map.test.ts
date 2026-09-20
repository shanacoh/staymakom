import { describe, it, expect } from "vitest";
import { clusterPoints, googleMapsUrl, isSamePlace, locateQueries, mapBaseEntries, splitByPosition } from "./map";
import type { CatalogueEntry } from "./types";

const entry = (over: Partial<CatalogueEntry>): CatalogueEntry =>
  ({
    id: over.id ?? "x",
    display_name: "Lieu",
    display_latitude: null,
    display_longitude: null,
    commercial_status: "partenaire",
    ...over,
  }) as CatalogueEntry;

describe("mapBaseEntries", () => {
  const all = [
    entry({ id: "a", commercial_status: "partenaire" }),
    entry({ id: "b", commercial_status: "a_trier" }),
    entry({ id: "c", commercial_status: "refuse" }),
    entry({ id: "d", commercial_status: "idee" }),
  ];

  it("écarte les lieux à trier et les lieux abandonnés", () => {
    expect(mapBaseEntries(all, false).map((e) => e.id)).toEqual(["a", "d"]);
  });

  it("montre les lieux abandonnés seulement si on les demande", () => {
    expect(mapBaseEntries(all, true).map((e) => e.id)).toEqual(["a", "c", "d"]);
  });
});

describe("splitByPosition", () => {
  it("sépare les lieux placés, à localiser et suspects", () => {
    const { placed, missing, suspect } = splitByPosition([
      entry({ id: "ok", display_latitude: 32.5, display_longitude: 34.9 }),
      entry({ id: "sans" }),
      entry({ id: "moitie", display_latitude: 32.5, display_longitude: null }),
      entry({ id: "ocean", display_latitude: 1, display_longitude: 1 }),
      entry({ id: "zero", display_latitude: 0, display_longitude: 0 }),
    ]);
    expect(placed.map((p) => p.id)).toEqual(["ok"]);
    expect(missing.map((e) => e.id)).toEqual(["sans", "moitie"]);
    expect(suspect.map((e) => e.id)).toEqual(["ocean", "zero"]);
    expect(placed[0]).toMatchObject({ lat: 32.5, lng: 34.9 });
  });

  it("accepte une position écrite en texte", () => {
    const { placed } = splitByPosition([
      entry({ id: "txt", display_latitude: "32.5723" as unknown as number, display_longitude: "34.9531" as unknown as number }),
      entry({ id: "vide", display_latitude: "" as unknown as number, display_longitude: "" as unknown as number }),
    ]);
    expect(placed).toHaveLength(1);
    expect(placed[0]).toMatchObject({ id: "txt", lat: 32.5723, lng: 34.9531 });
  });

  it("range une position impossible ou inversée parmi les suspects", () => {
    const { placed, suspect } = splitByPosition([
      entry({ id: "fou", display_latitude: 95, display_longitude: 10 }),
      entry({ id: "inversee", display_latitude: 34.78, display_longitude: 32.08 }),
    ]);
    expect(placed).toEqual([]);
    expect(suspect.map((e) => e.id)).toEqual(["fou", "inversee"]);
  });
});

describe("clusterPoints", () => {
  // Projection simple : 1 degré = 100 pixels
  const project = (lat: number, lng: number) => ({ x: lng * 100, y: lat * 100 });

  it("regroupe les épingles proches et garde les lointaines seules", () => {
    const points = [
      { lat: 32.0, lng: 34.0 },
      { lat: 32.001, lng: 34.001 }, // à 0,1 pixel du premier
      { lat: 32.0, lng: 34.9 }, // à 90 pixels
    ];
    const clusters = clusterPoints(points, project, 10, { cellSize: 46 });
    expect(clusters).toHaveLength(2);
    const big = clusters.find((c) => c.items.length === 2)!;
    expect(big.lat).toBeCloseTo(32.0005, 4);
    expect(big.lng).toBeCloseTo(34.0005, 4);
  });

  it("ne regroupe plus du tout à fort zoom", () => {
    const points = [
      { lat: 32.0, lng: 34.0 },
      { lat: 32.0, lng: 34.0 },
    ];
    expect(clusterPoints(points, project, 16)).toHaveLength(2);
    expect(clusterPoints(points, project, 12)).toHaveLength(1);
  });

  it("répartit chaque épingle dans un seul groupe", () => {
    const points = Array.from({ length: 50 }, (_, i) => ({ lat: 31 + (i % 10) * 0.05, lng: 34 + Math.floor(i / 10) * 0.05 }));
    const clusters = clusterPoints(points, project, 8);
    expect(clusters.reduce((n, c) => n + c.items.length, 0)).toBe(50);
  });
});

describe("isSamePlace", () => {
  it("reconnaît des lieux impossibles à séparer en zoomant", () => {
    expect(isSamePlace([{ lat: 32.1, lng: 34.8 }, { lat: 32.1, lng: 34.8 }])).toBe(true);
    expect(isSamePlace([{ lat: 32.1, lng: 34.8 }, { lat: 32.1, lng: 34.81 }])).toBe(false);
  });
});

describe("locateQueries", () => {
  it("propose d'abord l'adresse, puis le nom avec la ville, puis le nom seul", () => {
    expect(locateQueries({ display_name: "Vignoble Éden", display_address: "HaYekev 1", display_city: "Zichron" })).toEqual([
      "HaYekev 1, Zichron",
      "Vignoble Éden Zichron",
      "Vignoble Éden",
    ]);
  });

  it("ne répète rien et saute ce qui manque", () => {
    expect(locateQueries({ display_name: "Café Rimon", display_address: null, display_city: null })).toEqual(["Café Rimon"]);
    expect(locateQueries({ display_name: "Ab", display_address: null, display_city: null })).toEqual([]);
  });
});

describe("googleMapsUrl", () => {
  it("construit un lien vers la position", () => {
    expect(googleMapsUrl(32.5723, 34.9531)).toBe("https://www.google.com/maps/search/?api=1&query=32.5723,34.9531");
  });
});
