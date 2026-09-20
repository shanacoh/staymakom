import { describe, it, expect } from "vitest";
import { buildAiMessages, parseAiSuggestion, stripLongDashes } from "./ai";

describe("parseAiSuggestion", () => {
  it("lit une réponse propre", () => {
    const result = parseAiSuggestion(
      JSON.stringify({
        name: "Tishbi Winery",
        place_type: "activite",
        city: "Zichron Yaakov",
        region: "Center District Israel",
        address: "HaYekev 1",
        phone: "+972 4-628-8888",
        email: "info@tishbi.com",
        instagram: "tishbiwinery",
        description: "Un domaine viticole familial.",
      })
    );
    expect(result).toMatchObject({
      name: "Tishbi Winery",
      place_type: "activite",
      instagram: "@tishbiwinery",
      email: "info@tishbi.com",
      description: "Un domaine viticole familial.",
    });
  });

  it("supporte une réponse entourée de ``` ou de texte", () => {
    const content = 'Voici le résultat :\n```json\n{"name":"Café Rimon","place_type":"restaurant"}\n```';
    expect(parseAiSuggestion(content)).toMatchObject({ name: "Café Rimon", place_type: "restaurant" });
  });

  it("transforme les valeurs vides ou douteuses en 'vide' plutôt que de les garder", () => {
    const result = parseAiSuggestion(
      JSON.stringify({
        name: "  ",
        place_type: "hôtel de luxe",
        city: "null",
        phone: "12",
        email: "pas-un-email",
        instagram: "n'importe quoi !",
        region: 42,
      })
    );
    expect(result).toEqual({
      name: null,
      place_type: null,
      city: null,
      region: null,
      address: null,
      phone: null,
      email: null,
      instagram: null,
      description: null,
    });
  });

  it("n'utilise jamais de tiret long dans la description", () => {
    const result = parseAiSuggestion(JSON.stringify({ description: "Un vignoble — ouvert toute l'année – en famille." }));
    expect(result?.description).toBe("Un vignoble, ouvert toute l'année, en famille.");
    expect(stripLongDashes("a — b")).toBe("a, b");
  });

  it("renvoie rien quand la réponse n'est pas exploitable", () => {
    expect(parseAiSuggestion(null)).toBeNull();
    expect(parseAiSuggestion("désolé, je ne peux pas")).toBeNull();
    expect(parseAiSuggestion("{cassé")).toBeNull();
  });
});

describe("buildAiMessages", () => {
  it("donne les consignes de prudence et les régions déjà connues à l'IA", () => {
    const messages = buildAiMessages({
      kind: "site",
      url: "https://www.tishbi.com",
      lang: "en",
      title: "Tishbi",
      siteName: null,
      description: null,
      caption: null,
      author: null,
      text: "Welcome",
      structured: null,
      knownRegions: ["Tsafon", "Darom"],
    });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toMatch(/UNTRUSTED/);
    expect(messages[0].content).toMatch(/Never guess/);
    expect(messages[1].content).toContain('"Tsafon","Darom"');
    expect(messages[1].content).toContain("https://www.tishbi.com");
  });
});
