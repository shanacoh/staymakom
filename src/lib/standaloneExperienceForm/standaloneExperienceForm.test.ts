import { describe, expect, it } from "vitest";
import { diffPayload, sameValue } from "./payloadDiff";
import {
  copyPresentation,
  emptyPresentation,
  isPresentationFilled,
  makeMoodPrimary,
  planPresentationSync,
  presentationField,
  resolvePresentation,
  rowsToPresentationMap,
  type MoodPresentation,
} from "./moodPresentations";

const presentation = (overrides: Partial<MoodPresentation> = {}): MoodPresentation => ({ ...emptyPresentation(), ...overrides });

const FOOD = "mood-food";
const ROMANTIC = "mood-romantic";
const FAMILY = "mood-family";

describe("diffPayload : n'enregistrer que ce qui a changé", () => {
  // Ce que le formulaire enverrait pour une fiche réelle (prix arrondi, textes vides devenus null...).
  const baseline = {
    title: "DINNER IN THE DARK",
    subtitle: null,
    base_price: 252,
    category_ids: [ROMANTIC, FOOD],
    practical_info: { kosher: "yes", kids: { status: "no", from_age: null } },
    blocked_dates: ["2026-11-01", "2026-11-02"],
    status: "published",
  };

  it("ne renvoie rien quand la fiche est enregistrée sans avoir été touchée", () => {
    const sameLater = {
      ...baseline,
      category_ids: [...baseline.category_ids],
      // Mêmes informations, clés rangées dans un autre ordre.
      practical_info: { kids: { from_age: null, status: "no" }, kosher: "yes" },
      blocked_dates: [...baseline.blocked_dates],
    };
    expect(diffPayload(baseline, sameLater)).toEqual({});
  });

  it("ne renvoie que le champ modifié", () => {
    expect(diffPayload(baseline, { ...baseline, title: "DINNER IN THE DARK (new)" })).toEqual({ title: "DINNER IN THE DARK (new)" });
  });

  it("repère un changement de statut seul (brouillon vers publiée)", () => {
    expect(diffPayload({ ...baseline, status: "draft" }, baseline)).toEqual({ status: "published" });
  });

  it("repère un changement dans une liste ou dans son ordre", () => {
    expect(diffPayload(baseline, { ...baseline, category_ids: [FOOD, ROMANTIC] })).toEqual({ category_ids: [FOOD, ROMANTIC] });
    expect(diffPayload(baseline, { ...baseline, blocked_dates: ["2026-11-01"] })).toEqual({ blocked_dates: ["2026-11-01"] });
  });

  it("envoie tout pour une fiche neuve (pas de référence)", () => {
    expect(diffPayload(null, baseline)).toEqual(baseline);
  });

  it("n'envoie jamais un champ indéfini : ce n'est pas un ordre de vider", () => {
    expect(diffPayload(baseline, { ...baseline, slug: undefined })).toEqual({});
  });

  it("distingue vide, zéro et rien", () => {
    expect(sameValue(null, "")).toBe(false);
    expect(sameValue(0, null)).toBe(false);
    expect(sameValue([], null)).toBe(false);
    expect(sameValue(94.8, 95)).toBe(false);
  });
});

