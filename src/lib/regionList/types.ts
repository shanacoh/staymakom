import type { Lang } from "@/lib/regions";

export type { Lang };

/** Une des 4 grandes zones (Nord, Côte & Centre, Jérusalem, Sud). */
export interface RegionZone {
  slug: string;
  name: string;
  name_fr: string;
  name_he: string;
  display_order: number;
}

/** Une région de la liste de référence. `name` est le nom anglais. */
export interface Region {
  id: string;
  slug: string;
  name: string;
  name_fr: string;
  name_he: string;
  zone_slug: string;
  display_order: number;
  is_active: boolean;
}

export interface RegionList {
  zones: RegionZone[];
  regions: Region[];
}

export const EMPTY_REGION_LIST: RegionList = { zones: [], regions: [] };

/** Ce qu'une fiche sait de sa région : le lien vers la liste, et les anciens textes libres. */
export interface RegionFields {
  region_id?: string | null;
  region?: string | null;
  region_fr?: string | null;
  region_he?: string | null;
}
