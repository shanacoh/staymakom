import { describe, expect, it } from "vitest";
import { parseDraft, parseMoodPresentations, type DraftReferences } from "./parse";

const refs: DraftReferences = {
  categoriesBySlug: new Map([
    ["nature", "cat-nature"],
    ["romantic", "cat-romantic"],
    ["family", "cat-family"],
  ]),
  regionsBySlug: new Map([["sharon", "region-sharon"]]),
  badgesBySlug: new Map([["guided-tour", { id: "tag-guided", label: "Visite guidée" }]]),
  photoUrls: ["https://x/1.jpg", "https://x/2.jpg"],
  maxCategories: 3,
};

const validAnswer = {
  title: "Sunset Ride in the Sharon",
  long_copy: "<p>A ride at dusk.</p>",
  includes: [],
  to_verify: ["Prix fournisseur trouvé : 310 ₪/pers."],
};

// Tout ce que l'IA n'a pas le droit de remplir, tel qu'un PDF de prestataire pourrait le lui souffler.
const forbidden = {
  base_price: 390,
  base_price_child: 250,
  supplier_price_adult: 310,
  supplier_price_child: 200,
  markup_percent: 20,
  original_price: 450,
  deposit_percent: 30,
  available_days: [0, 1, 2],
  blocked_dates: ["2026-12-25"],
  whitelisted_dates: ["2026-11-01"],
  time_slots: ["17:00"],
  has_time_slots: true,
  supplier_name: "Ranch Ein Vered",
  supplier_contact: "050-0000000",
  supplier_booking_url: "https://ranch.example/book",
  provider_id: "provider-1",
  booking_channel: "instant",
  day_contact_name: "Yossi",
  day_contact_phone: "050-1111111",
  day_contact_language: "he",
  status: "published",
  featured_on_home: true,
  home_display_order: 1,
};

describe("parseDraft", () => {
  it("ne laisse sortir aucun champ interdit, même si l'IA les renvoie", () => {
    const { draft, toVerify } = parseDraft({ ...validAnswer, ...forbidden }, refs);
    for (const key of Object.keys(forbidden)) expect(draft).not.toHaveProperty(key);
    // Le prix reste lisible par Shana, mais seulement dans « À vérifier ».
    expect(toVerify).toContain("Prix fournisseur trouvé : 310 ₪/pers.");
    expect(JSON.stringify(draft)).not.toContain("310");
  });

  it("garde 1 à 3 moods de la liste, le premier comme mood principal", () => {
    const { draft, toVerify } = parseDraft({ ...validAnswer, category_slugs: ["nature", "inconnu", "romantic", "family"] }, refs);
    expect(draft.category_ids).toEqual(["cat-nature", "cat-romantic"]);
    expect(draft.category_id).toBe("cat-nature");
    expect(toVerify.some((line) => line.includes("inconnu"))).toBe(true);
  });

  it("ne met jamais « On the Water » en mood principal", () => {
    const boatRefs = { ...refs, categoriesBySlug: new Map([...refs.categoriesBySlug, ["bateaux", "cat-boats"]]), secondaryOnlySlugs: ["bateaux"] };
    expect(parseDraft({ ...validAnswer, category_slugs: ["bateaux", "nature"] }, boatRefs).draft.category_ids).toEqual(["cat-nature", "cat-boats"]);
    expect(parseDraft({ ...validAnswer, category_slugs: ["nature", "bateaux"] }, boatRefs).draft.category_ids).toEqual(["cat-nature", "cat-boats"]);
    const alone = parseDraft({ ...validAnswer, category_slugs: ["bateaux"] }, boatRefs);
    expect(alone.draft.category_ids).toEqual([]);
    expect(alone.toVerify.some((line) => line.includes("On the Water"))).toBe(true);
  });

  it("ne relie qu'une région de la liste et signale les autres", () => {
    expect(parseDraft({ ...validAnswer, region_slug: "sharon" }, refs).draft.region_id).toBe("region-sharon");
    const unknown = parseDraft({ ...validAnswer, region_slug: "atlantide" }, refs);
    expect(unknown.draft.region_id).toBeNull();
    expect(unknown.toVerify.some((line) => line.includes("atlantide"))).toBe(true);
    expect(parseDraft({ ...validAnswer, region_slug: null }, refs).draft.region_id).toBeNull();
  });

  it("ne crée jamais de badge : seuls ceux de la liste sont gardés", () => {
    const { draft, toVerify } = parseDraft({ ...validAnswer, badge_slugs: ["guided-tour", "horse-riding"] }, refs);
    expect(draft.badges).toEqual([{ id: "tag-guided", label: "Visite guidée" }]);
    expect(toVerify.some((line) => line.includes("horse-riding"))).toBe(true);
  });

  it("remplit l'après-réservation et ignore une valeur absurde", () => {
    const { draft } = parseDraft(
      { ...validAnswer, meeting_point_fr: " Devant l'écurie ", arrive_minutes_before: 15, know_before_you_go_fr: "Chaussures fermées obligatoires" },
      refs,
    );
    expect(draft.meeting_point_fr).toBe("Devant l'écurie");
    expect(draft.arrive_minutes_before).toBe(15);
    expect(draft.know_before_you_go_fr).toBe("Chaussures fermées obligatoires");
    expect(draft.contingency_note).toBeNull();
    expect(parseDraft({ ...validAnswer, arrive_minutes_before: 5000 }, refs).draft.arrive_minutes_before).toBeNull();
  });

  it("ne propose qu'une photo réellement montrée à l'IA", () => {
    expect(parseDraft({ ...validAnswer, cover_photo_number: 2 }, refs).draft.cover_image).toBe("https://x/2.jpg");
    expect(parseDraft({ ...validAnswer, cover_photo_number: 9 }, refs).draft.cover_image).toBeNull();
  });
});

