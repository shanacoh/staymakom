import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchMany } from "./_seo/db.js";
import { BRAND, SITE_URL } from "./_seo/site.js";
import { STATIC_PAGE_TEXTS } from "./_seo/staticPages.js";
import { oneLine } from "./_seo/text.js";

// /llms.txt : résumé du site pour les IA (format https://llmstxt.org), fabriqué à chaque
// appel à partir des fiches publiées (mis en cache 1 h). Adresse branchée dans vercel.json.
// RÈGLE : rien n'est importé de src/ (plantage constaté le 20/11/2026).

type Row = Record<string, any>;

// Copie de src/lib/boatsCategory.ts.
const BOATS_CATEGORY_ID = "06434e23-29f4-4c6b-ba63-b61e68879520";

function line(name: string, path: string, summary: unknown): string {
  const text = oneLine(summary, 180);
  return `- [${name.replace(/[[\]]/g, "")}](${SITE_URL}${path})${text ? `: ${text}` : ""}`;
}

function section(title: string, lines: string[]): string {
  return lines.length ? `## ${title}\n\n${lines.join("\n")}\n` : "";
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const [categories, hotels, experiences, standalones, posts] = await Promise.all([
    fetchMany("categories", "slug,name,launch_description,meta_description_en", "status=eq.published&order=display_order.asc"),
    fetchMany("hotels2", "slug,name,city,region,star_rating,meta_description_en", "status=eq.published&order=name.asc"),
    fetchMany("experiences2", "slug,title,subtitle,hotels2(name,city)", "status=eq.published&order=display_order.asc.nullslast"),
    fetchMany("standalone_experiences", "slug,title,subtitle,city,category_id", "status=eq.published&order=display_order.asc.nullslast"),
    fetchMany("journal_posts", "slug,title_en,excerpt_en", "status=eq.published&order=published_at.desc.nullslast"),
  ]);

  const hotelSummary = (h: Row) =>
    h.meta_description_en ||
    [h.star_rating ? `${h.star_rating}-star hotel` : "Boutique hotel", h.city || h.region ? `in ${h.city || h.region}, Israel` : "in Israel"].join(" ");
  const experienceSummary = (e: Row) => {
    const hotel = Array.isArray(e.hotels2) ? e.hotels2[0] : e.hotels2;
    return [e.subtitle, hotel?.name ? `Stay at ${hotel.name}${hotel.city ? `, ${hotel.city}` : ""}.` : ""].filter(Boolean).join(" ");
  };

  const policies = ["/about", "/contact", "/companies", "/partners", "/terms", "/privacy", "/cancellation-policy", "/legal"]
    .map((path) => line(STATIC_PAGE_TEXTS[path].en.h1, path, STATIC_PAGE_TEXTS[path].en.description));

  const body = [
    `# ${BRAND.name}\n`,
    `> ${BRAND.description}\n`,
    `${BRAND.name} (${BRAND.legalName}, ${BRAND.address.city}, Israel) is a curated booking platform: each experience can be booked with a night in a partner boutique hotel, or on its own. Prices are in Israeli shekels (ILS). Pages exist in English, French (?lang=fr) and Hebrew (?lang=he). Contact: ${BRAND.email}. Instagram and TikTok: @staymakom.\n`,
    section("Categories", categories.filter((c) => c.slug !== "bateaux").map((c) => line(c.name, `/category/${c.slug}`, c.meta_description_en || c.launch_description))),
    section("Hotels", hotels.map((h) => line(h.name, `/hotel/${h.slug}`, hotelSummary(h)))),
    section("Experiences with a hotel stay", experiences.map((e) => line(e.title, `/experience/${e.slug}`, experienceSummary(e)))),
    section("Experiences only", standalones.map((s) => line(s.title, `${s.category_id === BOATS_CATEGORY_ID ? "/boat" : "/standalone-experience"}/${s.slug}`, [s.subtitle, s.city].filter(Boolean).join(" · ")))),
    section("Journal", posts.map((p) => line(p.title_en, `/journal/${p.slug}`, p.excerpt_en))),
    section("About & Policies", policies),
    section("Press", [
      `- [The Jerusalem Post](${BRAND.press[0]}): article about STAYMAKOM and its founder`,
      `- [Actualité Juive](${BRAND.press[1]}): Voyager autrement en Israël avec STAYMAKOM`,
    ]),
  ]
    .filter(Boolean)
    .join("\n");

  res.setHeader("content-type", "text/markdown; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(body);
}
