import { describe, it, expect } from "vitest";
import { EMPTY_LOOKUP_SUGGESTION, describeFacts, findSimilarEntries, mergeSuggestion, toUrl, type LookupSuggestion } from "./lookup";
import type { CatalogueEntry } from "./types";

const s = (overrides: Partial<LookupSuggestion>): LookupSuggestion => ({ ...EMPTY_LOOKUP_SUGGESTION, ...overrides });
const entry = (display_name: string): CatalogueEntry => ({ id: display_name, display_name } as CatalogueEntry);

describe("toUrl", () => {
  it("reconnaît un lien, avec ou sans https://", () => {
    expect(toUrl("https://www.tishbi.com/fr")).toBe("https://www.tishbi.com/fr");
    expect(toUrl("  www.tishbi.com ")).toBe("https://www.tishbi.com");
    expect(toUrl("tishbi.co.il/contact")).toBe("https://tishbi.co.il/contact");
  });

  it("laisse un nom de lieu tranquille", () => {
    expect(toUrl("Vignoble Tishbi")).toBeNull();
    expect(toUrl("Tishbi")).toBeNull();
    expect(toUrl("")).toBeNull();
    expect(toUrl("javascript:alert(1)")).toBeNull();
    expect(toUrl("ftp://exemple.com")).toBeNull();
  });
});

describe("mergeSuggestion", () => {
  it("complète les trous sans jamais écraser une valeur déjà là", () => {
    const merged = mergeSuggestion(
      s({ name: "Tishbi Winery", phone: null, address: "HaYekev 1" }),
      s({ name: "Autre nom", phone: "+972 4-111", address: "Ailleurs 2", description: "Un domaine." })
    );
    expect(merged).toMatchObject({ name: "Tishbi Winery", phone: "+972 4-111", address: "HaYekev 1", description: "Un domaine." });
  });

  it("garde une position à zéro comme une vraie valeur", () => {
    expect(mergeSuggestion(s({ latitude: 0 }), s({ latitude: 32 })).latitude).toBe(0);
  });
});

describe("describeFacts", () => {
  it("liste ce qui a été trouvé, dans un ordre lisible", () => {
    const facts = describeFacts(s({ address: "HaYekev 1", phone: "+972", instagram: "@eden", website: "https://www.eden.co.il/", latitude: 32, longitude: 34 }));
    expect(facts.map((f) => f.label)).toEqual(["Adresse", "Téléphone", "Instagram", "Site web", "Position"]);
    expect(facts.find((f) => f.label === "Site web")?.value).toBe("eden.co.il");
    expect(describeFacts(EMPTY_LOOKUP_SUGGESTION)).toEqual([]);
  });
});

describe("findSimilarEntries", () => {
  const entries = [entry("Vignoble Éden"), entry("Café Rimon"), entry("Éden"), entry("Spa du Désert")];

  it("trouve un lieu déjà présent malgré les accents, la casse ou un nom plus long", () => {
    // "Éden" est contenu dans "vignoble eden" : lui aussi est signalé comme ressemblant
    expect(findSimilarEntries(entries, "vignoble eden").map((e) => e.display_name)).toEqual(["Vignoble Éden", "Éden"]);
    expect(findSimilarEntries(entries, "Café Rimon Jérusalem").map((e) => e.display_name)).toEqual(["Café Rimon"]);
  });

  it("ne signale rien pour un nom trop court ou sans rapport", () => {
    expect(findSimilarEntries(entries, "Spa")).toEqual([]);
    expect(findSimilarEntries(entries, "Hôtel Mamilla")).toEqual([]);
  });

  it("limite le nombre de lieux signalés", () => {
    const many = ["Tishbi A", "Tishbi B", "Tishbi C", "Tishbi D"].map(entry);
    expect(findSimilarEntries(many, "Tishbi", 3)).toHaveLength(3);
  });
});
