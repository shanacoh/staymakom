import { describe, it, expect } from "vitest";
import { guessPlaceType, mapOsmResult, matchKnownRegion, type OsmResult } from "./osm";

describe("guessPlaceType", () => {
  it("range les lieux OpenStreetMap dans nos types", () => {
    expect(guessPlaceType("tourism", "hotel")).toBe("hebergement");
    expect(guessPlaceType("tourism", "guest_house")).toBe("hebergement");
    expect(guessPlaceType("tourism", "museum")).toBe("lieu_a_visiter");
    expect(guessPlaceType("amenity", "restaurant")).toBe("restaurant");
    expect(guessPlaceType("craft", "winery")).toBe("activite");
    expect(guessPlaceType("leisure", "spa")).toBe("activite");
    expect(guessPlaceType("leisure", "nature_reserve")).toBe("lieu_a_visiter");
    expect(guessPlaceType("historic", "ruins")).toBe("lieu_a_visiter");
    expect(guessPlaceType("highway", "residential")).toBe("autre");
    expect(guessPlaceType(undefined, undefined)).toBe("autre");
  });
});

describe("matchKnownRegion", () => {
  const known = ["Tsafon", "Darom", "Center District Israel", "South District Israel", "Tel Aviv"];

  it("reprend l'écriture déjà utilisée dans le catalogue", () => {
    expect(matchKnownRegion("Center District", known)).toBe("Center District Israel");
    expect(matchKnownRegion("Southern District", known)).toBe("South District Israel");
    expect(matchKnownRegion("Tel Aviv District", known)).toBe("Tel Aviv");
  });

  it("garde la région trouvée quand rien ne correspond, et ne plante pas sans région", () => {
    expect(matchKnownRegion("Haifa District", known)).toBe("Haifa District");
    expect(matchKnownRegion(null, known)).toBeNull();
    expect(matchKnownRegion("Nord", [])).toBe("Nord");
  });
});

describe("mapOsmResult", () => {
  const winery: OsmResult = {
    lat: "32.5723",
    lon: "34.9531",
    name: "יקב תשבי",
    display_name: "יקב תשבי, זכרון יעקב, ישראל",
    category: "craft",
    type: "winery",
    address: { road: "HaYekev", house_number: "1", town: "Zichron Yaakov", state: "Haifa District" },
    namedetails: { name: "יקב תשבי", "name:en": "Tishbi Winery" },
    extratags: {
      website: "www.tishbi.com",
      phone: "+972-4-6288 888;+972-4-000",
      "contact:instagram": "https://www.instagram.com/tishbiwinery/",
      email: "info@tishbi.com",
    },
  };

  it("construit une fiche complète à partir d'un résultat riche", () => {
    const candidate = mapOsmResult(winery, [])!;
    expect(candidate.label).toBe("Tishbi Winery · Zichron Yaakov");
    expect(candidate.suggestion).toMatchObject({
      name: "Tishbi Winery",
      place_type: "activite",
      city: "Zichron Yaakov",
      region: "Haifa District",
      address: "HaYekev 1",
      latitude: 32.5723,
      longitude: 34.9531,
      phone: "+972-4-6288 888",
      email: "info@tishbi.com",
      instagram: "@tishbiwinery",
      website: "https://www.tishbi.com/",
      google_maps_link: "https://www.google.com/maps/search/?api=1&query=32.5723,34.9531",
    });
  });

  it("se contente du nom quand il n'y a pas de détails, et refuse un résultat sans position", () => {
    const bare = mapOsmResult({ lat: "31.7", lon: "35.2", display_name: "Café Rimon, Jérusalem", category: "amenity", type: "cafe" })!;
    expect(bare.suggestion).toMatchObject({ name: "Café Rimon", place_type: "restaurant", phone: null, website: null, city: null });
    expect(bare.label).toBe("Café Rimon");
    expect(mapOsmResult({ name: "Sans position" })).toBeNull();
    expect(mapOsmResult({ lat: "1", lon: "2" })).toBeNull();
  });

  it("écarte un site web invalide", () => {
    const result = mapOsmResult({ ...winery, extratags: { website: "pas un site" } })!;
    expect(result.suggestion.website).toBeNull();
  });
});
