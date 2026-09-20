// Conversion d'un résultat OpenStreetMap (Nominatim) en fiche de lieu du catalogue.

import { normalizeInstagram } from "./parse.ts";

export type PlaceType = "hebergement" | "restaurant" | "activite" | "lieu_a_visiter" | "bateau" | "autre";

export interface Suggestion {
  name: string | null;
  place_type: PlaceType | null;
  city: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  description: string | null;
  google_maps_link: string | null;
}

export const EMPTY_SUGGESTION: Suggestion = {
  name: null,
  place_type: null,
  city: null,
  region: null,
  address: null,
  latitude: null,
  longitude: null,
  phone: null,
  email: null,
  instagram: null,
  website: null,
  description: null,
  google_maps_link: null,
};

export interface Candidate {
  label: string;
  suggestion: Suggestion;
}

export interface OsmResult {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string> | null;
  namedetails?: Record<string, string> | null;
}

const ACCOMMODATION = new Set(["hotel", "guest_house", "hostel", "motel", "apartment", "chalet", "camp_site", "caravan_site", "resort", "alpine_hut", "wilderness_hut"]);
const SIGHTS = new Set(["attraction", "museum", "gallery", "viewpoint", "zoo", "aquarium", "theme_park", "artwork", "picnic_site"]);
const FOOD = new Set(["restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "biergarten", "ice_cream"]);

export function guessPlaceType(category?: string, type?: string): PlaceType {
  const c = category ?? "";
  const t = type ?? "";
  if (c === "tourism") {
    if (ACCOMMODATION.has(t)) return "hebergement";
    if (SIGHTS.has(t)) return "lieu_a_visiter";
    return "autre";
  }
  if (c === "amenity") return FOOD.has(t) ? "restaurant" : "autre";
  if (c === "craft" || (c === "shop" && (t === "wine" || t === "alcohol"))) return "activite";
  if (c === "leisure") return ["park", "nature_reserve", "garden", "beach_resort"].includes(t) ? "lieu_a_visiter" : "activite";
  if (c === "historic" || c === "natural") return "lieu_a_visiter";
  if (c === "boundary" && (t === "national_park" || t === "protected_area")) return "lieu_a_visiter";
  return "autre";
}

const simplify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(district|israel)\b/g, " ")
    .replace(/[^a-z֐-׿]/g, "");

/**
 * Si la région trouvée correspond à une région déjà utilisée dans le catalogue ("Center District" et
 * "Center District Israel"), on reprend l'écriture existante pour que les filtres restent propres.
 */
export function matchKnownRegion(region: string | null, known: string[]): string | null {
  if (!region) return null;
  const target = simplify(region);
  if (target.length < 3) return region;
  for (const candidate of known) {
    const other = simplify(candidate);
    if (other.length < 3) continue;
    if (other === target || (Math.min(other.length, target.length) >= 4 && (other.includes(target) || target.includes(other)))) {
      return candidate;
    }
  }
  return region;
}

const firstValue = (value: string | undefined): string | null => {
  const first = (value ?? "").split(";")[0].trim();
  return first === "" ? null : first;
};

function cleanWebsite(value: string | undefined): string | null {
  const first = firstValue(value);
  if (!first) return null;
  const withScheme = /^https?:\/\//i.test(first) ? first : `https://${first}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

export function mapsLinkFor(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** Nom du lieu : on préfère l'écriture française, puis anglaise, avant l'hébreu. */
function pickName(result: OsmResult): string | null {
  const details = result.namedetails ?? {};
  const name = details["name:fr"] || details["name:en"] || result.name || details.name || result.display_name?.split(",")[0];
  return name?.trim() || null;
}

export function mapOsmResult(result: OsmResult, knownRegions: string[] = []): Candidate | null {
  const latitude = parseFloat(result.lat ?? "");
  const longitude = parseFloat(result.lon ?? "");
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const name = pickName(result);
  if (!name) return null;

  const a = result.address ?? {};
  const tags = result.extratags ?? {};
  const road = a.road || a.pedestrian || a.path || a.footway || "";
  const address = [road, a.house_number].filter(Boolean).join(" ").trim() || null;
  const city = a.city || a.town || a.village || a.hamlet || a.suburb || a.municipality || null;
  const region = matchKnownRegion(a.state || a.region || null, knownRegions);
  const description = tags.description?.trim().slice(0, 300) || null;

  const suggestion: Suggestion = {
    name,
    place_type: guessPlaceType(result.category, result.type),
    city,
    region,
    address,
    latitude,
    longitude,
    phone: firstValue(tags.phone || tags["contact:phone"] || tags["contact:mobile"]),
    email: firstValue(tags.email || tags["contact:email"]),
    instagram: normalizeInstagram(firstValue(tags["contact:instagram"] || tags.instagram)),
    website: cleanWebsite(tags.website || tags["contact:website"] || tags.url),
    description,
    google_maps_link: mapsLinkFor(latitude, longitude),
  };
  return { label: city ? `${name} · ${city}` : name, suggestion };
}
