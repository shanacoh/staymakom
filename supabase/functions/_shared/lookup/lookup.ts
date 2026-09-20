// Cœur de la recherche : à partir d'un lien (site, TikTok, Instagram...) ou d'un nom, retrouve les
// informations d'un lieu. Tout ce qui dépend de l'environnement (réseau, IA, DNS) est injecté :
// la fonction se teste donc sans rien appeler pour de vrai.

import { buildAiMessages, parseAiSuggestion, type AiMessage } from "./ai.ts";
import { isOutsideIsrael } from "./geo.ts";
import { EMPTY_SUGGESTION, extractAddress, mapOsmResult, mapsLinkFor, matchKnownRegion, type Candidate, type OsmResult, type Suggestion } from "./osm.ts";
import {
  extractHrefs,
  extractLang,
  extractMetaTags,
  extractTitle,
  findEmail,
  findInstagram,
  findPhone,
  htmlToText,
  pickPlaceFromJsonLd,
} from "./parse.ts";
import { distanceMeters, followRedirects, isShortLink, parseGoogleMapsUrl } from "./resolve.ts";
import { isPrivateIp, parsePublicHttpUrl } from "./safe-url.ts";

export type LinkPlatform = "tiktok" | "instagram" | "youtube" | "facebook" | "google_maps" | "site_web" | "autre";

export interface LinkInfo {
  platform: LinkPlatform;
  url: string;
  caption: string | null;
  author: string | null;
  thumbnail_url: string | null;
}

export interface LookupResult {
  kind: "site" | "social" | "name";
  suggestion: Suggestion;
  link: LinkInfo | null;
  candidates: Candidate[];
  warnings: string[];
  sources: string[];
}

export class LookupError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface LookupDeps {
  fetchFn: typeof fetch;
  /** Adresses IP d'un nom de domaine ; null si la vérification n'est pas possible ici. */
  resolveHost?: (hostname: string) => Promise<string[] | null>;
  /** Réponse brute de l'IA, ou null si elle est indisponible. */
  askAi?: (messages: AiMessage[]) => Promise<string | null>;
  sleep?: (ms: number) => Promise<void>;
}

const MAX_PAGE_BYTES = 1_500_000;
const PAGE_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 4;
const OSM_MIN_INTERVAL_MS = 1100; // Nominatim demande au plus une requête par seconde
const BROWSER_UA = "Mozilla/5.0 (compatible; StaymakomBot/1.0; +https://staymakom.com)";
const OSM_UA = "Staymakom/1.0 (contact@staymakom.com)";

let lastOsmCall = 0;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Reconnaissance de ce qui a été saisi
// ---------------------------------------------------------------------------

export function looksLikeUrl(query: string): boolean {
  if (/\s/.test(query)) return false;
  return /^https?:\/\//i.test(query) || /^(www\.)?[\p{L}\d-]+(\.[\p{L}\d-]+)+(\/\S*)?$/u.test(query);
}

export function platformOf(host: string): LinkPlatform {
  const h = host.toLowerCase().replace(/^www\./, "");
  if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return "tiktok";
  if (h === "instagram.com" || h.endsWith(".instagram.com")) return "instagram";
  if (h === "youtu.be" || h === "youtube.com" || h.endsWith(".youtube.com")) return "youtube";
  if (h === "facebook.com" || h.endsWith(".facebook.com") || h === "fb.watch") return "facebook";
  if (h === "maps.app.goo.gl" || h === "goo.gl" || h.startsWith("maps.google.") || (h === "google.com")) return "google_maps";
  return "site_web";
}

/** "Vignoble Éden & Fils | Zichron" devient "Vignoble Éden & Fils". */
export function cleanTitle(title: string | null): string | null {
  const first = title?.split(/\s+[|–—·-]\s+|\s*\|\s*/)[0]?.trim();
  return first ? first.slice(0, 120) : null;
}

/** Instagram met la légende entre guillemets après "N likes, N comments - compte on date:". */
export function cleanInstagramCaption(description: string | null): string | null {
  if (!description) return null;
  const quoted = description.match(/:\s*["“]([\s\S]*)["”]\.?\s*$/);
  return (quoted ? quoted[1] : description).trim() || null;
}

