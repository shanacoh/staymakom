import type { CatalogueEntry, Nature } from "./types";

export type TabKey = "all" | Nature | "a_trier";
export type QuickFilter = "followup" | "to_visit" | null;
export type ContentFilter = "all" | "not_visited" | "no_video" | "content_not_sent";
export type SortKey = "recent" | "name" | "followup";

export interface CatalogueFilterState {
  tab: TabKey;
  search: string;
  placeType: string; // "all" ou une valeur de PlaceType
  categoryId: string; // "all" ou l'id d'une catégorie Staymakom
  region: string; // "all" ou la clé d'une région (voir placeKey)
  city: string; // "all" ou la clé d'une ville
  status: string; // "all" ou une valeur de CommercialStatus
  content: ContentFilter;
  source: string; // "all" ou une valeur de Source
  quick: QuickFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: CatalogueFilterState = {
  tab: "all",
  search: "",
  placeType: "all",
  categoryId: "all",
  region: "all",
  city: "all",
  status: "all",
  content: "all",
  source: "all",
  quick: null,
  sort: "recent",
};

/** Minuscules, sans accents : pour que "Eilat", "éilat" et "EILAT" se retrouvent. */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Clé de regroupement d'un nom de lieu : les fiches du site écrivent parfois la même ville de
 * deux façons ("Tel Aviv" / "Tel-Aviv", "Be'er Sheva" / "Beer Sheva"). Sans ça, le filtre
 * proposerait deux entrées pour le même endroit.
 */
export function placeKey(value: string | null | undefined): string {
  return normalizeText(value)
    .replace(/['’`]/g, "") // "Be'er" et "Beer" doivent se retrouver
    .replace(/-/g, " ") // "Tel-Aviv" et "Tel Aviv" aussi
    .replace(/\s+/g, " ")
    .trim();
}

export interface PlaceOption {
  key: string;
  label: string;
  count: number;
}

/** Valeurs distinctes (villes ou régions) présentes dans les lieux, regroupées par clé, triées. */
export function distinctPlaces(
  entries: CatalogueEntry[],
  pick: (entry: CatalogueEntry) => string | null
): PlaceOption[] {
  const groups = new Map<string, { labels: Map<string, number>; count: number }>();
  for (const entry of entries) {
    const raw = pick(entry)?.trim();
    if (!raw) continue;
    const key = placeKey(raw);
    if (!key) continue;
    const group = groups.get(key) ?? { labels: new Map(), count: 0 };
    group.count += 1;
    group.labels.set(raw, (group.labels.get(raw) ?? 0) + 1);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      // On affiche l'écriture la plus utilisée pour ce lieu
      label: [...group.labels.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: group.count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

/** "Aujourd'hui" au format AAAA-MM-JJ, à l'heure locale (les dates du catalogue n'ont pas d'heure). */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Relance à faire : une date de relance est posée et elle est arrivée (ou dépassée). */
export function isFollowupDue(entry: CatalogueEntry, today: string): boolean {
  return !!entry.next_followup_date && entry.next_followup_date <= today;
}

/** À visiter : partenaires et discussions en cours qui n'ont pas encore été visités. */
export function isToVisit(entry: CatalogueEntry): boolean {
  return (
    !entry.visited && (entry.commercial_status === "en_discussion" || entry.commercial_status === "partenaire")
  );
}

/**
 * Les onglets par nature ne montrent pas les lieux encore "À trier" : tant qu'un lieu n'a pas été
 * trié, sa nature n'est qu'une valeur par défaut. Ils ont leur propre onglet.
 */
export function matchesTab(entry: CatalogueEntry, tab: TabKey): boolean {
  if (tab === "all") return true;
  if (tab === "a_trier") return entry.commercial_status === "a_trier";
  return entry.nature === tab && entry.commercial_status !== "a_trier";
}

export function countByTab(entries: CatalogueEntry[]): Record<TabKey, number> {
  const counts: Record<TabKey, number> = { all: entries.length, partenaire: 0, hors_reseau: 0, inspiration: 0, a_trier: 0 };
  for (const entry of entries) {
    if (entry.commercial_status === "a_trier") counts.a_trier += 1;
    else counts[entry.nature] += 1;
  }
  return counts;
}

export function computeTiles(entries: CatalogueEntry[], today: string) {
  const tiles = { toSort: 0, followup: 0, toVisit: 0 };
  for (const entry of entries) {
    if (entry.commercial_status === "a_trier") tiles.toSort += 1;
    if (isFollowupDue(entry, today)) tiles.followup += 1;
    if (isToVisit(entry)) tiles.toVisit += 1;
  }
  return tiles;
}

function matchesContent(entry: CatalogueEntry, content: ContentFilter): boolean {
  switch (content) {
    case "not_visited":
      return !entry.visited;
    case "no_video":
      return !entry.video_done;
    case "content_not_sent":
      return !entry.content_sent;
    default:
      return true;
  }
}

function matchesSearch(entry: CatalogueEntry, search: string): boolean {
  const needle = normalizeText(search);
  if (!needle) return true;
  const haystack = normalizeText(
    [
      entry.display_name,
      entry.display_city,
      entry.display_region,
      entry.notes,
      entry.contact_name,
      entry.tags.join(" "),
    ].join(" ")
  );
  return haystack.includes(needle);
}

function sortEntries(entries: CatalogueEntry[], sort: SortKey): CatalogueEntry[] {
  const byName = (a: CatalogueEntry, b: CatalogueEntry) =>
    a.display_name.localeCompare(b.display_name, "fr", { sensitivity: "base" });
  const copy = [...entries];
  switch (sort) {
    case "name":
      return copy.sort(byName);
    case "followup":
      // Les relances les plus anciennes d'abord, les lieux sans date de relance à la fin
      return copy.sort((a, b) => {
        if (a.next_followup_date && b.next_followup_date) {
          return a.next_followup_date.localeCompare(b.next_followup_date) || byName(a, b);
        }
        if (a.next_followup_date) return -1;
        if (b.next_followup_date) return 1;
        return byName(a, b);
      });
    default:
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at) || byName(a, b));
  }
}

export function applyFilters(
  entries: CatalogueEntry[],
  filters: CatalogueFilterState,
  today: string
): CatalogueEntry[] {
  const filtered = entries.filter((entry) => {
    if (!matchesTab(entry, filters.tab)) return false;
    if (filters.placeType !== "all" && entry.place_type !== filters.placeType) return false;
    if (filters.status !== "all" && entry.commercial_status !== filters.status) return false;
    if (filters.source !== "all" && entry.source !== filters.source) return false;
    if (filters.region !== "all" && placeKey(entry.display_region) !== filters.region) return false;
    if (filters.city !== "all" && placeKey(entry.display_city) !== filters.city) return false;
    if (
      filters.categoryId !== "all" &&
      !entry.staymakom_category_ids.includes(filters.categoryId) &&
      !entry.site_category_ids.includes(filters.categoryId)
    ) {
      return false;
    }
    if (!matchesContent(entry, filters.content)) return false;
    if (filters.quick === "followup" && !isFollowupDue(entry, today)) return false;
    if (filters.quick === "to_visit" && !isToVisit(entry)) return false;
    return matchesSearch(entry, filters.search);
  });
  return sortEntries(filtered, filters.sort);
}

/** Vrai dès qu'un filtre (hors onglet et tri) est actif : sert à afficher "Réinitialiser". */
export function hasActiveFilters(filters: CatalogueFilterState): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.placeType !== "all" ||
    filters.categoryId !== "all" ||
    filters.region !== "all" ||
    filters.city !== "all" ||
    filters.status !== "all" ||
    filters.content !== "all" ||
    filters.source !== "all" ||
    filters.quick !== null
  );
}
