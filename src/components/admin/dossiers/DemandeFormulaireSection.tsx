/**
 * Fiche d'un dossier issu du formulaire « Tailor-made request » : toutes les réponses du client,
 * le contact WhatsApp, et, tant que la demande n'est pas ouverte, le bouton qui crée le dossier
 * (swipe ou itinéraire) déjà rempli avec ces réponses.
 */

import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWhatsAppLink } from "@/lib/reservations/whatsapp";
import { answerLines, dossierPrefillFromDemande } from "@/lib/dossiersVoyage/demandeFormulaire";
import { errorMessage, useUpdateDossierVoyage } from "@/lib/dossiersVoyage/queries";
import type { DossierVoyage, PointDepart } from "@/lib/dossiersVoyage/types";

// Premier message à envoyer au client, dans la langue qu'il a choisie.
const WHATSAPP_GREETING: Record<string, (name: string, ref: string) => string> = {
  fr: (name, ref) => `Bonjour ${name}, ici Shana de Staymakom. J'ai bien reçu votre demande de voyage sur mesure (réf. ${ref}) et je reviens vers vous pour en parler.`,
  en: (name, ref) => `Hello ${name}, this is Shana from Staymakom. I received your tailor-made trip request (ref. ${ref}) and would love to talk it through with you.`,
  he: (name, ref) => `שלום ${name}, כאן שנה מ-Staymakom. קיבלתי את הבקשה שלכם לטיול בהתאמה אישית (מספר ${ref}) ואשמח לדבר איתכם על זה.`,
};

export function DemandeFormulaireSection({ dossier }: { dossier: DossierVoyage }) {
  const updateDossier = useUpdateDossierVoyage(dossier.id);
  const lines = answerLines(dossier);
  if (lines.length === 0) return null;

  const aTraiter = dossier.statut === "demande_sur_mesure";
  const greeting = (WHATSAPP_GREETING[dossier.langue ?? "fr"] ?? WHATSAPP_GREETING.fr)(dossier.nom_destinataire, dossier.reference ?? "");

  const creerDossier = async (pointDepart: PointDepart) => {
    try {
      await updateDossier.mutateAsync(dossierPrefillFromDemande(dossier, pointDepart));
      toast.success("Dossier créé, déjà rempli avec les réponses du client");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Réponses du formulaire{dossier.reference ? ` · ${dossier.reference}` : ""}
        </CardTitle>
        {dossier.telephone && (
          <Button asChild size="sm" variant="outline">
            <a href={buildWhatsAppLink(dossier.telephone, greeting)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Contacter sur WhatsApp
            </a>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase text-muted-foreground">Contact</dt>
            <dd>
              {[dossier.telephone, dossier.email, dossier.langue?.toUpperCase()].filter(Boolean).join(" · ")}
            </dd>
          </div>
          {lines.map((line) => (
            <div key={line.label} className={line.label === "Message" ? "sm:col-span-2" : undefined}>
              <dt className="text-[10px] uppercase text-muted-foreground">{line.label}</dt>
              <dd className="whitespace-pre-wrap">{line.value}</dd>
            </div>
          ))}
        </dl>

        {aTraiter && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold">Créer le dossier swipe / itinéraire</p>
            <p className="text-xs text-muted-foreground">
              Dates, voyageurs, budget, envies et régions sont repris tels quels. Tu pourras tout modifier ensuite.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => creerDossier("explorer")} disabled={updateDossier.isPending} className="bg-action hover:bg-action-hover">
                {updateDossier.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Dossier swipe
              </Button>
              <Button variant="outline" onClick={() => creerDossier("proposition")} disabled={updateDossier.isPending}>
                Itinéraire (proposition directe)
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
