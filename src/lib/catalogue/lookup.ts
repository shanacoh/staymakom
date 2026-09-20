import { isHttpUrl } from "./embed";
import { normalizeText } from "./filters";
import type { CatalogueEntry, LinkPlatform, PlaceType } from "./types";

/** Ce que la recherche a retrouvé sur un lieu. Chaque champ peut être vide. */
export interface LookupSuggestion {
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

export interface LookupLink {
  platform: LinkPlatform;
  url: string;
  caption: string | null;
  author: string | null;
  thumbnail_url: string | null;
}

export interface LookupCandidate {
  label: string;
  suggestion: LookupSuggestion;
}

export interface LookupResponse {
  kind: "site" | "social" | "name";
  suggestion: LookupSuggestion;
  link: LookupLink | null;
  candidates: LookupCandidate[];
  warnings: string[];
  sources: string[];
}

/** Résultat prêt à remplir la fiche : la recherche, éventuellement complétée après le choix d'un lieu. */
export interface AppliedLookup {
  suggestion: LookupSuggestion;
  link: LookupLink | null;
  sources: string[];
}

export const EMPTY_LOOKUP_SUGGESTION: LookupSuggestion = {
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

const BARE_DOMAIN = /^(www\.)?[\p{L}\d-]+(\.[\p{L}\d-]+)+(\/\S*)?$/u;

/**
 * Ce qui est saisi est-il un lien ? Renvoie l'adresse complète (avec https:// ajouté si besoin),
 * ou null quand c'est un nom de lieu. "www.tishbi.com" est un lien, "Vignoble Tishbi" un nom.
 */
export function toUrl(query: string): string | null {
  const text = query.trim();
  if (!text || /\s/.test(text)) return null;
  if (/^https?:\/\//i.test(text)) return isHttpUrl(text) ? text : null;
  return BARE_DOMAIN.test(text) ? `https://${text}` : null;
}

/** Complète `base` avec `extra` : une valeur déjà présente dans `base` n'est jamais écrasée. */
export function mergeSuggestion(base: LookupSuggestion, extra: LookupSuggestion): LookupSuggestion {
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(extra)) {
    if (merged[key] === null || merged[key] === undefined || merged[key] === "") merged[key] = value;
  }
  return merged as unknown as LookupSuggestion;
}

/** Les infos trouvées, prêtes à être listées à l'écran ("Adresse", "Téléphone"...). */
export function describeFacts(s: LookupSuggestion): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];
  if (s.address) facts.push({ label: "Adresse", value: s.address });
  if (s.phone) facts.push({ label: "Téléphone", value: s.phone });
  if (s.email) facts.push({ label: "Email", value: s.email });
  if (s.instagram) facts.push({ label: "Instagram", value: s.instagram });
  if (s.website) facts.push({ label: "Site web", value: s.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") });
  if (s.latitude !== null && s.longitude !== null) facts.push({ label: "Position", value: "sur la carte" });
  return facts;
}

/**
 * Lieux déjà présents dans le catalogue qui ressemblent à ce nom (même nom, ou l'un contenu dans
 * l'autre). Sert à prévenir d'un doublon avant l'ajout, sans jamais le bloquer.
 */
export function findSimilarEntries(entries: CatalogueEntry[], name: string, limit = 3): CatalogueEntry[] {
  const needle = normalizeText(name);
  if (needle.length < 4) return [];
  return entries
    .filter((entry) => {
      const other = normalizeText(entry.display_name);
      return other.length >= 4 && (other === needle || other.includes(needle) || needle.includes(other));
    })
    .slice(0, limit);
}
