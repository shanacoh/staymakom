// Liens courts (TikTok, Google Maps) : suivre les redirections en sécurité pour découvrir la vraie
// adresse, puis en tirer le nom et la position. Fonctions sans dépendance à l'environnement.

import { parsePublicHttpUrl } from "./safe-url.ts";

const MAX_HOPS = 5;
const HOP_TIMEOUT_MS = 8000;
const BROWSER_UA = "Mozilla/5.0 (compatible; StaymakomBot/1.0; +https://staymakom.com)";

const SHORT_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com", "maps.app.goo.gl", "goo.gl", "g.co"]);

/** Lien raccourci dont la vraie adresse ne se découvre qu'en suivant la redirection. */
export function isShortLink(url: URL): boolean {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (SHORT_HOSTS.has(host)) return true;
  if (host === "tiktok.com" && /^\/t\//.test(url.pathname)) return true;
  if (host === "instagram.com" && /^\/share\//.test(url.pathname)) return true;
  return false;
}

/** En Europe, Google passe par une page de consentement qui garde l'adresse voulue dans "continue". */
export function unwrapConsentUrl(url: URL): URL {
  if (/^consent\.(google|youtube)\.com$/i.test(url.hostname)) {
    const target = url.searchParams.get("continue");
    const parsed = target ? parsePublicHttpUrl(target) : null;
    if (parsed) return parsed;
  }
  return url;
}

/**
 * Suit les redirections d'un lien court sans télécharger les pages : on ne lit que l'en-tête
 * "location". Chaque étape est vérifiée (`check` refuse les adresses internes). Renvoie la dernière
 * adresse atteinte ; si une étape est refusée ou échoue, on garde la dernière bonne.
 */
export async function followRedirects(
  start: URL,
  fetchFn: typeof fetch,
  check: (url: URL) => Promise<void>
): Promise<URL> {
  let current = start;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    current = unwrapConsentUrl(current);
    try {
      await check(current);
      const response = await fetchFn(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(HOP_TIMEOUT_MS),
        headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
      });
      await response.body?.cancel().catch(() => undefined);
      const location = response.headers.get("location");
      if (response.status < 300 || response.status >= 400 || !location) return current;
      const next = parsePublicHttpUrl(new URL(location, current).toString());
      if (!next) return current;
      current = next;
    } catch {
      return current;
    }
  }
  return unwrapConsentUrl(current);
}

// ---------------------------------------------------------------------------
// Google Maps
// ---------------------------------------------------------------------------

export interface MapsPlace {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
}

const validCoords = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const COORDS_ONLY = /^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/;

const decodeName = (raw: string): string | null => {
  try {
    const text = decodeURIComponent(raw.replace(/\+/g, " ")).trim();
    return text && !COORDS_ONLY.test(text) ? text.slice(0, 120) : null;
  } catch {
    return null;
  }
};

/**
 * Nom et position d'un lien Google Maps complet. La position exacte du lieu (!3d...!4d...) passe
 * avant le centre de la carte (@...), qui n'est que ce qui était affiché à l'écran.
 */
export function parseGoogleMapsUrl(input: string): MapsPlace {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { name: null, latitude: null, longitude: null };
  }
  const full = decodeURIComponent(url.pathname + url.search + url.hash).replace(/\+/g, " ");
  const raw = url.pathname + url.search + url.hash;

  let name = decodeName(raw.match(/\/maps\/place\/([^/@?]+)/)?.[1] ?? "");
  if (!name) {
    const q = url.searchParams.get("q") ?? url.searchParams.get("query");
    if (q && !COORDS_ONLY.test(q)) name = q.trim().slice(0, 120) || null;
  }

  let coords: [number, number] | null = null;
  const pin = full.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  const center = full.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (pin) coords = [parseFloat(pin[1]), parseFloat(pin[2])];
  else if (center) coords = [parseFloat(center[1]), parseFloat(center[2])];
  else {
    for (const key of ["q", "query", "ll", "destination"]) {
      const m = (url.searchParams.get(key) ?? "").match(COORDS_ONLY);
      if (m) {
        coords = [parseFloat(m[1]), parseFloat(m[2])];
        break;
      }
    }
  }

  return coords && validCoords(coords[0], coords[1])
    ? { name, latitude: coords[0], longitude: coords[1] }
    : { name, latitude: null, longitude: null };
}

/** Distance à vol d'oiseau en mètres entre deux positions. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}
