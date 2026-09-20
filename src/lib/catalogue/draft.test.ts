import { describe, it, expect } from "vitest";
import { buildPatch, draftFromEntry, hasChanges, parseTags } from "./draft";
import type { CatalogueEntry } from "./types";

function makeEntry(overrides: Partial<CatalogueEntry> = {}): CatalogueEntry {
  return {
    id: "1",
    name: "Vignoble Éden",
    nature: "partenaire",
    place_type: "activite",
    notes: null,
    city: "Zichron",
    region: "Nord",
    address: null,
    google_maps_link: null,
    latitude: null,
    longitude: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    contact_instagram: null,
    contact_website: null,
    commercial_status: "en_discussion",
    last_contact_date: null,
    next_followup_date: null,
    content_sent: false,
    content_sent_at: null,
    visited: false,
    visited_at: null,
    video_done: false,
    video_url: null,
    staymakom_category_ids: ["a", "b"],
    tags: ["vin", "famille"],
    hotel_id: null,
    experience_id: null,
    standalone_experience_id: null,
    source: "manuel",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    display_name: "Vignoble Éden",
    display_city: "Zichron",
    display_region: "Nord",
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
    ...overrides,
  };
}

describe("parseTags", () => {
  it("découpe sur les virgules, enlève les vides et les doublons (sans tenir compte de la casse)", () => {
    expect(parseTags(" vue mer, Casher ,, vue MER,enfants ")).toEqual(["vue mer", "Casher", "enfants"]);
    expect(parseTags("")).toEqual([]);
  });
});

describe("buildPatch", () => {
  it("ne renvoie rien quand rien n'a changé", () => {
    const entry = makeEntry();
    const result = buildPatch(draftFromEntry(entry), entry);
    expect(result.error).toBeNull();
    expect(hasChanges(result)).toBe(false);
  });

  it("ne renvoie que les champs modifiés, et vide un champ effacé", () => {
    const entry = makeEntry({ notes: "à rappeler" });
    const draft = { ...draftFromEntry(entry), notes: "", city: "Haïfa", visited: true, visited_at: "2026-09-20" };
    const { patch } = buildPatch(draft, entry);
    expect(patch).toEqual({ notes: null, city: "Haïfa", visited: true, visited_at: "2026-09-20" });
  });

  it("l'ordre des catégories n'est pas une modification, mais en retirer une l'est", () => {
    const entry = makeEntry();
    expect(hasChanges(buildPatch({ ...draftFromEntry(entry), category_ids: ["b", "a"] }, entry))).toBe(false);
    expect(buildPatch({ ...draftFromEntry(entry), category_ids: ["a"] }, entry).patch).toEqual({
      staymakom_category_ids: ["a"],
    });
  });

  it("met à jour les étiquettes", () => {
    const entry = makeEntry();
    expect(buildPatch({ ...draftFromEntry(entry), tags: "vin, plage" }, entry).patch).toEqual({
      tags: ["vin", "plage"],
    });
  });

  it("refuse un nom vide", () => {
    const entry = makeEntry();
    expect(buildPatch({ ...draftFromEntry(entry), name: "  " }, entry).error).toMatch(/nom/i);
  });

  it("pour un lieu relié au site, ignore le nom et la localisation (ils viennent de la fiche)", () => {
    const entry = makeEntry({ live_kind: "hotel", live_id: "h1", hotel_id: "h1" });
    const draft = { ...draftFromEntry(entry), name: "Autre nom", city: "Ailleurs", latitude: "abc", longitude: "" };
    const result = buildPatch(draft, entry);
    expect(result.error).toBeNull();
    expect(hasChanges(result)).toBe(false);
  });

  it("valide la position : les deux ensemble, dans les bornes, virgule décimale acceptée", () => {
    const entry = makeEntry();
    const base = draftFromEntry(entry);
    expect(buildPatch({ ...base, latitude: "32.1", longitude: "" }, entry).error).toMatch(/ensemble/);
    expect(buildPatch({ ...base, latitude: "95", longitude: "34" }, entry).error).toMatch(/invalide/);
    expect(buildPatch({ ...base, latitude: "abc", longitude: "34" }, entry).error).toMatch(/invalide/);
    expect(buildPatch({ ...base, latitude: "32,1", longitude: "34.8" }, entry).patch).toEqual({
      latitude: 32.1,
      longitude: 34.8,
    });
  });

  it("refuse un lien qui n'est pas en https (Google Maps et vidéo perso)", () => {
    const entry = makeEntry();
    const base = draftFromEntry(entry);
    expect(buildPatch({ ...base, google_maps_link: "javascript:alert(1)" }, entry).error).toMatch(/Google Maps/);
    expect(buildPatch({ ...base, video_url: "ma vidéo" }, entry).error).toMatch(/vidéo/);
    expect(buildPatch({ ...base, video_url: "https://www.tiktok.com/@moi/video/123456" }, entry).patch).toEqual({
      video_url: "https://www.tiktok.com/@moi/video/123456",
    });
  });
});
