import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ComposerSection } from "@/components/admin/dossiers/ComposerSection";
import {
  copierLienDossierVoyage,
  errorMessage,
  useDossierVoyage,
  useGenerateDossierBrief,
  useUpdateDossierVoyage,
} from "@/lib/dossiersVoyage/queries";
import {
  CANAL_ORIGINE_OPTIONS,
  labelOf,
  OBJECTIF_OPTIONS,
  parseBriefData,
  POINT_DEPART_OPTIONS,
  STATUT_OPTIONS,
  type CanalOrigine,
  type Objectif,
  type PointDepart,
} from "@/lib/dossiersVoyage/types";

interface BriefDraft {
  dates_arrivee: string;
  dates_depart: string;
  nb_voyageurs: string;
  budget_estime: string;
  devise: string;
  regions: string;
  langue: string;
  contraintes: string;
  envies: string;
}

/**
 * Fiche d'un dossier de voyage : cadrage, message d'origine, et brief généré par l'IA (étape 4).
 * Le Composer (programme jour par jour, étape 5) viendra enrichir cet écran ensuite.
 */
export default function DossierVoyageDetail() {
  const { dossierId } = useParams<{ dossierId: string }>();
  const { data: dossier, isLoading } = useDossierVoyage(dossierId);
  const generateBrief = useGenerateDossierBrief(dossierId ?? "");
  const updateDossier = useUpdateDossierVoyage(dossierId ?? "");

  const [draft, setDraft] = useState<BriefDraft | null>(null);

  useEffect(() => {
    if (!dossier) return;
    setDraft({
      dates_arrivee: dossier.dates_arrivee ?? "",
      dates_depart: dossier.dates_depart ?? "",
      nb_voyageurs: dossier.nb_voyageurs != null ? String(dossier.nb_voyageurs) : "",
      budget_estime: dossier.budget_estime != null ? String(dossier.budget_estime) : "",
      devise: dossier.devise ?? "ILS",
      regions: (dossier.regions ?? []).join(", "),
      langue: dossier.langue ?? "",
      contraintes: parseBriefData(dossier.brief_data).contraintes ?? "",
      envies: parseBriefData(dossier.brief_data).envies ?? "",
    });
  }, [dossier]);

  if (isLoading || !draft) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>;
  if (!dossier) return <div className="p-6 text-sm text-muted-foreground">Dossier introuvable.</div>;

  const brief = parseBriefData(dossier.brief_data);
  const aUnBrief = dossier.statut !== "nouvelle_demande";
  const statutOption = STATUT_OPTIONS.find((o) => o.value === dossier.statut);

  const copierLien = async () => {
    await navigator.clipboard.writeText(copierLienDossierVoyage(dossier.token_public));
    toast.success("Lien copié dans le presse-papiers");
  };

  const genererBrief = async () => {
    try {
      await generateBrief.mutateAsync();
      toast.success("Brief généré");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const enregistrerBrief = async () => {
    const regions = draft.regions
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    try {
      await updateDossier.mutateAsync({
        dates_arrivee: draft.dates_arrivee || null,
        dates_depart: draft.dates_depart || null,
        nb_voyageurs: draft.nb_voyageurs ? Number(draft.nb_voyageurs) : null,
        budget_estime: draft.budget_estime ? Number(draft.budget_estime) : null,
        devise: draft.devise || "ILS",
        regions,
        langue: draft.langue || null,
        brief_data: { ...brief, contraintes: draft.contraintes || null, envies: draft.envies || null },
      });
      toast.success("Brief enregistré");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const validerBrief = async () => {
    try {
      await updateDossier.mutateAsync({ brief_valide_par_shana: true });
      toast.success("Brief validé");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const copierMessageWhatsapp = async () => {
    if (!brief.message_whatsapp) return;
    await navigator.clipboard.writeText(brief.message_whatsapp);
    toast.success("Message copié dans le presse-papiers");
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
            {dossier.brief_valide_par_shana && (
              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                Brief validé
              </Badge>
            )}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Brief</CardTitle>
          <Button size="sm" variant="outline" onClick={genererBrief} disabled={!dossier.contenu_brut_recu || generateBrief.isPending}>
            {generateBrief.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            {aUnBrief ? "Régénérer avec l'IA" : "Générer avec l'IA"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!dossier.contenu_brut_recu && (
            <p className="text-sm text-muted-foreground">
              Ce dossier n'a pas de message brut à analyser (saisi sans texte, ou créé directement en Proposition).
            </p>
          )}

          {aUnBrief && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="brief-arrivee">Arrivée</Label>
                  <Input
                    id="brief-arrivee"
                    type="date"
                    value={draft.dates_arrivee}
                    onChange={(e) => setDraft((d) => (d ? { ...d, dates_arrivee: e.target.value } : d))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brief-depart">Départ</Label>
                  <Input
                    id="brief-depart"
                    type="date"
                    value={draft.dates_depart}
                    onChange={(e) => setDraft((d) => (d ? { ...d, dates_depart: e.target.value } : d))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="brief-voyageurs">Nombre de voyageurs</Label>
                  <Input
                    id="brief-voyageurs"
                    inputMode="numeric"
                    value={draft.nb_voyageurs}
                    onChange={(e) => setDraft((d) => (d ? { ...d, nb_voyageurs: e.target.value } : d))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brief-budget">Budget estimé</Label>
                  <Input
                    id="brief-budget"
                    inputMode="decimal"
                    value={draft.budget_estime}
                    onChange={(e) => setDraft((d) => (d ? { ...d, budget_estime: e.target.value } : d))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brief-devise">Devise</Label>
                  <Input
                    id="brief-devise"
                    value={draft.devise}
                    onChange={(e) => setDraft((d) => (d ? { ...d, devise: e.target.value } : d))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="brief-regions">Régions (séparées par des virgules)</Label>
                  <Input
                    id="brief-regions"
                    value={draft.regions}
                    onChange={(e) => setDraft((d) => (d ? { ...d, regions: e.target.value } : d))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Langue du client</Label>
                  <Select value={draft.langue || "none"} onValueChange={(v) => setDraft((d) => (d ? { ...d, langue: v === "none" ? "" : v } : d))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Non déterminée" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non déterminée</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                      <SelectItem value="he">Hébreu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief-contraintes">Contraintes (casher, mobilité réduite, Shabbat...)</Label>
                <Textarea
                  id="brief-contraintes"
                  rows={2}
                  value={draft.contraintes}
                  onChange={(e) => setDraft((d) => (d ? { ...d, contraintes: e.target.value } : d))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief-envies">Envies (ambiance, type de voyage, occasion)</Label>
                <Textarea
                  id="brief-envies"
                  rows={2}
                  value={draft.envies}
                  onChange={(e) => setDraft((d) => (d ? { ...d, envies: e.target.value } : d))}
                />
              </div>

              {brief.incertitudes.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Points incertains signalés par l'IA</Label>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700">
                    {brief.incertitudes.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.questions_a_poser.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Questions à poser au client</Label>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {brief.questions_a_poser.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.message_whatsapp && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Message WhatsApp prêt à envoyer</Label>
                    <Button size="sm" variant="ghost" onClick={copierMessageWhatsapp}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copier
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">{brief.message_whatsapp}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={enregistrerBrief} disabled={updateDossier.isPending}>
                  Enregistrer mes modifications
                </Button>
                <Button onClick={validerBrief} disabled={updateDossier.isPending || dossier.brief_valide_par_shana}>
                  {dossier.brief_valide_par_shana ? "Brief validé" : "Valider le brief"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ComposerSection dossierId={dossier.id} versionActiveId={dossier.version_active_id} />
    </div>
  );
}
