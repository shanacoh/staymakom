/**
 * Archivage des fiches (hôtels, expériences avec hôtel, standalone).
 *
 * Archiver ne supprime rien : la fiche passe au statut "archived" (déjà prévu en base),
 * disparaît du site et des listes du back-office par défaut, et ses réservations restent
 * intactes. Désarchiver la remet en brouillon, jamais directement en ligne.
 */

export const ARCHIVED_STATUS = "archived";
/** Statut rendu à une fiche désarchivée. */
export const UNARCHIVED_STATUS = "draft";

export type ListingKind = "hotel" | "experience" | "standalone";

export const LISTING_TABLE = {
  hotel: "hotels2",
  experience: "experiences2",
  standalone: "standalone_experiences",
} as const satisfies Record<ListingKind, string>;

export const isArchived = (status?: string | null): boolean => status === ARCHIVED_STATUS;

/** Sépare une liste en fiches actives (affichées par défaut) et fiches archivées (repliées). */
export function splitArchived<T extends { status?: string | null }>(rows: T[]): { active: T[]; archived: T[] } {
  const active: T[] = [];
  const archived: T[] = [];
  for (const row of rows) (isArchived(row.status) ? archived : active).push(row);
  return { active, archived };
}

/** Statut affiché dans l'en-tête des formulaires d'édition. */
export function formStatusLabel(status?: string | null): string {
  if (status === "published") return "Publiée";
  if (isArchived(status)) return "Archivée";
  return "Brouillon";
}

/**
 * Statut à enregistrer quand on clique sur « Brouillon » : une fiche archivée le reste
 * (modifier une fiche archivée ne doit pas la sortir des archives sans le vouloir).
 */
export function draftSaveStatus(currentStatus?: string | null): "draft" | "archived" {
  return isArchived(currentStatus) ? ARCHIVED_STATUS : "draft";
}
