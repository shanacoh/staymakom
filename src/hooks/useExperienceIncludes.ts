import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IncludesSource = "experience2" | "standalone";

const TABLE: Record<IncludesSource, string> = {
  experience2: "experience2_includes",
  standalone: "standalone_experience_includes",
};

/** Inclus publiés d'une fiche, dans l'ordre du bloc « Au programme ». Une seule requête partagée par toute la page. */
export function useExperienceIncludes(experienceId: string | undefined, source: IncludesSource) {
  return useQuery({
    queryKey: ["experience-includes", experienceId, source],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE[source])
        .select("*")
        .eq("experience_id", experienceId)
        .eq("published", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });
}

/**
 * Ajoute à la suite des photos de la fiche celles des inclus (champ icon_url quand c'est une photo),
 * dans l'ordre des inclus et sans doublon.
 */
export function withIncludePhotos(
  photos: readonly string[],
  includes: readonly { icon_url?: string | null }[] | null | undefined
): string[] {
  const seen = new Set(photos);
  const extra: string[] = [];
  for (const item of includes ?? []) {
    const url = item.icon_url;
    if (!url || !/^https?:\/\//.test(url) || seen.has(url)) continue;
    seen.add(url);
    extra.push(url);
  }
  return [...photos, ...extra];
}
