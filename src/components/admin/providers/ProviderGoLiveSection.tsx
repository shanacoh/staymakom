// Fiche prestataire : le parcours partenaire, du premier lien au go live.
//  - Lien partenaire : le lien personnel, le message WhatsApp (dans sa langue), « Voir comme le
//    partenaire », régénérer / révoquer, première ouverture et dernière visite.
//  - Go live : les mêmes étapes que lui, la date cible, et pour un hôtel « accord trouvé » et les trois
//    points HyperGuest. Relance : si l'étape « votre tour » n'a pas bougé depuis 3 jours, un signal et
//    un message WhatsApp prêt à copier qui nomme l'étape (rien ne part tout seul).
//  - Le tableau des champs de l'annonce : valeur, source, état.
//  - Expériences : prix public du partenaire et commission propre ; le prix fournisseur en découle.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, ExternalLink, Link2, MessageCircle, RefreshCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/catalogue/queries";
import { cn } from "@/lib/utils";
import { buildLinkMessage, buildReminderMessage, formatFieldValue, partnerLinkUrl, turnIsStale } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import { PARTNER_TEXTS } from "@/lib/partner/i18n";
import {
  derivedSupplierPrice,
  fetchAdminGoLive,
  fetchProviderLinkState,
  goliveAdminKeys,
  regeneratePartnerLink,
  revokePartnerLink,
  saveExperienceCommercials,
  updateProviderGoLive,
  type AdminExperienceCommercials,
  type ProviderGoLivePatch,
} from "@/lib/partnerAdmin/golive";
import { whatsappInviteUrl } from "@/lib/partnerAdmin/whatsapp";
import type { Provider } from "@/lib/providers/types";

const SITE = "https://staymakom.com";
const T = GOLIVE_TEXTS.fr;
const moment = (iso: string | null) => (iso ? format(parseISO(iso), "d MMM yyyy 'à' HH:mm", { locale: fr }) : "jamais");

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Copie impossible. Sélectionne le texte à la main.");
  }
}

