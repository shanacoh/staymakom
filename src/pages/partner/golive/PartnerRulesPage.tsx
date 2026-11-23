// Les règles non négociables du partenaire : taille de groupe, âge minimum, délai de réservation,
// jours jamais travaillés, groupes privés, « ce que le client doit savoir », annulation 48 h / 24 h.
// Appliquées tout de suite sur la fiche (champs existants), tracées, l'équipe est prévenue.

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, Empty, Hint, Notice, PageLoader, PrimaryButton, SectionTitle, TextAreaField, TextField } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { goliveKeys, usePartnerAccess } from "@/lib/partner/access";
import { partnerErrorCode } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { closedDaysOf, openDaysOf } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import { displayText } from "@/lib/partner/logic";
import type { PartnerListing } from "@/lib/partner/types";

export default function PartnerRulesPage() {
  const { id = "" } = useParams();
  const { t: base, lang } = usePartner();
  const access = usePartnerAccess();
  const { data, isLoading, error } = useQuery({
    queryKey: goliveKeys.listing(access.scope, "experience", id),
    queryFn: () => access.listing("experience", id),
    retry: false,
  });

  const back = (
    <Link to={`${access.base}/listing/experience/${id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600">
      <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {GOLIVE_TEXTS[lang].openPreview}
    </Link>
  );
  if (isLoading) return <PageLoader label={base.loading} />;
  if (error || !data) {
    return (
      <>
        {back}
        <Empty>{base.errorGeneric}</Empty>
      </>
    );
  }
  // La clé remet le formulaire à zéro quand on change de langue (« à savoir » est rédigé dans SA langue).
  return (
    <>
      {back}
      <RulesForm key={lang} experienceId={id} listing={data} />
    </>
  );
}

function RulesForm({ experienceId, listing }: { experienceId: string; listing: PartnerListing }) {
  const { t: base, lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const access = usePartnerAccess();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const c = listing.content;
  const [min, setMin] = useState(String(c.min_party ?? 1));
  const [max, setMax] = useState(String(c.max_party ?? 10));
  const [age, setAge] = useState(c.min_age != null ? String(c.min_age) : "");
  const [lead, setLead] = useState(String(c.lead_time_days ?? 0));
  const [closed, setClosed] = useState<number[]>(closedDaysOf(((c.available_days as number[] | null) ?? [1, 2, 3, 4, 5, 6, 7]).map(Number)));
  const [privateOnly, setPrivateOnly] = useState(Boolean(c.private_groups_only));
  const [know, setKnow] = useState(displayText(c, "know_before_you_go", lang));
  const [hours, setHours] = useState<24 | 48>(c.free_cancellation_hours === 24 ? 24 : 48);
  const [busy, setBusy] = useState(false);

  const minN = Number(min);
  const maxN = Number(max);
  const groupValid = Number.isInteger(minN) && Number.isInteger(maxN) && minN >= 1 && maxN >= minN;

  const save = async () => {
    if (!groupValid) {
      toast.error(t.invalidGroup);
      return;
    }
    setBusy(true);
    try {
      await access.setRules(experienceId, {
        min_party: minN,
        max_party: maxN,
        min_age: age.trim() === "" ? null : Number(age),
        lead_time_days: Number(lead) || 0,
        available_days: openDaysOf(closed),
        private_groups_only: privateOnly,
        know_before_you_go: know,
        free_cancellation_hours: hours,
      });
      toast.success(t.rulesSaved);
      queryClient.invalidateQueries({ queryKey: goliveKeys.listing(access.scope, "experience", experienceId) });
      queryClient.invalidateQueries({ queryKey: goliveKeys.golive(access.scope) });
      navigate(`${access.base}/listing/experience/${experienceId}`);
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("invalid_group_size") ? t.invalidGroup : base.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (day: number) => setClosed((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()));

  return (
    <div className="space-y-3">
      <h1 className="text-[17px] font-semibold tracking-tight">{t.rulesTitle}</h1>
      <Hint>{t.rulesIntro}</Hint>

      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t.groupMin} type="number" inputMode="numeric" min={1} dir="ltr" value={min} onChange={setMin} />
          <TextField label={t.groupMax} type="number" inputMode="numeric" min={1} dir="ltr" value={max} onChange={setMax} />
          <TextField label={t.minAge} hint={t.minAgeHint} type="number" inputMode="numeric" min={0} dir="ltr" value={age} onChange={setAge} />
          <TextField label={t.leadTime} type="number" inputMode="numeric" min={0} max={60} dir="ltr" value={lead} onChange={setLead} />
        </div>
        {!groupValid && <Notice>{t.invalidGroup}</Notice>}
      </Card>

      <Card className="space-y-2">
        <SectionTitle>{t.closedDays}</SectionTitle>
        <Hint>{t.closedDaysHint}</Hint>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <button
              key={day}
              type="button"
              aria-pressed={closed.includes(day)}
              onClick={() => toggleDay(day)}
              className={cn(
                "min-h-[36px] rounded-full border px-3 text-[12px] font-medium",
                closed.includes(day) ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700",
              )}
            >
              {base.weekdaysLong[day - 1]}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-3 pt-2 text-[13px] text-neutral-900">
          <input type="checkbox" className="h-5 w-5 accent-neutral-900" checked={privateOnly} onChange={(e) => setPrivateOnly(e.target.checked)} />
          {t.privateOnly}
        </label>
      </Card>

      <Card className="space-y-2">
        <TextAreaField label={t.knowLabel} hint={t.knowHint} rows={3} value={know} onChange={setKnow} />
      </Card>

      <Card className="space-y-2">
        <SectionTitle>{t.cancelTitle}</SectionTitle>
        {([48, 24] as const).map((value) => (
          <label key={value} className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-neutral-900">
            <input
              type="radio"
              name="cancellation"
              className="mt-0.5 h-5 w-5 shrink-0 accent-neutral-900"
              checked={hours === value}
              onChange={() => setHours(value)}
            />
            {value === 48 ? t.cancel48 : t.cancel24}
          </label>
        ))}
        <Hint>{t.cancelNote}</Hint>
      </Card>

      <div className="flex justify-end">
        <PrimaryButton busy={busy} disabled={!groupValid} onClick={save}>
          {base.save}
        </PrimaryButton>
      </div>
    </div>
  );
}
