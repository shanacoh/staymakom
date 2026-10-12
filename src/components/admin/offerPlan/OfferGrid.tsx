import { cellState, type CellState, type GridCell, type OfferGrid as Grid } from "@/lib/offerPlan/compute";
import type { OfferMood } from "@/lib/offerPlan/types";
import type { ZoneGroup } from "@/lib/regionList/labels";
import { cn } from "@/lib/utils";

export interface SelectedCell {
  moodId: string;
  regionId: string;
}

interface OfferGridProps {
  moods: OfferMood[];
  zones: ZoneGroup[];
  grid: Grid;
  selected: SelectedCell | null;
  onSelect: (cell: SelectedCell) => void;
}

// noir = objectif atteint, gris clair = partiel, pointillé rouge = rien en ligne, neutre = pas d'objectif.
const STATE_CLASS: Record<CellState, string> = {
  reached: "bg-black text-white",
  partial: "bg-neutral-200 text-neutral-900",
  missing: "border border-dashed border-red-500 text-red-600",
  none: "text-muted-foreground hover:bg-muted",
};

const STATE_HINT: Record<CellState, string> = {
  reached: "objectif atteint",
  partial: "objectif partiellement atteint",
  missing: "rien en ligne",
  none: "pas d'objectif",
};

const cellText = ({ live, target }: GridCell) => (live === 0 && target === 0 ? "" : `${live} / ${target}`);

/** La grille mood x région : « en ligne / objectif » dans chaque case, les régions groupées par zone. */
export function OfferGrid({ moods, zones, grid, selected, onSelect }: OfferGridProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th rowSpan={2} className="sticky left-0 z-10 min-w-40 border-b border-r border-border bg-card p-2 text-left align-bottom font-semibold">
              Mood
            </th>
            {zones.map(({ zone, regions }) => (
              <th
                key={zone.slug}
                colSpan={regions.length}
                className="border-b border-r border-border bg-muted/50 px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider"
              >
                {zone.name_fr}
              </th>
            ))}
            <th rowSpan={2} className="min-w-16 border-b border-border p-2 text-center align-bottom font-semibold">
              Total
            </th>
          </tr>
          <tr>
            {zones.map(({ regions }) =>
              regions.map((region, i) => (
                <th
                  key={region.id}
                  className={cn(
                    "w-20 min-w-20 border-b border-border px-1 py-1.5 text-center align-bottom text-[10px] font-medium leading-tight text-muted-foreground",
                    i === regions.length - 1 && "border-r"
                  )}
                >
                  {region.name_fr}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {moods.map((mood) => {
            const draft = mood.status !== "published";
            const total = grid.total(mood.id);
            return (
              <tr key={mood.id} className={cn(draft && "opacity-55")}>
                <th className="sticky left-0 z-10 border-b border-r border-border bg-card p-2 text-left font-medium">
                  {mood.name}
                  {draft && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">brouillon</span>}
                </th>
                {zones.map(({ regions }) =>
                  regions.map((region, i) => {
                    const cell = grid.cell(mood.id, region.id);
                    const state = cellState(cell.live, cell.target);
                    const isSelected = selected?.moodId === mood.id && selected.regionId === region.id;
                    return (
                      <td key={region.id} className={cn("border-b border-border p-1", i === regions.length - 1 && "border-r")}>
                        <button
                          type="button"
                          onClick={() => onSelect({ moodId: mood.id, regionId: region.id })}
                          aria-pressed={isSelected}
                          aria-label={`${mood.name}, ${region.name_fr} : ${cell.live} en ligne sur un objectif de ${cell.target}, ${STATE_HINT[state]}`}
                          className={cn(
                            "flex h-8 w-full items-center justify-center rounded tabular-nums transition-colors",
                            STATE_CLASS[state],
                            isSelected && "ring-2 ring-red-400 ring-offset-1"
                          )}
                        >
                          {cellText(cell)}
                        </button>
                      </td>
                    );
                  })
                )}
                <td className="border-b border-border p-2 text-center font-semibold tabular-nums">
                  {total.live} / {total.target}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** La légende des couleurs de la grille. */
export function OfferGridLegend() {
  const items: { state: CellState; label: string }[] = [
    { state: "reached", label: "Objectif atteint" },
    { state: "partial", label: "Partiel" },
    { state: "missing", label: "Rien en ligne" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      {items.map((item) => (
        <span key={item.state} className="flex items-center gap-1.5">
          <span className={cn("inline-block h-3.5 w-6 rounded", STATE_CLASS[item.state])} aria-hidden="true" />
          {item.label}
        </span>
      ))}
      <span>Case vide : pas d'objectif</span>
      <span>Chaque case : en ligne / objectif</span>
    </div>
  );
}
