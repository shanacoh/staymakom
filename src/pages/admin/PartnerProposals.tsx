import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PartnerTermsEditor } from "@/components/admin/partners/PartnerTermsEditor";
import { ProposalCard } from "@/components/admin/partners/ProposalCard";
import { errorMessage } from "@/lib/catalogue/queries";
import { fetchProposals, partnerAdminKeys, reviewProposal } from "@/lib/partnerAdmin/queries";

// Propositions partenaires : tout ce que les prestataires proposent depuis leur espace attend ici.
// Rien n'arrive sur le site sans passer par « Accepter ». Le second onglet sert à rédiger et
// publier les conditions partenaires.

type Tab = "pending" | "done" | "terms";

const TAB_CLASS = (active: boolean) =>
  `border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`;

export default function AdminPartnerProposals() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (["pending", "done", "terms"] as Tab[]).find((t) => t === searchParams.get("tab")) ?? "pending";
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: partnerAdminKeys.proposals, queryFn: fetchProposals });
  const proposals = useMemo(() => data ?? [], [data]);
  const pending = proposals.filter((p) => p.status === "pending");
  const done = proposals.filter((p) => p.status !== "pending");

  const review = useMutation({
    mutationFn: ({ id, decision, comment }: { id: string; decision: "accepted" | "rejected"; comment: string }) =>
      reviewProposal(id, decision, comment),
    onMutate: ({ id }) => setReviewingId(id),
    onSuccess: (_result, { decision }) => {
      toast.success(decision === "accepted" ? "Proposition acceptée et appliquée" : "Proposition refusée");
      queryClient.invalidateQueries({ queryKey: partnerAdminKeys.proposals });
      queryClient.invalidateQueries({ queryKey: partnerAdminKeys.pendingCount });
      queryClient.invalidateQueries({ queryKey: ["admin-partner-access"] });
      // Une proposition acceptée a modifié une fiche, un prix fournisseur ou créé un brouillon.
      queryClient.invalidateQueries({ queryKey: ["standalone-experience"] });
      queryClient.invalidateQueries({ queryKey: ["admin-supplier-price-signal"] });
    },
    onError: (e) => toast.error(`Action impossible : ${errorMessage(e)}`),
    onSettled: () => setReviewingId(null),
  });

  const shown = tab === "pending" ? pending : done;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="space-y-2">
        <Link to="/admin/partenaires" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Partenaires
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Propositions partenaires</h1>
        <p className="text-sm text-muted-foreground">
          Ce que les prestataires proposent depuis leur espace. Leurs disponibilités et leur contact du jour J sont appliqués directement ;
          tout le reste attend ta validation ici.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(
          [
            { key: "pending", label: `À valider (${pending.length})` },
            { key: "done", label: `Traitées (${done.length})` },
            { key: "terms", label: "Conditions partenaires" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button key={t.key} type="button" className={TAB_CLASS(tab === t.key)} onClick={() => setSearchParams({ tab: t.key }, { replace: true })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "terms" ? (
        <PartnerTermsEditor />
      ) : isLoading ? (
        <Skeleton className="h-48 w-full" aria-busy="true" />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Impossible de charger les propositions : {errorMessage(error)}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {tab === "pending" ? "Aucune proposition en attente." : "Aucune proposition traitée pour l'instant."}
        </p>
      ) : (
        <div className="space-y-4">
          {shown.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              busy={review.isPending && reviewingId === proposal.id}
              onReview={(decision, comment) => review.mutate({ id: proposal.id, decision, comment })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