describe("présentation par mood", () => {
  const main = presentation({
    title: "Dinner in the dark",
    title_fr: "Dîner dans le noir",
    subtitle: "A meal you taste first",
    long_copy: "<p>Main story</p>",
    cover_image: "https://img/main.jpg",
  });

  it("le nom de colonne suit la langue (l'anglais sans suffixe)", () => {
    expect(presentationField("title", "en")).toBe("title");
    expect(presentationField("long_copy", "he")).toBe("long_copy_he");
  });

  it("un mood sans version propre affiche la présentation principale, en lecture seule", () => {
    const resolved = resolvePresentation(main, {}, FOOD, ROMANTIC);
    expect(resolved.isOwn).toBe(false);
    expect(resolved.presentation).toEqual(main);
  });

  it("« Personnaliser » part d'une copie indépendante du principal", () => {
    const own = copyPresentation(main);
    own.title = "Dinner for food lovers";
    expect(main.title).toBe("Dinner in the dark");
    const resolved = resolvePresentation(main, { [FOOD]: own }, FOOD, ROMANTIC);
    expect(resolved.isOwn).toBe(true);
    expect(resolved.presentation.title).toBe("Dinner for food lovers");
  });

  it("une version propre sans photo reprend la couverture de la fiche", () => {
    const resolved = resolvePresentation(main, { [FOOD]: presentation({ title: "X" }) }, FOOD, ROMANTIC);
    expect(resolved.presentation.cover_image).toBe("https://img/main.jpg");
  });

  it("complète dans une langue = titre, accroche et description remplis", () => {
    expect(isPresentationFilled(main, "en")).toBe(true);
    expect(isPresentationFilled(main, "fr")).toBe(false);
    expect(isPresentationFilled(presentation({ title: "T", subtitle: "S", long_copy: "<p></p>" }), "en")).toBe(false);
  });

  describe("« En faire le mood principal »", () => {
    const foodVersion = presentation({ title: "Dinner for food lovers", long_copy: "<p>Food story</p>", cover_image: "https://img/food.jpg" });

    it("échange les contenus sans rien perdre quand le mood avait sa version", () => {
      const result = makeMoodPrimary({
        selectedCategoryIds: [ROMANTIC, FOOD, FAMILY],
        main,
        presentations: { [FOOD]: foodVersion },
        newPrimaryId: FOOD,
      });
      expect(result.selectedCategoryIds).toEqual([FOOD, ROMANTIC, FAMILY]);
      expect(result.main).toEqual(foodVersion);
      // L'ancien principal garde son texte et sa photo dans une version propre.
      expect(result.presentations[ROMANTIC]).toEqual(main);
      expect(result.presentations[FOOD]).toBeUndefined();
    });

    it("refaire l'échange dans l'autre sens ramène exactement l'état de départ", () => {
      const start = { selectedCategoryIds: [ROMANTIC, FOOD], main, presentations: { [FOOD]: foodVersion } };
      const swapped = makeMoodPrimary({ ...start, newPrimaryId: FOOD });
      const back = makeMoodPrimary({ ...swapped, newPrimaryId: ROMANTIC });
      expect(back).toEqual(start);
    });

    it("ne change que l'ordre quand le mood partageait la présentation principale", () => {
      const result = makeMoodPrimary({ selectedCategoryIds: [ROMANTIC, FOOD], main, presentations: {}, newPrimaryId: FOOD });
      expect(result.selectedCategoryIds).toEqual([FOOD, ROMANTIC]);
      expect(result.main).toEqual(main);
      expect(result.presentations).toEqual({});
    });

    it("ne fait rien pour un mood non coché ou déjà principal", () => {
      const input = { selectedCategoryIds: [ROMANTIC, FOOD], main, presentations: {} };
      expect(makeMoodPrimary({ ...input, newPrimaryId: FAMILY })).toEqual(input);
      expect(makeMoodPrimary({ ...input, newPrimaryId: ROMANTIC })).toEqual(input);
    });
  });

  describe("ce qui est écrit en base", () => {
    const foodVersion = presentation({ title: "Dinner for food lovers", cover_image: "https://img/food.jpg" });

    it("rien quand rien n'a changé depuis le chargement", () => {
      const loaded = { [FOOD]: foodVersion };
      const plan = planPresentationSync({ experienceId: "exp", loaded, current: { [FOOD]: { ...foodVersion } }, primaryId: ROMANTIC });
      expect(plan).toEqual({ upserts: [], deletes: [] });
    });

    it("une version nouvelle est créée, les textes vides deviennent « rien »", () => {
      const plan = planPresentationSync({ experienceId: "exp", loaded: {}, current: { [FOOD]: foodVersion }, primaryId: ROMANTIC });
      expect(plan.deletes).toEqual([]);
      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0]).toMatchObject({
        experience_id: "exp",
        category_id: FOOD,
        title: "Dinner for food lovers",
        title_fr: null,
        cover_image: "https://img/food.jpg",
      });
    });

    it("seule la version modifiée est réécrite", () => {
      const loaded = { [FOOD]: foodVersion, [FAMILY]: presentation({ title: "Family" }) };
      const current = { [FOOD]: { ...foodVersion, subtitle: "New hook" }, [FAMILY]: presentation({ title: "Family" }) };
      const plan = planPresentationSync({ experienceId: "exp", loaded, current, primaryId: ROMANTIC });
      expect(plan.upserts.map((r) => r.category_id)).toEqual([FOOD]);
      expect(plan.deletes).toEqual([]);
    });

    it("« Revenir à la présentation principale » supprime la version", () => {
      const plan = planPresentationSync({ experienceId: "exp", loaded: { [FOOD]: foodVersion }, current: {}, primaryId: ROMANTIC });
      expect(plan).toEqual({ upserts: [], deletes: [FOOD] });
    });

    it("après un échange : l'ancien principal est écrit, la version du nouveau principal est retirée", () => {
      const swapped = makeMoodPrimary({
        selectedCategoryIds: [ROMANTIC, FOOD],
        main,
        presentations: { [FOOD]: foodVersion },
        newPrimaryId: FOOD,
      });
      const plan = planPresentationSync({
        experienceId: "exp",
        loaded: { [FOOD]: foodVersion },
        current: swapped.presentations,
        primaryId: swapped.selectedCategoryIds[0],
      });
      expect(plan.upserts.map((r) => r.category_id)).toEqual([ROMANTIC]);
      expect(plan.upserts[0].title).toBe("Dinner in the dark");
      expect(plan.deletes).toEqual([FOOD]);
    });

    it("créée de zéro avec 2 moods dont un personnalisé : relue depuis la base, la version est intacte", () => {
      const current = { [FOOD]: presentation({ title: "Food title", title_fr: "Titre food", long_copy_he: "<p>עברית</p>", cover_image: "https://img/2.jpg" }) };
      const { upserts } = planPresentationSync({ experienceId: "exp", loaded: {}, current, primaryId: ROMANTIC });
      // Ce qui a été écrit, relu comme le fait le formulaire à la réouverture.
      const reopened = rowsToPresentationMap(upserts);
      expect(reopened).toEqual(current);
      // Et une réouverture suivie d'un enregistrement n'écrit plus rien.
      expect(planPresentationSync({ experienceId: "exp", loaded: reopened, current: reopened, primaryId: ROMANTIC })).toEqual({ upserts: [], deletes: [] });
    });
  });
});
