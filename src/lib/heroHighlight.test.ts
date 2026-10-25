import { describe, it, expect } from "vitest";
import { getHeroHighlight, formatAges } from "./heroHighlight";
import { BOATS_CATEGORY_ID } from "./boatsCategory";

const FAMILY = "381b9fcd-d8d8-4ec9-b8d7-619d702c42d6";
const FOODY = "1478887c-aca7-433c-bbb5-4f1101505db2";
const STORIES = "3f9e36d1-00d6-4777-87c2-0385439e89c9";
const NATURE = "40ba7f5d-f9ea-4449-bbcb-96ff556985ed";

describe("getHeroHighlight", () => {
  it("choisit selon la catégorie", () => {
    expect(getHeroHighlight({ category_id: BOATS_CATEGORY_ID, max_party: 10, price_variants: [{ max_capacity: 14, is_active: true }, { max_capacity: 30, is_active: false }] }, "fr"))
      .toEqual({ key: "group", label: "Groupe", value: "Jusqu'à 14 pers." });
    expect(getHeroHighlight({ category_id: FAMILY, practical_info: { kids: { status: "yes", from_age: 2 } } }, "en"))
      .toEqual({ key: "ages", label: "Ages", value: "From 2 yrs" });
    expect(getHeroHighlight({ category_id: FOODY, practical_info: { kosher: "yes" } }, "he"))
      .toEqual({ key: "kosher", label: "כשרות", value: "כשר" });
    expect(getHeroHighlight({ category_id: STORIES, languages: ["fr", "en", "he"] }, "en")?.value).toBe("FR · EN · HE");
    expect(getHeroHighlight({ category_id: NATURE, duration: "2 hours", duration_fr: "2 heures" }, "fr"))
      .toEqual({ key: "duration", label: "Durée", value: "2 heures" });
  });

  it("le choix manuel l'emporte sur la catégorie", () => {
    expect(getHeroHighlight({ category_id: FAMILY, hero_highlight: "private" }, "fr")?.value).toBe("Privé");
  });

  it("bascule sur la durée, puis sur rien", () => {
    expect(getHeroHighlight({ category_id: FOODY, duration: "90 minutes", practical_info: { kosher: "not_relevant" } }, "en")?.key).toBe("duration");
    expect(getHeroHighlight({ category_id: STORIES, duration: "3 h", languages: [] }, "en")?.key).toBe("duration");
    expect(getHeroHighlight({ category_id: FOODY, practical_info: { kosher: null } }, "en")).toBeNull();
    expect(getHeroHighlight({ category_id: NATURE }, "en")).toBeNull();
  });

  it("capacité : max_party si aucune formule active", () => {
    expect(getHeroHighlight({ category_id: BOATS_CATEGORY_ID, max_party: 13, price_variants: [] }, "en")?.value).toBe("Up to 13");
  });
});

describe("formatAges", () => {
  it("lit l'âge des infos pratiques", () => {
    expect(formatAges({ kids: { status: "yes", from_age: null } }, "fr")).toBe("Tous âges");
    expect(formatAges({ kids: { status: "yes", from_age: 6 } }, "fr")).toBe("Dès 6 ans");
    expect(formatAges({ kids: { status: "no", from_age: null } }, "he")).toBe("למבוגרים בלבד");
    expect(formatAges({ adult_only: true }, "en")).toBe("Adults only");
    expect(formatAges({ kids: { status: null, from_age: null } }, "en")).toBeNull();
  });
});
