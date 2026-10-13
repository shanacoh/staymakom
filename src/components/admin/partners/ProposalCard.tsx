import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProposal } from "@/lib/partnerAdmin/queries";
import { providerLanguageLabel, providerUrl } from "@/lib/providers/types";

// Une proposition d'un prestataire : ce qui est en ligne aujourd'hui, ce qu'il propose, et les
// boutons Accepter / Refuser. Accepter applique la modification (côté base, en une seule opération).

export const PROPOSAL_TYPE_LABEL: Record<AdminProposal["proposal_type"], string> = {
  text: "Textes",
  photos: "Photos",
  price: "Prix fournisseur",
  practical_info: "Infos pratiques",
  new_experience: "Nouvelle expérience",
};

const FIELD_LABEL: Record<string, string> = {
  title: "Titre",
  subtitle: "Accroche",
  long_copy: "Description",
  description: "Description",
  duration: "Durée",
  location: "Lieu",
  meeting_point: "Point de rendez-vous",
  address: "Adresse",
  access_note: "Accès sans voiture",
  know_before_you_go: "À savoir",
  contingency_note: "Météo et imprévus",
  arrive_minutes_before: "Arriver (minutes avant)",
  supplier_price_adult: "Prix fournisseur adulte",
  supplier_price_child: "Prix fournisseur enfant",
};

const STATUS_LABEL = { pending: "En attente", accepted: "Acceptée", rejected: "Refusée" } as const;
// Pas de vert : noir = acceptée, gris = refusée, rouge d'action = à traiter.
const STATUS_CLASS = {
  pending: "bg-action text-action-foreground",
  accepted: "bg-black text-white",
  rejected: "bg-neutral-100 text-neutral-500",
} as const;

const shown = (value: unknown) => (value == null || value === "" ? null : String(value));

function Value({ value, dir }: { value: unknown; dir?: "rtl" }) {
  const text = shown(value);
  return text ? (
    <p className="whitespace-pre-line text-sm text-foreground" dir={dir}>
      {text}
    </p>
  ) : (
    <p className="text-sm italic text-muted-foreground">vide</p>
  );
}

function Photos({ urls }: { urls: string[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {urls.map((url) => (
        <li key={url} className="aspect-[5/4] overflow-hidden rounded-md bg-muted">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
          </a>
        </li>
      ))}
    </ul>
  );
}

interface ProposalCardProps {
  proposal: AdminProposal;
  busy: boolean;
  onReview: (decision: "accepted" | "rejected", comment: string) => void;
}

export function ProposalCard({ proposal, busy, onReview }: ProposalCardProps) {
  const [comment, setComment] = useState("");
  const isNew = proposal.proposal_type === "new_experience";
  const dir = proposal.lang === "he" ? "rtl" : undefined;
  const photos = Array.isArray(proposal.proposed.photos) ? (proposal.proposed.photos as string[]) : [];
  const fields = Object.keys(proposal.proposed).filter((key) => key !== "photos" && key !== "lang");
  const draftUrl = proposal.created_experience_id ? `/admin/experiences2/standalone/edit/${proposal.created_experience_id}` : null;

  return (
    <article className="space-y-4 rounded-lg border border-border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[proposal.status]}`}>{STATUS_LABEL[proposal.status]}</span>
            <span className="text-sm font-semibold text-foreground">{PROPOSAL_TYPE_LABEL[proposal.proposal_type]}</span>
            <span className="text-xs text-muted-foreground">en {providerLanguageLabel(proposal.lang).toLowerCase()}</span>
          </div>
          <p className="text-sm text-foreground">
            <Link to={providerUrl(proposal.provider_id)} className="underline underline-offset-2 hover:text-red-600">
              {proposal.provider_name}
            </Link>
            {" · "}
            {isNew ? (
              <span>{shown(proposal.proposed.title)}</span>
            ) : proposal.experience_id ? (
              <Link to={`/admin/experiences2/standalone/edit/${proposal.experience_id}`} className="underline underline-offset-2 hover:text-red-600">
                {proposal.experience_title ?? "Expérience"}
              </Link>
            ) : (
              "Expérience supprimée"
            )}
          </p>
        </div>
        <time className="text-xs text-muted-foreground">{format(parseISO(proposal.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}</time>
      </header>

      {proposal.note && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground" dir={dir}>
          <span className="font-semibold">Message du prestataire : </span>
          {proposal.note}
        </p>
      )}

      {fields.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border">
          <div className={`grid gap-px bg-border text-xs font-semibold text-muted-foreground ${isNew ? "grid-cols-[10rem_1fr]" : "grid-cols-[10rem_1fr_1fr]"}`}>
            <div className="bg-muted px-3 py-2">Champ</div>
            {!isNew && <div className="bg-muted px-3 py-2">Aujourd'hui</div>}
            <div className="bg-muted px-3 py-2">Proposé</div>
            {fields.map((key) => (
              <div key={key} className="contents">
                <div className="bg-card px-3 py-2 font-medium text-foreground">{FIELD_LABEL[key] ?? key}</div>
                {!isNew && (
                  <div className="bg-card px-3 py-2 font-normal">
                    <Value value={proposal.current[key]} dir={dir} />
                  </div>
                )}
                <div className="bg-card px-3 py-2 font-normal">
                  <Value value={proposal.proposed[key]} dir={dir} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            {photos.length} photo{photos.length > 1 ? "s" : ""} proposée{photos.length > 1 ? "s" : ""}
            {!isNew && " (ajoutées à la suite de la galerie si tu acceptes)"}
          </p>
          <Photos urls={photos} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {proposal.proposal_type === "price" &&
          "Accepter ne change que le prix fournisseur. Le prix client reste tel quel : un signal « Prix fournisseur modifié, vérifier le prix client » apparaîtra sur la fiche."}
        {isNew && "Accepter crée une fiche en brouillon reliée à ce prestataire. Elle n'est jamais publiée automatiquement."}
        {(proposal.proposal_type === "text" || proposal.proposal_type === "practical_info") &&
          `Accepter applique ces textes sur la fiche, uniquement dans la langue de la proposition (${providerLanguageLabel(proposal.lang).toLowerCase()}). Les autres langues ne sont pas modifiées.`}
      </p>

      {proposal.status === "pending" ? (
        <div className="space-y-2 border-t border-border pt-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Commentaire pour le prestataire (facultatif, visible dans son espace)"
            className="text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => onReview("accepted", comment)}>
              Accepter
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onReview("rejected", comment)}>
              Refuser
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          {proposal.admin_comment && (
            <p>
              <span className="font-semibold">Ton commentaire : </span>
              {proposal.admin_comment}
            </p>
          )}
          {draftUrl && (
            <Link to={draftUrl} className="underline underline-offset-2 hover:text-red-600">
              Ouvrir la fiche en brouillon
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
