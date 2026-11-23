// L'en-tête de l'espace partenaire tant que l'annonce n'est pas en ligne : le go live, les raccourcis
// vers l'aperçu et les règles, puis la présentation STAYMAKOM. Partagé par le lien et le compte.

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GoLiveCard } from "@/components/partner/golive/GoLiveCard";
import { PitchBlocks } from "@/components/partner/golive/PitchBlocks";
import { Empty, Hint, PageLoader } from "@/components/partner/ui";
import { goliveKeys, usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import type { PartnerSession } from "@/lib/partner/types";

export function useGoLive() {
  const access = usePartnerAccess();
  return useQuery({ queryKey: goliveKeys.golive(access.scope), queryFn: access.golive, retry: false });
}

export function GoLiveSection({ session, showPitch = true }: { session: PartnerSession; showPitch?: boolean }) {
  const { t: base, lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const access = usePartnerAccess();
  const golive = useGoLive();

  if (golive.isLoading) return <PageLoader label={base.loading} />;
  if (!golive.data) return <Empty>{base.errorGeneric}</Empty>;
  const target = golive.data.target;

  return (
    <>
      <GoLiveCard golive={golive.data} loginEmail={session.provider.email} />
      {target ? (
        <div className="flex flex-wrap gap-2">
          <Link
            to={`${access.base}/listing/${target.kind}/${target.id}`}
            className="inline-flex min-h-[36px] items-center rounded-full border border-neutral-300 bg-white px-4 text-[12px] font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            {t.openPreview}
          </Link>
          {target.kind === "experience" && (
            <Link
              to={`${access.base}/rules/${target.id}`}
              className="inline-flex min-h-[36px] items-center rounded-full border border-neutral-300 bg-white px-4 text-[12px] font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              {t.myRules}
            </Link>
          )}
        </div>
      ) : (
        <Hint>{t.noListingYet}</Hint>
      )}
      {showPitch && <PitchBlocks providerName={session.provider.name} />}
    </>
  );
}
