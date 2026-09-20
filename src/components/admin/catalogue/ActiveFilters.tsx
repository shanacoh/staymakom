import { X } from "lucide-react";
import { toggleValue, type CatalogueFilterState } from "@/lib/catalogue/filters";
import type { PanelDimension } from "./FiltersPanel";

const DIMENSION_LABELS: Record<PanelDimension, string> = {
  placeTypes: "Type",
  categoryIds: "Catégorie",
  regions: "Région",
  cities: "Ville",
  sources: "Origine",
};

const ORDER: PanelDimension[] = ["placeTypes", "categoryIds", "regions", "cities", "sources"];

interface ActiveFiltersProps {
  filters: CatalogueFilterState;
  onChange: (next: CatalogueFilterState) => void;
  /** Le nom à afficher pour une valeur choisie (ex. la clé "tel aviv" devient "Tel Aviv"). */
  labelFor: (dimension: PanelDimension, value: string) => string;
}

/** Les choix faits dans le panneau, toujours visibles ici, avec une croix pour en retirer un. */
export function ActiveFilters({ filters, onChange, labelFor }: ActiveFiltersProps) {
  const chips = ORDER.flatMap((dimension) => filters[dimension].map((value) => ({ dimension, value })));
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Filtres actifs">
      {chips.map(({ dimension, value }) => (
        <li key={`${dimension}:${value}`}>
          <button
            type="button"
            onClick={() => onChange({ ...filters, [dimension]: toggleValue(filters[dimension], value) })}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/70"
            aria-label={`Retirer le filtre ${DIMENSION_LABELS[dimension]} : ${labelFor(dimension, value)}`}
          >
            <span className="text-muted-foreground">{DIMENSION_LABELS[dimension]} :</span>
            {labelFor(dimension, value)}
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}
