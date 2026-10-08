// Présentation par mood d'une expérience seule (chantier Offre, étape 2).
//
// Le mood principal d'une fiche est `category_id` : sa présentation, ce sont les colonnes de la
// fiche elle-même (titre, accroche, description, photo de couverture). Les autres moods cochés
// peuvent avoir leur propre version, rangée dans `standalone_experience_mood_presentations`.
// Un mood sans version propre affiche la présentation principale.
//
// Ce fichier ne contient que des règles (aucun accès à la base, aucun affichage).

export type PresentationLanguage = "en" | "fr" | "he";
export type PresentationPart = "title" | "subtitle" | "long_copy";

export const PRESENTATION_TEXT_FIELDS = [
  "title",
  "title_fr",
  "title_he",
  "subtitle",
  "subtitle_fr",
  "subtitle_he",
  "long_copy",
  "long_copy_fr",
  "long_copy_he",
] as const;

export type PresentationTextField = (typeof PRESENTATION_TEXT_FIELDS)[number];

export type MoodPresentation = Record<PresentationTextField, string> & {
  /** Une photo de la fiche (couverture ou galerie), ou null. */
  cover_image: string | null;
};

/** Versions propres des moods non principaux, rangées par identifiant de mood. */
export type MoodPresentationMap = Record<string, MoodPresentation>;

export interface MoodPresentationRow extends Record<PresentationTextField, string | null> {
  experience_id: string;
  category_id: string;
  cover_image: string | null;
}

/** Le nom de la colonne qui porte ce morceau de texte dans cette langue (l'anglais n'a pas de suffixe). */
export const presentationField = (part: PresentationPart, lang: PresentationLanguage): PresentationTextField =>
  (lang === "en" ? part : `${part}_${lang}`) as PresentationTextField;

export const emptyPresentation = (): MoodPresentation => ({
  title: "",
  title_fr: "",
  title_he: "",
  subtitle: "",
  subtitle_fr: "",
  subtitle_he: "",
  long_copy: "",
  long_copy_fr: "",
  long_copy_he: "",
  cover_image: null,
});

/** « Personnaliser pour ce mood » : la nouvelle version part d'une copie de la présentation principale. */
export const copyPresentation = (source: MoodPresentation): MoodPresentation => ({ ...source });

export function rowsToPresentationMap(rows: Partial<MoodPresentationRow>[] | null | undefined): MoodPresentationMap {
  const map: MoodPresentationMap = {};
  for (const row of rows ?? []) {
    if (!row.category_id) continue;
    const presentation = emptyPresentation();
    for (const field of PRESENTATION_TEXT_FIELDS) presentation[field] = row[field] ?? "";
    presentation.cover_image = row.cover_image || null;
    map[row.category_id] = presentation;
  }
  return map;
}

export function presentationToRow(experienceId: string, categoryId: string, presentation: MoodPresentation): MoodPresentationRow {
  const row = { experience_id: experienceId, category_id: categoryId, cover_image: presentation.cover_image || null } as MoodPresentationRow;
  for (const field of PRESENTATION_TEXT_FIELDS) row[field] = presentation[field] || null;
  return row;
}

const samePresentation = (a: MoodPresentation, b: MoodPresentation) =>
  (a.cover_image || null) === (b.cover_image || null) && PRESENTATION_TEXT_FIELDS.every((f) => (a[f] || "") === (b[f] || ""));

/**
 * Ce que le mood affiche réellement : sa version propre si elle existe, sinon la présentation
 * principale. `isOwn` dit si le contenu lui appartient (modifiable) ou s'il est hérité (lecture seule).
 */
export function resolvePresentation(
  main: MoodPresentation,
  presentations: MoodPresentationMap,
  categoryId: string,
  primaryId: string | null,
): { presentation: MoodPresentation; isOwn: boolean; isPrimary: boolean } {
  if (categoryId === primaryId) return { presentation: main, isOwn: true, isPrimary: true };
  const own = presentations[categoryId];
  if (!own) return { presentation: main, isOwn: false, isPrimary: false };
  // Une version propre sans photo choisie reprend la photo de couverture de la fiche.
  return { presentation: { ...own, cover_image: own.cover_image || main.cover_image }, isOwn: true, isPrimary: false };
}

/**
 * « En faire le mood principal ». Le mood choisi passe en tête, et les contenus sont échangés :
 * l'ancien principal garde son texte et sa photo dans une version propre, rien n'est perdu.
 * Si le mood choisi n'avait pas de version propre, les deux partageaient déjà le même contenu :
 * seul l'ordre change.
 */
export function makeMoodPrimary(input: {
  selectedCategoryIds: string[];
  main: MoodPresentation;
  presentations: MoodPresentationMap;
  newPrimaryId: string;
}): { selectedCategoryIds: string[]; main: MoodPresentation; presentations: MoodPresentationMap } {
  const { selectedCategoryIds, main, presentations, newPrimaryId } = input;
  const previousPrimaryId = selectedCategoryIds[0] ?? null;
  if (!selectedCategoryIds.includes(newPrimaryId) || previousPrimaryId === newPrimaryId) {
    return { selectedCategoryIds, main, presentations };
  }

  const reordered = [newPrimaryId, ...selectedCategoryIds.filter((id) => id !== newPrimaryId)];
  const own = presentations[newPrimaryId];
  if (!own) return { selectedCategoryIds: reordered, main, presentations };

  const nextPresentations = { ...presentations };
  delete nextPresentations[newPrimaryId];
  if (previousPrimaryId) nextPresentations[previousPrimaryId] = copyPresentation(main);

  return {
    selectedCategoryIds: reordered,
    main: { ...own, cover_image: own.cover_image || main.cover_image },
    presentations: nextPresentations,
  };
}

/**
 * Ce qu'il faut écrire en base pour passer de l'état chargé à l'état du formulaire.
 * - `upserts` : versions nouvelles ou modifiées (une version non modifiée n'est jamais réécrite).
 * - `deletes` : versions retirées à la main, ou devenues inutiles (le mood est devenu principal).
 * Une version d'un mood décoché est conservée : la recocher la fait réapparaître.
 */
export function planPresentationSync(input: {
  experienceId: string;
  loaded: MoodPresentationMap;
  current: MoodPresentationMap;
  primaryId: string | null;
}): { upserts: MoodPresentationRow[]; deletes: string[] } {
  const { experienceId, loaded, current, primaryId } = input;
  const upserts: MoodPresentationRow[] = [];
  for (const [categoryId, presentation] of Object.entries(current)) {
    if (categoryId === primaryId) continue;
    const before = loaded[categoryId];
    if (before && samePresentation(before, presentation)) continue;
    upserts.push(presentationToRow(experienceId, categoryId, presentation));
  }
  const deletes = Object.keys(loaded).filter((categoryId) => categoryId === primaryId || !current[categoryId]);
  return { upserts, deletes };
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Le texte d'une description sans sa mise en forme (pour compter les caractères ou l'afficher en lecture seule). */
export const presentationPlainText = stripHtml;

/** Titre, accroche et description remplis dans cette langue. */
export function isPresentationFilled(presentation: MoodPresentation, lang: PresentationLanguage): boolean {
  return (["title", "subtitle", "long_copy"] as const).every(
    (part) => stripHtml(presentation[presentationField(part, lang)] || "").length > 0,
  );
}
