// Article du blog automatique servi aux robots : HTML complet, une seule adresse par article
// (celle de sa langue), un seul bloc Article / FAQPage / BreadcrumbList, hébreu de droite à gauche.
import { describe, expect, it } from "vitest";
import { resolveGeneratedArticle } from "../../api/_seo/resolvers";
import { patchHtml } from "../../api/_seo/patchHead";
import { renderBody } from "../../api/_seo/renderBody";
import { canonicalRedirect } from "../../api/_seo/redirect";
import { inlineToHtml } from "../../api/_seo/journalArticle";

const W = "https://www.staymakom.com";
const SHELL = `<!doctype html><html lang="en"><head><title>STAYMAKOM</title></head><body><div id="root"></div></body></html>`;

const row = {
  id: "x",
  slug: "מתנה-לזוג-לחנוכה",
  lang: "he",
  topic_group: null,
  title: "מתנה לזוג לחנוכה",
  seo_title: "מתנה לזוג לחנוכה: חוויות במקום חפצים",
  meta_description: "רעיונות למתנה לזוג",
  intro: "פתיחה עם [קישור](/experience/a).",
  body: [
    { heading: "כותרת 1", paragraphs: ["פסקה"] },
    { heading: "כותרת 2", paragraphs: ["פסקה"], bullets: ["נקודה"] },
  ],
  booking_intro: "להזמנה",
  conclusion: "סיום",
  faq: [
    { question: "שאלה?", answer: "תשובה." },
    { question: "שאלה 2?", answer: "תשובה 2." },
  ],
  linked_listings: [],
  cover_image: "https://example.com/a.jpg",
  published_at: "2026-11-29T15:00:00Z",
  updated_at: "2026-11-29T15:00:00Z",
};

describe("article du blog automatique pour les robots", () => {
  it("HTML complet, en hébreu, adresse ?lang=he, un seul bloc de chaque type", async () => {
    const page = await resolveGeneratedArticle(row);
    expect(page.contentLang).toBe("he");
    expect(page.alternates).toEqual([]);
    const body = renderBody(page, "he", []);
    const html = patchHtml(SHELL, `/journal/${row.slug}`, page, { lang: "he", publicLangs: ["en", "fr", "he"], hidden: false }, body);
    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain(`<link rel="canonical" href="${W}/journal/${row.slug}?lang=he" />`);
    expect(html).not.toContain('hreflang="en"');
    expect(html).toContain("<h1>מתנה לזוג לחנוכה</h1>");
    expect(html).toContain("כותרת 2");
    const types = [...html.matchAll(/"@type":"(Article|FAQPage|BreadcrumbList)"/g)].map((m) => m[1]);
    expect(types.sort()).toEqual(["Article", "BreadcrumbList", "FAQPage"]);
  });

  it("une seule adresse : la version anglaise d'un article hébreu redirige vers ?lang=he", () => {
    expect(canonicalRedirect("/journal/x", undefined, "/journal/x", "en", "he")).toBe(`${W}/journal/x?lang=he`);
    expect(canonicalRedirect("/journal/x", "he", "/journal/x", "he", "he")).toBeNull();
    expect(canonicalRedirect("/journal/x", "en", "/journal/x", "en", "en")).toBe(`${W}/journal/x`);
    expect(canonicalRedirect("/journal/x", undefined, "/journal/x", "en", "en")).toBeNull();
  });

  it("le texte du rédacteur est échappé, seuls les liens internes et le gras passent", () => {
    expect(inlineToHtml("<script>x</script> **gras** [fiche](/experience/a)", "fr")).toBe(
      '&lt;script&gt;x&lt;/script&gt; <strong>gras</strong> <a href="/experience/a?lang=fr">fiche</a>'
    );
    expect(inlineToHtml("[ailleurs](https://evil.com)", "en")).toBe("ailleurs");
  });
});

describe("ancienne version hébreu de l'article Hanoucca", () => {
  it("le guichet robots répond 301 vers le nouvel article hébreu", async () => {
    const { resolvePage } = await import("../../api/_seo/resolvers");
    const page = await resolvePage("/journal/hanukkah-in-israel-2026", "he", false);
    expect(page.canonicalPath).toBe("/journal/matana-lezug-chanuka");
    expect(canonicalRedirect("/journal/hanukkah-in-israel-2026", "he", page.canonicalPath, "he", page.contentLang)).toBe(
      `${W}/journal/matana-lezug-chanuka?lang=he`
    );
  });
});
