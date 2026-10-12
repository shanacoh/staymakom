import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MOOD_VERSION_COLUMNS,
  inMood,
  isMoodOf,
  isSecondaryMoodOf,
  moodLinkSuffix,
  versionsByExperience,
  type MoodAwareExperience,
  type MoodVersion,
} from "./moodDisplay";

const TABLE = "standalone_experience_mood_presentations";

/** Toutes les versions écrites pour un mood (la base ne rend que celles des expériences publiées). */
async function fetchMoodVersions(categoryId: string): Promise<Record<string, MoodVersion>> {
  const { data, error } = await supabase.from(TABLE).select(MOOD_VERSION_COLUMNS).eq("category_id", categoryId);
  if (error) throw error;
  return versionsByExperience(data as MoodVersion[]);
}

/**
 * Une liste d'expériences affichée DANS un mood : chaque carte prend la version de ce mood (photo,
 * titre, accroche), et son lien porte le mood. Sans mood, ou tant que les versions ne sont pas
 * chargées, la liste est rendue telle quelle : les cartes gardent leur présentation principale.
 */
export function useMoodCards<T extends MoodAwareExperience>(
  experiences: readonly T[] | null | undefined,
  mood: { id?: string | null; slug?: string | null } | null | undefined,
): { cards: T[]; linkSuffix: string | undefined } {
  const categoryId = mood?.id ?? null;
  const { data: versions } = useQuery({
    queryKey: ["mood-versions", categoryId],
    queryFn: () => fetchMoodVersions(categoryId!),
    enabled: !!categoryId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const cards = useMemo(() => {
    const list = [...(experiences ?? [])];
    if (!versions) return list;
    return list.map((experience) => inMood(experience, versions[experience.id]));
  }, [experiences, versions]);

  return { cards, linkSuffix: categoryId ? moodLinkSuffix(mood?.slug) : undefined };
}

export interface ArrivalMood {
  /** Le mood d'arrivée, s'il est publié et s'il est bien un mood de cette expérience. Sinon null. */
  slug: string | null;
  /** Sa version propre, s'il en a une. */
  version: MoodVersion | null;
}

const NO_MOOD: ArrivalMood = { slug: null, version: null };

async function fetchArrivalMood(experience: MoodAwareExperience, moodSlug: string): Promise<ArrivalMood> {
  // Un mood en brouillon n'est pas lu : la fiche garde sa présentation principale.
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("slug", moodSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!category || !isMoodOf(experience, category.id)) return NO_MOOD;
  if (!isSecondaryMoodOf(experience, category.id)) return { slug: category.slug, version: null };

  const { data: version, error: versionError } = await supabase
    .from(TABLE)
    .select(MOOD_VERSION_COLUMNS)
    .eq("experience_id", experience.id)
    .eq("category_id", category.id)
    .maybeSingle();
  if (versionError) throw versionError;
  return { slug: category.slug, version: (version as MoodVersion | null) ?? null };
}

/**
 * Le mood par lequel le client est arrivé sur la fiche (`?mood=...`). `isReady` passe à vrai dès
 * qu'on sait quoi afficher : tout de suite sans paramètre, sinon une fois le mood vérifié. En cas
 * de panne de lecture, la fiche s'affiche avec sa présentation principale.
 */
export function useArrivalMood(
  experience: MoodAwareExperience | null | undefined,
  moodSlug: string | null,
): ArrivalMood & { isReady: boolean } {
  const { data, isFetched } = useQuery({
    queryKey: ["standalone-arrival-mood", experience?.id, moodSlug],
    queryFn: () => fetchArrivalMood(experience!, moodSlug!),
    enabled: !!experience && !!moodSlug,
    staleTime: 60_000,
    retry: 1,
  });
  if (!moodSlug) return { ...NO_MOOD, isReady: true };
  return { ...(data ?? NO_MOOD), isReady: !!experience && isFetched };
}
