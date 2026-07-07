import type { VercelRequest, VercelResponse } from "@vercel/node";

// Sert, aux seuls robots (Google, WhatsApp, Facebook...), une version de la page
// avec le vrai titre / la vraie description / la vraie image de la fiche demandée,
// au lieu du titre générique du site. Les visiteurs humains ne passent jamais par
// cette fonction (voir middleware.ts) : leur expérience est strictement inchangée.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface ResourceMeta {
  title: string;
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

async function resolveResource(pathname: string): Promise<ResourceMeta | null> {
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
      "title,subtitle,hero_image,base_price,currency,slug,categories(name,slug)",
      experienceMatch[1]
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
          url: `https://staymakom.com/experience/${row.slug}`,
          brand: { "@type": "Brand", name: "STAYMAKOM" },
          ...(row.base_price != null
            ? {
                offers: {
                  "@type": "Offer",
                  price: row.base_price,
                  priceCurrency: row.currency || "ILS",
                  availability: "https://schema.org/InStock",
                  url: `https://staymakom.com/experience/${row.slug}`,
                },
              }
            : {}),
        },
        buildBreadcrumbJsonLd([
          { name: "Home", url: "https://staymakom.com/" },
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
    const row = await fetchOne("standalone_experiences", "title,subtitle,hero_image,slug", standaloneMatch[1]);
    if (!row) return null;
    return {
      title: `${row.title} - Staymakom`,
      description: row.subtitle || undefined,
      image: row.hero_image || undefined,
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
  const safeTitle = escapeHtml(resource.title);
  const safeDescription = resource.description ? escapeHtml(resource.description) : undefined;
  const safeImage = resource.image ? escapeHtml(resource.image) : undefined;

  html = html.replace(/<title>.*?<\/title>/s, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
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
