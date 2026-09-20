import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TODO_KEYS,
  clearFilters,
  distinctPlaces,
  facetCounts,
  hasActiveFilters,
  matchesTab,
  panelFilterCount,
  toggleValue,
  todoCounts,
  type CatalogueFilterState,
  type SortKey,
  type TodoKey,
} from "@/lib/catalogue/filters";
import {
  PLACE_TYPE_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  type CatalogueCategory,
  type CatalogueEntry,
  type CommercialStatus,
} from "@/lib/catalogue/types";
import { ActiveFilters } from "./ActiveFilters";
import { FilterChip } from "./FilterChip";
import { FiltersPanel, type FacetGroupData, type FacetOption, type PanelDimension } from "./FiltersPanel";
import { SearchBox } from "./SearchBox";

const TODO_LABELS: Record<TodoKey, { label: string; title: string }> = {
  followup: { label: "À relancer", title: "La date de relance est arrivée" },
  to_visit: { label: "À visiter", title: "Partenaires et discussions en cours pas encore visités" },
  no_video: { label: "Vidéo à faire", title: "Partenaires et discussions en cours sans vidéo" },
  content_not_sent: { label: "Contenu à envoyer", title: "Partenaires et discussions en cours sans contenu envoyé" },
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Ajoutés récemment" },
  { value: "name", label: "Nom (A à Z)" },
  { value: "followup", label: "Relance la plus proche" },
];

const byCountThenLabel = (a: FacetOption, b: FacetOption) =>
  b.count - a.count || a.label.localeCompare(b.label, "fr", { sensitivity: "base" });

interface CatalogueToolbarProps {
  /** Tous les lieux de départ, avant les filtres (les nombres affichés en tiennent compte). */
  entries: CatalogueEntry[];
  filters: CatalogueFilterState;
  onChange: (next: CatalogueFilterState) => void;
  categories: CatalogueCategory[];
  today: string;
  /** Les statuts proposés en puces (la carte n'a pas « À trier »). */
  statusChoices: CommercialStatus[];
  /** Nombre de lieux affichés après filtres. */
  resultCount: number;
  showSort?: boolean;
  /** Cache les puces de statut et « à faire » (inutiles dans la boîte « À trier »). */
  hideProgress?: boolean;
}

/**
 * La recherche et les filtres, dans la même disposition sur le Catalogue et sur la Carte :
 * la barre de recherche et le bouton Filtres ; les statuts en puces ; ce qu'il reste à faire en puces ;
 * les choix faits dans le panneau, avec leur croix ; et le nombre de lieux affichés.
 */
