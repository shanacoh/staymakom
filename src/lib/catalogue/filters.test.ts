import { describe, it, expect } from "vitest";
import {
  DEFAULT_FILTERS,
  applyFilters,
  clearFilters,
  countByTab,
  distinctPlaces,
  facetCounts,
  hasActiveFilters,
  isFollowupDue,
  isToVisit,
  needsContentSent,
  needsVideo,
  panelFilterCount,
  placeKey,
  searchTerms,
  todayIso,
  todoCounts,
  toggleValue,
} from "./filters";
import type { CatalogueEntry } from "./types";

let counter = 0;
function entry(overrides: Partial<CatalogueEntry> = {}): CatalogueEntry {
  counter += 1;
  return {
    id: `id-${counter}`,
    name: `Lieu ${counter}`,
    nature: "inspiration",
    place_type: "autre",
    notes: null,
    city: null,
    region: null,
    address: null,
    google_maps_link: null,
    latitude: null,
    longitude: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    contact_instagram: null,
    contact_website: null,
    commercial_status: "idee",
    last_contact_date: null,
    next_followup_date: null,
    content_sent: false,
    content_sent_at: null,
    visited: false,
    visited_at: null,
    video_done: false,
    video_url: null,
    staymakom_category_ids: [],
    tags: [],
    hotel_id: null,
    experience_id: null,
    standalone_experience_id: null,
    source: "manuel",
    created_at: `2026-09-${String(10 + counter).padStart(2, "0")}T10:00:00Z`,
    updated_at: "2026-09-20T10:00:00Z",
    display_name: `Lieu ${counter}`,
    display_city: null,
    display_region: null,
    display_address: null,
    display_image: null,
    display_latitude: null,
    display_longitude: null,
    display_maps_link: null,
    live_kind: null,
    live_id: null,
    live_slug: null,
    live_status: null,
    site_category_ids: [],
    links_count: 0,
    first_thumbnail: null,
    live_latitude: null,
    live_longitude: null,
    ...overrides,
  };
}

const TODAY = "2026-09-20";

describe("todayIso", () => {
  it("donne la date locale au format AAAA-MM-JJ", () => {
    expect(todayIso(new Date(2026, 8, 5))).toBe("2026-09-05");
  });
});

describe("placeKey / distinctPlaces", () => {
  it("regroupe les écritures différentes d'une même ville", () => {
    expect(placeKey("Tel-Aviv")).toBe(placeKey("Tel Aviv"));
    expect(placeKey("Be'er Sheva")).toBe(placeKey("Beer Sheva"));
    expect(placeKey("  Éilat ")).toBe("eilat");
  });

  it("propose une seule entrée par lieu, avec l'écriture la plus utilisée", () => {
    const entries = [
      entry({ display_city: "Tel Aviv" }),
      entry({ display_city: "Tel Aviv" }),
      entry({ display_city: "Tel-Aviv" }),
      entry({ display_city: "Eilat" }),
      entry({ display_city: null }),
    ];
    const cities = distinctPlaces(entries, (e) => e.display_city);
    expect(cities.map((c) => c.label)).toEqual(["Eilat", "Tel Aviv"]);
    expect(cities.find((c) => c.label === "Tel Aviv")?.count).toBe(3);
  });
});

describe("ce qu'il reste à faire", () => {
  it("une relance est due le jour même ou après, jamais avant ni sans date", () => {
    expect(isFollowupDue(entry({ next_followup_date: "2026-09-20" }), TODAY)).toBe(true);
    expect(isFollowupDue(entry({ next_followup_date: "2026-09-01" }), TODAY)).toBe(true);
    expect(isFollowupDue(entry({ next_followup_date: "2026-09-21" }), TODAY)).toBe(false);
    expect(isFollowupDue(entry(), TODAY)).toBe(false);
  });

  it("visite, vidéo et contenu à envoyer concernent les partenaires et les discussions en cours", () => {
    for (const status of ["partenaire", "en_discussion"] as const) {
      expect(isToVisit(entry({ commercial_status: status }))).toBe(true);
      expect(needsVideo(entry({ commercial_status: status }))).toBe(true);
      expect(needsContentSent(entry({ commercial_status: status }))).toBe(true);
    }
    for (const status of ["idee", "a_contacter", "contacte", "a_trier", "refuse"] as const) {
      expect(isToVisit(entry({ commercial_status: status })), status).toBe(false);
      expect(needsVideo(entry({ commercial_status: status })), status).toBe(false);
      expect(needsContentSent(entry({ commercial_status: status })), status).toBe(false);
    }
  });

  it("c'est fait dès que la case est cochée", () => {
    const done = entry({ commercial_status: "partenaire", visited: true, video_done: true, content_sent: true });
    expect(isToVisit(done)).toBe(false);
    expect(needsVideo(done)).toBe(false);
    expect(needsContentSent(done)).toBe(false);
  });
});

