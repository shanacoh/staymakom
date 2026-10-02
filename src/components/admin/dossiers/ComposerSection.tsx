import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Lock, Plus, Search, Sparkles, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueEntries } from "@/lib/catalogue/queries";
import type { CatalogueEntry } from "@/lib/catalogue/types";
import {
  errorMessage,
  useCreateLigne,
  useDeleteLigne,
  useDossierVersions,
  useEnsureVersionActive,
  useGenerateComposer,
  useUpdateLigne,
  useVersionLignes,
} from "@/lib/dossiersVoyage/queries";
import {
  NATURE_LIGNE_OPTIONS,
  ORIGINE_LIGNE_OPTIONS,
  placeTypeVersNature,
  type DossierVoyageLigne,
  type OrigineLigne,
} from "@/lib/dossiersVoyage/types";

function CataloguePickerDialog({
  open,
  onOpenChange,
  jour,
  onAjouter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jour: number;
  onAjouter: (entry: CatalogueEntry, origine: OrigineLigne) => void;
}) {
  const { data: entries, isLoading } = useCatalogueEntries();
  const [recherche, setRecherche] = useState("");
  const [origine, setOrigine] = useState<OrigineLigne>("impose_shana");

  const filtrees = useMemo(() => {
    if (!entries) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return entries.slice(0, 50);
    return entries
      .filter((e) => e.display_name.toLowerCase().includes(q) || (e.display_city ?? "").toLowerCase().includes(q))
      .slice(0, 50);
  }, [entries, recherche]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter un lieu au jour {jour}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Rechercher dans le Catalogue..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              autoFocus
            />
          </div>
          <Select value={origine} onValueChange={(v) => setOrigine(v as OrigineLigne)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORIGINE_LIGNE_OPTIONS.filter((o) => o.value !== "ia").map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {!isLoading && filtrees.length === 0 && <p className="text-sm text-muted-foreground">Aucun lieu trouvé.</p>}
          {filtrees.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-md border p-2">
              {e.display_image ? (
                <img src={e.display_image} alt="" className="h-10 w-10 rounded-md object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.display_name}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{e.place_type}</Badge>
                  {e.display_city && <span>{e.display_city}</span>}
                </div>
              </div>
              <Button size="sm" onClick={() => onAjouter(e, origine)}>
                Ajouter
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LigneRow({
  ligne,
  nomLieu,
  villeLieu,
  onDelete,
  onToggleVerrou,
}: {
  ligne: DossierVoyageLigne;
  nomLieu: string | null;
  villeLieu: string | null;
  onDelete: () => void;
  onToggleVerrou: () => void;
}) {
  const natureLabel = NATURE_LIGNE_OPTIONS.find((o) => o.value === ligne.nature)?.label ?? ligne.nature;
  const origineOption = ORIGINE_LIGNE_OPTIONS.find((o) => o.value === ligne.origine);
  const titre = ligne.texte_libre || nomLieu || natureLabel;
  return (
    <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{titre}</span>
          <Badge variant="outline" className="text-[10px]">
            {natureLabel}
          </Badge>
          {villeLieu && <span className="text-xs text-muted-foreground">{villeLieu}</span>}
          {origineOption && (
            <Badge
              variant="outline"
              className={`text-[10px] ${ligne.origine === "ia" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-indigo-200 bg-indigo-50 text-indigo-700"}`}
            >
              {origineOption.label}
            </Badge>
          )}
          {ligne.casher && (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-[10px] text-green-700">
              Casher
            </Badge>
          )}
          {ligne.alerte_a_contacter && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">
              <AlertTriangle className="mr-1 h-3 w-3" />
              À contacter avant envoi
            </Badge>
          )}
        </div>
        {(ligne.cout_achat_estime != null || ligne.prix_vente_estime != null) && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ligne.cout_achat_estime != null && <>Achat ~{ligne.cout_achat_estime} </>}
            {ligne.prix_vente_estime != null && <>· Vente ~{ligne.prix_vente_estime}</>}
          </p>
        )}
      </div>
      {ligne.origine === "ia" && (
        <Button size="icon" variant="ghost" title={ligne.verrouillee_regeneration ? "Déverrouiller" : "Verrouiller (survit à une régénération)"} onClick={onToggleVerrou}>
          {ligne.verrouillee_regeneration ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </Button>
      )}
      <Button size="icon" variant="ghost" onClick={onDelete} title="Retirer">
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

export function ComposerSection({ dossierId, versionActiveId }: { dossierId: string; versionActiveId: string | null }) {
  const ensureVersion = useEnsureVersionActive(dossierId);
  const { data: versions } = useDossierVersions(dossierId);
  const { data: lignes } = useVersionLignes(versionActiveId ?? undefined);
  const { data: catalogueEntries } = useCatalogueEntries();
  const catalogueParId = useMemo(() => new Map((catalogueEntries ?? []).map((e) => [e.id, e])), [catalogueEntries]);
  const createLigne = useCreateLigne(versionActiveId ?? "");
  const updateLigne = useUpdateLigne(versionActiveId ?? "");
  const deleteLigne = useDeleteLigne(versionActiveId ?? "");
  const generateComposer = useGenerateComposer(dossierId, versionActiveId ?? "");

  const [pickerJour, setPickerJour] = useState<number | null>(null);
  const [consigne, setConsigne] = useState("");

  const versionActive = versions?.find((v) => v.id === versionActiveId);
  const joursPresents = lignes ? Array.from(new Set(lignes.map((l) => l.jour))).sort((a, b) => a - b) : [];
  const dernierJour = joursPresents.length > 0 ? joursPresents[joursPresents.length - 1] : 0;

  const demarrer = async () => {
    try {
      await ensureVersion.mutateAsync();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const ajouterLigne = async (entry: CatalogueEntry, origine: OrigineLigne, jour: number) => {
    try {
      await createLigne.mutateAsync({
        jour,
        ordre: lignes?.filter((l) => l.jour === jour).length ?? 0,
        nature: placeTypeVersNature(entry.place_type),
        origine,
        catalogue_item_id: entry.id,
        casher: null,
        fiche_jamais_formalisee: entry.commercial_status !== "partenaire",
        alerte_a_contacter: entry.commercial_status !== "partenaire",
        cout_achat_estime: entry.prix_achat,
        prix_vente_estime: entry.prix_client,
      });
      setPickerJour(null);
      toast.success("Lieu ajouté");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const retirerLigne = async (id: string) => {
    try {
      await deleteLigne.mutateAsync(id);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const toggleVerrou = async (ligne: DossierVoyageLigne) => {
    try {
      await updateLigne.mutateAsync({ id: ligne.id, patch: { verrouillee_regeneration: !ligne.verrouillee_regeneration } });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const regenerer = async () => {
    try {
      const n = await generateComposer.mutateAsync(consigne);
      toast.success(`${n} ligne(s) générée(s) par l'IA`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (!versionActiveId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Composer</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={demarrer} disabled={ensureVersion.isPending}>
            {ensureVersion.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Démarrer le programme (version R1)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">
          Composer — {versionActive?.label ?? "Version"}
          {versionActive?.prix_total_vente != null && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Prix total ~{versionActive.prix_total_vente} (achat ~{versionActive.prix_total_achat ?? 0})
            </span>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setPickerJour(dernierJour + 1 || 1)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter un jour
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {joursPresents.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun lieu dans le programme pour l'instant.</p>
        )}
        {joursPresents.map((jour) => (
          <div key={jour} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Jour {jour}</Label>
              <Button size="sm" variant="ghost" onClick={() => setPickerJour(jour)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Ajouter à ce jour
              </Button>
            </div>
            <div className="space-y-1.5">
              {(lignes ?? [])
                .filter((l) => l.jour === jour)
                .map((l) => {
                  const fiche = l.catalogue_item_id ? catalogueParId.get(l.catalogue_item_id) : undefined;
                  return (
                    <LigneRow
                      key={l.id}
                      ligne={l}
                      nomLieu={fiche?.display_name ?? null}
                      villeLieu={fiche?.display_city ?? null}
                      onDelete={() => retirerLigne(l.id)}
                      onToggleVerrou={() => toggleVerrou(l)}
                    />
                  );
                })}
            </div>
          </div>
        ))}

        <div className="space-y-1.5 border-t pt-4">
          <Label htmlFor="composer-consigne">Régénérer avec l'IA</Label>
          <p className="text-[11px] text-muted-foreground">
            Les lieux imposés, demandés par le client, ou verrouillés (🔒) sont toujours conservés. Seules les
            suggestions IA non verrouillées sont remplacées.
          </p>
          <Textarea
            id="composer-consigne"
            rows={2}
            value={consigne}
            onChange={(e) => setConsigne(e.target.value)}
            placeholder="Consigne libre (facultatif) : ex. « plus d'activités nature, moins de musées »"
          />
          <Button variant="outline" onClick={regenerer} disabled={generateComposer.isPending}>
            {generateComposer.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            {joursPresents.length > 0 ? "Régénérer avec l'IA" : "Générer avec l'IA"}
          </Button>
        </div>
      </CardContent>

      {pickerJour != null && (
        <CataloguePickerDialog
          open
          onOpenChange={(o) => !o && setPickerJour(null)}
          jour={pickerJour}
          onAjouter={(entry, origine) => ajouterLigne(entry, origine, pickerJour)}
        />
      )}
    </Card>
  );
}