describe("parseMoodPresentations", () => {
  const options = {
    targetsBySlug: new Map([
      ["romantic", { id: "cat-romantic", name: "Romantic Escape" }],
      ["family", { id: "cat-family", name: "Family Fun" }],
    ]),
    needsCover: new Set(["cat-family"]),
    photoUrls: ["https://x/1.jpg"],
    takenTitles: ["Sunset Ride in the Sharon"],
  };
  const texts = { subtitle: "s", subtitle_fr: "s", subtitle_he: "s", long_copy: "<p>l</p>", long_copy_fr: "<p>l</p>", long_copy_he: "<p>l</p>" };

  it("ne garde que les moods demandés et leurs trois textes", () => {
    const { presentations } = parseMoodPresentations(
      [
        { mood_slug: "romantic", title: "Two Horses at Dusk", title_fr: "À deux au crépuscule", title_he: "שניים בשקיעה", ...texts, base_price: 390, cover_photo_number: 1 },
        { mood_slug: "taste", title: "Autre", ...texts },
      ],
      options,
    );
    expect(Object.keys(presentations)).toEqual(["cat-romantic"]);
    expect(presentations["cat-romantic"]).not.toHaveProperty("base_price");
    // Ce mood a déjà sa photo : l'IA ne la change pas.
    expect(presentations["cat-romantic"].cover_image).toBeNull();
  });

  it("propose une photo seulement au mood qui n'en a pas", () => {
    const { presentations } = parseMoodPresentations(
      [{ mood_slug: "family", title: "Their First Ride", title_fr: "Leur première balade", title_he: "הרכיבה הראשונה", ...texts, cover_photo_number: 1 }],
      options,
    );
    expect(presentations["cat-family"].cover_image).toBe("https://x/1.jpg");
  });

  it("signale un titre identique à celui d'un autre mood", () => {
    const { toVerify } = parseMoodPresentations(
      [
        { mood_slug: "romantic", title: "sunset ride in the sharon", title_fr: "À deux", title_he: "א", ...texts },
        { mood_slug: "family", title: "Their First Ride", title_fr: "À deux", title_he: "ב", ...texts },
      ],
      options,
    );
    expect(toVerify).toHaveLength(2);
    expect(toVerify[0]).toContain("Romantic Escape");
    expect(toVerify[1]).toContain("Family Fun");
  });
});
