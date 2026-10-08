import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { regionLabel } from "./labels";
import { EMPTY_REGION_LIST, type Lang, type RegionFields, type RegionList } from "./types";

export const REGION_LIST_QUERY_KEY = ["region-list"] as const;

// Dernière liste chargée, pour le suivi d'audience qui s'exécute en dehors des composants.
let lastLoadedList: RegionList = EMPTY_REGION_LIST;

export async function fetchRegionList(): Promise<RegionList> {
  const [zones, regions] = await Promise.all([
    supabase.from("region_zones").select("slug, name, name_fr, name_he, display_order").order("display_order"),
    supabase
      .from("regions")
      .select("id, slug, name, name_fr, name_he, zone_slug, display_order, is_active")
      .order("display_order"),
  ]);
  if (zones.error) throw zones.error;
  if (regions.error) throw regions.error;
  lastLoadedList = { zones: zones.data ?? [], regions: regions.data ?? [] };
  return lastLoadedList;
}

/**
 * Le nom de région envoyé au suivi d'audience : toujours en anglais, pour ne pas mélanger les langues
 * dans les statistiques. Nom de la liste si la fiche est reliée, ancien texte sinon.
 */
export function trackedRegionName(fields: RegionFields | null | undefined): string | null {
  return regionLabel(fields, "en", lastLoadedList);
}

/**
 * La liste des régions, chargée une fois puis gardée en mémoire (elle change très rarement).
 * Tant qu'elle n'est pas chargée, ou si elle est indisponible, la liste est vide : les fiches
 * retombent alors d'elles-mêmes sur leur ancien texte.
 */
export function useRegionList(): RegionList {
  const { data } = useQuery({
    queryKey: REGION_LIST_QUERY_KEY,
    queryFn: fetchRegionList,
    staleTime: 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    retry: 1,
  });
  return data ?? EMPTY_REGION_LIST;
}

/** Donne la fonction « nom de région à afficher pour cette fiche », dans la langue du site. */
export function useRegionLabel(lang: Lang): (fields: RegionFields | null | undefined) => string | null {
  const list = useRegionList();
  return useCallback((fields) => regionLabel(fields, lang, list), [lang, list]);
}
