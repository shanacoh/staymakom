import { useState } from "react";
import { Crosshair, Link2, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/catalogue/queries";
import { toUrl, type LookupCandidate } from "@/lib/catalogue/lookup";
import { useCatalogueLookup } from "@/lib/catalogue/lookupApi";
import { formatPosition, isInIsrael, positionOf } from "@/lib/catalogue/geo";
import { locateQueries } from "@/lib/catalogue/map";
import { PLACE_TYPE_OPTIONS, labelOf, type CatalogueEntry } from "@/lib/catalogue/types";
import { SiteBadge } from "./CatalogueBadges";

export interface SuggestedPosition {
  lat: number;
  lng: number;
  label: string;
}

interface LocateListProps {
  entries: CatalogueEntry[];
  knownRegions: string[];
  placingId: string | null;
  onSuggest: (entry: CatalogueEntry, position: SuggestedPosition) => void;
  onStartPlacing: (entry: CatalogueEntry) => void;
  onCancelPlacing: () => void;
  onOpen: (id: string) => void;
  /** Titre de la liste (par défaut "À localiser"). */
  title?: string;
  /** Texte quand la liste est vide. */
  emptyText?: string;
  /** Affiche la position actuelle de chaque lieu (pour les positions à corriger). */
  showPosition?: boolean;
  listClassName?: string;
}

const PAGE = 25;

type Mode = "idle" | "link";

function candidateLabel(candidate: LookupCandidate): string {
  const { latitude, longitude, address } = candidate.suggestion;
  const position = positionOf(latitude, longitude);
  const outside = position && !isInIsrael(position.lat, position.lng) ? "hors d'Israël" : null;
  return [candidate.label, address, outside].filter(Boolean).join(" · ");
}

function LocateRow({
  entry,
  knownRegions,
  placing,
  onSuggest,
  onStartPlacing,
  onCancelPlacing,
  onOpen,
  showPosition,
}: {
  entry: CatalogueEntry;
  knownRegions: string[];
  showPosition: boolean;
  placing: boolean;
  onSuggest: LocateListProps["onSuggest"];
  onStartPlacing: LocateListProps["onStartPlacing"];
  onCancelPlacing: LocateListProps["onCancelPlacing"];
  onOpen: LocateListProps["onOpen"];
}) {
  const lookup = useCatalogueLookup();
  const [mode, setMode] = useState<Mode>("idle");
  const [linkText, setLinkText] = useState("");
  const [candidates, setCandidates] = useState<LookupCandidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const suggest = (candidate: LookupCandidate) => {
    const { latitude, longitude } = candidate.suggestion;
    if (latitude === null || longitude === null) return;
    onSuggest(entry, { lat: latitude, lng: longitude, label: candidateLabel(candidate) });
    setCandidates([]);
  };

  const search = async () => {
    setMessage(null);
    setCandidates([]);
    onCancelPlacing();
    try {
      // De la recherche la plus précise à la plus large, jusqu'à trouver quelque chose
      for (const query of locateQueries(entry)) {
        const result = await lookup.mutateAsync({ query, knownRegions });
        const found = result.candidates.filter((c) => c.suggestion.latitude !== null && c.suggestion.longitude !== null);
        if (found.length > 0) {
          setCandidates(found);
          return;
        }
      }
      setMessage("Rien trouvé sur la carte. Essaie de cliquer sur la carte ou de coller un lien Google Maps.");
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const fromLink = async () => {
    setMessage(null);
    const url = toUrl(linkText);
    if (!url) {
      setMessage("Colle un lien complet (Google Maps ou le site du lieu).");
      return;
    }
    try {
      const result = await lookup.mutateAsync({ query: url, knownRegions });
      const { latitude, longitude, address } = result.suggestion;
      if (latitude === null || longitude === null) {
        setMessage("Ce lien ne contient pas de position lisible.");
        return;
      }
      onSuggest(entry, { lat: latitude, lng: longitude, label: [result.suggestion.name, address].filter(Boolean).join(" · ") || "Position du lien" });
      setMode("idle");
      setLinkText("");
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const where = [labelOf(PLACE_TYPE_OPTIONS, entry.place_type), entry.display_city ?? entry.display_region].filter(Boolean).join(" · ");
  const current = showPosition ? positionOf(entry.display_latitude, entry.display_longitude) : null;
  const siteValue = positionOf(entry.live_latitude, entry.live_longitude);
  const fromSite = !!current && !!siteValue && current.lat === siteValue.lat && current.lng === siteValue.lng;

  return (
    <li className={cn("space-y-2 rounded-lg border border-border bg-card p-3", placing && "border-[#ad1414] ring-1 ring-[#ad1414]/30")}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="min-w-0 text-left" onClick={() => onOpen(entry.id)}>
          <div className="truncate text-sm font-medium hover:underline">{entry.display_name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <SiteBadge entry={entry} />
            {where && <span>{where}</span>}
          </div>
        </button>
      </div>

      {current && (
        <p className="text-[11px] text-destructive">
          Position actuelle : {formatPosition(current.lat, current.lng)} ({fromSite ? "écrite sur la fiche du site" : "dans le catalogue"})
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={search} disabled={lookup.isPending}>
          {lookup.isPending && mode === "idle" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Search className="mr-1 h-3 w-3" />}
          Chercher
        </Button>
        <Button
          type="button"
          size="sm"
          variant={placing ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => (placing ? onCancelPlacing() : onStartPlacing(entry))}
        >
          <Crosshair className="mr-1 h-3 w-3" />
          {placing ? "Annuler" : "Cliquer sur la carte"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setMode(mode === "link" ? "idle" : "link")}>
          <Link2 className="mr-1 h-3 w-3" />
          Lien Maps
        </Button>
      </div>

      {placing && <p className="text-[11px] text-[#ad1414]">Clique sur la carte à l'endroit exact du lieu.</p>}

      {mode === "link" && (
        <div className="flex gap-1.5">
          <Input
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                fromLink();
              }
            }}
            placeholder="https://maps.app.goo.gl/..."
            inputMode="url"
            className="h-8 text-xs"
            aria-label="Lien Google Maps du lieu"
          />
          <Button type="button" size="sm" className="h-8" onClick={fromLink} disabled={lookup.isPending || !linkText.trim()}>
            {lookup.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "OK"}
          </Button>
        </div>
      )}

      {message && <p className="text-[11px] text-amber-700">{message}</p>}

      {candidates.length > 0 && (
        <ul className="space-y-1 rounded-md border border-border p-1.5">
          <li className="px-1 text-[11px] font-medium">C'est lequel ?</li>
          {candidates.map((candidate) => (
            <li key={candidate.label}>
              <button
                type="button"
                onClick={() => suggest(candidate)}
                className="flex w-full items-start gap-1.5 rounded px-1.5 py-1 text-left text-xs transition-colors hover:bg-muted"
              >
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <span>{candidateLabel(candidate)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Les lieux affichés qui n'ont pas de position sur la carte. Trois façons de les placer : chercher
 * (adresse ou nom), cliquer sur la carte, ou coller un lien Google Maps. La position n'est enregistrée
 * qu'après confirmation sur la carte.
 */
export function LocateList({
  entries,
  knownRegions,
  placingId,
  onSuggest,
  onStartPlacing,
  onCancelPlacing,
  onOpen,
  title = "À localiser",
  emptyText = "Tous les lieux affichés ont une position sur la carte.",
  showPosition = false,
  listClassName = "max-h-[65vh]",
}: LocateListProps) {
  const [visible, setVisible] = useState(PAGE);

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title} ({entries.length})
      </h2>
      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <>
          <ul className={cn("space-y-2 overflow-y-auto pr-1", listClassName)}>
            {entries.slice(0, visible).map((entry) => (
              <LocateRow
                key={entry.id}
                entry={entry}
                knownRegions={knownRegions}
                showPosition={showPosition}
                placing={placingId === entry.id}
                onSuggest={onSuggest}
                onStartPlacing={onStartPlacing}
                onCancelPlacing={onCancelPlacing}
                onOpen={onOpen}
              />
            ))}
          </ul>
          {entries.length > visible && (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setVisible((n) => n + PAGE)}>
              Afficher la suite ({entries.length - visible} de plus)
            </Button>
          )}
        </>
      )}
    </div>
  );
}
