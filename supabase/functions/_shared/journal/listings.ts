// Choix des fiches publiées à donner au rédacteur pour un sujet : celles qui correspondent
// aux régions / moods / villes du sujet, 8 au maximum. Sujet « toutes régions » : un
// échantillon varié (une fiche par région d'abord).
import type { BlogTopic, ListingContext } from "./types.ts";

export const MAX_LISTINGS = 8;

export interface CandidateListing extends ListingContext {
  region_slug: string | null;
  mood_slugs: string[];
}

// Villes d'hôtels sans région renseignée → région (fiches avec hôtel anciennes).
const CITY_REGION: Record<string, string> = {
  tsfat: "tsfat-meron",
  safed: "tsfat-meron",
  "en gev": "kinneret",
  "ein gev": "kinneret",
  tiberias: "kinneret",
  "ein bokek": "dead-sea",
  "ein gedi": "dead-sea",
  "neve zohar": "dead-sea",
  "sde boker": "central-negev",
  "mitspe ramon": "central-negev",
  "mitzpe ramon": "central-negev",
  eilat: "eilat",
  jerusalem: "jerusalem",
  "tel aviv": "tel-aviv",
  "tel-aviv": "tel-aviv",
  jaffa: "tel-aviv",
  "zichron yaakov": "zichron",
};

export function regionOfCity(city: string | null): string | null {
  if (!city) return null;
  return CITY_REGION[city.trim().toLowerCase()] || null;
}

const norm = (s: string | null | undefined) => (s || "").trim().toLowerCase();

function score(l: CandidateListing, topic: BlogTopic): number {
  let s = 0;
  const region = l.region_slug || regionOfCity(l.city);
  if (region && topic.link_regions.includes(region)) s += 2;
  if (l.mood_slugs.some((m) => topic.link_moods.includes(m))) s += 2;
  if (topic.link_cities.some((c) => norm(c) === norm(l.city) || (norm(l.city) && norm(l.city).includes(norm(c))))) s += 2;
  return s;
}

export function selectListings(all: CandidateListing[], topic: BlogTopic, max = MAX_LISTINGS): CandidateListing[] {
  const hasFilters = topic.link_regions.length + topic.link_moods.length + topic.link_cities.length > 0;
  if (!hasFilters) {
    // Toutes régions : une fiche par région d'abord, puis le reste.
    const seen = new Set<string>();
    const first: CandidateListing[] = [];
    const rest: CandidateListing[] = [];
    for (const l of all) {
      const region = l.region_slug || regionOfCity(l.city) || l.id;
      (seen.has(region) ? rest : first).push(l);
      seen.add(region);
    }
    return [...first, ...rest].slice(0, max);
  }
  // Région ET mood à la fois comptent double ; un sujet région + mood garde d'abord les fiches
  // qui cochent les deux, puis celles qui n'en cochent qu'un.
  const matched = all
    .map((l) => ({ l, s: score(l, topic) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((x) => x.l);
  // Trop peu de fiches pour le bloc « À réserver » (2 minimum) : on complète avec d'autres.
  if (matched.length >= 3) return matched;
  const others = all.filter((l) => !matched.includes(l)).slice(0, 4 - matched.length);
  return [...matched, ...others];
}
