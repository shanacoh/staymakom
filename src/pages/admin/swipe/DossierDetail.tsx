import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Link as LinkIcon, BarChart3, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  useDossier,
  useDossierPropositions,
  useUpdateDossier,
  useAjouterPropositionAuDossier,
  useRetirerPropositionDuDossier,
  useReordonnerPropositionsDossier,
} from "@/lib/swipe/queries";
import { DossierPropositionsList } from "@/components/admin/swipe/DossierPropositionsList";
import { PropositionPicker } from "@/components/admin/swipe/PropositionPicker";

const AdminSwipeDossierDetail = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const { data: dossier } = useDossier(dossierId);
  const { data: propositions } = useDossierPropositions(dossierId);
  const updateDossier = useUpdateDossier();
  const ajouterProposition = useAjouterPropositionAuDossier();
  const retirerProposition = useRetirerPropositionDuDossier();
  const reordonner = useReordonnerPropositionsDossier();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editionNom, setEditionNom] = useState(false);
  const [nomEnCours, setNomEnCours] = useState("");

  if (!dossier || !dossierId) return <div className="p-6">Chargement...</div>;

  const demarrerEditionNom = () => {
    setNomEnCours(dossier.nom_client);
    setEditionNom(true);
  };

  const enregistrerNom = async () => {
    if (!nomEnCours.trim()) return;
    try {
      await updateDossier.mutateAsync({ id: dossierId, nom_client: nomEnCours.trim() });
      setEditionNom(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du renommage");
    }
  };

  const toggleAfficherPrix = async (checked: boolean) => {
    try {
      await updateDossier.mutateAsync({ id: dossierId, afficher_prix: checked });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const toggleTrierParCategorie = async (checked: boolean) => {
    try {
      await updateDossier.mutateAsync({ id: dossierId, trier_par_categorie: checked });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const ajouter = async (propositionId: string) => {
    try {
      await ajouterProposition.mutateAsync({
        dossierId,
        propositionId,
        ordre: propositions?.length ?? 0,
      });
      toast.success("Proposition ajoutée au dossier");
    } catch (e: any) {
      toast.error(e.message || "Cette proposition est déjà dans le dossier");
    }
  };

  const retirer = async (id: string) => {
    try {
      await retirerProposition.mutateAsync({ id, dossierId });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du retrait");
    }
  };

  const reorder = async (ordres: { id: string; ordre: number }[]) => {
    try {
      await reordonner.mutateAsync({ dossierId, ordres });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la réorganisation");
    }
  };

  const copierLien = () => {
    const url = `${window.location.origin}/swipe/${dossier.token_public}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers");
  };

  const dejaAjoutees = new Set((propositions ?? []).map((p) => p.proposition_id));

  return (
    <div className="p-6 max-w-3xl">
      <Link to="/admin/swipe/dossiers" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          {editionNom ? (
            <div className="flex items-center gap-2">
              <Input
                value={nomEnCours}
                onChange={(e) => setNomEnCours(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enregistrerNom()}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={enregistrerNom}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditionNom(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{dossier.nom_client}</h1>
              <Button size="icon" variant="ghost" onClick={demarrerEditionNom} title="Renommer">
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Badge variant="outline" className="mt-1">
            {dossier.statut_lecture === "termine" ? "Terminé" : dossier.statut_lecture === "vu" ? "Vu" : "Envoyé"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copierLien}>
            <LinkIcon className="w-4 h-4 mr-1" /> Copier le lien
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/admin/swipe/dossiers/${dossierId}/resultats`}>
              <BarChart3 className="w-4 h-4 mr-1" /> Résultats
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 border rounded-md p-3">
        <Switch checked={dossier.afficher_prix} onCheckedChange={toggleAfficherPrix} id="afficher-prix" />
        <Label htmlFor="afficher-prix">Afficher les prix au client dans le deck de swipe</Label>
      </div>

      <div className="flex items-center gap-3 mb-6 border rounded-md p-3">
        <Switch
          checked={dossier.trier_par_categorie}
          onCheckedChange={toggleTrierParCategorie}
          id="trier-par-categorie"
        />
        <Label htmlFor="trier-par-categorie">
          Trier les propositions par catégorie (le client verra une pancarte de catégorie entre chaque groupe)
        </Label>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Propositions du dossier</h2>
        <Button onClick={() => setPickerOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter une proposition
        </Button>
      </div>

      <DossierPropositionsList items={propositions ?? []} onReorder={reorder} onRemove={retirer} />

      <PropositionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        dejaAjoutees={dejaAjoutees}
        onAjouter={ajouter}
      />
    </div>
  );
};

export default AdminSwipeDossierDetail;
