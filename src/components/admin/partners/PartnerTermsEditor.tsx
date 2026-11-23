import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/catalogue/queries";
import {
  fetchTermsVersions,
  hasStaymakomSignature,
  partnerAdminKeys,
  publishTermsVersion,
  saveTermsVersion,
  uploadStaymakomSignature,
  type TermsTexts,
} from "@/lib/partnerAdmin/queries";
import type { TermsKind } from "@/lib/partner/types";

// Conditions partenaires, par type : « conditions expériences » (trois langues) ou « contrat hôtel »
// (modèle à variables, texte juridique en anglais). Le texte de la version en vigueur.
// Tant que personne ne l'a acceptée, on corrige le texte sur place. Dès qu'un prestataire l'a
// acceptée, c'est une preuve : on ne la modifie plus, on publie une nouvelle version (que chacun
// devra accepter à sa prochaine connexion).

const LANGS: { key: keyof TermsTexts; label: string; dir?: "rtl" }[] = [
  { key: "text_fr", label: "Français" },
  { key: "text_en", label: "Anglais" },
  { key: "text_he", label: "Hébreu", dir: "rtl" },
];

const HOTEL_VARIABLES = "{{hotel_name}}, {{company}}, {{registration_number}}, {{address}}, {{signatory_name}}, {{signatory_title}}, {{commission}}, {{date}}";

export function PartnerTermsEditor({ kind = "experience_terms" }: { kind?: TermsKind }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: partnerAdminKeys.terms(kind), queryFn: () => fetchTermsVersions(kind) });
  // La version en vigueur ; à défaut (contrat hôtel jamais publié), le brouillon.
  const current = data?.find((v) => v.published_at) ?? data?.[0] ?? null;
  const isDraft = !!current && !current.published_at;
  const langs = kind === "hotel_contract" ? LANGS.filter((l) => l.key === "text_en") : LANGS;

  const [texts, setTexts] = useState<TermsTexts>({ text_he: "", text_en: "", text_fr: "" });
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  useEffect(() => {
    if (current) setTexts({ text_he: current.text_he, text_en: current.text_en, text_fr: current.text_fr });
    // On ne recharge le formulaire que lorsque la version en vigueur change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.version]);

  const done = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: partnerAdminKeys.terms(kind) });
  };
  const save = useMutation({
    mutationFn: () => saveTermsVersion(current!.version, texts),
    onSuccess: () => done("Conditions enregistrées"),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const publish = useMutation({
    mutationFn: () =>
      publishTermsVersion(kind, kind === "hotel_contract" ? { text_en: texts.text_en, text_fr: texts.text_en, text_he: texts.text_en } : texts),
    onSuccess: (version) => done(`Version ${version} publiée. Chaque prestataire devra l'accepter à sa prochaine connexion.`),
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" aria-busy="true" />;
  if (error || !current) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Impossible de charger les conditions{error ? ` : ${errorMessage(error)}` : "."}
      </div>
    );
  }

  const dirty = langs.some(({ key }) => texts[key] !== current[key]);
  const locked = current.acceptances > 0;
  const busy = save.isPending || publish.isPending;
  const incomplete = langs.some(({ key }) => ["", "À rédiger", "À coller"].includes(texts[key].trim()));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-semibold text-foreground">
          {kind === "hotel_contract" ? "Contrat hôtel" : "Conditions expériences"} · {isDraft ? "brouillon non publié" : `version en vigueur : ${current.version}`}
          {!isDraft && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · publiée le {format(parseISO(current.published_at!), "d MMM yyyy", { locale: fr })} · acceptée par {current.acceptances} prestataire
              {current.acceptances > 1 ? "s" : ""}
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {locked
            ? "Cette version a déjà été acceptée : son texte ne se modifie plus. Toute modification se publie comme une nouvelle version, que chaque prestataire devra accepter à sa prochaine connexion."
            : "Personne n'a encore accepté cette version : tu peux corriger son texte directement. Un prestataire ne peut entrer dans son espace qu'après l'avoir acceptée."}
        </p>
        {kind === "hotel_contract" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Colle le texte juridique (en anglais). Variables remplies automatiquement à la signature : {HOTEL_VARIABLES}. Le taux de
            commission est celui de la fiche prestataire. Tant que ce texte n'est pas publié, aucun hôtel ne peut signer.
          </p>
        )}
        {incomplete && (
          <p className="mt-2 text-xs font-semibold text-destructive">
            Le texte n'est pas encore rédigé dans les trois langues. À faire avant d'inviter un prestataire.
          </p>
        )}
      </div>

      {langs.map(({ key, label, dir }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`terms-${key}`}>{label}</Label>
          <Textarea
            id={`terms-${key}`}
            dir={dir}
            rows={12}
            value={texts[key]}
            onChange={(e) => setTexts((t) => ({ ...t, [key]: e.target.value }))}
            className="text-sm leading-relaxed"
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {!locked && !isDraft && (
          <Button type="button" disabled={!dirty || busy} onClick={() => save.mutate()}>
            {save.isPending ? "Enregistrement…" : `Enregistrer (corriger la version ${current.version})`}
          </Button>
        )}
        <Button
          type="button"
          variant={locked || isDraft ? "default" : "outline"}
          disabled={(!dirty && !isDraft) || incomplete || busy}
          onClick={() => setConfirmingPublish(true)}
        >
          {isDraft ? "Publier ce texte" : "Publier une nouvelle version"}
        </Button>
        {isDraft && (
          <Button type="button" variant="outline" disabled={!dirty || busy} onClick={() => save.mutate()}>
            Enregistrer le brouillon
          </Button>
        )}
      </div>

      {(data?.length ?? 0) > 1 && (
        <p className="text-xs text-muted-foreground">
          Versions précédentes conservées : {data!.filter((v) => v.version !== current.version).map((v) => `v${v.version} (${v.acceptances} acceptation${v.acceptances > 1 ? "s" : ""})`).join(", ")}.
        </p>
      )}

      {kind === "hotel_contract" && <StaymakomSignatureUpload />}

      <AlertDialog open={confirmingPublish} onOpenChange={setConfirmingPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publier une nouvelle version des conditions ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les prestataires devront relire et accepter cette version à leur prochaine connexion. D'ici là, ils ne verront que l'écran
              des conditions. Les acceptations déjà enregistrées sont conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => publish.mutate()}>Publier</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** La signature STAYMAKOM, déposée une fois, apposée sur chaque contrat hôtel signé (PDF). */
function StaymakomSignatureUpload() {
  const queryClient = useQueryClient();
  const present = useQuery({ queryKey: partnerAdminKeys.signature, queryFn: hasStaymakomSignature });
  const upload = useMutation({
    mutationFn: (file: File) => uploadStaymakomSignature(file),
    onSuccess: () => {
      toast.success("Signature STAYMAKOM enregistrée");
      queryClient.invalidateQueries({ queryKey: partnerAdminKeys.signature });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-card p-4 text-sm">
      <Label htmlFor="staymakom-signature">Signature STAYMAKOM (image PNG, fond transparent de préférence)</Label>
      <p className="text-xs text-muted-foreground">
        {present.data ? "Une signature est déjà enregistrée : en envoyer une autre la remplace pour les prochains contrats." : "Pas encore de signature : les PDF seront générés sans elle."}
      </p>
      <input
        id="staymakom-signature"
        type="file"
        accept="image/png"
        disabled={upload.isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
        }}
        className="text-xs"
      />
    </div>
  );
}
