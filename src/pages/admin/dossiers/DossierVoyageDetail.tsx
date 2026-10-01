import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copierLienDossierVoyage, useDossierVoyage } from "@/lib/dossiersVoyage/queries";
import {
  CANAL_ORIGINE_OPTIONS,
  labelOf,
  OBJECTIF_OPTIONS,
  POINT_DEPART_OPTIONS,
  STATUT_OPTIONS,
  type CanalOrigine,
  type Objectif,
  type PointDepart,
} from "@/lib/dossiersVoyage/types";

/**
 * Fiche minimale d'un dossier de voyage : destinataire, cadrage, message d'origine.
 * Le Brief IA (étape 4) et le Composer (étape 5) viendront enrichir cet écran.
 */
export default function DossierVoyageDetail() {
  const { dossierId } = useParams<{ dossierId: string }>();
  const { data: dossier, isLoading } = useDossierVoyage(dossierId);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>;
  if (!dossier) return <div className="p-6 text-sm text-muted-foreground">Dossier introuvable.</div>;

  const statutOption = STATUT_OPTIONS.find((o) => o.value === dossier.statut);

  const copierLien = async () => {
    await navigator.clipboard.writeText(copierLienDossierVoyage(dossier.token_public));
    toast.success("Lien copié dans le presse-papiers");
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Link to="/admin/dossiers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Retour aux dossiers
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{dossier.nom_destinataire}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {statutOption && (
              <Badge variant="outline" className={statutOption.className}>
                {statutOption.label}
              </Badge>
            )}
            {dossier.est_modele && <Badge variant="outline">Modèle</Badge>}
            {dossier.archive && <Badge variant="outline">Archivé</Badge>}
          </div>
        </div>
        <Button variant="outline" onClick={copierLien}>
          <Copy className="mr-1.5 h-4 w-4" />
          Copier le lien client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cadrage</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Email : </span>
            {dossier.email || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Téléphone : </span>
            {dossier.telephone || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Objectif : </span>
            {labelOf(OBJECTIF_OPTIONS, dossier.objectif as Objectif)}
          </div>
          <div>
            <span className="text-muted-foreground">Point de départ : </span>
            {labelOf(POINT_DEPART_OPTIONS, dossier.point_depart as PointDepart)}
          </div>
          <div>
            <span className="text-muted-foreground">Canal d'arrivée : </span>
            {labelOf(CANAL_ORIGINE_OPTIONS, dossier.canal_origine as CanalOrigine)}
          </div>
          <div>
            <span className="text-muted-foreground">Créé le : </span>
            {format(new Date(dossier.created_at), "d MMMM yyyy", { locale: fr })}
          </div>
        </CardContent>
      </Card>

      {dossier.contenu_brut_recu && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Message d'origine</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{dossier.contenu_brut_recu}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">À venir</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Le brief généré par l'IA et le programme jour par jour (Composer) arrivent aux prochaines étapes du
          chantier.
        </CardContent>
      </Card>
    </div>
  );
}
