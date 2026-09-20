import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toggleValue, type CatalogueFilterState, type Dimension } from "@/lib/catalogue/filters";

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export type PanelDimension = Extract<Dimension, "placeTypes" | "categoryIds" | "regions" | "cities" | "sources">;

export interface FacetGroupData {
  dimension: PanelDimension;
  title: string;
  options: FacetOption[];
}

interface FiltersPanelProps {
  filters: CatalogueFilterState;
  onChange: (next: CatalogueFilterState) => void;
  groups: FacetGroupData[];
  activeCount: number;
}

const SEARCHABLE_FROM = 8; // au-delà, la liste a son propre champ de recherche

function FacetGroup({
  group,
  selected,
  onToggle,
}: {
  group: FacetGroupData;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  // Un choix sans aucun lieu ne mène à rien : on ne le montre que s'il est déjà coché
  const visible = group.options.filter((o) => o.count > 0 || selected.includes(o.value));
  if (visible.length === 0) return null;

  const needle = query.trim().toLowerCase();
  const shown = needle ? visible.filter((o) => o.label.toLowerCase().includes(needle)) : visible;

  return (
    <fieldset className="space-y-1.5">
      <legend className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{group.title}</span>
        {selected.length > 0 && <span className="normal-case tracking-normal text-foreground">{selected.length} choisi{selected.length > 1 ? "s" : ""}</span>}
      </legend>
      {visible.length >= SEARCHABLE_FROM && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Chercher dans « ${group.title.toLowerCase()} »`}
          className="h-8 text-xs"
          aria-label={`Chercher dans ${group.title}`}
        />
      )}
      <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
        {shown.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
            <Checkbox checked={selected.includes(option.value)} onCheckedChange={() => onToggle(option.value)} />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{option.count}</span>
          </label>
        ))}
        {shown.length === 0 && <p className="px-1 py-1 text-xs text-muted-foreground">Aucun résultat</p>}
      </div>
    </fieldset>
  );
}

/** Le bouton « Filtres » et son panneau : tous les critères secondaires, à cocher, avec le nombre de lieux de chacun. */
export function FiltersPanel({ filters, onChange, groups, activeCount }: FiltersPanelProps) {
  const clearPanel = () =>
    onChange({ ...filters, placeTypes: [], categoryIds: [], regions: [], cities: [], sources: [] });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeCount > 0 && (
            <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">{activeCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[75vh] w-[min(92vw,28rem)] overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Filtres</h2>
          {activeCount > 0 && (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearPanel}>
              Tout décocher
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {groups.map((group) => (
            <FacetGroup
              key={group.dimension}
              group={group}
              selected={filters[group.dimension]}
              onToggle={(value) => onChange({ ...filters, [group.dimension]: toggleValue(filters[group.dimension], value) })}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
