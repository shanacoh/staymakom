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
import { fetchTermsVersions, partnerAdminKeys, publishTermsVersion, saveTermsVersion, type TermsTexts } from "@/lib/partnerAdmin/queries";

// Conditions partenaires : le texte en trois langues de la version en vigueur.
// Tant que personne ne l'a acceptée, on corrige le texte sur place. Dès qu'un prestataire l'a
// acceptée, c'est une preuve : on ne la modifie plus, on publie une nouvelle version (que chacun
// devra accepter à sa prochaine connexion).

const LANGS: { key: keyof TermsTexts; label: string; dir?: "rtl" }[] = [
  { key: "text_fr", label: "Français" },
  { key: "text_en", label: "Anglais" },
  { key: "text_he", label: "Hébreu", dir: "rtl" },
];

export function PartnerTermsEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: partnerAdminKeys.terms, queryFn: fetchTermsVersions });
  const current = data?.find((v) => v.published_at) ?? null;

  const [texts, setTexts] = useState<TermsTexts>({ text_he: "", text_en: "", text_fr: "" });
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  useEffect(() => {
    if (current) setTexts({ text_he: current.text_he, text_en: current.text_en, text_fr: current.text_fr });
    // On ne recharge le formulaire que lorsque la version en vigueur change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.version]);

  const done = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: partnerAdminKeys.terms });
  };
  const save = useMutation({
    mutationFn: () => saveTermsVersion(current!.version, texts),
    onSuccess: () => done("Conditions enregistrées"),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const publish = useMutation({
    mutationFn: () => publishTermsVersion(texts),
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

  const dirty = LANGS.some(({ key }) => texts[key] !== current[key]);
  const locked = current.acceptances > 0;
  const busy = save.isPending || publish.isPending;
  const incomplete = LANGS.some(({ key }) => texts[key].trim() === "" || texts[key].trim() === "À rédiger");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-semibold text-foreground">
          Version en vigueur : {current.version}
          <span className="font-normal text-muted-foreground">
            {" "}
            · publiée le {format(parseISO(current.published_at!), "d MMM yyyy", { locale: fr })} · acceptée par {current.acceptances} prestataire
            {current.acceptances > 1 ? "s" : ""}
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {locked
            ? "Cette version a déjà été acceptée : son texte ne se modifie plus. Toute modification se publie comme une nouvelle version, que chaque prestataire devra accepter à sa prochaine connexion."
            : "Personne n'a encore accepté cette version : tu peux corriger son texte directement. Un prestataire ne peut entrer dans son espace qu'après l'avoir acceptée."}
        </p>
        {incomplete && (
          <p className="mt-2 text-xs font-semibold text-destructive">
            Le texte n'est pas encore rédigé dans les trois langues. À faire avant d'inviter un prestataire.
          </p>
        )}
      </div>

      {LANGS.map(({ key, label, dir }) => (
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
        {!locked && (
          <Button type="button" disabled={!dirty || busy} onClick={() => save.mutate()}>
            {save.isPending ? "Enregistrement…" : `Enregistrer (corriger la version ${current.version})`}
          </Button>
        )}
        <Button type="button" variant={locked ? "default" : "outline"} disabled={!dirty || busy} onClick={() => setConfirmingPublish(true)}>
          Publier comme version {(data?.[0]?.version ?? current.version) + 1}
        </Button>
      </div>

      {(data?.length ?? 0) > 1 && (
        <p className="text-xs text-muted-foreground">
          Versions précédentes conservées : {data!.filter((v) => v.version !== current.version).map((v) => `v${v.version} (${v.acceptances} acceptation${v.acceptances > 1 ? "s" : ""})`).join(", ")}.
        </p>
      )}

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
