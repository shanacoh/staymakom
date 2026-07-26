import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { useSwipePropositions, type PropositionFilters } from "@/lib/swipe/queries";
import { PropositionForm } from "./PropositionForm";

interface PropositionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dejaAjoutees: Set<string>;
  onAjouter: (propositionId: string) => void;
}

export const PropositionPicker = ({ open, onOpenChange, dejaAjoutees, onAjouter }: PropositionPickerProps) => {
  const [recherche, setRecherche] = useState("");
  const [creationOpen, setCreationOpen] = useState(false);
  const filters: PropositionFilters = { recherche, statut: "actif" };
  const { data: propositions, isLoading } = useSwipePropositions(filters);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajouter une proposition au dossier</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Rechercher dans la bibliothèque..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                autoFocus
              />
            </div>
            <Button variant="outline" onClick={() => setCreationOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Créer une nouvelle proposition
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading && <p className="text-muted-foreground text-sm">Recherche...</p>}
            {!isLoading && propositions?.length === 0 && (
              <p className="text-muted-foreground text-sm">Aucune proposition trouvée.</p>
            )}
            {propositions?.map((p) => {
              const dejaDansDossier = dejaAjoutees.has(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 border rounded-md p-2">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-10 h-10 object-cover rounded-md" />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded-md" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.titre}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {p.swipe_categories?.nom && <Badge variant="outline">{p.swipe_categories.nom}</Badge>}
                      {p.ville && <span>{p.ville}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={dejaDansDossier ? "outline" : "default"}
                    disabled={dejaDansDossier}
                    onClick={() => onAjouter(p.id)}
                  >
                    {dejaDansDossier ? "Déjà ajoutée" : "Ajouter"}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <PropositionForm
        open={creationOpen}
        onOpenChange={setCreationOpen}
        onSaved={(id) => {
          onAjouter(id);
        }}
      />
    </>
  );
};
