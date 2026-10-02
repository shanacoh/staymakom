import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CatalogueItemTeaser = Database["public"]["Tables"]["catalogue_item_teasers"]["Row"];
export type CatalogueItemTeaserUpdate = Database["public"]["Tables"]["catalogue_item_teasers"]["Update"];

const teaserKey = (catalogueItemId: string) => ["catalogue", "teaser", catalogueItemId] as const;

export function useCatalogueItemTeaser(catalogueItemId: string) {
  return useQuery({
    queryKey: teaserKey(catalogueItemId),
    queryFn: async (): Promise<CatalogueItemTeaser | null> => {
      const { data, error } = await supabase
        .from("catalogue_item_teasers")
        .select("*")
        .eq("catalogue_item_id", catalogueItemId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertCatalogueItemTeaser(catalogueItemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Omit<CatalogueItemTeaserUpdate, "catalogue_item_id">): Promise<CatalogueItemTeaser> => {
      const { data, error } = await supabase
        .from("catalogue_item_teasers")
        .upsert({ ...patch, catalogue_item_id: catalogueItemId }, { onConflict: "catalogue_item_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teaserKey(catalogueItemId) }),
  });
}