// ---------------------------------------------------------------------------
// Lecture d'une page web, en sécurité
// ---------------------------------------------------------------------------

interface FetchedPage {
  finalUrl: string;
  html: string;
}

async function assertNotInternal(url: URL, deps: LookupDeps): Promise<void> {
  if (!deps.resolveHost) return;
  const ips = await deps.resolveHost(url.hostname);
  if (ips && ips.some(isPrivateIp)) {
    throw new LookupError("Cette adresse pointe vers un réseau interne : elle ne peut pas être lue.");
  }
}

function decodeBody(bytes: Uint8Array, contentType: string): string {
  const header = contentType.match(/charset=["']?([\w-]+)/i)?.[1];
  const head = new TextDecoder("latin1").decode(bytes.slice(0, 2048));
  const declared = header ?? head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(declared, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => undefined);
  const bytes = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const room = bytes.length - offset;
    if (room <= 0) break;
    bytes.set(chunk.length > room ? chunk.slice(0, room) : chunk, offset);
    offset += Math.min(chunk.length, room);
  }
  return bytes;
}

/**
 * Lit une page en suivant les redirections à la main : chaque étape est revérifiée (une redirection
 * ne doit pas nous emmener vers une adresse interne). Taille et durée sont limitées.
 */
export async function fetchPage(startUrl: URL, deps: LookupDeps): Promise<FetchedPage> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertNotInternal(current, deps);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await deps.fetchFn(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "fr,en;q=0.8,he;q=0.6",
        },
      });
    } catch {
      clearTimeout(timer);
      throw new LookupError("Le site ne répond pas (ou met trop de temps à répondre).", 502);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      clearTimeout(timer);
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => undefined);
      if (!location) throw new LookupError("Le site redirige vers une adresse invalide.", 502);
      const next = parsePublicHttpUrl(new URL(location, current).toString());
      if (!next) throw new LookupError("Le site redirige vers une adresse qui ne peut pas être lue.", 502);
      current = next;
      continue;
    }

    try {
      if (!response.ok) throw new LookupError(`Le site a refusé la lecture (erreur ${response.status}).`, 502);
      const contentType = response.headers.get("content-type") ?? "";
      if (!/html|xml|text\/plain/i.test(contentType)) {
        throw new LookupError("Ce lien n'est pas une page web lisible.", 422);
      }
      const bytes = await readLimited(response, MAX_PAGE_BYTES);
      return { finalUrl: current.toString(), html: decodeBody(bytes, contentType) };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new LookupError("Le site redirige trop de fois.", 502);
}

// ---------------------------------------------------------------------------
// OpenStreetMap
// ---------------------------------------------------------------------------

/** Respecte la règle d'OpenStreetMap : pas plus d'une requête par seconde. */
async function throttleOsm(deps: LookupDeps): Promise<void> {
  const sleep = deps.sleep ?? defaultSleep;
  const wait = OSM_MIN_INTERVAL_MS - (Date.now() - lastOsmCall);
  if (wait > 0) await sleep(wait);
  lastOsmCall = Date.now();
}

/** Adresse, ville et région d'une position. */
export async function reverseOsm(
  latitude: number,
  longitude: number,
  deps: LookupDeps,
  knownRegions: string[]
): Promise<{ address: string | null; city: string | null; region: string | null }> {
  await throttleOsm(deps);
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "fr,en",
  });
  let response: Response;
  try {
    response = await deps.fetchFn(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { "User-Agent": OSM_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
  } catch {
    throw new LookupError("Le service de recherche de lieux ne répond pas pour le moment.", 503);
  }
  if (!response.ok) throw new LookupError("Le service de recherche de lieux ne répond pas pour le moment.", 503);
  const data = (await response.json()) as OsmResult;
  return extractAddress(data.address, knownRegions);
}

export async function searchOsm(
  query: string,
  deps: LookupDeps,
  knownRegions: string[],
  options: { israelOnly: boolean; limit?: number }
): Promise<Candidate[]> {
  await throttleOsm(deps);

  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    limit: String(options.limit ?? 6),
    "accept-language": "fr,en",
  });
  if (options.israelOnly) params.set("countrycodes", "il");

  let response: Response;
  try {
    response = await deps.fetchFn(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": OSM_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
  } catch {
    throw new LookupError("Le service de recherche de lieux ne répond pas pour le moment.", 503);
  }
  if (!response.ok) throw new LookupError("Le service de recherche de lieux ne répond pas pour le moment.", 503);

  const results = (await response.json()) as OsmResult[];
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  for (const result of Array.isArray(results) ? results : []) {
    const candidate = mapOsmResult(result, knownRegions);
    if (!candidate || seen.has(candidate.label)) continue;
    seen.add(candidate.label);
    candidates.push(candidate);
    if (candidates.length >= 5) break;
  }
  return candidates;
}

