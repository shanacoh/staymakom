import { describe, it, expect } from "vitest";
import { inMood, isMoodOf, moodLinkSuffix, orderedPhotos, versionsByExperience, type MoodVersion } from "./moodDisplay";

const ROMANTIC = "cat-romantic";
const FAMILY = "cat-family";
const FOOD = "cat-food";

// Une expérience à 2 moods : Romantic (principal) et Family (version personnalisée).
const experience = {
  id: "exp-1",
  slug: "pottery-in-jaffa",
  category_id: ROMANTIC,
  category_ids: [ROMANTIC, FAMILY],
  title: "Clay for Two",
  title_fr: "L'argile à deux",
  title_he: "חימר לשניים",
  subtitle: "A slow evening at the wheel",
  subtitle_fr: "Une soirée lente au tour",
  subtitle_he: null as string | null,
  long_copy: "<p>Main EN</p>",
  long_copy_fr: "<p>Principal FR</p>",
  long_copy_he: null as string | null,
  hero_image: "main.jpg",
  base_price: 320,
};

const familyVersion: MoodVersion = {
  experience_id: "exp-1",
  category_id: FAMILY,
  title: "Little Hands, Big Pots",
  title_fr: "Petites mains, grands pots",
  title_he: null,
  subtitle: "An hour of mud the kids will remember",
  subtitle_fr: null,
  subtitle_he: null,
  long_copy: "<p>Family EN</p>",
  long_copy_fr: "<p>Famille FR</p>",
  long_copy_he: null,
  cover_image: "kids.jpg",
};

describe("inMood", () => {
  it("sans version, la fiche est rendue telle quelle", () => {
    expect(inMood(experience, null)).toBe(experience);
    expect(inMood(experience, undefined)).toBe(experience);
  });

  it("dans un mood personnalisé : photo, titre, accroche et description du mood", () => {
    const shown = inMood(experience, familyVersion);
    expect(shown.hero_image).toBe("kids.jpg");
    expect(shown.title).toBe("Little Hands, Big Pots");
    expect(shown.title_fr).toBe("Petites mains, grands pots");
    expect(shown.subtitle).toBe("An hour of mud the kids will remember");
    expect(shown.long_copy_fr).toBe("<p>Famille FR</p>");
  });

  it("un champ du mood non traduit retombe sur l'anglais du mood", () => {
    const shown = inMood(experience, familyVersion);
    expect(shown.subtitle_fr).toBe("An hour of mud the kids will remember");
    expect(shown.title_he).toBe("Little Hands, Big Pots");
    expect(shown.long_copy_he).toBe("<p>Family EN</p>");
  });

  it("un texte vide dans toutes les langues garde le texte principal", () => {
    const shown = inMood(experience, { ...familyVersion, subtitle: null });
    expect(shown.subtitle).toBe("A slow evening at the wheel");
    expect(shown.subtitle_fr).toBe("Une soirée lente au tour");
  });

  it("une version sans photo garde la photo de la fiche", () => {
    expect(inMood(experience, { ...familyVersion, cover_image: null }).hero_image).toBe("main.jpg");
  });

  it("ne touche à rien d'autre (prix, adresse de la fiche, moods)", () => {
    const shown = inMood(experience, familyVersion);
    expect(shown.base_price).toBe(320);
    expect(shown.slug).toBe("pottery-in-jaffa");
    expect(shown.category_id).toBe(ROMANTIC);
  });

  it("ignore une version du mood principal, d'un mood décoché ou d'une autre fiche", () => {
    expect(inMood(experience, { ...familyVersion, category_id: ROMANTIC })).toBe(experience);
    expect(inMood(experience, { ...familyVersion, category_id: FOOD })).toBe(experience);
    expect(inMood(experience, { ...familyVersion, experience_id: "exp-2" })).toBe(experience);
  });
});

describe("isMoodOf", () => {
  it("reconnaît le mood principal et les moods secondaires, pas les autres", () => {
    expect(isMoodOf(experience, ROMANTIC)).toBe(true);
    expect(isMoodOf(experience, FAMILY)).toBe(true);
    expect(isMoodOf(experience, FOOD)).toBe(false);
    expect(isMoodOf(experience, null)).toBe(false);
    expect(isMoodOf({ id: "x", category_id: ROMANTIC, category_ids: null }, FAMILY)).toBe(false);
  });
});

describe("orderedPhotos", () => {
  it("met la photo du mood en premier sans perdre ni doubler de photo", () => {
    expect(orderedPhotos("kids.jpg", "main.jpg", ["a.jpg", "kids.jpg", "b.jpg"])).toEqual(["kids.jpg", "main.jpg", "a.jpg", "b.jpg"]);
  });

  it("sans mood, l'ordre est celui d'aujourd'hui : couverture puis galerie", () => {
    expect(orderedPhotos("main.jpg", "main.jpg", ["a.jpg", "main.jpg", "b.jpg"])).toEqual(["main.jpg", "a.jpg", "b.jpg"]);
    expect(orderedPhotos(null, null, ["a.jpg", "b.jpg"])).toEqual(["a.jpg", "b.jpg"]);
  });
});

describe("versionsByExperience et moodLinkSuffix", () => {
  it("range les versions par expérience", () => {
    expect(versionsByExperience([familyVersion])).toEqual({ "exp-1": familyVersion });
    expect(versionsByExperience(null)).toEqual({});
  });

  it("le lien d'une carte porte le mood", () => {
    expect(moodLinkSuffix("family")).toBe("mood=family");
    expect(moodLinkSuffix(null)).toBeUndefined();
  });
});
