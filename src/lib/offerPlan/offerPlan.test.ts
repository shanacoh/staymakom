import { describe, expect, it } from "vitest";
import {
  NO_FILTERS,
  buildGrid,
  cellDetail,
  cellState,
  countMustHaves,
  filterMustHaves,
  mustHavesForMoods,
  offPlanExperiences,
  prospectionCsv,
  sortMoods,
} from "./compute";
import type { MustHave, OfferExperience, OfferMood } from "./types";

const regions = [
  { id: "r-golan", name_fr: "Golan" },
  { id: "r-tlv", name_fr: "Tel Aviv-Jaffa" },
];

const moods: OfferMood[] = [
  { id: "m-creative", name: "Creative Spirit", status: "draft", display_order: 10 },
  { id: "m-food", name: "Foody Discovery", status: "published", display_order: 2 },
  { id: "m-family", name: "Family Fun", status: "published", display_order: 1 },
  { id: "m-old", name: "Ancien mood", status: "archived", display_order: 0 },
];

const mustHave = (over: Partial<MustHave>): MustHave => ({
  id: "mh",
  category_id: "m-food",
  pillar: null,
  name: "Must-have",
  format: null,
  season: null,
  car_free: "a_voir",
  is_core: false,
  status: "a_trouver",
  partner: null,
  notes: null,
  standalone_experience_id: null,
  experience2_id: null,
  region_ids: [],
  ...over,
});

const experience = (over: Partial<OfferExperience>): OfferExperience => ({
  kind: "standalone",
  id: "e",
  title: "Expérience",
  published: true,
  moodIds: ["m-food"],
  regionId: "r-tlv",
  ...over,
});

describe("sortMoods", () => {
  it("met les moods publiés d'abord, puis les brouillons, sans les archivés", () => {
    expect(sortMoods(moods).map((m) => m.id)).toEqual(["m-family", "m-food", "m-creative"]);
  });
});

describe("cellState", () => {
  it("donne la couleur de la case", () => {
    expect(cellState(3, 3)).toBe("reached");
    expect(cellState(4, 3)).toBe("reached");
    expect(cellState(1, 3)).toBe("partial");
    expect(cellState(0, 3)).toBe("missing");
    expect(cellState(0, 0)).toBe("none");
    expect(cellState(2, 0)).toBe("none");
  });
});

describe("buildGrid", () => {
  const experiences = [
    experience({ id: "a", moodIds: ["m-food", "m-family"], regionId: "r-tlv" }),
    experience({ id: "b", moodIds: ["m-food"], regionId: "r-tlv" }),
    experience({ id: "c", kind: "experience2", moodIds: ["m-food"], regionId: "r-golan" }),
    experience({ id: "brouillon", published: false, regionId: "r-tlv" }),
    experience({ id: "sans-region", regionId: null }),
  ];
  const targets = [
    { category_id: "m-food", region_id: "r-tlv", target: 3 },
    { category_id: "m-family", region_id: "r-golan", target: 2 },
  ];
  const grid = buildGrid(regions, targets, experiences);

  it("compte une expérience dans chaque mood où elle apparaît", () => {
    expect(grid.cell("m-food", "r-tlv")).toEqual({ live: 2, target: 3 });
    expect(grid.cell("m-family", "r-tlv")).toEqual({ live: 1, target: 0 });
  });

  it("ne compte ni les brouillons ni les expériences sans région", () => {
    expect(grid.cell("m-food", "r-golan")).toEqual({ live: 1, target: 0 });
    expect(grid.withoutRegion).toBe(1);
  });

  it("une case sans ligne a un objectif de 0", () => {
    expect(grid.cell("m-creative", "r-golan")).toEqual({ live: 0, target: 0 });
  });

  it("additionne les cases dans le total du mood", () => {
    expect(grid.total("m-food")).toEqual({ live: 3, target: 3 });
    expect(grid.total("m-family")).toEqual({ live: 1, target: 2 });
    expect(grid.total("m-creative")).toEqual({ live: 0, target: 0 });
  });
});

