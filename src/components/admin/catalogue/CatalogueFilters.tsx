import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  type CatalogueFilterState,
  type ContentFilter,
  type PlaceOption,
  type SortKey,
} from "@/lib/catalogue/filters";
import {
  PLACE_TYPE_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  type CatalogueCategory,
} from "@/lib/catalogue/types";

interface CatalogueFiltersProps {
  filters: CatalogueFilterState;
  onChange: (next: CatalogueFilterState) => void;
  categories: CatalogueCategory[];
  regions: PlaceOption[];
  cities: PlaceOption[];
  /** Affiche le choix du tri (inutile sur la carte). */
  showSort?: boolean;
}

const CONTENT_OPTIONS: { value: ContentFilter; label: string }[] = [
  { value: "not_visited", label: "Pas encore visité" },
  { value: "no_video", label: "Vidéo pas faite" },
  { value: "content_not_sent", label: "Contenu pas envoyé" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Ajoutés récemment" },
  { value: "name", label: "Nom (A à Z)" },
  { value: "followup", label: "Relance la plus proche" },
];

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CatalogueFilters({ filters, onChange, categories, regions, cities, showSort = true }: CatalogueFiltersProps) {
  const set = <K extends keyof CatalogueFilterState>(key: K, value: CatalogueFilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Rechercher un lieu, une ville, une étiquette..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        {showSort && (
        <div className="w-full sm:w-52">
          <Select value={filters.sort} onValueChange={(value) => set("sort", value as SortKey)}>
            <SelectTrigger className="h-9 text-xs" aria-label="Trier par">
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
        {hasActiveFilters(filters) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...DEFAULT_FILTERS, tab: filters.tab, sort: filters.sort })}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        <FilterSelect
          value={filters.placeType}
          onChange={(value) => set("placeType", value)}
          placeholder="Tous les types"
          options={PLACE_TYPE_OPTIONS}
        />
        <FilterSelect
          value={filters.categoryId}
          onChange={(value) => set("categoryId", value)}
          placeholder="Toutes les catégories"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          value={filters.region}
          onChange={(value) => set("region", value)}
          placeholder="Toutes les régions"
          options={regions.map((r) => ({ value: r.key, label: `${r.label} (${r.count})` }))}
        />
        <FilterSelect
          value={filters.city}
          onChange={(value) => set("city", value)}
          placeholder="Toutes les villes"
          options={cities.map((c) => ({ value: c.key, label: `${c.label} (${c.count})` }))}
        />
        <FilterSelect
          value={filters.status}
          onChange={(value) => set("status", value)}
          placeholder="Tous les statuts"
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          value={filters.content}
          onChange={(value) => set("content", value as ContentFilter)}
          placeholder="Tout le contenu"
          options={CONTENT_OPTIONS}
        />
        <FilterSelect
          value={filters.source}
          onChange={(value) => set("source", value)}
          placeholder="Toutes les origines"
          options={SOURCE_OPTIONS}
        />
      </div>
    </div>
  );
}
