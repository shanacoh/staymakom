import { describe, expect, it } from "vitest";
import { canonicalRedirect } from "../../api/_seo/redirect";
import { defaultExperienceSeoTitle, experienceSeoTitle, isUsableSeoTitle, softenCaps } from "../../api/_seo/seoTitle";

const W = "https://www.staymakom.com";

describe("Une seule adresse par fiche (301 du guichet robots)", () => {
  it("adresse déjà canonique : pas de redirection", () => {
    expect(canonicalRedirect("/experience/galita", undefined, "/experience/galita", "en")).toBeNull();
    expect(canonicalRedirect("/experience/galita", "fr", "/experience/galita", "fr")).toBeNull();
    expect(canonicalRedirect("/", undefined, undefined, "en")).toBeNull();
  });
  it("ancienne route ou mauvais type → 301 en gardant la langue", () => {
    expect(canonicalRedirect("/experience2/galita", undefined, "/experience/galita", "en")).toBe(`${W}/experience/galita`);
    expect(canonicalRedirect("/standalone-experience/galita", "he", "/experience/galita", "he")).toBe(`${W}/experience/galita?lang=he`);
    expect(canonicalRedirect("/hotels/inbal", "fr", "/hotel/inbal", "fr")).toBe(`${W}/hotel/inbal?lang=fr`);
  });
  it("?lang=en ou langue inconnue → adresse nue", () => {
    expect(canonicalRedirect("/experience/galita", "en", "/experience/galita", "en")).toBe(`${W}/experience/galita`);
    expect(canonicalRedirect("/", "xx", undefined, "en")).toBe(`${W}/`);
  });
  it("barre finale → adresse sans barre", () => {
    expect(canonicalRedirect("/experience/galita/", undefined, "/experience/galita", "en")).toBe(`${W}/experience/galita`);
  });
});

describe("Titre Google des fiches", () => {
  it("le titre SEO saisi est prioritaire", () => {
    expect(experienceSeoTitle({ seoTitle: "Cooking Classes in Tel Aviv", editorialTitle: "COOK LIKE A TEL AVIVI", place: "Tel Aviv" })).toBe("Cooking Classes in Tel Aviv");
  });
  it("titre SEO vide ou identique au titre éditorial → titre descriptif sans majuscules", () => {
    expect(isUsableSeoTitle("SOURCES SECRÈTES DU NÉGUEV | STAYMAKOM", "SOURCES SECRÈTES DU NÉGUEV")).toBe(false);
    expect(experienceSeoTitle({ seoTitle: "", editorialTitle: "SOURCES SECRÈTES DU NÉGUEV", place: "Sde Boker" })).toBe("Sources Secrètes du Néguev | Sde Boker | STAYMAKOM");
  });
  it("jamais plus de 60 caractères", () => {
    const title = defaultExperienceSeoTitle("WINE TASTING IN THE NEGEV'S LONE FARMS AND ANCIENT TERRACES OF THE DESERT", "Mitspe Ramon");
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("| Mitspe Ramon")).toBe(true);
  });
  it("un titre déjà en minuscules n'est pas touché", () => {
    expect(softenCaps("Drink & Paint on the Tel Aviv Shore")).toBe("Drink & Paint on the Tel Aviv Shore");
  });
});
