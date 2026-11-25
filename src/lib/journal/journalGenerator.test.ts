// Tests des règles du blog automatique (fichiers partagés avec la fonction serveur
// supabase/functions/generate-journal-article).
import { describe, expect, it } from "vitest";
import { chooseTopic } from "../../../supabase/functions/_shared/journal/rotation.ts";
import {
  findAddresses,
  findForbiddenWords,
  findProviderNames,
  providerTerms,
  runContentChecks,
} from "../../../supabase/functions/_shared/journal/checks.ts";
import { israelTimeToUtc, nextPublishAt } from "../../../supabase/functions/_shared/journal/schedule.ts";
import { slugify, extractLinks } from "../../../supabase/functions/_shared/journal/text.ts";
import { selectListings, type CandidateListing } from "../../../supabase/functions/_shared/journal/listings.ts";
import { validateArticle } from "../../../supabase/functions/_shared/journal/validate.ts";
import type { BlogTopic, GeneratedArticle } from "../../../supabase/functions/_shared/journal/types.ts";

const topic = (over: Partial<BlogTopic>): BlogTopic => ({
  id: over.primary_keyword || "t",
  lang: "en",
  primary_keyword: "kw",
  monthly_volume: 100,
  difficulty: 10,
  topic_type: "guide",
  working_title: "Title",
  angle: null,
  link_regions: [],
  link_moods: [],
  link_cities: [],
  link_note: null,
  desired_date: null,
  priority: 100,
  status: "a_faire",
  topic_group: null,
  ...over,
});

describe("choix du sujet", () => {
  const queue = [
    topic({ primary_keyword: "en1", lang: "en", priority: 10 }),
    topic({ primary_keyword: "he1", lang: "he", priority: 10 }),
    topic({ primary_keyword: "fr1", lang: "fr", priority: 10 }),
    topic({ primary_keyword: "hanukkah", lang: "en", topic_type: "saisonnier", desired_date: "2026-11-27", priority: 1 }),
  ];

  it("prend d'abord le saisonnier dans les 10 jours", () => {
    expect(chooseTopic(queue, [], "2026-11-25").topic?.primary_keyword).toBe("hanukkah");
  });

  it("ne sort pas un saisonnier trop tôt", () => {
    expect(chooseTopic(queue, [], "2026-11-01").topic?.primary_keyword).toBe("en1");
  });

  it("respecte la rotation 3 EN / 2 HE / 2 FR", () => {
    // 3 EN déjà faits sur les 6 derniers : l'hébreu passe devant.
    expect(chooseTopic(queue, ["en", "en", "fr", "en", "he", "fr"], "2026-12-20").topic?.lang).toBe("he");
  });

  it("passe à la langue suivante si une file est vide et le signale", () => {
    const choice = chooseTopic(queue.filter((t) => t.lang !== "he"), ["en", "en", "en", "fr", "fr"], "2026-12-20");
    expect(choice.topic?.lang).toBe("en");
    expect(choice.notes.join(" ")).toMatch(/HE est vide/);
  });

  it("signale une file de moins de 10 sujets", () => {
    expect(chooseTopic(queue, [], "2026-11-25").notes.join(" ")).toMatch(/moins de 10/);
  });
});

describe("contrôles de fond", () => {
  const terms = providerTerms(
    [
      { name: "Dolphin Reef", provider_type: "experience" },
      { name: "Time Elevator (Jerusalem)", provider_type: "experience" },
      { name: "City of David", provider_type: "experience" },
      { name: "MARK", provider_type: "boat" },
      { name: "The Inbal Jerusalem", provider_type: "hotel" },
    ],
    ["Galita", "גליתה"],
    ["City of David"]
  );

  it("bloque un nom de prestataire, pas un hôtel ni un site public autorisé", () => {
    expect(findProviderNames("Meet the dolphins at Dolphin Reef.", terms)).toEqual(["Dolphin Reef"]);
    expect(findProviderNames("Try the Time Elevator show.", terms)).toEqual(["Time Elevator"]);
    expect(findProviderNames("Stay at The Inbal Jerusalem near the City of David.", terms)).toEqual([]);
  });

  it("nom court en majuscules : cherché seulement en majuscules", () => {
    expect(findProviderNames("Mark the date in your calendar.", terms)).toEqual([]);
    expect(findProviderNames("Sail with MARK from the marina.", terms)).toEqual(["MARK"]);
  });

  it("variantes en hébreu avec préfixe collé", () => {
    expect(findProviderNames("סדנת שוקולד בגליתה", terms)).toEqual(["גליתה"]);
  });

  it("mots interdits dans les 3 langues, sans faux positifs évidents", () => {
    expect(findForbiddenWords("No war talk here.", ["war"])).toEqual(["war"]);
    expect(findForbiddenWords("A warm welcome and great software.", ["war"])).toEqual([]);
    expect(findForbiddenWords("La politique d'annulation est souple.", ["situation politique"])).toEqual([]);
    expect(findForbiddenWords("בזמן המלחמה", ["מלחמה"])).toEqual(["מלחמה"]);
    expect(findForbiddenWords("טיול בגליל", ["טיל"])).toEqual([]);
  });

  it("repère une adresse exacte", () => {
    expect(findAddresses("Meet at 12 Herzl Street in the morning.", [])).not.toEqual([]);
    expect(findAddresses("Rendez-vous rue Dizengoff 99.", [])).not.toEqual([]);
    expect(findAddresses("נפגשים ברחוב הרצל 12", [])).not.toEqual([]);
    expect(findAddresses("The workshop is at Beit Oren Junction, near Haifa.", ["Beit Oren Junction, Beit Oren 30044, Israel"])).toEqual([]);
    expect(findAddresses("Go to Retzif HaAliya HaShniya 5 in Jaffa", ["Retzif HaAliya HaShniya 5, Jaffa"])).toContain("Retzif HaAliya HaShniya 5");
    expect(findAddresses("Open 7 days a week, 2 hours from Tel Aviv.", [])).toEqual([]);
  });

  it("assemble les raisons de blocage", () => {
    const reasons = runContentChecks({
      text: "Book Dolphin Reef at 12 Herzl Street during the war.",
      lang: "en",
      providerTerms: terms,
      forbiddenWords: { en: ["war"] },
      listingAddresses: [],
      duplicateOf: "Old article",
    });
    expect(reasons).toHaveLength(4);
  });
});