const GENERIC_WORDS = new Set([
  "hotel", "hôtel", "cafe", "café", "restaurant", "winery", "wine", "spa", "resort", "bar", "boutique",
  "the", "le", "la", "les", "chez", "domaine", "yaakov", "tel", "beit", "beer",
]);

/**
 * OpenStreetMap exige que tous les mots correspondent : "Tishbi Winery Zichron Yaakov" ne trouve rien
 * alors que "Tishbi Winery" trouve le lieu. On essaie donc la saisie complète, puis des versions
 * plus courtes (mots de fin retirés, puis le premier mot s'il est assez distinctif).
 */
export function queryVariants(query: string): string[] {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const variants = [words.join(" ")];
  for (const drop of [1, 2]) {
    if (words.length - drop >= 2 || (words.length - drop === 1 && words[0].length >= 4 && !GENERIC_WORDS.has(words[0].toLowerCase()))) {
      variants.push(words.slice(0, words.length - drop).join(" "));
    }
  }
  return [...new Set(variants)];
}

interface OsmSearch {
  candidates: Candidate[];
  usedQuery: string;
}

async function searchOsmWithFallback(query: string, deps: LookupDeps, knownRegions: string[]): Promise<OsmSearch> {
  for (const variant of queryVariants(query)) {
    const found = await searchOsm(variant, deps, knownRegions, { israelOnly: true });
    if (found.length > 0) return { candidates: found, usedQuery: variant };
  }
  // Rien en Israël : dernier essai partout dans le monde avec la saisie complète
  return { candidates: await searchOsm(query, deps, knownRegions, { israelOnly: false }), usedQuery: query };
}

// ---------------------------------------------------------------------------
// Les trois parcours
// ---------------------------------------------------------------------------

