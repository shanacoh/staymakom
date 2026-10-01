import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalogueEntries } from "@/lib/catalogue/queries";
import { errorMessage, useUpdateDossierVoyage } from "@/lib/dossiersVoyage/queries";
import { parseLieuxImposes, type DossierVoyage, type LieuImpose } from "@/lib/dossiersVoyage/types";

export function LieuxImposesSection({ dossier }: { dossier: DossierVoyage }) {
  const lieux = parseLieuxImposes(dossier.lieux_imposes);
  const update = useUpdateDossierVoyage(dossier.id);
  const { data: entries } = useCatalogueEntries();

  const [recherche, setRecherche] = useState("");
  const [origine, setOrigine] = useState<LieuImpose["origine"]>("impose_shana");
  const [ouvert, setOuvert] = useState(false);

  const suggestions = useMemo(() => {
    if (!entries) return [];
    const q = recherche.trim().toLowerCase();
    const dejaChoisis = new Set(lieux.map((l) => l.catalogue_item_id));
    const filtrees = q
      ? entries.filter((e) => e.display_name.toLowerCase().includes(q))
      : entries.slice(0, 20);
    return filtrees.filter((e) => !dejaChoisis.has(e.id)).slice(0, 20);
  }, [entries, recherche, lieux]);

  const ajouter = async (catalogueItemId: string, nom: string) => {
    try {
      await update.mutateAsync({
        lieux_imposes: [...lieux, { catalogue_item_id: catalogueItemId, nom, origine }],
      });
      setRecherche("");
      setOuvert(false);
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

      <div className="flex gap-2">
        <Popover open={ouvert} onOpenChange={setOuvert}>
          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Ajouter un lieu que tu veux absolument (Catalogue)"
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setOuvert(true);
                }}
                onFocus={() => setOuvert(true)}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
            <div className="max-h-64 space-y-0.5 overflow-y-auto">
              {suggestions.length === 0 && <p className="p-2 text-xs text-muted-foreground">Aucun résultat.</p>}
              {suggestions.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => ajouter(e.id, e.display_name)}
                >
                  <span className="truncate">{e.display_name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{e.display_city}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Select value={origine} onValueChange={(v) => setOrigine(v as LieuImpose["origine"])}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="impose_shana">Imposé par toi</SelectItem>
            <SelectItem value="demande_client">Demandé par le client</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
