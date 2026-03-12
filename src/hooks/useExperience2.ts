/**
 * Hook pour récupérer une expérience V2 par son slug
 * Utilise TanStack Query pour le cache et la synchronisation
 * Inclut maintenant les hôtels du parcours via experience2_hotels
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useExperience2(slug: string | null) {
  return useQuery({
    queryKey: ["experience2", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");

      const { data, error } = await supabase
        .from("experiences2")
        .select("*, hotels2(*), categories(*)")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw new Error(`Experience not found: ${error.message}`);
      if (!data) throw new Error("Experience not found");

      // Fetch experience hotels separately to avoid relation resolution issues
      const { data: expHotels } = await supabase
        .from("experience2_hotels" as any)
        .select("*, hotels2(*)")
        .eq("experience_id", data.id)
        .order("position");

      // Attach and sort
      (data as any).experience2_hotels = expHotels || [];

      return data;
    },
    enabled: !!slug,
  });
}
