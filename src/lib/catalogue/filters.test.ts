import { describe, it, expect } from "vitest";
import {
  DEFAULT_FILTERS,
  applyFilters,
  computeTiles,
  countByTab,
  distinctPlaces,
  hasActiveFilters,
  isFollowupDue,
  isToVisit,
  placeKey,
  todayIso,
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

describe("relance et visite", () => {
  it("une relance est due le jour même ou après, jamais avant ni sans date", () => {
    expect(isFollowupDue(entry({ next_followup_date: "2026-09-20" }), TODAY)).toBe(true);
    expect(isFollowupDue(entry({ next_followup_date: "2026-09-01" }), TODAY)).toBe(true);
    expect(isFollowupDue(entry({ next_followup_date: "2026-09-21" }), TODAY)).toBe(false);
    expect(isFollowupDue(entry(), TODAY)).toBe(false);
  });

  it("à visiter = partenaire ou en discussion, pas encore visité", () => {
    expect(isToVisit(entry({ commercial_status: "partenaire" }))).toBe(true);
    expect(isToVisit(entry({ commercial_status: "en_discussion" }))).toBe(true);
    expect(isToVisit(entry({ commercial_status: "partenaire", visited: true }))).toBe(false);
    expect(isToVisit(entry({ commercial_status: "idee" }))).toBe(false);
  });
});

describe("onglets et compteurs", () => {
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

  it("calcule les 3 compteurs du bandeau", () => {
    const withDates = [
      ...entries,
      entry({ next_followup_date: "2026-09-10" }),
      entry({ commercial_status: "partenaire", visited: true }),
    ];
    expect(computeTiles(withDates, TODAY)).toEqual({ toSort: 1, followup: 1, toVisit: 2 });
  });
});

describe("applyFilters", () => {
  const paris = entry({ display_name: "Café du Port", display_city: "Tel-Aviv", place_type: "restaurant", tags: ["vue mer"] });
  const vigne = entry({
    display_name: "Vignoble Éden",
    display_city: "Tel Aviv",
    display_region: "Center",
    notes: "Dégustation en famille",
    staymakom_category_ids: ["cat-food"],
    content_sent: true,
  });
  const site = entry({ display_name: "Spa du Désert", site_category_ids: ["cat-spa"], video_done: true, visited: true });
  const all = [paris, vigne, site];

  it("cherche sans tenir compte des accents ni des majuscules, dans le nom, les notes et les étiquettes", () => {
    expect(applyFilters(all, { ...DEFAULT_FILTERS, search: "eden" }, TODAY)).toEqual([vigne]);
    expect(applyFilters(all, { ...DEFAULT_FILTERS, search: "famille" }, TODAY)).toEqual([vigne]);
    expect(applyFilters(all, { ...DEFAULT_FILTERS, search: "VUE MER" }, TODAY)).toEqual([paris]);
  });

  it("filtre par ville même si elle est écrite de deux façons", () => {
    const result = applyFilters(all, { ...DEFAULT_FILTERS, city: placeKey("Tel Aviv") }, TODAY);
    expect(result).toHaveLength(2);
  });

  it("filtre par catégorie Staymakom, qu'elle vienne du catalogue ou de la fiche du site", () => {
    expect(applyFilters(all, { ...DEFAULT_FILTERS, categoryId: "cat-food" }, TODAY)).toEqual([vigne]);
    expect(applyFilters(all, { ...DEFAULT_FILTERS, categoryId: "cat-spa" }, TODAY)).toEqual([site]);
  });

  it("filtre sur le suivi du contenu", () => {
    expect(applyFilters(all, { ...DEFAULT_FILTERS, content: "no_video" }, TODAY)).toHaveLength(2);
    expect(applyFilters(all, { ...DEFAULT_FILTERS, content: "not_visited" }, TODAY)).toHaveLength(2);
    expect(applyFilters(all, { ...DEFAULT_FILTERS, content: "content_not_sent" }, TODAY)).toHaveLength(2);
  });

  it("trie par nom, et met les relances les plus anciennes en premier", () => {
    const byName = applyFilters(all, { ...DEFAULT_FILTERS, sort: "name" }, TODAY).map((e) => e.display_name);
    expect(byName).toEqual(["Café du Port", "Spa du Désert", "Vignoble Éden"]);

    const a = entry({ display_name: "A", next_followup_date: "2026-10-01" });
    const b = entry({ display_name: "B", next_followup_date: "2026-09-01" });
    const c = entry({ display_name: "C" });
    const byFollowup = applyFilters([c, a, b], { ...DEFAULT_FILTERS, sort: "followup" }, TODAY).map((e) => e.display_name);
    expect(byFollowup).toEqual(["B", "A", "C"]);
  });

  it("le tri par défaut met les lieux les plus récemment ajoutés en premier", () => {
    const older = entry({ display_name: "Ancien", created_at: "2026-01-01T00:00:00Z" });
    const newer = entry({ display_name: "Récent", created_at: "2026-09-01T00:00:00Z" });
    expect(applyFilters([older, newer], DEFAULT_FILTERS, TODAY).map((e) => e.display_name)).toEqual(["Récent", "Ancien"]);
  });
});

describe("hasActiveFilters", () => {
  it("ignore l'onglet et le tri", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, tab: "partenaire", sort: "name" })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: "  " })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, quick: "followup" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, city: "eilat" })).toBe(true);
  });
});
