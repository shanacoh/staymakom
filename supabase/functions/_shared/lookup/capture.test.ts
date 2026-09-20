import { describe, it, expect } from "vitest";
import { buildCaptureItem, captureMessage, extractFirstUrl, pickConfidentCandidate, timingSafeEqual } from "./capture";
import { EMPTY_SUGGESTION, type Candidate } from "./osm";
import type { LookupResult } from "./lookup";

const candidate = (name: string, over: Partial<Candidate["suggestion"]> = {}): Candidate => ({
  label: name,
  suggestion: { ...EMPTY_SUGGESTION, name, ...over },
});

const result = (over: Partial<LookupResult> = {}): LookupResult => ({
  kind: "social",
  suggestion: { ...EMPTY_SUGGESTION },
  link: { platform: "tiktok", url: "https://www.tiktok.com/@a/video/123", caption: "Belle adresse", author: "foodie", thumbnail_url: "https://cdn/t.jpg" },
  candidates: [],
  warnings: [],
  sources: [],
  ...over,
});

describe("extractFirstUrl", () => {
  it("retrouve le lien dans un texte partagé et retire la ponctuation collée", () => {
    expect(extractFirstUrl("https://vm.tiktok.com/ZMabc/")).toBe("https://vm.tiktok.com/ZMabc/");
    expect(extractFirstUrl("Regarde ça ! https://www.instagram.com/reel/CxYz/?igsh=abc.")).toBe("https://www.instagram.com/reel/CxYz/?igsh=abc");
    expect(extractFirstUrl("(voir https://www.tishbi.com/fr), merci")).toBe("https://www.tishbi.com/fr");
    expect(extractFirstUrl("https://a.com/x et https://b.com/y")).toBe("https://a.com/x");
  });

  it("renvoie rien quand il n'y a pas de lien", () => {
    expect(extractFirstUrl("juste du texte")).toBeNull();
    expect(extractFirstUrl("")).toBeNull();
    expect(extractFirstUrl("ftp://exemple.com")).toBeNull();
  });
});

describe("timingSafeEqual", () => {
  it("compare deux secrets", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    expect(timingSafeEqual("abc", "abc123")).toBe(false);
    expect(timingSafeEqual("", "abc")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("pickConfidentCandidate", () => {
  it("ne retient qu'un lieu de la carte qui porte bien le nom repéré", () => {
    const list = [candidate("Tishbi Winery"), candidate("Café Rimon")];
    expect(pickConfidentCandidate("Tishbi", list)?.label).toBe("Tishbi Winery");
    expect(pickConfidentCandidate("Tishbi Winery", list)?.label).toBe("Tishbi Winery");
    expect(pickConfidentCandidate("CAFE RIMON", list)?.label).toBe("Café Rimon");
  });

  it("refuse un homonyme situé hors d'Israël, même si le nom correspond", () => {
    const abroad = candidate("Tishbi Winery", { latitude: 48.85, longitude: 2.35 });
    const inIsrael = candidate("Tishbi Winery", { latitude: 32.57, longitude: 34.95 });
    expect(pickConfidentCandidate("Tishbi", [abroad])).toBeNull();
    expect(pickConfidentCandidate("Tishbi", [abroad, inIsrael])).toBe(inIsrael);
    // un candidat sans position n'est pas suspect
    expect(pickConfidentCandidate("Tishbi", [candidate("Tishbi Winery")])?.label).toBe("Tishbi Winery");
  });

  it("refuse un homonyme lointain, un nom trop court ou l'absence de nom", () => {
    const list = [candidate("Tishbi Winery")];
    expect(pickConfidentCandidate("Hôtel Mamilla", list)).toBeNull();
    expect(pickConfidentCandidate("Spa", [candidate("Spa du Désert")])).toBeNull();
    expect(pickConfidentCandidate(null, list)).toBeNull();
  });
});

describe("buildCaptureItem", () => {
  it("garde le lien seul, à identifier, quand la recherche n'a rien trouvé ou a échoué", () => {
    const failed = buildCaptureItem(null, "https://vm.tiktok.com/ZMabc/");
    expect(failed.item).toMatchObject({ name: "À identifier (TikTok)", commercial_status: "a_trier", nature: "inspiration", place_type: "autre", source: "tiktok" });
    expect(failed.link).toEqual({ url: "https://vm.tiktok.com/ZMabc/", platform: "tiktok", caption: null, author: null, thumbnail_url: null });
    expect(failed.identifiedName).toBeNull();
    expect(captureMessage(failed, null)).toBe("Ajouté à trier : TikTok, lieu à identifier dans le catalogue");
  });

  it("copie légende, auteur et vignette, et garde le nom proposé par l'IA", () => {
    const record = buildCaptureItem(
      result({ suggestion: { ...EMPTY_SUGGESTION, name: "Tishbi Winery", city: "Zichron", place_type: "activite", description: "Un domaine familial." } }),
      "https://vm.tiktok.com/ZMabc/"
    );
    expect(record.item).toMatchObject({ name: "Tishbi Winery", city: "Zichron", place_type: "activite", notes: "Un domaine familial.", latitude: null });
    expect(record.link).toEqual({ url: "https://www.tiktok.com/@a/video/123", platform: "tiktok", caption: "Belle adresse", author: "foodie", thumbnail_url: "https://cdn/t.jpg" });
    expect(captureMessage(record, "Zichron")).toBe("Ajouté à trier : Tishbi Winery (Zichron)");
  });

  it("adopte l'adresse et la position de la carte seulement pour un lieu qui correspond", () => {
    const osm = candidate("Tishbi Winery", { address: "HaYekev 1", latitude: 32.57, longitude: 34.95, website: "https://www.tishbi.com/", city: "Zichron Yaakov" });
    const good = buildCaptureItem(
      result({ suggestion: { ...EMPTY_SUGGESTION, name: "Tishbi", description: "Dégustation." }, candidates: [osm] }),
      "https://vm.tiktok.com/x/"
    );
    expect(good.item).toMatchObject({ name: "Tishbi Winery", address: "HaYekev 1", latitude: 32.57, contact_website: "https://www.tishbi.com/", notes: "Dégustation." });

    const wrong = buildCaptureItem(
      result({ suggestion: { ...EMPTY_SUGGESTION, name: "Hôtel Mamilla" }, candidates: [osm] }),
      "https://vm.tiktok.com/x/"
    );
    expect(wrong.item).toMatchObject({ name: "Hôtel Mamilla", address: null, latitude: null });
  });

  it("déduit la plateforme de l'adresse quand la recherche a échoué", () => {
    expect(buildCaptureItem(null, "https://www.instagram.com/reel/CxYz/").item.source).toBe("instagram");
    expect(buildCaptureItem(null, "https://www.tishbi.com").item).toMatchObject({ source: "autre", name: "À identifier (Site web)" });
    expect(buildCaptureItem(null, "pas une adresse").item.name).toBe("À identifier (Lien)");
  });
});
