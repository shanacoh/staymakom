import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalogueEntries } from "@/lib/catalogue/queries";
import { PLACE_TYPE_OPTIONS } from "@/lib/catalogue/types";
import { errorMessage, useUpdateDossierVoyage } from "@/lib/dossiersVoyage/queries";
import { parseLieuxImposes, type DossierVoyage, type LieuImpose } from "@/lib/dossiersVoyage/types";

function labelPlaceType(placeType: string): string {
  return PLACE_TYPE_OPTIONS.find((o) => o.value === placeType)?.label ?? placeType;
}

export function LieuxImposesSection({ dossier }: { dossier: DossierVoyage }) {
  const lieux = parseLieuxImposes(dossier.lieux_imposes);
  const update = useUpdateDossierVoyage(dossier.id);
  const { data: entries, isLoading } = useCatalogueEntries();

  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [origine, setOrigine] = useState<LieuImpose["origine"]>("impose_shana");

  const resultats = useMemo(() => {
    if (!entries) return [];
    const q = recherche.trim().toLowerCase();
    const dejaChoisis = new Set(lieux.map((l) => l.catalogue_item_id));
    const filtrees = q
      ? entries.filter((e) => e.display_name.toLowerCase().includes(q) || (e.display_city ?? "").toLowerCase().includes(q))
      : entries;
    return filtrees.filter((e) => !dejaChoisis.has(e.id)).slice(0, 50);
  }, [entries, recherche, lieux]);

  const ajouter = async (catalogueItemId: string, nom: string) => {
    try {
      await update.mutateAsync({
        lieux_imposes: [...lieux, { catalogue_item_id: catalogueItemId, nom, origine }],
      });
      toast.success("Lieu ajouté");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const retirer = async (catalogueItemId: string) => {
    try {
      await update.mutateAsync({
        lieux_imposes: lieux.filter((l) => l.catalogue_item_id !== catalogueItemId),
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lieux imposés</h3>
        <span className="text-[10px] text-muted-foreground">Toujours gardés par l'IA</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {lieux.length === 0 && <p className="text-sm text-muted-foreground">Aucun lieu imposé pour l'instant.</p>}
        {lieux.map((l) => (
          <Badge
            key={l.catalogue_item_id}
            variant="outline"
            className={l.origine === "impose_shana" ? "border-red-200 bg-red-50 text-red-700" : "border-sky-200 bg-sky-50 text-sky-700"}
          >
            {l.nom} · {l.origine === "impose_shana" ? "par toi" : "demande client"}
            <button type="button" onClick={() => retirer(l.catalogue_item_id)} className="ml-1.5 hover:opacity-70" aria-label={`Retirer ${l.nom}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => setDialogOuvert(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Ajouter un lieu que tu veux absolument (Catalogue)
      </Button>

      <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>Ajouter un lieu imposé</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Rechercher dans le Catalogue (hôtel, restaurant, activité...)"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                autoFocus
              />
            </div>
            <Select value={origine} onValueChange={(v) => setOrigine(v as LieuImpose["origine"])}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impose_shana">Imposé par toi</SelectItem>
                <SelectItem value="demande_client">Demandé par le client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {isLoading && <p className="p-2 text-sm text-muted-foreground">Chargement...</p>}
            {!isLoading && resultats.length === 0 && <p className="p-2 text-sm text-muted-foreground">Aucun résultat.</p>}
            {resultats.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => ajouter(e.id, e.display_name)}
                className="flex w-full items-center gap-3 rounded-md border p-2 text-left text-sm hover:bg-muted"
              >
                {e.display_image ? (
                  <img src={e.display_image} alt="" className="h-10 w-10 rounded-md object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.display_name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {labelPlaceType(e.place_type)}
                    </Badge>
                    {e.display_city && <span>{e.display_city}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
