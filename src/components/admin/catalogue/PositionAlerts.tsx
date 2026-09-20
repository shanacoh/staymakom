import { Link } from "react-router-dom";
import { AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPosition, positionOf } from "@/lib/catalogue/geo";
import { siteEditPath, type CatalogueEntry } from "@/lib/catalogue/types";
import { LocateList, type SuggestedPosition } from "./LocateList";

interface PositionAlertsProps {
  /** Lieux dont la position affichée n'est pas en Israël. */
  suspect: CatalogueEntry[];
  /** Fiches du site dont la propre position n'est pas en Israël (vue par les clients). */
  siteBad: CatalogueEntry[];
  knownRegions: string[];
  placingId: string | null;
  onSuggest: (entry: CatalogueEntry, position: SuggestedPosition) => void;
  onStartPlacing: (entry: CatalogueEntry) => void;
  onCancelPlacing: () => void;
  onOpen: (id: string) => void;
}

/**
 * Alertes de position. Tous les lieux sont en Israël : une position ailleurs est une erreur de données.
 * Première alerte : la position affichée dans le catalogue (elle n'est pas dessinée sur la carte, avec les
 * outils pour la corriger). Seconde alerte : la fiche du site elle-même est fausse, donc les clients voient
 * une mauvaise carte, même si le catalogue a été corrigé.
 */
export function PositionAlerts({
  suspect,
  siteBad,
  knownRegions,
  placingId,
  onSuggest,
  onStartPlacing,
  onCancelPlacing,
  onOpen,
}: PositionAlertsProps) {
  if (suspect.length === 0 && siteBad.length === 0) return null;

  return (
    <div className="space-y-3">
      {suspect.length > 0 && (
        <section role="alert" className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-destructive">
                {suspect.length} lieu{suspect.length > 1 ? "x" : ""} avec une position hors d'Israël : à corriger
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tous les lieux sont en Israël : une position ailleurs est une erreur de données (par exemple 1, 1, ou
                latitude et longitude inversées). Ces lieux ne sont pas dessinés sur la carte. Corrige-les ici, avec
                « Chercher », « Cliquer sur la carte » ou « Lien Maps ».
              </p>
            </div>
          </div>
          <LocateList
            entries={suspect}
            knownRegions={knownRegions}
            placingId={placingId}
            onSuggest={onSuggest}
            onStartPlacing={onStartPlacing}
            onCancelPlacing={onCancelPlacing}
            onOpen={onOpen}
            title="Positions à corriger"
            showPosition
            listClassName="max-h-[40vh]"
          />
        </section>
      )}

      {siteBad.length > 0 && (
        <section role="alert" className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/60 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-amber-800">
                {siteBad.length} fiche{siteBad.length > 1 ? "s" : ""} du site avec une position aberrante, vue par les clients
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                La page de ces fiches affiche une carte au mauvais endroit, et son lien « itinéraire » y mène. Corriger
                la position dans le catalogue ne change pas la fiche du site : modifie la position sur la fiche elle-même.
              </p>
            </div>
          </div>
          <ul className="max-h-[30vh] space-y-1 overflow-y-auto pr-1">
            {siteBad.map((entry) => {
              const position = positionOf(entry.live_latitude, entry.live_longitude);
              const editPath = siteEditPath(entry);
              return (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background/70 px-2.5 py-1.5 text-xs">
                  <span className="min-w-0">
                    <button type="button" className="font-medium hover:underline" onClick={() => onOpen(entry.id)}>
                      {entry.display_name}
                    </button>
                    {position && (
                      <span className="ml-2 text-muted-foreground">position : {formatPosition(position.lat, position.lng)}</span>
                    )}
                  </span>
                  {editPath && (
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link to={editPath}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Modifier la fiche
                      </Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