describe("heure de publication (Israël)", () => {
  it("17:00 en Israël = 15:00 UTC en hiver", () => {
    expect(israelTimeToUtc("2026-11-25", 17).toISOString()).toBe("2026-11-25T15:00:00.000Z");
  });
  it("17:00 en Israël = 14:00 UTC en été", () => {
    expect(israelTimeToUtc("2026-07-01", 17).toISOString()).toBe("2026-07-01T14:00:00.000Z");
  });
  it("génération à 05:00 → publication le jour même à 17:00", () => {
    expect(nextPublishAt(new Date("2026-11-25T03:00:00Z"), 17).toISOString()).toBe("2026-11-25T15:00:00.000Z");
  });
  it("génération l'après-midi → publication le lendemain à 17:00", () => {
    expect(nextPublishAt(new Date("2026-11-25T13:00:00Z"), 17).toISOString()).toBe("2026-11-26T15:00:00.000Z");
  });
});

describe("textes", () => {
  it("slug par langue", () => {
    expect(slugify("Hanouka 2026 en Israël : que faire ?", "fr")).toBe("hanouka-2026-en-israel-que-faire");
    expect(slugify("מתנה לזוג לחנוכה", "he")).toBe("מתנה-לזוג-לחנוכה");
  });
  it("liens internes", () => {
    expect(extractLinks("See [the ritual](/experience/x) and [this](/journal/y?lang=he).")).toEqual(["/experience/x", "/journal/y?lang=he"]);
  });
});

describe("fiches et validation", () => {
  const listing = (id: string, region: string | null, moods: string[] = []): CandidateListing => ({
    id,
    kind: "standalone",
    path: `/standalone-experience/${id}`,
    title: id,
    description: "",
    city: null,
    region: null,
    moods: [],
    from_price_ils: 100,
    price_basis: "per_person",
    cover_image: null,
    hotel_name: null,
    address: null,
    region_slug: region,
    mood_slugs: moods,
  });
  const all = [listing("a", "jerusalem", ["family"]), listing("b", "jerusalem"), listing("c", "eilat", ["family"]), listing("d", "eilat")];

  it("garde d'abord les fiches qui cochent région ET mood", () => {
    const picked = selectListings(all, topic({ link_regions: ["jerusalem"], link_moods: ["family"] }));
    expect(picked.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("refuse un lien vers une page inconnue et une FAQ trop courte", () => {
    const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
    const a: GeneratedArticle = {
      slug: "s",
      seo_title: "Title",
      meta_description: "Desc",
      h1: "H1",
      intro: words(50),
      sections: Array.from({ length: 4 }, (_, i) => ({
        heading: `H${i}`,
        paragraphs: [`${words(230)} [a](/standalone-experience/a) [b](/standalone-experience/b) [x](/experience/unknown)`],
      })),
      booking_intro: "Book.",
      booking_listing_ids: ["a", "b"],
      faq: [{ question: "q", answer: "a" }],
      conclusion: "End.",
      cover_listing_id: "a",
      cover_alt: "Alt",
      secondary_keywords: [],
      to_verify: [],
    };
    const errors = validateArticle(a, { topicType: "guide", listings: all, extraAllowedPaths: [] });
    expect(errors.some((e) => e.includes("/experience/unknown"))).toBe(true);
    expect(errors.some((e) => e.includes("FAQ"))).toBe(true);
  });
});

describe("règles du 25/11 au soir", () => {
  it("bloque une grande chaîne citée", () => {
    const reasons = runContentChecks({
      text: "Grab a coffee at Aroma, then sufganiyot at Roladin.",
      lang: "en",
      providerTerms: [],
      forbiddenWords: {},
      chainNames: ["Roladin", "Aroma", "רולדין"],
      listingAddresses: [],
      duplicateOf: null,
    });
    expect(reasons).toEqual(["Grande chaîne citée : Roladin, Aroma"]);
  });

  it("chaque point à vérifier porte l'URL de sa source (sauf date clé)", () => {
    const base = { topicType: "guide" as const, listings: [], extraAllowedPaths: [] };
    const article = (to_verify: string[]) =>
      ({ slug: "s", seo_title: "t", meta_description: "d", h1: "h", intro: "", sections: [], booking_intro: "", booking_listing_ids: [], faq: [], conclusion: "", cover_listing_id: "", cover_alt: "", secondary_keywords: [], to_verify }) as GeneratedArticle;
    expect(validateArticle(article(["Marché de Mamilla"]), base).some((e) => e.includes("sans URL"))).toBe(true);
    expect(validateArticle(article(["Marché de Mamilla : https://www.jerusalem.muni.il/x", "Hanoucca 4 au 12 décembre (date clé vérifiée)"]), base).some((e) => e.includes("sans URL"))).toBe(false);
  });
});