export function CatalogueToolbar({
  entries,
  filters,
  onChange,
  categories,
  today,
  statusChoices,
  resultCount,
  showSort = false,
  hideProgress = false,
}: CatalogueToolbarProps) {
  const statusCounts = useMemo(() => facetCounts(entries, filters, "statuses", today), [entries, filters, today]);
  const todo = useMemo(() => todoCounts(entries, filters, today), [entries, filters, today]);
  const typeCounts = useMemo(() => facetCounts(entries, filters, "placeTypes", today), [entries, filters, today]);
  const sourceCounts = useMemo(() => facetCounts(entries, filters, "sources", today), [entries, filters, today]);
  const categoryCounts = useMemo(() => facetCounts(entries, filters, "categoryIds", today), [entries, filters, today]);
  const regionCounts = useMemo(() => facetCounts(entries, filters, "regions", today), [entries, filters, today]);
  const cityCounts = useMemo(() => facetCounts(entries, filters, "cities", today), [entries, filters, today]);

  // Le nom lisible de chaque région et ville, pris sur l'ensemble des lieux (pas seulement les affichés)
  const regionLabels = useMemo(() => new Map(distinctPlaces(entries, (e) => e.display_region).map((p) => [p.key, p.label])), [entries]);
  const cityLabels = useMemo(() => new Map(distinctPlaces(entries, (e) => e.display_city).map((p) => [p.key, p.label])), [entries]);

  const groups: FacetGroupData[] = useMemo(() => {
    const fromMap = (labels: Map<string, string>, counts: Map<string, number>, selected: string[]): FacetOption[] =>
      [...new Set([...labels.keys(), ...selected])]
        .map((value) => ({ value, label: labels.get(value) ?? value, count: counts.get(value) ?? 0 }))
        .sort(byCountThenLabel);
    return [
      {
        dimension: "placeTypes",
        title: "Type",
        options: PLACE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label, count: typeCounts.get(o.value) ?? 0 })),
      },
      {
        dimension: "categoryIds",
        title: "Catégorie Staymakom",
        options: categories.map((c) => ({ value: c.id, label: c.name, count: categoryCounts.get(c.id) ?? 0 })),
      },
      { dimension: "regions", title: "Région", options: fromMap(regionLabels, regionCounts, filters.regions) },
      { dimension: "cities", title: "Ville", options: fromMap(cityLabels, cityCounts, filters.cities) },
      {
        dimension: "sources",
        title: "Origine",
        options: SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label, count: sourceCounts.get(o.value) ?? 0 })),
      },
    ];
  }, [typeCounts, sourceCounts, categoryCounts, regionCounts, cityCounts, regionLabels, cityLabels, categories, filters.regions, filters.cities]);

  const labelFor = (dimension: PanelDimension, value: string): string => {
    switch (dimension) {
      case "placeTypes":
        return PLACE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
      case "sources":
        return SOURCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
      case "categoryIds":
        return categories.find((c) => c.id === value)?.name ?? value;
      case "regions":
        return regionLabels.get(value) ?? value;
      case "cities":
        return cityLabels.get(value) ?? value;
    }
  };

  const inTab = useMemo(() => entries.filter((e) => matchesTab(e, filters.tab)).length, [entries, filters.tab]);
  const allStatuses = [...statusCounts.values()].reduce((sum, n) => sum + n, 0);
  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={filters.search} onChange={(search) => onChange({ ...filters, search })} />
        <FiltersPanel filters={filters} onChange={onChange} groups={groups} activeCount={panelFilterCount(filters)} />
        {showSort && (
          <div className="w-full sm:w-52">
            <Select value={filters.sort} onValueChange={(value) => onChange({ ...filters, sort: value as SortKey })}>
              <SelectTrigger className="h-10 text-xs" aria-label="Trier par">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!hideProgress && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 w-14 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Statut</span>
            <FilterChip
              label="Tous"
              count={allStatuses}
              active={filters.statuses.length === 0}
              onClick={() => onChange({ ...filters, statuses: [] })}
            />
            {STATUS_OPTIONS.filter((s) => statusChoices.includes(s.value)).map((status) => (
              <FilterChip
                key={status.value}
                label={status.label}
                count={statusCounts.get(status.value) ?? 0}
                active={filters.statuses.includes(status.value)}
                onClick={() => onChange({ ...filters, statuses: toggleValue(filters.statuses, status.value) })}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 w-14 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">À faire</span>
            {TODO_KEYS.map((key) => (
              <FilterChip
                key={key}
                label={TODO_LABELS[key].label}
                title={TODO_LABELS[key].title}
                count={todo[key]}
                active={filters.todo.includes(key)}
                onClick={() => onChange({ ...filters, todo: toggleValue(filters.todo, key) })}
              />
            ))}
          </div>
        </>
      )}

      <ActiveFilters filters={filters} onChange={onChange} labelFor={labelFor} />

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground" aria-live="polite">
        <span>
          {resultCount} lieu{resultCount > 1 ? "x" : ""} affiché{resultCount > 1 ? "s" : ""}
          {active && ` sur ${inTab}`}
        </span>
        {active && (
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onChange(clearFilters(filters))}>
            Tout effacer
          </Button>
        )}
      </div>
    </div>
  );
}