describe("hors plan et compteurs", () => {
  const experiences = [
    experience({ id: "liee" }),
    experience({ id: "libre" }),
    experience({ id: "hotel-libre", kind: "experience2", regionId: "r-golan" }),
    experience({ id: "brouillon", published: false }),
  ];
  const mustHaves = [
    mustHave({ id: "1", status: "en_ligne", standalone_experience_id: "liee", region_ids: ["r-tlv"] }),
    mustHave({ id: "2", status: "a_trouver", region_ids: ["r-tlv", "r-golan"] }),
    mustHave({ id: "3", status: "en_prospection", category_id: "m-family", region_ids: ["r-tlv"] }),
    mustHave({ id: "4", status: "signe" }),
  ];

  it("une expérience en ligne liée à aucun must-have est hors plan", () => {
    expect(offPlanExperiences(experiences, mustHaves).map((e) => e.id)).toEqual(["libre", "hotel-libre"]);
  });

  it("ne confond pas une expérience seule et une expérience hôtel de même identifiant", () => {
    const sameId = [experience({ id: "x" }), experience({ id: "x", kind: "experience2" })];
    const linked = [mustHave({ experience2_id: "x" })];
    expect(offPlanExperiences(sameId, linked).map((e) => e.kind)).toEqual(["standalone"]);
  });

  it("compte les must-haves par statut", () => {
    const counters = countMustHaves({ mustHaves, experiences });
    expect(counters.total).toBe(4);
    expect(counters.byStatus).toEqual({ a_trouver: 1, en_prospection: 1, signe: 1, en_ligne: 1, abandonne: 0 });
    expect(counters.offPlan).toBe(2);
  });

  it("le panneau d'une case liste ses must-haves et ses expériences hors plan", () => {
    const detail = cellDetail("m-food", "r-tlv", { mustHaves, experiences });
    expect(detail.mustHaves.map((m) => m.id)).toEqual(["1", "2"]);
    expect(detail.offPlan.map((e) => e.id)).toEqual(["libre"]);
  });
});

describe("filterMustHaves", () => {
  const list = [
    mustHave({ id: "1", is_core: true, region_ids: ["r-tlv"] }),
    mustHave({ id: "2", status: "signe", category_id: "m-family" }),
    mustHave({ id: "3", region_ids: ["r-golan"] }),
  ];

  it("sans filtre, garde tout", () => {
    expect(filterMustHaves(list, NO_FILTERS)).toHaveLength(3);
  });

  it("filtre par mood, statut, socle et région", () => {
    expect(filterMustHaves(list, { ...NO_FILTERS, mood: "m-family" }).map((m) => m.id)).toEqual(["2"]);
    expect(filterMustHaves(list, { ...NO_FILTERS, status: "a_trouver" }).map((m) => m.id)).toEqual(["1", "3"]);
    expect(filterMustHaves(list, { ...NO_FILTERS, core: true }).map((m) => m.id)).toEqual(["1"]);
    expect(filterMustHaves(list, { ...NO_FILTERS, core: false }).map((m) => m.id)).toEqual(["2", "3"]);
    expect(filterMustHaves(list, { ...NO_FILTERS, region: "r-golan" }).map((m) => m.id)).toEqual(["3"]);
  });

  it("« à chercher » = aucun région candidate", () => {
    expect(filterMustHaves(list, { ...NO_FILTERS, region: "none" }).map((m) => m.id)).toEqual(["2"]);
  });
});

describe("mustHavesForMoods", () => {
  const list = [
    mustHave({ id: "food" }),
    mustHave({ id: "family", category_id: "m-family" }),
    mustHave({ id: "abandonne", status: "abandonne" }),
  ];

  it("propose les must-haves des moods cochés, sans les abandonnés", () => {
    expect(mustHavesForMoods(list, ["m-food"], null).map((m) => m.id)).toEqual(["food"]);
  });

  it("garde le must-have déjà choisi, même si son mood n'est plus coché", () => {
    expect(mustHavesForMoods(list, ["m-food"], "family").map((m) => m.id)).toEqual(["food", "family"]);
  });
});

describe("prospectionCsv", () => {
  it("exporte les must-haves à trouver ou en prospection", () => {
    const csv = prospectionCsv(
      [
        mustHave({ name: 'Atelier "challah"', format: "atelier", season: "Toute l'année", is_core: true, region_ids: ["r-tlv", "r-golan"] }),
        mustHave({ name: "Table druze", status: "en_prospection", category_id: "m-family" }),
        mustHave({ name: "Déjà signé", status: "signe" }),
      ],
      moods,
      regions
    );
    expect(csv.split("\n")).toEqual([
      '"Mood";"Nom";"Régions";"Format";"Saison";"Socle"',
      '"Foody Discovery";"Atelier ""challah""";"Tel Aviv-Jaffa, Golan";"Atelier";"Toute l\'année";"Oui"',
      '"Family Fun";"Table druze";"À chercher";"";"";"Non"',
    ]);
  });
});
