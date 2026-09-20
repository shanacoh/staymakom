import { isInIsrael, positionOf } from "./geo";
import type { CatalogueEntry, CommercialStatus } from "./types";

/** Couleur de l'épingle selon le statut commercial (mêmes teintes que les pastilles du catalogue). */
export const STATUS_COLORS: Record<CommercialStatus, string> = {
  a_trier: "#f59e0b",
  idee: "#64748b",
  a_contacter: "#0ea5e9",
  contacte: "#6366f1",
  en_discussion: "#8b5cf6",
  partenaire: "#16a34a",
  refuse: "#a3a3a3",
};

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  entry: CatalogueEntry;
}

/**
 * Lieux visibles sur la carte : on écarte ceux qui sont encore "À trier" (pas encore rangés) et,
 * sauf demande explicite, ceux qui sont écartés ou abandonnés.
 */
export function mapBaseEntries(entries: CatalogueEntry[], statusFilter: string): CatalogueEntry[] {
  return entries.filter(
    (entry) =>
      entry.commercial_status !== "a_trier" && (entry.commercial_status !== "refuse" || statusFilter === "refuse")
  );
}

/**
 * Sépare les lieux en trois : ceux dont la position est en Israël (épingles), ceux sans position (à
 * localiser), et ceux dont la position n'est pas en Israël (suspects : forcément une erreur, on ne les
 * dessine pas, ils feraient dézoomer la carte sur le monde).
 */
export function splitByPosition(entries: CatalogueEntry[]): {
  placed: MapPoint[];
  missing: CatalogueEntry[];
  suspect: CatalogueEntry[];
} {
  const placed: MapPoint[] = [];
  const missing: CatalogueEntry[] = [];
  const suspect: CatalogueEntry[] = [];
  for (const entry of entries) {
    const position = positionOf(entry.display_latitude, entry.display_longitude);
    if (!position) missing.push(entry);
    else if (isInIsrael(position.lat, position.lng)) placed.push({ id: entry.id, lat: position.lat, lng: position.lng, entry });
    else suspect.push(entry);
  }
  return { placed, missing, suspect };
}

export interface Cluster<T extends { lat: number; lng: number }> {
  lat: number;
  lng: number;
  items: T[];
}

/**
 * Regroupe les épingles proches à l'écran : des épingles qui tomberaient dans la même case de
 * `cellSize` pixels forment un seul groupe (avec leur nombre). `project` donne la position en pixels
 * d'un point au zoom courant. Comme les cases sont ancrées sur le monde et non sur l'écran, les groupes
 * ne bougent pas quand on déplace la carte, seulement quand on zoome. Au zoom `maxZoom` et au-delà, plus de groupes.
 */
export function clusterPoints<T extends { lat: number; lng: number }>(
  points: T[],
  project: (lat: number, lng: number) => { x: number; y: number },
  zoom: number,
  options: { cellSize?: number; maxZoom?: number } = {}
): Cluster<T>[] {
  const { cellSize = 46, maxZoom = 16 } = options;
  if (zoom >= maxZoom) return points.map((p) => ({ lat: p.lat, lng: p.lng, items: [p] }));

  const cells = new Map<string, T[]>();
  for (const point of points) {
    const { x, y } = project(point.lat, point.lng);
    const key = `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(point);
    else cells.set(key, [point]);
  }
  return [...cells.values()].map((items) => ({
    lat: items.reduce((sum, p) => sum + p.lat, 0) / items.length,
    lng: items.reduce((sum, p) => sum + p.lng, 0) / items.length,
    items,
  }));
}

/** Tous les points du groupe sont-ils au même endroit (impossible à séparer en zoomant) ? */
export function isSamePlace<T extends { lat: number; lng: number }>(items: T[], toleranceDegrees = 0.00005): boolean {
  return items.every(
    (p) => Math.abs(p.lat - items[0].lat) <= toleranceDegrees && Math.abs(p.lng - items[0].lng) <= toleranceDegrees
  );
}

/**
 * Recherches à essayer pour retrouver un lieu sur la carte, de la plus précise à la plus large :
 * l'adresse avec la ville si on l'a, puis le nom avec la ville, puis le nom seul.
 */
export function locateQueries(entry: Pick<CatalogueEntry, "display_name" | "display_address" | "display_city">): string[] {
  const name = entry.display_name.trim();
  const city = entry.display_city?.trim() ?? "";
  const address = entry.display_address?.trim() ?? "";
  const queries = [address && [address, city].filter(Boolean).join(", "), [name, city].filter(Boolean).join(" "), name];
  return [...new Set(queries.filter((q): q is string => !!q && q.length >= 3))];
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
