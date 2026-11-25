// Fiches d'identité « schema.org » (données structurées JSON-LD) lues par Google et les IA.
// Toutes les valeurs viennent de la base, jamais écrites en dur, sauf l'identité de la marque.
import { BRAND, SITE_URL, pageUrl } from "./site.js";

type Json = Record<string, unknown>;

/** Retire les champs vides pour ne pas envoyer de valeurs nulles à Google. */
function clean<T extends Json>(obj: T): T {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      delete obj[key];
    }
  }
  return obj;
}

/**
 * Fiche d'identité de la marque (une seule par page, sur l'accueil). Agence de voyage en
 * ligne : adresse limitée à la ville (pas de rue), pas de note moyenne (aggregateRating).
 */
export function organizationJsonLd(): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": ["Organization", "TravelAgency"],
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.name,
    legalName: BRAND.legalName,
    url: `${SITE_URL}/`,
    logo: BRAND.logo,
    image: BRAND.image,
    description: BRAND.description,
    slogan: BRAND.slogan,
    foundingDate: BRAND.foundingDate,
    areaServed: { "@type": "Country", name: "Israel" },
    knowsLanguage: ["en", "fr", "he", "es", "ru", "de"],
    priceRange: "₪₪",
    email: BRAND.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.address.city,
      addressCountry: BRAND.address.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: BRAND.whatsappUrl,
      availableLanguage: ["en", "fr", "he"],
    },
    sameAs: [BRAND.socials.instagram, BRAND.socials.tiktok, BRAND.socials.linkedin, ...BRAND.press],
  });
}

export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BRAND.name,
    url: `${SITE_URL}/`,
    inLanguage: ["en", "fr", "he"],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: pageUrl(crumb.path),
    })),
  };
}

export function hotelJsonLd(row: Record<string, any>, description: string | undefined, amenities: string[]): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: row.name,
    description,
    image: row.hero_image || row.og_image,
    url: pageUrl(`/hotel/${row.slug}`),
    address: clean({
      "@type": "PostalAddress",
      streetAddress: row.address || undefined,
      addressLocality: row.city || undefined,
      addressRegion: row.region || undefined,
      addressCountry: "IL",
    }),
    geo:
      row.latitude && row.longitude
        ? { "@type": "GeoCoordinates", latitude: row.latitude, longitude: row.longitude }
        : undefined,
    starRating: row.star_rating ? { "@type": "Rating", ratingValue: row.star_rating } : undefined,
    amenityFeature: amenities.slice(0, 20).map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
  });
}

/**
 * Fiche expérience vendue : Product + Offer. Volontairement SANS adresse exacte ni nom du
 * prestataire ou de l'hôtel partenaire (règle : l'adresse n'apparaît que dans l'email de
 * confirmation).
 */
export function productJsonLd(params: {
  name: string;
  description?: string;
  image?: string;
  path: string;
  price: number | null;
  currency: string;
  rating?: { ratingValue: number; reviewCount: number } | null;
}): Json | null {
  // Google refuse un Product sans prix ni avis : dans ce cas on n'en déclare pas.
  if (!(params.price != null && params.price > 0) && !params.rating) return null;
  const url = pageUrl(params.path);
  return clean({
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    description: params.description,
    image: params.image,
    url,
    brand: { "@type": "Brand", name: BRAND.name },
    offers:
      params.price != null && params.price > 0
        ? {
            "@type": "Offer",
            price: params.price,
            priceCurrency: params.currency || "ILS",
            availability: "https://schema.org/InStock",
            url,
            seller: { "@id": `${SITE_URL}/#organization` },
          }
        : undefined,
    aggregateRating: params.rating
      ? { "@type": "AggregateRating", ratingValue: params.rating.ratingValue, reviewCount: params.rating.reviewCount }
      : undefined,
  });
}

export function itemListJsonLd(name: string, path: string, items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: pageUrl(path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: pageUrl(item.path),
      })),
    },
  };
}

export function articleJsonLd(row: Record<string, any>, headline: string, description?: string): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    image: row.og_image || row.cover_image,
    url: row.__url || pageUrl(`/journal/${row.slug}`),
    inLanguage: row.__lang || undefined,
    datePublished: row.published_at || row.created_at,
    dateModified: row.updated_at || row.published_at,
    // Auteur = la marque (décision du sprint SEO du 25/11/2026), quel que soit le rédacteur.
    author: { "@type": "Organization", name: BRAND.name, url: `${SITE_URL}/` },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      logo: { "@type": "ImageObject", url: BRAND.logo },
    },
  });
}

/** Questions fréquentes de l'accueil (résultat enrichi « FAQ » de Google). */
export function faqPageJsonLd(items: { q: string; a: string[] }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.join(" ").replace(/\[([^\]]+)\]/g, "$1") },
    })),
  };
}