const absoluteUrl = (value: string | undefined, base: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

async function askAiSafely(deps: LookupDeps, messages: AiMessage[]): Promise<Partial<Suggestion> | null> {
  if (!deps.askAi) return null;
  try {
    return parseAiSuggestion(await deps.askAi(messages));
  } catch {
    return null;
  }
}

/** Recherche par nom : plusieurs lieux possibles, c'est Shana qui choisit le bon. */
async function lookupByName(query: string, deps: LookupDeps, knownRegions: string[]): Promise<LookupResult> {
  const { candidates, usedQuery } = await searchOsmWithFallback(query, deps, knownRegions);
  const warnings: string[] = [];
  if (candidates.length === 0) {
    warnings.push("Aucun lieu trouvé avec ce nom. Essaie avec un autre nom, ou colle le lien du site du lieu.");
  } else if (usedQuery !== query.trim()) {
    warnings.push(`Rien avec « ${query.trim()} » : recherche élargie à « ${usedQuery} ». Vérifie que c'est le bon lieu.`);
  }
  return { kind: "name", suggestion: { ...EMPTY_SUGGESTION }, link: null, candidates, warnings, sources: candidates.length ? ["OpenStreetMap"] : [] };
}

/** Recherche à partir d'un site web : lecture de la page, IA pour ranger, OpenStreetMap pour la position. */
async function lookupBySite(url: URL, deps: LookupDeps, knownRegions: string[]): Promise<LookupResult> {
  const warnings: string[] = [];
  const sources = ["le site"];
  const page = await fetchPage(url, deps);

  const meta = extractMetaTags(page.html);
  const title = extractTitle(page.html);
  const hrefs = extractHrefs(page.html);
  const structured = pickPlaceFromJsonLd(page.html);
  const description = meta.description ?? meta["og:description"] ?? structured?.description ?? null;

  const suggestion: Suggestion = {
    ...EMPTY_SUGGESTION,
    name: structured?.name ?? cleanTitle(meta["og:site_name"] ?? meta["og:title"] ?? title),
    city: structured?.city ?? null,
    region: matchKnownRegion(structured?.region ?? null, knownRegions),
    address: structured?.address ?? null,
    latitude: structured?.latitude ?? null,
    longitude: structured?.longitude ?? null,
    phone: structured?.phone ?? findPhone(hrefs),
    email: structured?.email ?? findEmail(hrefs),
    instagram: findInstagram([...(structured?.sameAs ?? []), ...hrefs]),
    website: page.finalUrl,
    description: description ? description.slice(0, 300) : null,
  };

  if (!deps.askAi) {
    warnings.push("L'IA n'est pas disponible : voici ce qui a été lu directement sur le site.");
  } else {
    const ai = await askAiSafely(deps, buildAiMessages({
      kind: "site",
      url: page.finalUrl,
      lang: extractLang(page.html),
      title,
      siteName: meta["og:site_name"] ?? null,
      description,
      caption: null,
      author: null,
      text: htmlToText(page.html),
      structured,
      knownRegions,
    }));
    if (ai) {
      sources.push("l'IA");
      suggestion.name = structured?.name ?? ai.name ?? suggestion.name;
      suggestion.place_type = ai.place_type ?? null;
      suggestion.city = suggestion.city ?? ai.city ?? null;
      suggestion.region = matchKnownRegion(ai.region ?? suggestion.region, knownRegions);
      suggestion.address = suggestion.address ?? ai.address ?? null;
      suggestion.phone = suggestion.phone ?? ai.phone ?? null;
      suggestion.email = suggestion.email ?? ai.email ?? null;
      suggestion.instagram = suggestion.instagram ?? ai.instagram ?? null;
      suggestion.description = ai.description ?? suggestion.description;
    } else {
      warnings.push("L'IA n'a pas pu résumer la page : voici ce qui a été lu directement sur le site.");
    }
  }

  // Position : uniquement à partir d'une vraie adresse (chercher un simple nom risquerait de tomber sur un homonyme)
  if (suggestion.latitude === null && suggestion.address) {
    try {
      const found = await searchOsm(`${suggestion.address}${suggestion.city ? `, ${suggestion.city}` : ""}`, deps, knownRegions, { israelOnly: true, limit: 1 });
      const top = found[0]?.suggestion;
      if (top?.latitude != null && top.longitude != null) {
        suggestion.latitude = top.latitude;
        suggestion.longitude = top.longitude;
        suggestion.city = suggestion.city ?? top.city;
        suggestion.region = suggestion.region ?? top.region;
        sources.push("OpenStreetMap");
      }
    } catch {
      warnings.push("La position sur la carte n'a pas pu être retrouvée.");
    }
  }
  if (suggestion.latitude !== null && suggestion.longitude !== null) {
    suggestion.google_maps_link = mapsLinkFor(suggestion.latitude, suggestion.longitude);
  }

  return {
    kind: "site",
    suggestion,
    link: {
      platform: "site_web",
      url: url.toString(),
      caption: description ? description.slice(0, 300) : null,
      author: null,
      thumbnail_url: absoluteUrl(meta["og:image"] ?? structured?.image ?? undefined, page.finalUrl),
    },
    candidates: [],
    warnings,
    sources,
  };
}

const NEARBY_METERS = 300; // un lieu de la carte à moins de 300 m de la position du lien est considéré comme le même
const SEARCH_RADIUS_METERS = 2000;

/** Recherche à partir d'un lien Google Maps : nom et position exacts, adresse retrouvée sur la carte. */
async function lookupByMaps(original: URL, resolved: URL, deps: LookupDeps, knownRegions: string[]): Promise<LookupResult> {
  const link: LinkInfo = { platform: "google_maps", url: original.toString(), caption: null, author: null, thumbnail_url: null };
  const place = parseGoogleMapsUrl(resolved.toString());
  const suggestion: Suggestion = {
    ...EMPTY_SUGGESTION,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    google_maps_link: original.toString(),
  };

  if (!place.name && place.latitude === null) {
    return {
      kind: "site",
      suggestion,
      link,
      candidates: [],
      warnings: ["Ce lien Google Maps ne contient ni nom ni position lisible : il est gardé tel quel."],
      sources: [],
    };
  }

  const warnings: string[] = [];
  const sources = ["Google Maps"];
  let candidates: Candidate[] = [];

  if (place.latitude !== null && place.longitude !== null) {
    try {
      const where = await reverseOsm(place.latitude, place.longitude, deps, knownRegions);
      suggestion.address = where.address;
      suggestion.city = where.city;
      suggestion.region = where.region;
      if (where.address || where.city) sources.push("OpenStreetMap");
    } catch {
      warnings.push("L'adresse de ce lieu n'a pas pu être retrouvée à partir de sa position.");
    }
  }

  if (place.name) {
    try {
      const found = await searchOsm(place.name, deps, knownRegions, { israelOnly: true });
      const withDistance = found
        .map((candidate) => ({
          candidate,
          meters:
            place.latitude !== null && place.longitude !== null && candidate.suggestion.latitude !== null && candidate.suggestion.longitude !== null
              ? distanceMeters(place.latitude, place.longitude, candidate.suggestion.latitude, candidate.suggestion.longitude)
              : Infinity,
        }))
        .sort((a, b) => a.meters - b.meters);
      const best = withDistance[0];
      if (best && best.meters <= NEARBY_METERS) {
        // Le même lieu sur la carte : on complète les trous (téléphone, site, type...) sans toucher au nom ni à la position
        for (const [key, value] of Object.entries(best.candidate.suggestion)) {
          const current = suggestion[key as keyof Suggestion];
          if (current === null || current === undefined) (suggestion as Record<string, unknown>)[key] = value;
        }
        if (!sources.includes("OpenStreetMap")) sources.push("OpenStreetMap");
      } else {
        candidates = withDistance.filter((entry) => entry.meters <= SEARCH_RADIUS_METERS).map((entry) => entry.candidate);
      }
    } catch {
      // La recherche du lieu sur la carte est un bonus : le nom et la position du lien suffisent
    }
  }

  return { kind: "site", suggestion, link, candidates, warnings, sources };
}

interface SocialPost {
  caption: string | null;
  author: string | null;
  thumbnail: string | null;
}

async function readSocialPost(url: URL, platform: LinkPlatform, deps: LookupDeps): Promise<SocialPost> {
  if (platform === "tiktok") {
    // Service public officiel de TikTok : légende, auteur, vignette (pas de clé nécessaire)
    const response = await deps.fetchFn(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url.toString())}`, {
      headers: { "User-Agent": BROWSER_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
    if (!response.ok) throw new LookupError("TikTok n'a pas donné la légende de cette vidéo.", 502);
    const data = (await response.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return { caption: data.title?.trim() || null, author: data.author_name?.trim() || null, thumbnail: data.thumbnail_url || null };
  }

  const page = await fetchPage(url, deps);
  const meta = extractMetaTags(page.html);
  const rawCaption = meta["og:description"] ?? meta.description ?? null;
  const caption = platform === "instagram" ? cleanInstagramCaption(rawCaption) : rawCaption;
  const author = meta["og:title"]?.match(/^(.+?)\s+on\s+Instagram/i)?.[1] ?? meta["og:site_name"] ?? null;
  return { caption, author, thumbnail: absoluteUrl(meta["og:image"], page.finalUrl) };
}

/** Recherche à partir d'une vidéo ou d'une publication : on copie la légende, l'IA repère le lieu, OSM le retrouve. */
async function lookupBySocial(url: URL, platform: LinkPlatform, deps: LookupDeps, knownRegions: string[]): Promise<LookupResult> {
  const warnings: string[] = [];
  const sources: string[] = [];
  let post: SocialPost = { caption: null, author: null, thumbnail: null };

  try {
    post = await readSocialPost(url, platform, deps);
    sources.push("la publication");
  } catch (error) {
    warnings.push(
      error instanceof LookupError && error.status !== 502
        ? error.message
        : "Cette publication n'a pas pu être lue automatiquement : colle la légende à la main si tu veux la garder."
    );
  }

  const suggestion: Suggestion = { ...EMPTY_SUGGESTION };
  let candidates: Candidate[] = [];

  if (post.caption && deps.askAi) {
    const ai = await askAiSafely(deps, buildAiMessages({
      kind: "social",
      url: url.toString(),
      lang: null,
      title: null,
      siteName: null,
      description: null,
      caption: post.caption.slice(0, 1500),
      author: post.author,
      text: "",
      structured: null,
      knownRegions,
    }));
    if (ai) {
      sources.push("l'IA");
      suggestion.name = ai.name ?? null;
      suggestion.place_type = ai.place_type ?? null;
      suggestion.city = ai.city ?? null;
      suggestion.region = matchKnownRegion(ai.region ?? null, knownRegions);
      suggestion.address = ai.address ?? null;
      suggestion.phone = ai.phone ?? null;
      suggestion.email = ai.email ?? null;
      suggestion.instagram = ai.instagram ?? null;
      suggestion.description = ai.description ?? null;

      if (suggestion.name) {
        try {
          candidates = (await searchOsmWithFallback(`${suggestion.name}${suggestion.city ? ` ${suggestion.city}` : ""}`, deps, knownRegions)).candidates;
          if (candidates.length) sources.push("OpenStreetMap");
        } catch {
          warnings.push("Le lieu repéré dans la légende n'a pas pu être cherché sur la carte.");
        }
      }
    }
  }

  return {
    kind: "social",
    suggestion,
    link: { platform, url: url.toString(), caption: post.caption?.slice(0, 1000) ?? null, author: post.author, thumbnail_url: post.thumbnail },
    candidates,
    warnings,
    sources,
  };
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

/** Ajoute une alerte quand une position trouvée (ou un résultat proposé) n'est pas en Israël. */
export function withPositionWarnings(result: LookupResult): LookupResult {
  const warnings = [...result.warnings];
  const { latitude, longitude } = result.suggestion;
  if (isOutsideIsrael(latitude, longitude)) {
    warnings.push(`La position trouvée (${latitude}, ${longitude}) n'est pas en Israël : c'est sans doute une erreur, vérifie le lieu.`);
  }
  if (result.candidates.some((c) => isOutsideIsrael(c.suggestion.latitude, c.suggestion.longitude))) {
    warnings.push("Certains résultats sont hors d'Israël (ils sont signalés dans la liste) : ne choisis que celui qui est bien en Israël.");
  }
  return warnings.length === result.warnings.length ? result : { ...result, warnings };
}

export async function lookup(query: string, knownRegions: string[], deps: LookupDeps): Promise<LookupResult> {
  return withPositionWarnings(await lookupUnchecked(query, knownRegions, deps));
}

async function lookupUnchecked(query: string, knownRegions: string[], deps: LookupDeps): Promise<LookupResult> {
  const text = query.trim();
  if (!text) throw new LookupError("Écris un nom de lieu ou colle un lien.");
  if (text.length > 500) throw new LookupError("La recherche est trop longue.");

  if (!looksLikeUrl(text)) return lookupByName(text, deps, knownRegions);

  const url = parsePublicHttpUrl(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  if (!url) throw new LookupError("Ce lien n'est pas une adresse web valide.");

  // Un lien court (vm.tiktok.com, maps.app.goo.gl...) cache la vraie adresse : on la découvre d'abord
  const resolved = isShortLink(url) ? await followRedirects(url, deps.fetchFn, (u) => assertNotInternal(u, deps)) : url;
  const platform = platformOf(resolved.hostname);

  if (platform === "google_maps") return lookupByMaps(url, resolved, deps, knownRegions);
  if (platform === "tiktok" || platform === "instagram" || platform === "youtube" || platform === "facebook") {
    return lookupBySocial(resolved, platform, deps, knownRegions);
  }
  return lookupBySite(resolved, deps, knownRegions);
}
