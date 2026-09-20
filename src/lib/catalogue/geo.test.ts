import { describe, it, expect } from "vitest";
import {
  formatPosition,
  hasSuspectPosition,
  isInIsrael,
  outsideIsraelWarning,
  positionOf,
  siteHasBadPosition,
} from "./geo";

describe("isInIsrael", () => {
  it("accepte des lieux d'un bout à l'autre du pays", () => {
    const places: [string, number, number][] = [
      ["Tel Aviv", 32.0853, 34.7818],
      ["Jérusalem", 31.7683, 35.2137],
      ["Eilat", 29.5577, 34.9519],
      ["Metula", 33.2797, 35.5796],
      ["Zichron Yaakov", 32.5723, 34.9531],
      ["Mer Morte", 31.5, 35.5],
      ["Golan", 33.13, 35.75],
    ];
    for (const [name, lat, lng] of places) expect(isInIsrael(lat, lng), name).toBe(true);
  });

  it("refuse les erreurs typiques", () => {
    expect(isInIsrael(1, 1)).toBe(false); // valeur par défaut relevée sur des fiches du site
    expect(isInIsrael(1, 3)).toBe(false);
    expect(isInIsrael(0, 0)).toBe(false);
    expect(isInIsrael(34.7818, 32.0853)).toBe(false); // latitude et longitude inversées
    expect(isInIsrael(48.85, 2.35)).toBe(false); // Paris
    expect(isInIsrael(95, 34.8)).toBe(false);
    expect(isInIsrael(NaN, 34.8)).toBe(false);
  });
});

describe("positionOf", () => {
  it("lit des nombres ou des textes, et refuse une moitié de position", () => {
    expect(positionOf(32.5, 34.9)).toEqual({ lat: 32.5, lng: 34.9 });
    expect(positionOf("32.5", "34.9")).toEqual({ lat: 32.5, lng: 34.9 });
    expect(positionOf(32.5, null)).toBeNull();
    expect(positionOf("", "")).toBeNull();
    expect(positionOf(undefined, undefined)).toBeNull();
  });
});

describe("alertes de position", () => {
  it("repère la position affichée hors d'Israël, jamais un lieu sans position", () => {
    expect(hasSuspectPosition({ display_latitude: 1, display_longitude: 1 })).toBe(true);
    expect(hasSuspectPosition({ display_latitude: 32.5, display_longitude: 34.9 })).toBe(false);
    expect(hasSuspectPosition({ display_latitude: null, display_longitude: null })).toBe(false);
    expect(hasSuspectPosition({ display_latitude: 32.5, display_longitude: null })).toBe(false);
  });

  it("repère une fiche du site qui porte une position aberrante, même corrigée dans le catalogue", () => {
    expect(siteHasBadPosition({ live_kind: "standalone", live_latitude: 1, live_longitude: 2 })).toBe(true);
    expect(siteHasBadPosition({ live_kind: "standalone", live_latitude: 32.1, live_longitude: 34.8 })).toBe(false);
    expect(siteHasBadPosition({ live_kind: "standalone", live_latitude: null, live_longitude: null })).toBe(false);
    expect(siteHasBadPosition({ live_kind: null, live_latitude: 1, live_longitude: 1 })).toBe(false);
  });

  it("prépare un message clair pour une saisie hors d'Israël", () => {
    expect(outsideIsraelWarning("1", "1")).toMatch(/n'est pas en Israël/);
    expect(outsideIsraelWarning(34.78, 32.08)).toMatch(/inversées/);
    expect(outsideIsraelWarning(32.08, 34.78)).toBeNull();
    expect(outsideIsraelWarning("", "")).toBeNull();
  });

  it("écrit une position lisiblement", () => {
    expect(formatPosition(1, 1)).toBe("1, 1");
    expect(formatPosition(32.57234567, 34.95311111)).toBe("32.5723, 34.9531");
  });
});
