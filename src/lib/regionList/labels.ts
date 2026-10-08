import type { Lang, Region, RegionFields, RegionList, RegionZone } from "./types";

/** Le nom d'une région ou d'une zone dans la langue demandée. */
export function localizedName(entry: { name: string; name_fr: string; name_he: string }, lang: Lang): string {
  if (lang === "fr") return entry.name_fr || entry.name;
  if (lang === "he") return entry.name_he || entry.name;
  return entry.name;
}

/** La région reliée à une fiche, ou null si la fiche n'en a pas (ou si la région n'existe plus). */
export function linkedRegion(fields: RegionFields | null | undefined, list: RegionList): Region | null {
  if (!fields?.region_id) return null;
  return list.regions.find((r) => r.id === fields.region_id) ?? null;
}

/** L'ancien texte libre de région, dans la langue demandée. */
export function legacyRegionText(fields: RegionFields | null | undefined, lang: Lang): string | null {
  if (!fields) return null;
  const text = lang === "fr" ? fields.region_fr || fields.region : lang === "he" ? fields.region_he || fields.region : fields.region;
  return text?.trim() || null;
}

/**
 * Le nom de région à afficher pour une fiche : celui de la liste si la fiche est reliée,
 * sinon l'ancien texte libre (la fiche s'affiche alors exactement comme avant).
 */
export function regionLabel(fields: RegionFields | null | undefined, lang: Lang, list: RegionList): string | null {
  const region = linkedRegion(fields, list);
  return region ? localizedName(region, lang) : legacyRegionText(fields, lang);
}

export interface ZoneGroup {
  zone: RegionZone;
  regions: Region[];
}

/** Les régions rangées par zone, dans l'ordre d'affichage. Les zones sans région sont omises. */
export function groupByZone(list: RegionList, options: { includeInactive?: boolean } = {}): ZoneGroup[] {
  const byOrder = <T extends { display_order: number }>(a: T, b: T) => a.display_order - b.display_order;
  return [...list.zones]
    .sort(byOrder)
    .map((zone) => ({
      zone,
      regions: list.regions
        .filter((r) => r.zone_slug === zone.slug && (options.includeInactive || r.is_active))
        .sort(byOrder),
    }))
    .filter((group) => group.regions.length > 0);
}
