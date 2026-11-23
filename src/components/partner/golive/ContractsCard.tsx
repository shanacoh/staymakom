// Profil : ses conditions et contrats acceptés, sa commission, et le PDF du contrat hôtel signé
// (téléchargé par une adresse temporaire, jamais publique).

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, Hint, SectionTitle } from "@/components/partner/ui";
import { fetchPartnerContracts, partnerContractUrl, partnerKeys } from "@/lib/partner/api";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import { formatPartnerDate } from "@/lib/partner/i18n";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";

export function ContractsCard() {
  const { t: base, lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const session = usePartnerSession();
  const contracts = useQuery({ queryKey: partnerKeys.contracts, queryFn: fetchPartnerContracts });

  const download = async (id: string) => {
    try {
      window.open(await partnerContractUrl(id), "_blank", "noopener");
    } catch {
      toast.error(base.errorGeneric);
    }
  };

  return (
    <Card className="space-y-3">
      <SectionTitle>{t.contractsTitle}</SectionTitle>
      <p className="text-[13px] text-neutral-700">
        {session.terms.commission_label ? t.commissionLine(session.terms.commission_label) : t.commissionPending}
      </p>
      {(contracts.data ?? []).length === 0 ? (
        <Hint>{base.fTerms}</Hint>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {contracts.data!.map((contract) => (
            <li key={contract.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[12px]">
              <span className="text-neutral-700">
                {contract.kind === "hotel_contract" ? t.contractTitle : base.termsTitle} · {t.acceptedOn(formatPartnerDate(contract.accepted_at, lang))}
                <span className="text-neutral-400"> · {contract.signer_name}</span>
              </span>
              {contract.kind === "hotel_contract" &&
                (contract.has_pdf ? (
                  <button type="button" onClick={() => download(contract.id)} className="font-medium text-neutral-900 underline underline-offset-4">
                    {t.downloadPdf}
                  </button>
                ) : (
                  <span className="text-neutral-400">{t.pdfPending}</span>
                ))}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
