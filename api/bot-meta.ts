import type { VercelRequest, VercelResponse } from "@vercel/node";

// Sert, aux seuls robots (Google, WhatsApp, Facebook...), une version de la page
// avec le vrai titre / la vraie description / la vraie image de la fiche demandée,
// au lieu du titre générique du site. Les visiteurs humains ne passent jamais par
// cette fonction (voir middleware.ts) : leur expérience est strictement inchangée.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface ResourceMeta {
  // Absent = on garde le titre/description déjà présents dans index.html
  // (cas de l'accueil et de la liste des expériences : rien à personnaliser).
  title?: string;
  description?: string;
  image?: string;
  jsonLdBlocks?: Record<string, unknown>[];
}

interface BreadcrumbCrumb {
  name: string;
  url: string;
}

function buildBreadcrumbJsonLd(crumbs: BreadcrumbCrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

async function fetchOne(
  table: string,
  columns: string,
  slug: string
): Promise<Record<string, any> | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&slug=eq.${encodeURIComponent(
    slug
  )}&status=eq.published&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

async function fetchMany(
  table: string,
  columns: string,
  extraQuery: string
): Promise<Record<string, any>[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${extraQuery}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// Pour les expériences vendues avec une chambre d'hôtel ("bar_rate"), il n'y a
// pas de prix fixe stocké : le vrai prix dépend de la disponibilité de la
// chambre au moment de la réservation (voir src/hooks/useExperience2Price.ts).
// On calcule ici la même estimation "à partir de" que le site utilise déjà en
// secours quand il n'a pas de tarif en direct, à partir des données stockées,
// pour ne jamais envoyer un prix à 0 à Google.
function estimateBarRateFromPrice(row: Record<string, any>): number | null {
  if (row.pricing_model !== "bar_rate") return null;
  const netRate = Number(row.room_net_rate) || 0;
  if (netRate <= 0) return null;
  const markupValue = Number(row.bar_rate_markup_value) || 0;
  const isPct = row.bar_rate_markup_is_pct ?? true;
  const roomClient = isPct ? netRate + (netRate * markupValue) / 100 : netRate + markupValue;
  const sellFixed = Number(row.experience_sell_fixed) || 0;
  const sellPerPerson = Number(row.experience_sell_per_person) || 0;
  const minParty = Number(row.min_party) || 1;
  const total = roomClient + sellFixed + sellPerPerson * minParty;
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

async function fetchAggregateRating(
  experienceId: string
): Promise<{ ratingValue: number; reviewCount: number } | null> {
  const rows = await fetchMany(
    "experience2_reviews",
    "rating",
    `experience_id=eq.${encodeURIComponent(experienceId)}&is_visible=eq.true`
  );
  if (!rows.length) return null;
  const sum = rows.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return { ratingValue: Math.round((sum / rows.length) * 10) / 10, reviewCount: rows.length };
}

async function resolveResource(pathname: string): Promise<ResourceMeta | null> {
  // Accueil : le titre/la description générique d'index.html sont déjà bons,
  // on ajoute seulement la fiche d'identité de la marque pour Google.
  if (pathname === "/") {
    return {
      jsonLdBlocks: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "STAYMAKOM",
          url: "https://staymakom.com/",
          logo: "https://staymakom.com/favicon.png",
        },
      ],
    };
  }

  // Liste des expériences : titre/description dédiés (au lieu du générique de
  // l'accueil) + fil d'Ariane + liste des expériences publiées pour Google.
  if (pathname === "/experiences") {
    const rows = await fetchMany(
      "experiences2",
      "title,slug",
      "status=eq.published&order=created_at.desc&limit=20"
    );
    return {
      title: "All Experiences - Staymakom",
      description:
        "Browse curated local experiences across Israel — from desert adventures to culinary discoveries, bookable alone or paired with a stay.",
      jsonLdBlocks: [
        buildBreadcrumbJsonLd([
          { name: "Home", url: "https://staymakom.com/" },
          { name: "Experiences", url: "https://staymakom.com/experiences" },
        ]),
        ...(rows.length
          ? [
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                itemListElement: rows.map((row, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  url: `https://staymakom.com/experience/${row.slug}`,
                  name: row.title,
                })),
              },
            ]
          : []),
      ],
    };
  }

  const hotelMatch = pathname.match(/^\/hotel\/([^/?#]+)/);
  if (hotelMatch) {
    const row = await fetchOne(
      "hotels2",
      "name,city,story,hero_image,og_image,seo_title_en,meta_description_en,latitude,longitude,slug",
      hotelMatch[1]
    );
    if (!row) return null;
    return {
      title: row.seo_title_en || `${row.name} - ${row.city || ""} - Staymakom`.replace(/\s*-\s*$/, ""),
      description:
        row.meta_description_en || (row.story ? String(row.story).slice(0, 155) : undefined),
      image: row.og_image || row.hero_image || undefined,
      jsonLdBlocks: [
        {
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          name: row.name,
          image: row.hero_image || row.og_image || undefined,
          url: `https://staymakom.com/hotel/${row.slug}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: row.city || undefined,
            addressCountry: "IL",
          },
          ...(row.latitude && row.longitude
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: row.latitude,
                  longitude: row.longitude,
                },
              }
            : {}),
        },
        buildBreadcrumbJsonLd([
          { name: "Home", url: "https://staymakom.com/" },
          { name: row.name, url: `https://staymakom.com/hotel/${row.slug}` },
        ]),
      ],
    };
  }

  const experienceMatch = pathname.match(/^\/experience\/([^/?#]+)/);
  if (experienceMatch) {
    const row = await fetchOne(
      "experiences2",
      "id,title,subtitle,hero_image,base_price,currency,slug,pricing_model,room_net_rate,bar_rate_markup_value,bar_rate_markup_is_pct,experience_sell_fixed,experience_sell_per_person,min_party,categories(name,slug)",
      experienceMatch[1]
    );
    if (!row) return null;
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    const aggregateRating = row.id ? await fetchAggregateRating(row.id) : null;
    const price = row.base_price > 0 ? row.base_price : estimateBarRateFromPrice(row);
    return {
      title: `${row.title} - Staymakom`,
      description: row.subtitle || undefined,
      image: row.hero_image || undefined,
      jsonLdBlocks: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: row.title,
          description: row.subtitle || undefined,
          image: row.hero_image || undefined,
          url: `https://staymakom.com/experience/${row.slug}`,
          brand: { "@type": "Brand", name: "STAYMAKOM" },
          ...(price != null
            ? {
                offers: {
                  "@type": "Offer",
                  price,
                  priceCurrency: row.currency || "ILS",
                  availability: "https://schema.org/InStock",
                  url: `https://staymakom.com/experience/${row.slug}`,
                },
              }
            : {}),
          ...(aggregateRating
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: aggregateRating.ratingValue,
                  reviewCount: aggregateRating.reviewCount,
                },
              }
            : {}),
        },
        buildBreadcrumbJsonLd([
          { name: "Home", url: "https://staymakom.com/" },
          {
            name: "With Hotel",
            url: category?.slug
              ? `https://staymakom.com/category/${category.slug}?mode=stay`
              : "https://staymakom.com/experiences",
          },
          ...(category?.name && category?.slug
            ? [{ name: category.name, url: `https://staymakom.com/category/${category.slug}` }]
            : []),
          { name: row.title, url: `https://staymakom.com/experience/${row.slug}` },
        ]),
      ],
    };
  }

  const categoryMatch = pathname.match(/^\/category\/([^/?#]+)/);
  if (categoryMatch) {
    const row = await fetchOne(
      "categories",
      "name,intro_rich_text,og_image,hero_image,seo_title_en,meta_description_en,slug",
      categoryMatch[1]
    );
    if (!row) return null;
    return {
      title: row.seo_title_en || `${row.name} - Staymakom`,
      description:
        row.meta_description_en ||
        (row.intro_rich_text ? String(row.intro_rich_text).replace(/<[^>]+>/g, "").slice(0, 155) : undefined),
      image: row.og_image || row.hero_image || undefined,
      jsonLdBlocks: [
        buildBreadcrumbJsonLd([
          { name: "Home", url: "https://staymakom.com/" },
          { name: "With Hotel", url: `https://staymakom.com/category/${row.slug}?mode=stay` },
          { name: row.name, url: `https://staymakom.com/category/${row.slug}?mode=stay` },
        ]),
      ],
    };
  }

  const journalMatch = pathname.match(/^\/journal\/([^/?#]+)/);
  if (journalMatch) {
    const row = await fetchOne(
      "journal_posts",
      "title_en,excerpt_en,cover_image,og_image,seo_title_en,meta_description_en,published_at,slug",
      journalMatch[1]
    );
    if (!row) return null;
    return {
      title: row.seo_title_en || row.title_en,
      description: row.meta_description_en || row.excerpt_en || undefined,
      image: row.og_image || row.cover_image || undefined,
      jsonLdBlocks: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: row.title_en,
          description: row.excerpt_en || undefined,
          image: row.og_image || row.cover_image || undefined,
          url: `https://staymakom.com/journal/${row.slug}`,
          datePublished: row.published_at,
          author: { "@type": "Organization", name: "STAYMAKOM" },
          publisher: {
            "@type": "Organization",
            name: "STAYMAKOM",
            logo: { "@type": "ImageObject", url: "https://staymakom.com/favicon.png" },
          },
        },
      ],
    };
  }

  const standaloneMatch = pathname.match(/^\/standalone-experience\/([^/?#]+)/);
  if (standaloneMatch) {
    const row = await fetchOne(
      "standalone_experiences",
      "title,subtitle,hero_image,base_price,currency,slug,categories(name,slug)",
      standaloneMatch[1]
    );
    if (!row) return null;
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      title: `${row.title} - Staymakom`,
      description: row.subtitle || undefined,
      image: row.hero_image || undefined,
      jsonLdBlocks: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: row.title,
          description: row.subtitle || undefined,
          image: row.hero_image || undefined,
          url: `https://staymakom.com/standalone-experience/${row.slug}`,
          brand: { "@type": "Brand", name: "STAYMAKOM" },
          ...(row.base_price != null
            ? {
                offers: {
                  "@type": "Offer",
                  price: row.base_price,
                  priceCurrency: row.currency || "ILS",
                  availability: "https://schema.org/InStock",
                  url: `https://staymakom.com/standalone-experience/${row.slug}`,
                },
              }
            : {}),
        },
        buildBreadcrumbJsonLd([
          { name: "Home", url: "https://staymakom.com/" },
          {
            name: "Experience Only",
            url: category?.slug
              ? `https://staymakom.com/category/${category.slug}?mode=live`
              : "https://staymakom.com/experiences?mode=live",
          },
          ...(category?.name && category?.slug
            ? [{ name: category.name, url: `https://staymakom.com/category/${category.slug}` }]
            : []),
          { name: row.title, url: `https://staymakom.com/standalone-experience/${row.slug}` },
        ]),
      ],
    };
  }

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function patchHtml(html: string, pathname: string, resource: ResourceMeta): string {
  const canonicalUrl = `https://staymakom.com${pathname}`;
  const safeTitle = resource.title ? escapeHtml(resource.title) : undefined;
  const safeDescription = resource.description ? escapeHtml(resource.description) : undefined;
  const safeImage = resource.image ? escapeHtml(resource.image) : undefined;

  if (safeTitle) {
    html = html.replace(/<title>.*?<\/title>/s, `<title>${safeTitle}</title>`);
    html = html.replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${safeTitle}" />`
    );
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${safeTitle}" />`
    );
  }
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  if (safeDescription) {
    html = html.replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${safeDescription}" />`
    );
    html = html.replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${safeDescription}" />`
    );
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${safeDescription}" />`
    );
  }

  if (safeImage) {
    html = html.replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${safeImage}" />`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${safeImage}" />`
    );
  }

  const extras = [`<link rel="canonical" href="${canonicalUrl}" />`];
  for (const block of resource.jsonLdBlocks || []) {
    const jsonLd = JSON.stringify(block).replace(/</g, "\\u003c");
    extras.push(`<script type="application/ld+json">${jsonLd}</script>`);
  }
  html = html.replace("</head>", `${extras.join("\n")}\n</head>`);

  return html;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = typeof req.query.path === "string" ? req.query.path : "/";

  const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers.host;
  const origin = `${protocol}://${host}`;

  let html = "";
  try {
    const originRes = await fetch(`${origin}/index.html`);
    html = await originRes.text();
  } catch {
    res.status(502).send("Bad gateway");
    return;
  }

  try {
    const resource = await resolveResource(pathname);
    if (resource) {
      html = patchHtml(html, pathname, resource);
    }
  } catch {
    // En cas d'erreur de récupération des données, on sert la page générique
    // plutôt que de renvoyer une erreur au robot.
  }

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400");
  res.status(200).send(html);
}
