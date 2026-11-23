// Ouvrir ses dates depuis le go live : l'éditeur de disponibilités existant (appliqué directement,
// tracé). Les jours fermés des règles et ce calendrier sont les mêmes données.

import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AvailabilitySection } from "@/components/partner/experience/AvailabilitySection";
import { Empty, PageLoader } from "@/components/partner/ui";
import { goliveKeys, usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { displayText } from "@/lib/partner/logic";

export default function PartnerAvailabilityPage() {
  const { id = "" } = useParams();
  const { t, lang } = usePartner();
  const access = usePartnerAccess();
  const { data, isLoading } = useQuery({
    queryKey: goliveKeys.experience(access.scope, id),
    queryFn: () => access.experience(id),
    retry: false,
  });

  const back = (
    <Link to={access.base} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600">
      <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {t.tabHome}
    </Link>
  );
  if (isLoading) return <PageLoader label={t.loading} />;
  if (!data) {
    return (
      <>
        {back}
        <Empty>{t.errorGeneric}</Empty>
      </>
    );
  }
  return (
    <>
      {back}
      <h1 className="text-[17px] font-semibold tracking-tight">
        {t.expSectionAvailability} · {displayText(data, "title", lang) || data.slug}
      </h1>
      <AvailabilitySection experience={data} />
    </>
  );
}
