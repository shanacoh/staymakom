import { isInIsrael, positionOf } from "@/lib/catalogue/geo";

/**
 * Les 6 grandes régions proposées aux clients dans le formulaire de voyage sur mesure.
 *
 * Elles servent aussi de filet de sécurité au filtre de la home (voir regionList/filter.ts) : une fiche
 * qui n'a pas encore de région reliée à la liste de référence est située ici, d'abord d'après sa
 * position sur la carte (fiable), sinon d'après les mots de son ancien texte de région et de sa ville.
 */
export type MacroRegion = "tlv" | "jlm" | "gal" | "car" | "neg" | "eil";

export type Lang = "en" | "fr" | "he";

export const MACRO_REGIONS: ReadonlyArray<{ code: MacroRegion; label: Record<Lang, string> }> = [
  { code: "tlv", label: { fr: "Tel Aviv et la côte", en: "Tel Aviv & the coast", he: "תל אביב והחוף" } },
  { code: "jlm", label: { fr: "Jérusalem", en: "Jerusalem", he: "ירושלים" } },
  { code: "gal", label: { fr: "Galilée et Golan", en: "Galilee & Golan", he: "הגליל והגולן" } },
  { code: "car", label: { fr: "Carmel et Haïfa", en: "Carmel & Haifa", he: "הכרמל וחיפה" } },
  { code: "neg", label: { fr: "Néguev et mer Morte", en: "Negev & Dead Sea", he: "הנגב וים המלח" } },
  { code: "eil", label: { fr: "Eilat et Arava", en: "Eilat & Arava", he: "אילת והערבה" } },
];

/** Rayon de « Autour de moi ». */
export const NEAR_ME_RADIUS_KM = 80;

export interface Place {
  region?: string | null;
  city?: string | null;
  latitude?: unknown;
  longitude?: unknown;
}

export interface Position {
  lat: number;
  lng: number;
}

/** La position d'un lieu si elle existe et se trouve bien en Israël, sinon null. */
export function placePosition(place: Place | null | undefined): Position | null {
  if (!place) return null;
  const position = positionOf(place.latitude, place.longitude);
  return position && isInIsrael(position.lat, position.lng) ? position : null;
}

/** Range une position dans une grande région. Les limites sont volontairement simples (lignes droites). */
function regionFromPosition({ lat, lng }: Position): MacroRegion {
  // Sud : Eilat et la vallée de l'Arava (le long de la frontière est, sous la mer Morte).
  if (lat < 30.0 || (lat < 30.9 && lng > 35.0)) return "eil";
  // Néguev, et rives de la mer Morte qui remontent plus au nord à l'est.
  if (lat < 31.35 || (lat < 31.8 && lng > 35.33)) return "neg";
  // Centre : Jérusalem et ses collines, sinon la plaine côtière.
  if (lat < 32.45) return lat >= 31.6 && lat < 31.95 && lng >= 34.95 ? "jlm" : "tlv";
  // Nord : la bande du Carmel côté mer, sinon Galilée, Kinneret et Golan.
  return lat < 32.95 && lng < 35.12 ? "car" : "gal";
}

// L'ordre compte : "Mount Carmel area, Northern Israel" doit donner Carmel, pas Galilée.
const KEYWORDS: ReadonlyArray<[MacroRegion, RegExp]> = [
  ["eil", /eilat|arava/],
  ["neg", /negev|dead sea|mitzpe|ramon|dimona|arad|beer.?sheva|darom|south/],
  ["jlm", /jerusalem/],
  ["car", /carmel|haifa|binyamina|zichron|caesarea|habonim|beit oren|bat shlomo/],
  ["gal", /galil|golan|tiberias|kinneret|tsafon|safed|tzfat|tsfat|nazareth|north/],
  ["tlv", /tel.?aviv|jaffa|yafo|herzliya|sharon|netanya|bat yam|ramat gan|rishon|cent(er|re|ral)/],
];

function regionFromText(text: string): MacroRegion | null {
  const lower = text.toLowerCase();
  return KEYWORDS.find(([, pattern]) => pattern.test(lower))?.[0] ?? null;
}

/** La grande région d'un lieu, ou null si rien ne permet de le situer. */
export function macroRegionOf(place: Place | null | undefined): MacroRegion | null {
  if (!place) return null;
  const position = placePosition(place);
  if (position) return regionFromPosition(position);
  // La ville est plus précise que la région saisie ("Sea outing" + "Herzliya").
  return regionFromText(place.city ?? "") ?? regionFromText(place.region ?? "");
}

/** Distance à vol d'oiseau entre deux positions, en kilomètres. */
export function distanceKm(a: Position, b: Position): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
