// Plan du site (sitemap.xml) fabriqué en direct à partir des fiches publiées : un hôtel,
// une expérience ou un article publié dans le back-office y apparaît tout seul (cache 1 h),
// sans attendre une mise en ligne du code. Remplace l'ancien generate-sitemap.mjs.
import { fetchMany } from "./db.js";
import { PUBLIC_LANGS, pageUrl, type PageLang } from "./site.js";

type Row = Record<string, any>;

// Copie de src/lib/boatsCategory.ts : les bateaux ont leur adresse de référence /boat/<slug>.
const BOATS_CATEGORY_ID = "06434e23-29f4-4c6b-ba63-b61e68879520";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/experiences", priority: "0.9", changefreq: "daily" },
  { path: "/boat", priority: "0.8", changefreq: "weekly" },
  { path: "/journal", priority: "0.7", changefreq: "weekly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/companies", priority: "0.5", changefreq: "monthly" },
  { path: "/partners", priority: "0.4", changefreq: "monthly" },
  { path: "/consulting", priority: "0.4", changefreq: "monthly" },
  { path: "/terms", priority: "0.2", changefreq: "yearly" },
  { path: "/privacy", priority: "0.2", changefreq: "yearly" },
  { path: "/cancellation-policy", priority: "0.2", changefreq: "yearly" },
  { path: "/cookies", priority: "0.2", changefreq: "yearly" },
];

/** Date de dernière modification réelle (AAAA-MM-JJ), ou rien si inconnue. */
const lastmodOf = (row: Row | undefined): string | null =>
  row && row.updated_at ? String(row.updated_at).slice(0, 10) : null;

const latest = (...lists: Row[][]): string | null =>
  lists.flat().map(lastmodOf).filter((d): d is string => !!d).sort().pop() || null;

/** Une page = une adresse par langue, chacune listant toutes ses sœurs (hreflang). */
function urlEntry(path: string, priority: string, changefreq: string, lastmod: string | null, langs: readonly PageLang[]): string {
  const alternates = [
    ...langs.map((code) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${pageUrl(path, code)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(path, "en")}"/>`,
  ];
  return langs
    .map((code) =>
      [
        "  <url>",
        `    <loc>${pageUrl(path, code)}</loc>`,
        ...alternates,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n")
    )
    .join("\n");
}

/** null = la base n'a rien renvoyé (on ne publie pas un plan du site vide). */
export async function buildSitemap(): Promise<string | null> {
  const published = "status=eq.published";
  const [experiences, hotels, categories, standalones, journals] = await Promise.all([
    fetchMany("experiences2", "slug,updated_at", published),
    fetchMany("hotels2", "slug,updated_at", published),
    fetchMany("categories", "slug,updated_at", published),
    fetchMany("standalone_experiences", "slug,updated_at,category_id", published),
    fetchMany("journal_posts", "slug,updated_at", published),
  ]);
  if (!experiences.length && !hotels.length) return null;

  const boats = standalones.filter((r) => r.category_id === BOATS_CATEGORY_ID);
  const listLastmod: Record<string, string | null> = {
    "/": latest(experiences, hotels, standalones, categories),
    "/experiences": latest(experiences, standalones),
    "/boat": latest(boats),
    "/journal": latest(journals),
  };
  const langs = PUBLIC_LANGS;
  const withSlug = (rows: Row[]) => rows.filter((r) => r.slug);

  const entries = [
    ...STATIC_PAGES.map((p) => urlEntry(p.path, p.priority, p.changefreq, listLastmod[p.path] || null, langs)),
    // « bateaux » est une catégorie saisonnière : la vitrine permanente /boat est déjà listée.
    ...withSlug(categories).filter((r) => r.slug !== "bateaux").map((r) => urlEntry(`/category/${r.slug}`, "0.8", "weekly", lastmodOf(r), langs)),
    ...withSlug(experiences).map((r) => urlEntry(`/experience/${r.slug}`, "0.9", "weekly", lastmodOf(r), langs)),
    ...withSlug(hotels).map((r) => urlEntry(`/hotel/${r.slug}`, "0.8", "weekly", lastmodOf(r), langs)),
    ...withSlug(standalones).map((r) =>
      urlEntry(`${r.category_id === BOATS_CATEGORY_ID ? "/boat" : "/standalone-experience"}/${r.slug}`, "0.8", "weekly", lastmodOf(r), langs)
    ),
    ...withSlug(journals).map((r) => urlEntry(`/journal/${r.slug}`, "0.7", "monthly", lastmodOf(r), langs)),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    "</urlset>",
  ].join("\n");
}