describe("onglets", () => {
  const entries = [
    entry({ nature: "partenaire", commercial_status: "partenaire" }),
    entry({ nature: "partenaire", commercial_status: "en_discussion" }),
    entry({ nature: "hors_reseau", commercial_status: "idee" }),
    entry({ nature: "inspiration", commercial_status: "a_trier" }),
    entry({ nature: "inspiration", commercial_status: "idee" }),
  ];

  it("les lieux à trier ont leur onglet et sortent des onglets par nature", () => {
    expect(countByTab(entries)).toEqual({ all: 5, partenaire: 2, hors_reseau: 1, inspiration: 1, a_trier: 1 });
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, tab: "a_trier" }, TODAY)).toHaveLength(1);
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, tab: "inspiration" }, TODAY)).toHaveLength(1);
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, tab: "all" }, TODAY)).toHaveLength(5);
  });
});

describe("recherche", () => {
  it("découpe en mots, sans accents ni majuscules", () => {
    expect(searchTerms("  Vin  ÉILAT ")).toEqual(["vin", "eilat"]);
    expect(searchTerms("   ")).toEqual([]);
  });

  const paris = entry({ display_name: "Café du Port", display_city: "Tel-Aviv", tags: ["vue mer"] });
  const vigne = entry({ display_name: "Vignoble Éden", display_city: "Zichron", notes: "Dégustation en famille", display_address: "HaYekev 1", contact_instagram: "@eden.winery" });
  const spa = entry({ display_name: "Spa du Désert", display_city: "Arad" });
  const all = [paris, vigne, spa];
  const search = (text: string) => applyFilters(all, { ...DEFAULT_FILTERS, search: text }, TODAY);

  it("cherche dans le nom, la ville, les notes, l'adresse, le contact et les étiquettes", () => {
    expect(search("eden")).toEqual([vigne]);
    expect(search("famille")).toEqual([vigne]);
    expect(search("VUE MER")).toEqual([paris]);
    expect(search("hayekev")).toEqual([vigne]);
    expect(search("winery")).toEqual([vigne]);
    expect(search("arad")).toEqual([spa]);
  });

  it("tous les mots doivent correspondre, dans n'importe quel ordre", () => {
    expect(search("eden zichron")).toEqual([vigne]);
    expect(search("zichron eden")).toEqual([vigne]);
    expect(search("eden arad")).toEqual([]);
  });
});

describe("filtres à cocher", () => {
  const a = entry({ display_name: "A", commercial_status: "partenaire", place_type: "restaurant", display_city: "Tel Aviv", source: "site", staymakom_category_ids: ["cat-food"] });
  const b = entry({ display_name: "B", commercial_status: "en_discussion", place_type: "activite", display_city: "Tel-Aviv", source: "tiktok", site_category_ids: ["cat-spa"] });
  const c = entry({ display_name: "C", commercial_status: "idee", place_type: "restaurant", display_city: "Eilat", display_region: "Darom", source: "manuel" });
  const all = [a, b, c];
  const run = (over: Partial<typeof DEFAULT_FILTERS>) =>
    applyFilters(all, { ...DEFAULT_FILTERS, sort: "name", ...over }, TODAY).map((e) => e.display_name);

  it("plusieurs valeurs d'un même critère s'additionnent (ou)", () => {
    expect(run({ statuses: ["partenaire", "idee"] })).toEqual(["A", "C"]);
    expect(run({ placeTypes: ["activite", "restaurant"] })).toEqual(["A", "B", "C"]);
  });

  it("des critères différents se combinent (et)", () => {
    expect(run({ statuses: ["partenaire", "idee"], placeTypes: ["restaurant"], cities: [placeKey("Tel Aviv")] })).toEqual(["A"]);
  });

  it("une ville écrite de deux façons ne fait qu'un seul choix", () => {
    expect(run({ cities: [placeKey("Tel Aviv")] })).toEqual(["A", "B"]);
    expect(run({ regions: [placeKey("Darom")] })).toEqual(["C"]);
  });

  it("la catégorie Staymakom peut venir du catalogue ou de la fiche du site", () => {
    expect(run({ categoryIds: ["cat-food"] })).toEqual(["A"]);
    expect(run({ categoryIds: ["cat-spa"] })).toEqual(["B"]);
    expect(run({ categoryIds: ["cat-food", "cat-spa"] })).toEqual(["A", "B"]);
  });

  it("filtre par origine", () => {
    expect(run({ sources: ["tiktok", "manuel"] })).toEqual(["B", "C"]);
  });

  it("les puces « à faire » se combinent (et)", () => {
    const todoA = entry({ display_name: "TA", commercial_status: "partenaire", visited: true, next_followup_date: "2026-09-01" });
    const todoB = entry({ display_name: "TB", commercial_status: "partenaire", next_followup_date: "2026-09-01" });
    const todoC = entry({ display_name: "TC", commercial_status: "partenaire" });
    const set = [todoA, todoB, todoC];
    const names = (todo: ("followup" | "to_visit")[]) =>
      applyFilters(set, { ...DEFAULT_FILTERS, sort: "name", todo }, TODAY).map((e) => e.display_name);
    expect(names(["followup"])).toEqual(["TA", "TB"]);
    expect(names(["followup", "to_visit"])).toEqual(["TB"]);
    expect(names([])).toEqual(["TA", "TB", "TC"]);
  });

  it("trie par nom, et met les relances les plus anciennes en premier", () => {
    const x = entry({ display_name: "A", next_followup_date: "2026-10-01" });
    const y = entry({ display_name: "B", next_followup_date: "2026-09-01" });
    const z = entry({ display_name: "C" });
    const order = (sort: "name" | "followup") => applyFilters([z, x, y], { ...DEFAULT_FILTERS, sort }, TODAY).map((e) => e.display_name);
    expect(order("name")).toEqual(["A", "B", "C"]);
    expect(order("followup")).toEqual(["B", "A", "C"]);
  });

  it("le tri par défaut met les lieux les plus récemment ajoutés en premier", () => {
    const older = entry({ display_name: "Ancien", created_at: "2026-01-01T00:00:00Z" });
    const newer = entry({ display_name: "Récent", created_at: "2026-09-01T00:00:00Z" });
    expect(applyFilters([older, newer], DEFAULT_FILTERS, TODAY).map((e) => e.display_name)).toEqual(["Récent", "Ancien"]);
  });
});

