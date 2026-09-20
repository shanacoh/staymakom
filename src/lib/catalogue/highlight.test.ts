import { describe, it, expect } from "vitest";
import { highlightSegments } from "./highlight";

const joined = (segments: { text: string }[]) => segments.map((s) => s.text).join("");

describe("highlightSegments", () => {
  it("surligne un mot sans tenir compte des accents ni des majuscules, en gardant le texte d'origine", () => {
    const segments = highlightSegments("Vignoble Éden", ["eden"]);
    expect(segments).toEqual([
      { text: "Vignoble ", match: false },
      { text: "Éden", match: true },
    ]);
  });

  it("surligne plusieurs mots et plusieurs occurrences", () => {
    const segments = highlightSegments("Café du Port, café du soir", ["cafe", "port"]);
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(["Café", "Port", "café"]);
    expect(joined(segments)).toBe("Café du Port, café du soir");
  });

  it("ne change jamais le texte, même sans recherche ou sans résultat", () => {
    expect(highlightSegments("Tel Aviv", [])).toEqual([{ text: "Tel Aviv", match: false }]);
    expect(highlightSegments("Tel Aviv", ["haifa"])).toEqual([{ text: "Tel Aviv", match: false }]);
    expect(highlightSegments("", ["a"])).toEqual([{ text: "", match: false }]);
  });

  it("garde le texte intact avec des lettres qui changent de longueur une fois simplifiées", () => {
    const text = "Œuvre d'Éden & fils";
    const segments = highlightSegments(text, ["eden"]);
    expect(joined(segments)).toBe(text);
    expect(segments.find((s) => s.match)?.text).toBe("Éden");
  });

  it("marche aussi pour un texte en hébreu ou avec des symboles", () => {
    const text = "יקב תשבי & Co";
    expect(joined(highlightSegments(text, ["co"]))).toBe(text);
    expect(highlightSegments(text, ["co"]).find((s) => s.match)?.text).toBe("Co");
  });
});
