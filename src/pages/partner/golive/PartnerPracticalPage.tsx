// Infos pratiques d'une expérience, depuis le go live : le questionnaire existant (contact du jour J
// appliqué directement, le reste en proposition) et le prix public du partenaire.

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { QuestionnaireSection } from "@/components/partner/experience/QuestionnaireSection";
import { Card, Empty, Hint, PageLoader, PrimaryButton, SectionTitle, TextField } from "@/components/partner/ui";
import { goliveKeys, usePartnerAccess } from "@/lib/partner/access";
import { partnerErrorCode } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import { displayText } from "@/lib/partner/logic";

export default function PartnerPracticalPage() {
  const { id = "" } = useParams();
  const { t: base, lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const access = usePartnerAccess();
  const experience = useQuery({
    queryKey: goliveKeys.experience(access.scope, id),
    queryFn: () => access.experience(id),
    retry: false,
  });
  const listing = useQuery({
    queryKey: goliveKeys.listing(access.scope, "experience", id),
    queryFn: () => access.listing("experience", id),
    retry: false,
  });

  const back = (
    <Link to={access.base} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600">
      <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {base.tabHome}
    </Link>
  );
  if (experience.isLoading || listing.isLoading) return <PageLoader label={base.loading} />;
  if (!experience.data || !listing.data) {
    return (
      <>
        {back}
        <Empty>{base.errorGeneric}</Empty>
      </>
    );
  }
  const price = (listing.data.content.public_price ?? {}) as { adult?: number | null; child?: number | null };

  return (
    <>
      {back}
      <h1 className="text-[17px] font-semibold tracking-tight">
        {t.practicalTitle} · {displayText(experience.data, "title", lang) || experience.data.slug}
      </h1>
      <PublicPriceCard experienceId={id} adult={price.adult ?? null} child={price.child ?? null} currency={String(listing.data.content.currency ?? "ILS")} />
      <QuestionnaireSection key={`q-${lang}`} experience={experience.data} />
    </>
  );
}

function PublicPriceCard({ experienceId, adult, child, currency }: { experienceId: string; adult: number | null; child: number | null; currency: string }) {
  const { t: base, lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const access = usePartnerAccess();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ adult: adult != null ? String(adult) : "", child: child != null ? String(child) : "" });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await access.setPublicPrice(experienceId, draft.adult, draft.child);
      toast.success(t.publicPriceSaved);
      queryClient.invalidateQueries({ queryKey: goliveKeys.listing(access.scope, "experience", experienceId) });
      queryClient.invalidateQueries({ queryKey: goliveKeys.golive(access.scope) });
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("invalid_price") ? t.invalidPrice : base.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3">
      <div>
        <SectionTitle>{t.publicPriceTitle}</SectionTitle>
        <Hint>{t.publicPriceHint}</Hint>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={`${t.priceAdult} (${currency})`}
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={draft.adult}
          onChange={(value) => setDraft((d) => ({ ...d, adult: value }))}
        />
        <TextField
          label={`${t.priceChild} (${currency})`}
          optional={base.optional}
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={draft.child}
          onChange={(value) => setDraft((d) => ({ ...d, child: value }))}
        />
      </div>
      <div className="flex justify-end">
        <PrimaryButton busy={busy} disabled={!draft.adult.trim()} onClick={save}>
          {base.save}
        </PrimaryButton>
      </div>
    </Card>
  );
}
