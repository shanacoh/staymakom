// Capture depuis le téléphone : un lien partagé devient un lieu "à trier" dans le catalogue.
// Logique pure (testée) ; l'accès à la base et la réponse web sont dans capture-catalogue-link/index.ts.

import { EMPTY_SUGGESTION, type Candidate, type Suggestion } from "./osm.ts";
import { platformOf, type LinkInfo, type LinkPlatform, type LookupResult } from "./lookup.ts";

const PLATFORM_LABELS: Record<LinkPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  google_maps: "Google Maps",
  site_web: "Site web",
  autre: "Lien",
};

/** Premier lien d'un texte partagé ("Regarde ça ! https://vm.tiktok.com/abc/"), sans la ponctuation collée à la fin. */
export function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return null;
  return match[0].replace(/[.,;:!?)\]}»”]+$/u, "");
}

/** Comparaison de deux textes en temps constant, pour ne rien révéler du secret par la vitesse de réponse. */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

const simplify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z֐-׿\d]/g, "");

/**
 * Un lieu de la carte n'est retenu que s'il porte le même nom que celui repéré dans la légende
 * (l'un contenu dans l'autre). Sans ça, on garderait un homonyme et une mauvaise position.
 */
export function pickConfidentCandidate(name: string | null, candidates: Candidate[]): Candidate | null {
  const wanted = simplify(name ?? "");
  if (wanted.length < 4) return null;
  return (
    candidates.find((candidate) => {
      const other = simplify(candidate.suggestion.name ?? "");
      return other.length >= 4 && (other === wanted || other.includes(wanted) || wanted.includes(other));
    }) ?? null
  );
}

/** Complète les trous de `base` avec `extra`, sans jamais écraser une valeur de `base`. */
function fillGaps(base: Suggestion, extra: Suggestion): Suggestion {
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(extra)) {
    if (merged[key] === null || merged[key] === undefined) merged[key] = value;
  }
  return merged as unknown as Suggestion;
}

export interface CaptureRecord {
  item: Record<string, unknown>;
  link: { url: string; platform: LinkPlatform; caption: string | null; author: string | null; thumbnail_url: string | null };
  /** Nom du lieu retrouvé, ou null quand il reste à identifier à la main. */
  identifiedName: string | null;
  platformLabel: string;
}

/**
 * Prépare le lieu et son lien pour le catalogue. `result` est null quand la recherche a échoué :
 * le lien est alors gardé seul, un partage n'est jamais perdu.
 */
export function buildCaptureItem(result: LookupResult | null, originalUrl: string): CaptureRecord {
  let platform: LinkPlatform = "autre";
  try {
    platform = platformOf(new URL(originalUrl).hostname);
  } catch {
    // Adresse illisible : on garde "lien"
  }
  const link: LinkInfo | null = result?.link ?? null;
  platform = link?.platform ?? platform;

  let suggestion: Suggestion = { ...EMPTY_SUGGESTION, ...(result?.suggestion ?? {}) };
  const confident = result ? pickConfidentCandidate(suggestion.name, result.candidates) : null;
  if (confident) suggestion = fillGaps(confident.suggestion, suggestion);

  const platformLabel = PLATFORM_LABELS[platform];
  return {
    item: {
      name: suggestion.name ?? `À identifier (${platformLabel})`,
      nature: "inspiration",
      place_type: suggestion.place_type ?? "autre",
      notes: suggestion.description,
      city: suggestion.city,
      region: suggestion.region,
      address: suggestion.address,
      google_maps_link: suggestion.google_maps_link,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      contact_phone: suggestion.phone,
      contact_email: suggestion.email,
      contact_instagram: suggestion.instagram,
      contact_website: suggestion.website,
      commercial_status: "a_trier",
      source: platform === "tiktok" || platform === "instagram" ? platform : "autre",
    },
    link: {
      url: link?.url ?? originalUrl,
      platform,
      caption: link?.caption ?? null,
      author: link?.author ?? null,
      thumbnail_url: link?.thumbnail_url ?? null,
    },
    identifiedName: suggestion.name,
    platformLabel,
  };
}

/** Message affiché sur l'iPhone après le partage. */
export function captureMessage(record: CaptureRecord, city: string | null): string {
  if (record.identifiedName) {
    return `Ajouté à trier : ${record.identifiedName}${city ? ` (${city})` : ""}`;
  }
  return `Ajouté à trier : ${record.platformLabel}, lieu à identifier dans le catalogue`;
}
