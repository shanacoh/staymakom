// L'état des propositions du prestataire : en attente, acceptée, refusée, avec la réponse de l'équipe.

import { Pill } from "@/components/partner/ui";
import { usePartner } from "@/lib/partner/context";
import { formatPartnerDate } from "@/lib/partner/i18n";
import { displayText } from "@/lib/partner/logic";
import type { PartnerProposal } from "@/lib/partner/types";

export function ProposalList({ proposals }: { proposals: PartnerProposal[] }) {
  const { t, lang } = usePartner();
  return (
    <ul className="divide-y divide-neutral-100">
      {proposals.map((proposal) => {
        const title =
          proposal.proposal_type === "new_experience"
            ? String(proposal.proposed.title ?? "")
            : displayText(proposal as unknown as Record<string, unknown>, "experience_title", lang);
        return (
          <li key={proposal.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-neutral-900">{title}</p>
                <p className="text-[12px] text-neutral-500">
                  {t.typeLabels[proposal.proposal_type]} · {formatPartnerDate(proposal.created_at, lang)}
                </p>
              </div>
              {/* En attente = rien à faire pour le partenaire : neutre. */}
              <Pill tone={proposal.status === "accepted" ? "strong" : proposal.status === "rejected" ? "muted" : "neutral"}>
                {t.proposalStatus[proposal.status]}
              </Pill>
            </div>
            {proposal.admin_comment && (
              <p className="mt-2 rounded-[10px] bg-neutral-100 px-3 py-2 text-[13px] leading-relaxed text-neutral-800">
                <span className="font-semibold">{t.proposalComment} : </span>
                {proposal.admin_comment}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
