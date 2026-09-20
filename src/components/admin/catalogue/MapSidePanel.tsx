import { ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, type MapPoint } from "@/lib/catalogue/map";
import { PLACE_TYPE_OPTIONS, labelOf, type CatalogueEntry } from "@/lib/catalogue/types";
import { Highlighted } from "./Highlighted";
import { LocateList, type SuggestedPosition } from "./LocateList";
import { PositionAlerts } from "./PositionAlerts";

export type SideTab = "places" | "missing" | "suspect";

interface MapSidePanelProps {
  tab: SideTab;
  onTabChange: (tab: SideTab) => void;
  points: MapPoint[];
  missing: CatalogueEntry[];
  suspect: CatalogueEntry[];
  siteBad: CatalogueEntry[];
  terms: string[];
  knownRegions: string[];
  placingId: string | null;
  onHover: (id: string | null) => void;
  onFocus: (id: string) => void;
  onOpen: (id: string) => void;
  onSuggest: (entry: CatalogueEntry, position: SuggestedPosition) => void;
  onStartPlacing: (entry: CatalogueEntry) => void;
  onCancelPlacing: () => void;
}

/**
 * La liste à côté de la carte. « Lieux » : les lieux affichés, survoler l'un met son repère en évidence
 * sur la carte, cliquer y zoome. « À localiser » : les lieux sans position. « À corriger » : les positions
 * qui ne sont pas en Israël (rouge, avec leur nombre).
 */
export function MapSidePanel({
  tab,
  onTabChange,
  points,
  missing,
  suspect,
  siteBad,
  terms,
  knownRegions,
  placingId,
  onHover,
  onFocus,
  onOpen,
  onSuggest,
  onStartPlacing,
  onCancelPlacing,
}: MapSidePanelProps) {
  const sorted = [...points].sort((a, b) =>
    a.entry.display_name.localeCompare(b.entry.display_name, "fr", { sensitivity: "base" })
  );
  const problems = suspect.length + siteBad.length;

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <Tabs value={tab} onValueChange={(value) => onTabChange(value as SideTab)}>
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="places" className="text-xs">
            Lieux <span className="ml-1 text-muted-foreground">{points.length}</span>
          </TabsTrigger>
          <TabsTrigger value="missing" className="text-xs">
            À localiser <span className="ml-1 text-muted-foreground">{missing.length}</span>
          </TabsTrigger>
          <TabsTrigger value="suspect" className={cn("text-xs", problems > 0 && "text-destructive")}>
            À corriger <span className={cn("ml-1", problems > 0 ? "font-semibold" : "text-muted-foreground")}>{problems}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "places" && (
        <div>
          {sorted.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Aucun lieu avec une position ne correspond à ces filtres.
            </p>
          ) : (
            <ul className="max-h-[65vh] space-y-1 overflow-y-auto pr-1" onMouseLeave={() => onHover(null)}>
              {sorted.map((point) => {
                const { entry } = point;
                const where = [labelOf(PLACE_TYPE_OPTIONS, entry.place_type), entry.display_city].filter(Boolean).join(" · ");
                return (
                  <li
                    key={point.id}
                    className="group flex items-center gap-1 rounded-lg border border-transparent hover:border-border hover:bg-muted/50"
                    onMouseEnter={() => onHover(point.id)}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left"
                      onClick={() => onFocus(point.id)}
                      onFocus={() => onHover(point.id)}
                      onBlur={() => onHover(null)}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full border border-white shadow"
                        style={{ background: STATUS_COLORS[entry.commercial_status] }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          <Highlighted text={entry.display_name} terms={terms} />
                        </span>
                        {where && (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            <Highlighted text={where} terms={terms} />
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpen(entry.id)}
                      className="mr-1.5 rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                      aria-label={`Ouvrir la fiche de ${entry.display_name}`}
                      title="Ouvrir la fiche"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "missing" && (
        <LocateList
          entries={missing}
          knownRegions={knownRegions}
          placingId={placingId}
          onSuggest={onSuggest}
          onStartPlacing={onStartPlacing}
          onCancelPlacing={onCancelPlacing}
          onOpen={onOpen}
        />
      )}

      {tab === "suspect" &&
        (problems === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Aucune position hors d'Israël : tout est en ordre.
          </p>
        ) : (
          <PositionAlerts
            suspect={suspect}
            siteBad={siteBad}
            knownRegions={knownRegions}
            placingId={placingId}
            onSuggest={onSuggest}
            onStartPlacing={onStartPlacing}
            onCancelPlacing={onCancelPlacing}
            onOpen={onOpen}
          />
        ))}
    </div>
  );
}
