import type { CatalogueEntry, CommercialStatus, Nature } from "./types";

export type TabKey = "all" | Nature | "a_trier";
export type SortKey = "recent" | "name" | "followup";

/** Ce qu'il reste à faire : chaque puce est une condition, on peut en combiner plusieurs. */
export type TodoKey = "followup" | "to_visit" | "no_video" | "content_not_sent";

/** Les critères qu'on peut cocher (plusieurs valeurs possibles pour chacun). */
export type Dimension = "statuses" | "todo" | "placeTypes" | "categoryIds" | "regions" | "cities" | "sources";

export interface CatalogueFilterState {
  tab: TabKey;
  search: string;
  statuses: CommercialStatus[];
  todo: TodoKey[];
  placeTypes: string[];
  categoryIds: string[]; // ids de catégories Staymakom
  regions: string[]; // clés de région (voir placeKey)
  cities: string[]; // clés de ville
  sources: string[];
  sort: SortKey;
}

export const DEFAULT_FILTERS: CatalogueFilterState = {
  tab: "all",
  search: "",
  statuses: [],
  todo: [],
  placeTypes: [],
  categoryIds: [],
  regions: [],
  cities: [],
  sources: [],
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

/** Un partenaire, ou une discussion en cours : les lieux pour lesquels il y a du travail concret à faire. */
const isActivePartner = (entry: CatalogueEntry): boolean =>
  entry.commercial_status === "en_discussion" || entry.commercial_status === "partenaire";

/** À visiter : partenaires et discussions en cours qui n'ont pas encore été visités. */
export function isToVisit(entry: CatalogueEntry): boolean {
  return !entry.visited && isActivePartner(entry);
}

/** Vidéo à faire : partenaires et discussions en cours dont la vidéo n'est pas faite. */
export function needsVideo(entry: CatalogueEntry): boolean {
  return !entry.video_done && isActivePartner(entry);
}

/** Contenu à envoyer : partenaires et discussions en cours à qui le contenu n'a pas été envoyé. */
export function needsContentSent(entry: CatalogueEntry): boolean {
  return !entry.content_sent && isActivePartner(entry);
}

const TODO_PREDICATES: Record<TodoKey, (entry: CatalogueEntry, today: string) => boolean> = {
  followup: isFollowupDue,
  to_visit: (entry) => isToVisit(entry),
  no_video: (entry) => needsVideo(entry),
  content_not_sent: (entry) => needsContentSent(entry),
};

export const TODO_KEYS: TodoKey[] = ["followup", "to_visit", "no_video", "content_not_sent"];

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

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------

/** Les mots d'une recherche, sans accents ni majuscules. "vin eilat" donne ["vin", "eilat"]. */
export function searchTerms(search: string): string[] {
  return normalizeText(search).split(/\s+/).filter(Boolean);
}

/** Tous les mots de la recherche doivent se retrouver quelque part dans la fiche (nom, lieu, notes, contact, étiquettes). */
function matchesSearch(entry: CatalogueEntry, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = normalizeText(
    [
      entry.display_name,
      entry.display_city,
      entry.display_region,
      entry.display_address,
      entry.notes,
      entry.contact_name,
      entry.contact_instagram,
      entry.tags.join(" "),
    ].join(" ")
  );
  return terms.every((term) => haystack.includes(term));
}

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------

const selected = (values: string[]) => values.length > 0;

/** Les lieux qui passent tous les filtres (sans tri) ; `ignore` saute certains critères, pour calculer les nombres des puces. */
function filterEntries(
  entries: CatalogueEntry[],
  filters: CatalogueFilterState,
  today: string,
  ignore: Dimension[] = []
): CatalogueEntry[] {
  const skip = new Set<Dimension>(ignore);
  const terms = searchTerms(filters.search);

  return entries.filter((entry) => {
    if (!matchesTab(entry, filters.tab)) return false;
    if (!skip.has("statuses") && selected(filters.statuses) && !filters.statuses.includes(entry.commercial_status)) return false;
    if (!skip.has("todo") && !filters.todo.every((key) => TODO_PREDICATES[key](entry, today))) return false;
    if (!skip.has("placeTypes") && selected(filters.placeTypes) && !filters.placeTypes.includes(entry.place_type)) return false;
    if (!skip.has("sources") && selected(filters.sources) && !filters.sources.includes(entry.source)) return false;
    if (!skip.has("regions") && selected(filters.regions) && !filters.regions.includes(placeKey(entry.display_region))) return false;
    if (!skip.has("cities") && selected(filters.cities) && !filters.cities.includes(placeKey(entry.display_city))) return false;
    if (
      !skip.has("categoryIds") &&
      selected(filters.categoryIds) &&
      !filters.categoryIds.some((id) => entry.staymakom_category_ids.includes(id) || entry.site_category_ids.includes(id))
    ) {
      return false;
    }
    return matchesSearch(entry, terms);
  });
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
  return sortEntries(filterEntries(entries, filters, today), filters.sort);
}

/**
 * Le nombre de lieux pour chaque valeur d'un critère, en tenant compte de tous les AUTRES critères
 * (pas de celui-ci) : c'est le nombre affiché à côté d'une puce ou d'une case, "si je choisis
 * celle-ci, combien de lieux ?". Les clés sont les valeurs du critère (statut, clé de ville...).
 */
export function facetCounts(
  entries: CatalogueEntry[],
  filters: CatalogueFilterState,
  dimension: Exclude<Dimension, "todo">,
  today: string
): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (key: string) => {
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (const entry of filterEntries(entries, filters, today, [dimension])) {
    switch (dimension) {
      case "statuses":
        add(entry.commercial_status);
        break;
      case "placeTypes":
        add(entry.place_type);
        break;
      case "sources":
        add(entry.source);
        break;
      case "regions":
        add(placeKey(entry.display_region));
        break;
      case "cities":
        add(placeKey(entry.display_city));
        break;
      case "categoryIds":
        new Set([...entry.staymakom_category_ids, ...entry.site_category_ids]).forEach(add);
        break;
    }
  }
  return counts;
}

/** Combien de lieux pour chaque puce "à faire", compte tenu des autres critères (pas des autres puces "à faire"). */
export function todoCounts(
  entries: CatalogueEntry[],
  filters: CatalogueFilterState,
  today: string
): Record<TodoKey, number> {
  const counts: Record<TodoKey, number> = { followup: 0, to_visit: 0, no_video: 0, content_not_sent: 0 };
  for (const entry of filterEntries(entries, filters, today, ["todo"])) {
    for (const key of TODO_KEYS) if (TODO_PREDICATES[key](entry, today)) counts[key] += 1;
  }
  return counts;
}

/** Ajoute la valeur si elle n'y est pas, la retire sinon : le geste d'une puce ou d'une case à cocher. */
export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Le nombre de valeurs cochées dans le panneau de filtres (type, catégorie, région, ville, origine). */
export function panelFilterCount(filters: CatalogueFilterState): number {
  return filters.placeTypes.length + filters.categoryIds.length + filters.regions.length + filters.cities.length + filters.sources.length;
}

/** Vrai dès qu'un critère est actif (hors onglet et tri) : sert à proposer "Tout effacer". */
export function hasActiveFilters(filters: CatalogueFilterState): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.statuses.length > 0 ||
    filters.todo.length > 0 ||
    panelFilterCount(filters) > 0
  );
}

/** Efface tous les critères, mais garde l'onglet et le tri. */
export function clearFilters(filters: CatalogueFilterState): CatalogueFilterState {
  return { ...DEFAULT_FILTERS, tab: filters.tab, sort: filters.sort };
}