export function ProviderGoLiveSection({ provider }: { provider: Provider }) {
  const queryClient = useQueryClient();
  const link = useQuery({ queryKey: goliveAdminKeys.link(provider.id), queryFn: () => fetchProviderLinkState(provider.id) });
  const golive = useQuery({ queryKey: goliveAdminKeys.golive(provider.id), queryFn: () => fetchAdminGoLive(provider.id) });
  const [confirming, setConfirming] = useState<"regenerate" | "revoke" | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: goliveAdminKeys.link(provider.id) });
    queryClient.invalidateQueries({ queryKey: goliveAdminKeys.golive(provider.id) });
  };
  const regenerate = useMutation({
    mutationFn: () => regeneratePartnerLink(provider.id),
    onSuccess: () => {
      toast.success("Nouveau lien créé. L'ancien ne fonctionne plus.");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const revoke = useMutation({
    mutationFn: () => revokePartnerLink(provider.id),
    onSuccess: () => {
      toast.success("Lien révoqué : il ne donne plus accès à rien.");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const patch = useMutation({
    mutationFn: (p: ProviderGoLivePatch) => updateProviderGoLive(provider.id, p),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });

  const token = link.data?.partner_link_token ?? null;
  const url = token ? partnerLinkUrl(SITE, token) : null;
  const message = url ? buildLinkMessage({ language: provider.language, contactName: provider.contact_name, url }) : "";
  const g = golive.data;
  const stale = g ? turnIsStale(g, new Date()) : false;
  const reminder =
    url && g?.current_step ? buildReminderMessage({ language: provider.language, contactName: provider.contact_name, stepKey: g.current_step, url }) : "";
  const isHotel = provider.provider_type === "hotel";
  const commissionMissing = !provider.commission_type || provider.commission_value == null;

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Parcours partenaire : du premier lien au go live</h3>
          <p className="text-xs text-muted-foreground">
            Un seul lien, envoyé par WhatsApp avant ou après signature : il y voit son annonce préparée, où en est son go live et ce
            qu'il lui reste à faire. Signer et voir ses réservations demandent la connexion par email.
          </p>
        </div>
        {commissionMissing && (
          <span className="rounded-full border border-destructive/40 px-2.5 py-0.5 text-xs font-semibold text-destructive">Commission à saisir</span>
        )}
      </div>

      {/* Lien partenaire */}
      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lien partenaire</h4>
        {link.isLoading ? (
          <p className="text-xs text-muted-foreground">Chargement…</p>
        ) : !url ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {link.data?.partner_link_created_at ? "Le lien a été révoqué." : "Pas encore de lien."} Le lien marche avant signature : c'est un outil de vente.
            </p>
            <Button type="button" size="sm" disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>
              <Link2 className="mr-1.5 h-4 w-4" /> Créer le lien
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs">{url}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => copy(message, "Message WhatsApp copié")}>
                <Copy className="mr-1.5 h-4 w-4" /> Copier le message WhatsApp
              </Button>
              {whatsappInviteUrl(provider.whatsapp, message) && (
                <Button type="button" size="sm" variant="outline" asChild>
                  <a href={whatsappInviteUrl(provider.whatsapp, message)!} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-1.5 h-4 w-4" /> Ouvrir WhatsApp
                  </a>
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={`/partner/link/${token}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Voir comme le partenaire
                </a>
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => copy(url, "Lien copié")}>
                Copier le lien seul
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming("regenerate")}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Régénérer
              </Button>
              <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setConfirming("revoke")}>
                Révoquer
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Message en {provider.language === "he" ? "hébreu" : provider.language === "fr" ? "français" : "anglais"} · première ouverture :{" "}
              {moment(link.data?.partner_link_first_opened_at ?? null)} · dernière visite : {moment(link.data?.partner_link_last_seen_at ?? null)}
            </p>
          </>
        )}
      </section>

      {/* Go live */}
      <section className="space-y-2 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Go live</h4>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Date cible (affichée au partenaire)
            <Input
              type="date"
              className="h-8 w-40 text-xs"
              value={link.data?.golive_target_date ?? ""}
              onChange={(e) => patch.mutate({ golive_target_date: e.target.value || null })}
            />
          </label>
        </div>
        {golive.isLoading ? (
          <p className="text-xs text-muted-foreground">Chargement…</p>
        ) : golive.error || !g ? (
          <p className="text-xs text-destructive">Impossible de calculer le go live{golive.error ? ` : ${errorMessage(golive.error)}` : ""}.</p>
        ) : (
          <>
            {!g.target && (
              <p className="text-xs text-muted-foreground">
                {isHotel ? "Aucun hôtel n'est relié à ce prestataire (fiche hôtel, champ prestataire)." : "Aucune expérience n'est reliée à ce prestataire."}
              </p>
            )}
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {g.steps.map((step, index) => {
                const current = step.key === g.current_step;
                return (
                  <li
                    key={step.key}
                    className={cn(
                      "rounded-md border px-3 py-2 text-xs",
                      current && g.my_turn ? "border-destructive/50 bg-destructive/5" : current ? "border-foreground/40" : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("font-semibold", step.done ? "text-muted-foreground line-through" : "text-foreground")}>
                        {index + 1}. {T.steps[step.key]}
                      </span>
                      <span className="text-muted-foreground">
                        {step.done ? "fait" : current ? (g.my_turn ? "au tour du partenaire" : "à nous") : step.actor === "partner" ? "partenaire" : "STAYMAKOM"}
                      </span>
                    </div>
                    {step.subtasks && (
                      <ul className="mt-1 space-y-0.5 text-muted-foreground">
                        {step.subtasks.map((sub) => (
                          <li key={sub.key}>
                            {sub.done ? "●" : "○"} {T.subtasks[sub.key]}
                          </li>
                        ))}
                      </ul>
                    )}
                    {step.waiting_commission && !step.done && <p className="mt-1 text-destructive">Commission à saisir sur cette fiche.</p>}
                  </li>
                );
              })}
            </ol>
            {g.current_step === null && <p className="text-xs font-semibold text-foreground">Go live terminé : l'annonce est en ligne.</p>}

            {isHotel && link.data && (
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1 text-xs">
                {(
                  [
                    ["hotel_agreement_at", "Accord trouvé"],
                    ["hg_channel_manager_at", "HyperGuest : channel manager renseigné"],
                    ["hg_rooms_mapped_at", "HyperGuest : chambres et tarifs mappés"],
                    ["hg_test_booking_at", "HyperGuest : réservation test faite"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-foreground"
                      checked={!!link.data![key]}
                      onChange={(e) => patch.mutate({ [key]: e.target.checked ? new Date().toISOString() : null })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}

            {stale && url && (
              <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
                <p className="font-semibold text-destructive">
                  Relance : l'étape « {T.steps[g.current_step!]} » attend le partenaire depuis le {moment(g.turn_since)}.
                </p>
                <pre className="whitespace-pre-wrap font-sans text-muted-foreground">{reminder}</pre>
                <Button type="button" size="sm" onClick={() => copy(reminder, "Relance copiée")}>
                  <Copy className="mr-1.5 h-4 w-4" /> Copier la relance WhatsApp
                </Button>
              </div>
            )}

            {g.fields.length > 0 && <ListingFieldsTable fields={g.fields} />}
            {!isHotel && g.experiences.length > 0 && (
              <ExperienceCommercialsTable providerId={provider.id} provider={provider} experiences={g.experiences} onSaved={refresh} />
            )}
          </>
        )}
      </section>

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirming === "revoke" ? "Révoquer le lien partenaire ?" : "Régénérer le lien partenaire ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              L'ancien lien ne donnera plus accès à rien.{" "}
              {confirming === "regenerate" ? "Il faudra envoyer le nouveau lien au partenaire." : "Tu pourras en créer un nouveau à tout moment."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => (confirming === "revoke" ? revoke.mutate() : regenerate.mutate())}>
              {confirming === "revoke" ? "Révoquer" : "Régénérer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ListingFieldsTable({ fields }: { fields: AdminGoLiveField[] }) {
  return (
    <div className="space-y-1.5 pt-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Champs de l'annonce</h4>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 font-medium">Section</th>
              <th className="px-2 py-1.5 font-medium">Champ</th>
              <th className="px-2 py-1.5 font-medium">Valeur</th>
              <th className="px-2 py-1.5 font-medium">Source</th>
              <th className="px-2 py-1.5 font-medium">État</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.key} className="border-t border-border">
                <td className="px-2 py-1.5 text-muted-foreground">{T.sections[field.section] ?? field.section}</td>
                <td className="px-2 py-1.5 font-medium">{T.fields[field.key] ?? field.key}</td>
                <td className="max-w-[18rem] truncate px-2 py-1.5" title={formatFieldValue(field, T, PARTNER_TEXTS.fr.weekdaysLong)}>
                  {formatFieldValue(field, T, PARTNER_TEXTS.fr.weekdaysLong)}
                </td>
                <td className="px-2 py-1.5">{field.source === "partner" ? "Rempli par le partenaire" : "Préparé par STAYMAKOM"}</td>
                <td className={cn("px-2 py-1.5", field.state === "confirmed" ? "font-semibold" : "text-muted-foreground")}>
                  {field.state === "confirmed" ? "Confirmé" : field.state === "to_fill" ? "À remplir" : "À confirmer"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type AdminGoLiveField = Parameters<typeof formatFieldValue>[0] & { section: string; source: string; state: string };

function ExperienceCommercialsTable({
  provider,
  experiences,
  onSaved,
}: {
  providerId: string;
  provider: Provider;
  experiences: AdminExperienceCommercials[];
  onSaved: () => void;
}) {
  return (
    <div className="space-y-1.5 pt-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prix public et commission par expérience</h4>
      <p className="text-xs text-muted-foreground">
        Pas de double saisie : le prix fournisseur découle du prix public moins la commission (celle de l'expérience si elle en a une, sinon
        celle du prestataire). Un prix fournisseur déjà saisi et différent n'est pas écrasé : il est signalé « à vérifier ».
      </p>
      <div className="space-y-2">
        {experiences.map((experience) => (
          <ExperienceCommercialsRow key={experience.id} provider={provider} experience={experience} onSaved={onSaved} />
        ))}
      </div>
    </div>
  );
}

function ExperienceCommercialsRow({
  provider,
  experience,
  onSaved,
}: {
  provider: Provider;
  experience: AdminExperienceCommercials;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState({
    publicAdult: experience.public_price_adult != null ? String(experience.public_price_adult) : "",
    publicChild: experience.public_price_child != null ? String(experience.public_price_child) : "",
    type: experience.commission_type ?? "",
    value: experience.commission_value != null ? String(experience.commission_value) : "",
    unit: experience.commission_fixed_unit ?? "per_person",
  });
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
  const effectiveType = (draft.type || provider.commission_type || null) as "percent" | "fixed" | null;
  const effectiveValue = draft.type ? num(draft.value) : provider.commission_value;
  const effectiveUnit = (draft.type ? (draft.type === "fixed" ? draft.unit : null) : provider.commission_fixed_unit) as
    | "per_person"
    | "per_booking"
    | null;
  const derived = derivedSupplierPrice(num(draft.publicAdult), effectiveType, effectiveValue, effectiveUnit);
  const toCheck = derived != null && experience.supplier_price_adult != null && Number(experience.supplier_price_adult) !== derived;

  const save = useMutation({
    mutationFn: (applySupplier: boolean) =>
      saveExperienceCommercials({
        experienceId: experience.id,
        publicAdult: num(draft.publicAdult),
        publicChild: num(draft.publicChild),
        commissionType: (draft.type || null) as "percent" | "fixed" | null,
        commissionValue: draft.type ? num(draft.value) : null,
        commissionUnit: draft.type === "fixed" ? (draft.unit as "per_person" | "per_booking") : null,
        applySupplier,
      }),
    onSuccess: (result) => {
      toast.success(result.to_check ? "Enregistré. Le prix fournisseur actuel est différent : à vérifier." : "Enregistré");
      onSaved();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="rounded-md border border-border p-3 text-xs">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{experience.title}</span>
        {toCheck && (
          <span className="rounded-full border border-destructive/40 px-2 py-0.5 font-semibold text-destructive">Prix fournisseur à vérifier</span>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1">
          <span className="block text-muted-foreground">Prix public adulte ({experience.currency})</span>
          <Input className="h-8 w-24 text-xs" inputMode="decimal" value={draft.publicAdult} onChange={(e) => setDraft((d) => ({ ...d, publicAdult: e.target.value }))} />
        </label>
        <label className="space-y-1">
          <span className="block text-muted-foreground">Enfant</span>
          <Input className="h-8 w-20 text-xs" inputMode="decimal" value={draft.publicChild} onChange={(e) => setDraft((d) => ({ ...d, publicChild: e.target.value }))} />
        </label>
        <label className="space-y-1">
          <span className="block text-muted-foreground">Commission de l'expérience</span>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as typeof d.type }))}
          >
            <option value="">Celle du prestataire</option>
            <option value="percent">Pourcentage</option>
            <option value="fixed">Montant fixe</option>
          </select>
        </label>
        {draft.type && (
          <Input className="h-8 w-20 text-xs" inputMode="decimal" value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))} />
        )}
        {draft.type === "fixed" && (
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={draft.unit}
            onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value as typeof d.unit }))}
          >
            <option value="per_person">par personne</option>
            <option value="per_booking">par réservation</option>
          </select>
        )}
        <Button type="button" size="sm" className="h-8" disabled={save.isPending} onClick={() => save.mutate(false)}>
          Enregistrer
        </Button>
      </div>
      <p className="mt-2 text-muted-foreground">
        Prix fournisseur déduit : <strong className="text-foreground">{derived ?? "non calculable"}</strong> · prix fournisseur actuel :{" "}
        <strong className="text-foreground">{experience.supplier_price_adult ?? "vide"}</strong>
        {toCheck && (
          <Button type="button" size="sm" variant="outline" className="ml-2 h-7 text-xs" disabled={save.isPending} onClick={() => save.mutate(true)}>
            Remplacer par {derived}
          </Button>
        )}
      </p>
    </div>
  );
}