describe("nombres affichés à côté des choix", () => {
  const a = entry({ commercial_status: "partenaire", place_type: "restaurant", display_city: "Tel Aviv", visited: true });
  const b = entry({ commercial_status: "partenaire", place_type: "activite", display_city: "Tel Aviv" });
  const c = entry({ commercial_status: "idee", place_type: "restaurant", display_city: "Eilat" });
  const all = [a, b, c];

  it("compte chaque statut en tenant compte des AUTRES critères, pas de celui-ci", () => {
    // Le filtre "Partenaire" ne cache pas les autres statuts dans les puces : on voit ce que donnerait chaque choix
    const filters = { ...DEFAULT_FILTERS, statuses: ["partenaire" as const], placeTypes: ["restaurant"] };
    const counts = facetCounts(all, filters, "statuses", TODAY);
    expect(counts.get("partenaire")).toBe(1);
    expect(counts.get("idee")).toBe(1);
  });

  it("compte les villes sous leur clé regroupée", () => {
    const counts = facetCounts(all, DEFAULT_FILTERS, "cities", TODAY);
    expect(counts.get(placeKey("Tel Aviv"))).toBe(2);
    expect(counts.get(placeKey("Eilat"))).toBe(1);
  });

  it("compte une catégorie une seule fois par lieu, qu'elle vienne du catalogue ou du site", () => {
    const d = entry({ staymakom_category_ids: ["x"], site_category_ids: ["x", "y"] });
    const counts = facetCounts([d], DEFAULT_FILTERS, "categoryIds", TODAY);
    expect(counts.get("x")).toBe(1);
    expect(counts.get("y")).toBe(1);
  });

  it("compte les puces « à faire » selon les autres critères", () => {
    expect(todoCounts(all, DEFAULT_FILTERS, TODAY)).toEqual({ followup: 0, to_visit: 1, no_video: 2, content_not_sent: 2 });
    expect(todoCounts(all, { ...DEFAULT_FILTERS, placeTypes: ["restaurant"] }, TODAY).no_video).toBe(1);
  });

  it("le nombre d'une puce « à faire » ne dépend pas des autres puces « à faire »", () => {
    const withTodo = todoCounts(all, { ...DEFAULT_FILTERS, todo: ["to_visit"] }, TODAY);
    expect(withTodo.no_video).toBe(2);
  });
});

describe("état des filtres", () => {
  it("toggleValue ajoute puis retire", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });

  it("repère un critère actif, hors onglet et tri", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, tab: "partenaire", sort: "name" })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: "  " })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: "vin" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, statuses: ["idee"] })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, todo: ["followup"] })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, cities: ["eilat"] })).toBe(true);
  });

  it("compte les cases cochées du panneau et sait tout effacer en gardant onglet et tri", () => {
    const filters = { ...DEFAULT_FILTERS, tab: "partenaire" as const, sort: "name" as const, placeTypes: ["restaurant"], cities: ["eilat", "haifa"], statuses: ["idee" as const] };
    expect(panelFilterCount(filters)).toBe(3); // les statuts ont leurs puces, hors panneau
    expect(clearFilters(filters)).toEqual({ ...DEFAULT_FILTERS, tab: "partenaire", sort: "name" });
  });
});
