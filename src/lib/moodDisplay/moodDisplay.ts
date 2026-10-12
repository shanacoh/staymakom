// La version d'une expérience seule affichée au client dans un mood (chantier Offre, étape 5).
//
// Le mood principal d'une fiche (`category_id`) s'affiche avec les colonnes de la fiche. Les autres
// moods cochés (`category_ids`) peuvent avoir leur propre photo de couverture, titre, accroche et
// description, rangés dans `standalone_experience_mood_presentations`. Un mood sans version propre,
// ou un mood qui n'est pas un mood de la fiche, affiche la présentation principale.
//
// Ce fichier ne contient que des règles (aucun accès à la base, aucun affichage).

import type { MoodPresentationRow, PresentationPart } from "@/lib/standaloneExperienceForm/moodPresentations";

/** Le nom du paramètre d'adresse qui porte le mood d'arrivée (`?mood=family`). */
export const MOOD_PARAM = "mood";

/** Ce que le site lit d'une version par mood. */
export type MoodVersion = Pick<
  MoodPresentationRow,
  | "experience_id"
  | "category_id"
  | "title"
  | "title_fr"
  | "title_he"
  | "subtitle"
  | "subtitle_fr"
  | "subtitle_he"
  | "long_copy"
  | "long_copy_fr"
  | "long_copy_he"
  | "cover_image"
>;

export const MOOD_VERSION_COLUMNS =
  "experience_id, category_id, title, title_fr, title_he, subtitle, subtitle_fr, subtitle_he, long_copy, long_copy_fr, long_copy_he, cover_image";

/** Ce qu'une fiche sait de ses moods et de sa présentation principale. */
export interface MoodAwareExperience {
  id: string;
  category_id?: string | null;
  category_ids?: unknown;
  hero_image?: string | null;
}

const PARTS: PresentationPart[] = ["title", "subtitle", "long_copy"];

const filled = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Vrai si ce mood est un mood secondaire de la fiche : le seul cas où une version propre s'applique. */
export function isSecondaryMoodOf(experience: MoodAwareExperience, categoryId: string | null | undefined): boolean {
  if (!categoryId || categoryId === experience.category_id) return false;
  return Array.isArray(experience.category_ids) && experience.category_ids.includes(categoryId);
}

/** Vrai si ce mood est un mood de la fiche, principal ou secondaire. */
export function isMoodOf(experience: MoodAwareExperience, categoryId: string | null | undefined): boolean {
  return !!categoryId && (categoryId === experience.category_id || isSecondaryMoodOf(experience, categoryId));
}

/**
 * La fiche telle qu'elle se présente dans un mood : mêmes colonnes, avec la photo de couverture,
 * le titre, l'accroche et la description remplacés par ceux de la version du mood.
 *
 * Pour chaque texte, dans chaque langue : la version du mood dans cette langue, sinon sa version
 * anglaise, sinon le texte principal de la fiche. Une version sans photo garde celle de la fiche.
 * Sans version applicable, la fiche est rendue telle quelle (le même objet).
 */
export function inMood<T extends MoodAwareExperience>(experience: T, version: MoodVersion | null | undefined): T {
  if (!version || version.experience_id !== experience.id || !isSecondaryMoodOf(experience, version.category_id)) {
    return experience;
  }
  const shown: Record<string, unknown> = { ...(experience as unknown as Record<string, unknown>) };
  for (const part of PARTS) {
    const english = version[part];
    for (const lang of ["fr", "he"] as const) {
      const own = version[`${part}_${lang}`];
      if (filled(own)) shown[`${part}_${lang}`] = own;
      else if (filled(english)) shown[`${part}_${lang}`] = english;
    }
    if (filled(english)) shown[part] = english;
  }
  if (filled(version.cover_image)) shown.hero_image = version.cover_image;
  return shown as T;
}

/**
 * Les photos du haut de la fiche : la photo de couverture affichée d'abord, puis toutes les autres.
 * La liste contient toujours les mêmes photos, seul l'ordre change selon le mood.
 */
export function orderedPhotos(cover: string | null | undefined, mainCover: string | null | undefined, gallery: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  return [cover, mainCover, ...(gallery ?? [])].filter((photo): photo is string => {
    if (!filled(photo) || seen.has(photo)) return false;
    seen.add(photo);
    return true;
  });
}

/** Range les versions d'un mood par identifiant d'expérience. */
export function versionsByExperience(rows: readonly MoodVersion[] | null | undefined): Record<string, MoodVersion> {
  const map: Record<string, MoodVersion> = {};
  for (const row of rows ?? []) map[row.experience_id] = row;
  return map;
}

/** Le morceau d'adresse ajouté au lien d'une carte affichée dans un mood. */
export const moodLinkSuffix = (moodSlug: string | null | undefined): string | undefined =>
  moodSlug ? `${MOOD_PARAM}=${encodeURIComponent(moodSlug)}` : undefined;
