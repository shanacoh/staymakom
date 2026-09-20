import type { CatalogueEntry } from "./types";

/**
 * Rectangle qui entoure Israël (du Golan à Eilat, de la Méditerranée à la mer Morte). Tous les lieux du
 * catalogue sont en Israël : une position en dehors est forcément une erreur de données (positions
 * inversées, valeur par défaut comme 1, 1, faute de frappe...). Le rectangle est volontairement large : il
 * attrape les grosses erreurs, il ne dessine pas les frontières.
 */
export const ISRAEL_BOUNDS = { south: 29.4, north: 33.4, west: 34.2, east: 35.9 } as const;

export function isInIsrael(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= ISRAEL_BOUNDS.south &&
    lat <= ISRAEL_BOUNDS.north &&
    lng >= ISRAEL_BOUNDS.west &&
    lng <= ISRAEL_BOUNDS.east
  );
}

/** Une position peut arriver comme nombre ou comme texte ("32.57") selon la base : on accepte les deux. */
export function toCoordinate(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** La position d'un lieu, ou null s'il n'en a pas (ou une moitié seulement). */
export function positionOf(latitude: unknown, longitude: unknown): { lat: number; lng: number } | null {
  const lat = toCoordinate(latitude);
  const lng = toCoordinate(longitude);
  return lat !== null && lng !== null ? { lat, lng } : null;
}

/** Texte à afficher pour une position, ex. "1, 1" ou "32.5723, 34.9531". */
export function formatPosition(lat: number, lng: number): string {
  const round = (n: number) => String(Math.round(n * 10000) / 10000);
  return `${round(lat)}, ${round(lng)}`;
}

/** La position affichée pour ce lieu existe mais n'est pas en Israël. */
export function hasSuspectPosition(entry: Pick<CatalogueEntry, "display_latitude" | "display_longitude">): boolean {
  const position = positionOf(entry.display_latitude, entry.display_longitude);
  return position !== null && !isInIsrael(position.lat, position.lng);
}

/**
 * La fiche du site elle-même porte une position hors d'Israël, ce que voient les clients (carte et lien
 * d'itinéraire de la page). Vrai même si le catalogue a corrigé sa propre position.
 */
export function siteHasBadPosition(
  entry: Pick<CatalogueEntry, "live_kind" | "live_latitude" | "live_longitude">
): boolean {
  if (!entry.live_kind) return false;
  const position = positionOf(entry.live_latitude, entry.live_longitude);
  return position !== null && !isInIsrael(position.lat, position.lng);
}

/** Message d'alerte quand une position saisie n'est pas en Israël, ou null si tout va bien. */
export function outsideIsraelWarning(latitude: unknown, longitude: unknown): string | null {
  const position = positionOf(latitude, longitude);
  if (!position || isInIsrael(position.lat, position.lng)) return null;
  return `Cette position (${formatPosition(position.lat, position.lng)}) n'est pas en Israël : vérifie la latitude et la longitude (elles sont peut-être inversées).`;
}
