import { distanceKm, macroRegionOf, NEAR_ME_RADIUS_KM, placePosition, type MacroRegion, type Place, type Position } from "@/lib/regions";
import { linkedRegion } from "./labels";
import type { RegionList } from "./types";

/** Un lieu filtrable : sa région reliée si elle existe, et de quoi le situer sinon. */
export interface RegionPlace extends Place {
  region_id?: string | null;
}

/** Le choix du client : toute Israël (null), « Autour de moi », une zone ou une région (par slug). */
export type RegionChoice = `zone:${string}` | `region:${string}` | "near" | null;

export const zoneChoice = (slug: string): RegionChoice => `zone:${slug}`;
export const regionChoice = (slug: string): RegionChoice => `region:${slug}`;

const ZONE_OF_MACRO: Record<Exclude<MacroRegion, "car">, string> = {
  tlv: "coast-center",
  jlm: "jerusalem",
  gal: "north",
  neg: "south",
  eil: "south",
};

// Le sud du Carmel (Zichron, Binyamina, Césarée, Habonim) est rangé en « Côte & Centre », Haïfa au Nord.
const SOUTH_CARMEL_MAX_LAT = 32.68;
const SOUTH_CARMEL_WORDS = /zichron|zikhron|binyamina|caesarea|habonim|bat shlomo/;

/**
 * La zone d'une fiche qui n'a pas encore de région reliée, estimée d'après sa position sur la carte
 * ou, à défaut, d'après son ancien texte. Évite qu'une fiche disparaisse du filtre en attendant.
 */
function fallbackZoneOf(place: RegionPlace): string | null {
  const macro = macroRegionOf(place);
  if (!macro) return null;
  if (macro !== "car") return ZONE_OF_MACRO[macro];
  const position = placePosition(place);
  const isSouthCarmel = position
    ? position.lat < SOUTH_CARMEL_MAX_LAT
    : SOUTH_CARMEL_WORDS.test(`${place.city ?? ""} ${place.region ?? ""}`.toLowerCase());
  return isSouthCarmel ? "coast-center" : "north";
}

/** Le slug de la région reliée à un lieu, ou null. */
export function regionSlugOf(place: RegionPlace | null | undefined, list: RegionList): string | null {
  return linkedRegion(place, list)?.slug ?? null;
}

/** Le slug de la zone d'un lieu : celle de sa région reliée, sinon une estimation. */
export function zoneSlugOf(place: RegionPlace | null | undefined, list: RegionList): string | null {
  if (!place) return null;
  return linkedRegion(place, list)?.zone_slug ?? fallbackZoneOf(place);
}

export interface PlacedItem<T> {
  item: T;
  /** Renseignée uniquement avec « Autour de moi ». */
  distanceKm?: number;
}

/**
 * Applique le choix de région à une liste. Avec « Autour de moi », ne garde que les lieux qui ont une
 * position, à moins de NEAR_ME_RADIUS_KM, du plus proche au plus lointain.
 */
export function filterByRegion<T>(
  items: readonly T[],
  getPlace: (item: T) => RegionPlace | null | undefined,
  choice: RegionChoice,
  userPosition: Position | null,
  list: RegionList
): PlacedItem<T>[] {
  if (choice === null) return items.map((item) => ({ item }));
  if (choice === "near") {
    if (!userPosition) return [];
    return items
      .flatMap((item) => {
        const position = placePosition(getPlace(item));
        if (!position) return [];
        const km = distanceKm(userPosition, position);
        return km <= NEAR_ME_RADIUS_KM ? [{ item, distanceKm: km }] : [];
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
  const [kind, slug] = choice.split(":");
  const slugOf = kind === "zone" ? zoneSlugOf : regionSlugOf;
  return items.filter((item) => slugOf(getPlace(item), list) === slug).map((item) => ({ item }));
}

export interface RegionCounts {
  zones: Record<string, number>;
  regions: Record<string, number>;
}

/** Nombre de lieux par zone et par région (celles qui n'ont rien ne sont pas dans le résultat). */
export function countByRegion<T>(
  items: readonly T[],
  getPlace: (item: T) => RegionPlace | null | undefined,
  list: RegionList
): RegionCounts {
  const counts: RegionCounts = { zones: {}, regions: {} };
  for (const item of items) {
    const place = getPlace(item);
    const zone = zoneSlugOf(place, list);
    const region = regionSlugOf(place, list);
    if (zone) counts.zones[zone] = (counts.zones[zone] ?? 0) + 1;
    if (region) counts.regions[region] = (counts.regions[region] ?? 0) + 1;
  }
  return counts;
}
