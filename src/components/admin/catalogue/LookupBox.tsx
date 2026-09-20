import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/catalogue/queries";
import {
  mergeSuggestion,
  toUrl,
  type AppliedLookup,
  type LookupCandidate,
  type LookupResponse,
} from "@/lib/catalogue/lookup";
import { useCatalogueLookup } from "@/lib/catalogue/lookupApi";
import { PLACE_TYPE_OPTIONS, labelOf } from "@/lib/catalogue/types";

interface LookupBoxProps {
  query: string;
  onQueryChange: (value: string) => void;
  label: string;
  placeholder: string;
  autoFocus?: boolean;
  knownRegions: string[];
  /** Appelée dès qu'on a de quoi remplir la fiche (et de nouveau après le choix d'un lieu). */
  onApply: (applied: AppliedLookup) => void;
}

/**
 * Zone "lien ou nom" : lance la recherche (bouton, touche Entrée, ou dès qu'un lien est collé).
 * Pour un nom, propose les lieux trouvés : c'est Shana qui choisit le bon, rien n'est deviné.
 */
export function LookupBox({ query, onQueryChange, label, placeholder, autoFocus, knownRegions, onApply }: LookupBoxProps) {
  const lookup = useCatalogueLookup();
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);

  const run = async (text: string) => {
    const q = text.trim();
    if (!q || lookup.isPending) return;
    setError(null);
    setResult(null);
    setPickedLabel(null);
    try {
      const response = await lookup.mutateAsync({ query: q, knownRegions });
      setResult(response);
      // Un site ou une publication remplit la fiche tout de suite ; un nom attend qu'on choisisse le lieu
      if (response.kind !== "name") {
        onApply({ suggestion: response.suggestion, link: response.link, sources: response.sources });
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const pick = async (candidate: LookupCandidate) => {
    if (!result) return;
    setPicking(true);
    let suggestion = candidate.suggestion;
    let link = result.link;
    let sources = result.kind === "name" ? ["OpenStreetMap"] : [...result.sources];

    if (result.kind === "social") {
      // Les infos de la carte priment, la description et le type venant de la publication complètent
      suggestion = mergeSuggestion(candidate.suggestion, result.suggestion);
    } else if (candidate.suggestion.website) {
      // Le lieu a un site : on le lit pour compléter (description, Instagram...), sans jamais bloquer le choix
      try {
        const site = await lookup.mutateAsync({ query: candidate.suggestion.website, knownRegions });
        suggestion = mergeSuggestion(candidate.suggestion, site.suggestion);
        link = site.link;
        sources = [...sources, ...site.sources.filter((s) => s !== "OpenStreetMap")];
      } catch {
        // Le site ne répond pas : on garde ce que la carte a donné
      }
    }
    onApply({ suggestion, link, sources });
    setPickedLabel(candidate.label);
    setPicking(false);
  };

  const showCandidates = result && result.candidates.length > 0 && !pickedLabel;

  return (
    <div className="space-y-2">
      <Label htmlFor="catalogue-lookup">{label}</Label>
      <div className="flex gap-2">
        <Input
          id="catalogue-lookup"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            // Entrée lance la recherche, elle ne doit pas envoyer tout le formulaire
            if (e.key === "Enter") {
              e.preventDefault();
              run(query);
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (toUrl(pasted)) {
              e.preventDefault();
              onQueryChange(pasted.trim());
              run(pasted);
            }
          }}
          placeholder={placeholder}
          inputMode="url"
          autoComplete="off"
        />
        <Button type="button" variant="outline" onClick={() => run(query)} disabled={lookup.isPending || picking || !query.trim()}>
          {lookup.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
          Rechercher
        </Button>
      </div>

      {(lookup.isPending || picking) && (
        <p className="text-xs text-muted-foreground" role="status">
          Recherche en cours, ça peut prendre quelques secondes...
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result?.warnings.map((warning) => (
        <p key={warning} className="text-xs text-amber-700">
          {warning}
        </p>
      ))}

      {showCandidates && (
        <div className="space-y-1.5 rounded-lg border border-border p-2">
          <p className="px-1 text-xs font-medium">
            {result.kind === "name" ? "Quel lieu est le bon ?" : "Est-ce l'un de ces lieux ? (facultatif)"}
          </p>
          <ul className="space-y-1">
            {result.candidates.map((candidate) => (
              <li key={candidate.label}>
                <button
                  type="button"
                  disabled={picking}
                  onClick={() => pick(candidate)}
                  className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <div className="text-sm font-medium">{candidate.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {[labelOf(PLACE_TYPE_OPTIONS, candidate.suggestion.place_type), candidate.suggestion.address]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pickedLabel && <p className="text-xs text-green-700">Lieu choisi : {pickedLabel}</p>}
    </div>
  );
}
