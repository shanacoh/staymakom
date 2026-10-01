import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ComposerSection } from "@/components/admin/dossiers/ComposerSection";
import { DossierStepper } from "@/components/admin/dossiers/DossierStepper";
import { ExclusionsSection } from "@/components/admin/dossiers/ExclusionsSection";
import { LieuxImposesSection } from "@/components/admin/dossiers/LieuxImposesSection";
import {
  copierLienDossierVoyage,
  errorMessage,
  useDossierVersions,
  useDossierVoyage,
  useGenerateDossierBrief,
  useUpdateDossierVoyage,
} from "@/lib/dossiersVoyage/queries";
import {
  CANAL_ORIGINE_OPTIONS,
  etapeDuStatut,
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

export default function DossierVoyageDetail() {
  const { dossierId } = useParams<{ dossierId: string }>();
  const { data: dossier, isLoading } = useDossierVoyage(dossierId);
  const { data: versions } = useDossierVersions(dossierId);
  const generateBrief = useGenerateDossierBrief(dossierId ?? "");
  const updateDossier = useUpdateDossierVoyage(dossierId ?? "");

  const [draft, setDraft] = useState<BriefDraft | null>(null);
  const [messageCollé, setMessageCollé] = useState("");

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

  if (isLoading || !draft) return <div className="text-sm text-muted-foreground">Chargement...</div>;
  if (!dossier) return <div className="text-sm text-muted-foreground">Dossier introuvable.</div>;

  const brief = parseBriefData(dossier.brief_data);
  const aUnBrief = dossier.statut !== "nouvelle_demande";
  const etape = etapeDuStatut(dossier.statut);
  const statutOption = STATUT_OPTIONS.find((o) => o.value === dossier.statut);

  const copierLien = async () => {
    await navigator.clipboard.writeText(copierLienDossierVoyage(dossier.token_public));
    toast.success("Lien copié dans le presse-papiers");
  };

  const enregistrerMessage = async () => {
    try {
      await updateDossier.mutateAsync({ contenu_brut_recu: messageCollé });
      toast.success("Message enregistré");
    } catch (error) {
      toast.error(errorMessage(error));
    }
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
    const regions = draft.regions.split(",").map((r) => r.trim()).filter(Boolean);
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

  const changerPointDepart = async (v: PointDepart) => {
    try {
      await updateDossier.mutateAsync({ point_depart: v });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const versionActive = versions?.find((v) => v.id === dossier.version_active_id);
  const nbIncertitudes = brief.incertitudes.length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">{dossier.nom_destinataire}</h1>
          <Button variant="outline" onClick={copierLien}>
            <Copy className="mr-1.5 h-4 w-4" />
            Copier le lien client
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statutOption && (
            <Badge variant="outline" className={statutOption.className}>
              {statutOption.label}
            </Badge>
          )}
          <Badge variant="outline">via {labelOf(CANAL_ORIGINE_OPTIONS, dossier.canal_origine as CanalOrigine)}</Badge>
          {dossier.est_modele && <Badge variant="outline">Modèle</Badge>}
          {dossier.archive && <Badge variant="outline">Archivé</Badge>}
        </div>
        <DossierStepper etapeActive={etape} />
      </div>

      {/* Demande reçue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demande reçue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {labelOf(CANAL_ORIGINE_OPTIONS, dossier.canal_origine as CanalOrigine)} · reçu le{" "}
            {format(new Date(dossier.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
          </p>
          {dossier.contenu_brut_recu ? (
            <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{dossier.contenu_brut_recu}</p>
          ) : (
            <Textarea
              rows={5}
              value={messageCollé}
              onChange={(e) => setMessageCollé(e.target.value)}
              placeholder="Colle ici un message WhatsApp, un email, une note vocale retranscrite..."
            />
          )}
          {!dossier.contenu_brut_recu && (
            <Button size="sm" variant="outline" onClick={enregistrerMessage} disabled={!messageCollé.trim() || updateDossier.isPending}>
              Enregistrer le message
            </Button>
          )}
          {dossier.contenu_brut_recu && (
            <div>
              <Button onClick={genererBrief} disabled={generateBrief.isPending} className="bg-[#ad1414] hover:bg-[#8f1010]">
                {generateBrief.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                {aUnBrief ? "Régénérer avec l'IA" : "Analyser avec l'IA"}
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Extrait le brief, repère ce qui manque, et prépare les questions à poser au client.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brief */}
      {aUnBrief && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brief extrait</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              modifiable
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="brief-arrivee" className="text-[10px] uppercase text-muted-foreground">
                  Dates
                </Label>
                <div className="flex gap-1">
                  <Input id="brief-arrivee" type="date" value={draft.dates_arrivee} onChange={(e) => setDraft((d) => (d ? { ...d, dates_arrivee: e.target.value } : d))} />
                  <Input type="date" value={draft.dates_depart} onChange={(e) => setDraft((d) => (d ? { ...d, dates_depart: e.target.value } : d))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief-voyageurs" className="text-[10px] uppercase text-muted-foreground">
                  Voyageurs
                </Label>
                <Input id="brief-voyageurs" inputMode="numeric" value={draft.nb_voyageurs} onChange={(e) => setDraft((d) => (d ? { ...d, nb_voyageurs: e.target.value } : d))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief-budget" className="text-[10px] uppercase text-muted-foreground">
                  Budget
                </Label>
                <div className="flex gap-1">
                  <Input id="brief-budget" inputMode="decimal" value={draft.budget_estime} onChange={(e) => setDraft((d) => (d ? { ...d, budget_estime: e.target.value } : d))} />
                  <Input className="w-16" value={draft.devise} onChange={(e) => setDraft((d) => (d ? { ...d, devise: e.target.value } : d))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief-contraintes" className="text-[10px] uppercase text-muted-foreground">
                  Contraintes
                </Label>
                <Input id="brief-contraintes" value={draft.contraintes} onChange={(e) => setDraft((d) => (d ? { ...d, contraintes: e.target.value } : d))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief-regions" className="text-[10px] uppercase text-muted-foreground">
                  Régions
                </Label>
                <Input id="brief-regions" value={draft.regions} onChange={(e) => setDraft((d) => (d ? { ...d, regions: e.target.value } : d))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief-envies" className="text-[10px] uppercase text-muted-foreground">
                  Envies
                </Label>
                <Input id="brief-envies" value={draft.envies} onChange={(e) => setDraft((d) => (d ? { ...d, envies: e.target.value } : d))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground">Langue</Label>
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

            {nbIncertitudes > 0 && (
              <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">{nbIncertitudes} question(s) avant d'envoyer</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                  {brief.questions_a_poser.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
                {brief.message_whatsapp && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={copierMessageWhatsapp}>
                      Préparer le message WhatsApp
                    </Button>
                    <span className="text-xs text-amber-700">Tu peux composer en parallèle, rien n'est envoyé.</span>
                  </div>
                )}
              </div>
            )}

            <LieuxImposesSection dossier={dossier} />
            <ExclusionsSection dossier={dossier} exclusionsClient={brief.exclusions_mentionnees} />

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={enregistrerBrief} disabled={updateDossier.isPending}>
                Enregistrer mes modifications
              </Button>
              <Button onClick={validerBrief} disabled={updateDossier.isPending || dossier.brief_valide_par_shana} className="bg-[#ad1414] hover:bg-[#8f1010]">
                {dossier.brief_valide_par_shana ? "Brief validé" : "Valider le brief"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Composer */}
      {dossier.brief_valide_par_shana && <ComposerSection dossierId={dossier.id} versionActiveId={dossier.version_active_id} />}

      {/* Lien client */}
      {dossier.version_active_id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lien client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => changerPointDepart("explorer")}
                className={`rounded-md border p-3 text-left text-sm ${dossier.point_depart === "explorer" ? "border-[#ad1414] ring-1 ring-[#ad1414]" : "border-border"}`}
              >
                <p className="font-semibold">Explorer → Proposition → Carnet</p>
                <p className="text-xs text-muted-foreground">Le brouillon sert de base à une sélection élargie à swiper.</p>
              </button>
              <button
                type="button"
                onClick={() => changerPointDepart("proposition")}
                className={`rounded-md border p-3 text-left text-sm ${dossier.point_depart === "proposition" ? "border-[#ad1414] ring-1 ring-[#ad1414]" : "border-border"}`}
              >
                <p className="font-semibold">Proposition → Carnet</p>
                <p className="text-xs text-muted-foreground">Le brouillon devient directement la proposition.</p>
              </button>
            </div>

            <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              L'écran client (Explorer/Proposition/Carnet) n'est pas encore construit — c'est la prochaine étape du
              chantier. Le bouton d'envoi reste désactivé en attendant, pour ne jamais envoyer un lien qui ne mène
              nulle part.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled>
                Prévisualiser
              </Button>
              <Button disabled className="bg-[#ad1414] hover:bg-[#8f1010]">
                Créer le lien et envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
