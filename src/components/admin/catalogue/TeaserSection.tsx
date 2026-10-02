import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueItemTeaser, useUpsertCatalogueItemTeaser } from "@/lib/catalogue/teaserQueries";

interface TeaserDraft {
  nom_code: string;
  nom_code_en: string;
  nom_code_he: string;
  description_sensorielle: string;
  description_sensorielle_en: string;
  description_sensorielle_he: string;
  visuel_url: string;
  secteur_libelle: string;
  secteur_rayon_km: string;
  pret: boolean;
}

const vide: TeaserDraft = {
  nom_code: "",
  nom_code_en: "",
  nom_code_he: "",
  description_sensorielle: "",
  description_sensorielle_en: "",
  description_sensorielle_he: "",
  visuel_url: "",
  secteur_libelle: "",
  secteur_rayon_km: "15",
  pret: false,
};

/**
 * Habillage "teaser" d'une fiche Catalogue pour l'étape Proposition (ce que voit le client avant
 * paiement) : un nom de code, une description qui fait rêver sans tout dévoiler, et un secteur
 * flouté sur la carte plutôt que l'adresse exacte. Tant que le statut n'est pas "prêt", cette fiche
 * n'apparaît simplement pas dans un Composer envoyé au client (voir dossier_voyage_get_proposition_lignes_by_token).
 */
export function TeaserSection({ catalogueItemId }: { catalogueItemId: string }) {
  const { data: teaser } = useCatalogueItemTeaser(catalogueItemId);
  const upsert = useUpsertCatalogueItemTeaser(catalogueItemId);
  const [draft, setDraft] = useState<TeaserDraft>(vide);

  useEffect(() => {
    if (!teaser) return;
    setDraft({
      nom_code: teaser.nom_code ?? "",
      nom_code_en: teaser.nom_code_en ?? "",
      nom_code_he: teaser.nom_code_he ?? "",
      description_sensorielle: teaser.description_sensorielle ?? "",
      description_sensorielle_en: teaser.description_sensorielle_en ?? "",
      description_sensorielle_he: teaser.description_sensorielle_he ?? "",
      visuel_url: teaser.visuel_url ?? "",
      secteur_libelle: teaser.secteur_libelle ?? "",
      secteur_rayon_km: String(teaser.secteur_rayon_km ?? 15),
      pret: teaser.statut === "pret",
    });
  }, [teaser]);

  const enregistrer = async () => {
    if (!draft.nom_code.trim()) {
      toast.error("Le nom de code est obligatoire pour pouvoir passer en « prêt »");
      return;
    }
    try {
      await upsert.mutateAsync({
        nom_code: draft.nom_code.trim(),
        nom_code_en: draft.nom_code_en.trim() || null,
        nom_code_he: draft.nom_code_he.trim() || null,
        description_sensorielle: draft.description_sensorielle.trim() || null,
        description_sensorielle_en: draft.description_sensorielle_en.trim() || null,
        description_sensorielle_he: draft.description_sensorielle_he.trim() || null,
        visuel_url: draft.visuel_url.trim() || null,
        secteur_libelle: draft.secteur_libelle.trim() || null,
        secteur_rayon_km: draft.secteur_rayon_km ? Number(draft.secteur_rayon_km) : 15,
        statut: draft.pret ? "pret" : "brouillon",
      });
      toast.success("Teaser enregistré");
    } catch (error) {
      toast.error("Échec de l'enregistrement du teaser");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          Ce que verra le client avant paiement — jamais le nom réel, l'adresse ou le prix par ligne.
        </p>
        <Badge
          variant="outline"
          className={draft.pret ? "border-green-200 bg-green-50 text-[10px] text-green-700" : "border-slate-200 bg-slate-50 text-[10px] text-slate-500"}
        >
          {draft.pret ? "Prêt" : "Brouillon"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input placeholder="Nom de code (FR)" value={draft.nom_code} onChange={(e) => setDraft((d) => ({ ...d, nom_code: e.target.value }))} />
        <Input placeholder="Nom de code (EN)" value={draft.nom_code_en} onChange={(e) => setDraft((d) => ({ ...d, nom_code_en: e.target.value }))} />
        <Input placeholder="Nom de code (HE)" value={draft.nom_code_he} onChange={(e) => setDraft((d) => ({ ...d, nom_code_he: e.target.value }))} />
      </div>

      <Textarea
        placeholder="Description sensorielle (FR) : ce qui fait rêver, sans révéler le lieu"
        rows={2}
        value={draft.description_sensorielle}
        onChange={(e) => setDraft((d) => ({ ...d, description_sensorielle: e.target.value }))}
      />
      <Textarea
        placeholder="Description sensorielle (EN)"
        rows={2}
        value={draft.description_sensorielle_en}
        onChange={(e) => setDraft((d) => ({ ...d, description_sensorielle_en: e.target.value }))}
      />
      <Textarea
        placeholder="Description sensorielle (HE)"
        rows={2}
        value={draft.description_sensorielle_he}
        onChange={(e) => setDraft((d) => ({ ...d, description_sensorielle_he: e.target.value }))}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input
          placeholder="Visuel non identifiable (lien image)"
          className="sm:col-span-2"
          value={draft.visuel_url}
          onChange={(e) => setDraft((d) => ({ ...d, visuel_url: e.target.value }))}
        />
        <Input
          type="number"
          placeholder="Rayon flou (km)"
          value={draft.secteur_rayon_km}
          onChange={(e) => setDraft((d) => ({ ...d, secteur_rayon_km: e.target.value }))}
        />
      </div>
      <Input
        placeholder="Secteur affiché au client (ex. « Nord du Néguev »)"
        value={draft.secteur_libelle}
        onChange={(e) => setDraft((d) => ({ ...d, secteur_libelle: e.target.value }))}
      />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Switch id="teaser-pret" checked={draft.pret} onCheckedChange={(v) => setDraft((d) => ({ ...d, pret: v }))} />
          <Label htmlFor="teaser-pret" className="text-sm">
            Prêt à être montré au client
          </Label>
        </div>
        <Button size="sm" onClick={enregistrer} disabled={upsert.isPending}>
          Enregistrer le teaser
        </Button>
      </div>
    </div>
  );
}
