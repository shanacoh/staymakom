// Lecture d'une page web : on en tire les faits utiles (nom, adresse, téléphone, Instagram...)
// sans navigateur, uniquement à partir du texte de la page. Fonctions pures, testées.

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  ndash: "–",
  mdash: "—",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

const clean = (value: string | null | undefined): string | null => {
  const text = decodeEntities(value ?? "").replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
};

export function extractTitle(html: string): string | null {
  return clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
}

/** Balises <meta> de la page : "og:title", "description", etc. La première valeur rencontrée l'emporte. */
export function extractMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const attr of match[0].matchAll(/([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? "";
    }
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    const value = clean(attrs.content);
    if (key && value && !(key in tags)) tags[key] = value;
  }
  return tags;
}

/** Langue déclarée de la page (ex : "he", "en"), en deux lettres. */
export function extractLang(html: string): string | null {
  return html.match(/<html[^>]*\blang=["']?([a-zA-Z]{2})/i)?.[1]?.toLowerCase() ?? null;
}

/** Retire scripts, styles, commentaires et blocs cachés : ce qu'ils contiennent n'est pas du contenu de la page. */
function stripNonContent(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ");
}

export function extractHrefs(html: string): string[] {
  const hrefs: string[] = [];
  for (const match of stripNonContent(html).matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const href = decodeEntities(match[1] ?? match[2] ?? "").trim();
    if (href) hrefs.push(href);
  }
  return hrefs;
}

// ---------------------------------------------------------------------------
// Données structurées (JSON-LD, le format que les sites donnent aux moteurs de recherche)
// ---------------------------------------------------------------------------

function extractJsonLd(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const push = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(push);
    else if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      nodes.push(node);
      if (Array.isArray(node["@graph"])) node["@graph"].forEach(push);
    }
  };
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      push(JSON.parse(decodeEntities(match[1]).trim()));
    } catch {
      // Un bloc mal formé n'empêche pas de lire les autres
    }
  }
  return nodes;
}

const PLACE_TYPES = [
  "hotel", "lodgingbusiness", "resort", "bedandbreakfast", "hostel", "campground", "restaurant",
  "foodestablishment", "barorpub", "cafeorcoffeeshop", "winery", "brewery", "touristattraction",
  "museum", "dayspa", "healthandbeautybusiness", "sportsactivitylocation", "amusementpark",
  "localbusiness", "store", "place", "organization",
];

export interface StructuredPlace {
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  image: string | null;
  sameAs: string[];
}

const str = (value: unknown): string | null => (typeof value === "string" ? clean(value) : null);
const num = (value: unknown): number | null => {
  const n = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : null;
};

function typesOf(node: Record<string, unknown>): string[] {
  const raw = node["@type"];
  return (Array.isArray(raw) ? raw : [raw]).filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase());
}

/** Choisit dans la page l'entrée qui décrit un lieu (hôtel, restaurant, commerce...), la plus précise d'abord. */
export function pickPlaceFromJsonLd(html: string): StructuredPlace | null {
  const nodes = extractJsonLd(html);
  let best: { node: Record<string, unknown>; rank: number } | null = null;
  for (const node of nodes) {
    const ranks = typesOf(node).map((t) => PLACE_TYPES.indexOf(t)).filter((r) => r >= 0);
    if (ranks.length === 0) continue;
    const rank = Math.min(...ranks);
    if (!best || rank < best.rank) best = { node, rank };
  }
  if (!best) return null;
  const node = best.node;

  const address = node.address;
  let street: string | null = null;
  let city: string | null = null;
  let region: string | null = null;
  if (typeof address === "string") street = clean(address);
  else if (address && typeof address === "object") {
    const a = address as Record<string, unknown>;
    street = str(a.streetAddress);
    city = str(a.addressLocality);
    region = str(a.addressRegion);
  }

  const geo = node.geo && typeof node.geo === "object" ? (node.geo as Record<string, unknown>) : {};
  const image = Array.isArray(node.image) ? node.image[0] : node.image;
  const imageUrl = typeof image === "string" ? image : image && typeof image === "object" ? str((image as Record<string, unknown>).url) : null;
  const sameAs = (Array.isArray(node.sameAs) ? node.sameAs : [node.sameAs]).filter((s): s is string => typeof s === "string");

  return {
    name: str(node.name),
    phone: str(node.telephone),
    email: str(node.email),
    address: street,
    city,
    region,
    latitude: num(geo.latitude),
    longitude: num(geo.longitude),
    description: str(node.description),
    image: imageUrl,
    sameAs,
  };
}

// ---------------------------------------------------------------------------
// Coordonnées repérées dans les liens de la page
// ---------------------------------------------------------------------------

const INSTAGRAM_RESERVED = new Set([
  "p", "reel", "reels", "explore", "accounts", "stories", "tv", "direct", "about", "developer", "legal", "privacy", "share", "web",
]);

export function normalizeInstagram(value: string | null | undefined): string | null {
  const text = (value ?? "").trim();
  if (!text) return null;
  const fromUrl = text.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1];
  const handle = (fromUrl ?? text).replace(/^@/, "").replace(/[/?#].*$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle) || INSTAGRAM_RESERVED.has(handle.toLowerCase())) return null;
  return `@${handle}`;
}

/** Premier compte Instagram trouvé parmi les liens de la page (ou les liens "sameAs" des données structurées). */
export function findInstagram(links: string[]): string | null {
  for (const link of links) {
    if (!/instagram\.com/i.test(link)) continue;
    const handle = normalizeInstagram(link);
    if (handle) return handle;
  }
  return null;
}

export function findPhone(hrefs: string[]): string | null {
  for (const href of hrefs) {
    if (!/^tel:/i.test(href)) continue;
    let value = href.replace(/^tel:/i, "");
    try {
      value = decodeURIComponent(value);
    } catch {
      // On garde la valeur telle quelle
    }
    value = value.replace(/[^\d+()\-\s]/g, "").trim();
    if (value.replace(/\D/g, "").length >= 7) return value;
  }
  return null;
}

export function findEmail(hrefs: string[]): string | null {
  for (const href of hrefs) {
    if (!/^mailto:/i.test(href)) continue;
    const email = href.replace(/^mailto:/i, "").split("?")[0].trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email;
  }
  return null;
}

/** Texte lisible de la page (sans scripts ni styles), coupé à `max` caractères pour l'IA. */
export function htmlToText(html: string, max = 3000): string {
  const text = stripNonContent(html).replace(/<[^>]+>/g, " ");
  return decodeEntities(text).replace(/\s+/g, " ").trim().slice(0, max);
}
