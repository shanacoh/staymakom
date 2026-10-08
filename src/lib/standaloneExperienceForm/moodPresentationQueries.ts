import { supabase } from "@/integrations/supabase/client";
import {
  planPresentationSync,
  rowsToPresentationMap,
  type MoodPresentationMap,
  type MoodPresentationRow,
} from "./moodPresentations";

const TABLE = "standalone_experience_mood_presentations";

export const moodPresentationsQueryKey = (experienceId: string | null | undefined) =>
  ["standalone-mood-presentations", experienceId] as const;

/** Les versions propres des moods non principaux d'une fiche. */
export async function fetchMoodPresentations(experienceId: string): Promise<MoodPresentationMap> {
  const { data, error } = await (supabase as any).from(TABLE).select("*").eq("experience_id", experienceId);
  if (error) throw error;
  return rowsToPresentationMap(data as MoodPresentationRow[]);
}

type SyncInput = Parameters<typeof planPresentationSync>[0];

/**
 * L'enregistrement se fait en deux temps, autour de l'enregistrement de la fiche, pour qu'un
 * incident en cours de route ne fasse jamais perdre un texte :
 * 1. AVANT la fiche : on écrit les versions nouvelles ou modifiées (dont l'ancien contenu principal
 *    lors d'un échange de mood principal) ;
 * 2. APRÈS la fiche : on retire les versions devenues inutiles.
 * Si l'étape 2 échoue, il reste un doublon sans effet, corrigé au prochain enregistrement.
 */
export async function writeChangedPresentations(input: SyncInput): Promise<void> {
  const { upserts } = planPresentationSync(input);
  if (upserts.length === 0) return;
  const { error } = await (supabase as any).from(TABLE).upsert(upserts, { onConflict: "experience_id,category_id" });
  if (error) throw error;
}

export async function removeObsoletePresentations(input: SyncInput): Promise<void> {
  const { deletes } = planPresentationSync(input);
  if (deletes.length === 0) return;
  const { error } = await (supabase as any)
    .from(TABLE)
    .delete()
    .eq("experience_id", input.experienceId)
    .in("category_id", deletes);
  if (error) throw error;
}

export function hasPresentationChanges(input: SyncInput): boolean {
  const { upserts, deletes } = planPresentationSync(input);
  return upserts.length > 0 || deletes.length > 0;
}
