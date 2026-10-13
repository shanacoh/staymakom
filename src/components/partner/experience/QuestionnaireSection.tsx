// Questionnaire pratique d'une expérience.
// Le contact du jour J est appliqué directement ; tout le reste (point de rendez-vous, adresse,
// accès, arriver X minutes avant, à savoir, météo) part en proposition à valider.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, Hint, Notice, PrimaryButton, SectionTitle, SelectField, TextAreaField, TextField } from "@/components/partner/ui";
import { partnerErrorCode, partnerKeys, setPartnerDayContact, submitPartnerProposal } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { changedFields, ownText } from "@/lib/partner/logic";
import type { PartnerExperienceDetail } from "@/lib/partner/types";

const PRACTICAL_TEXT_FIELDS = ["meeting_point", "address", "access_note", "know_before_you_go", "contingency_note"] as const;

export function QuestionnaireSection({ experience }: { experience: PartnerExperienceDetail }) {
  const { t, lang } = usePartner();
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: partnerKeys.experience(experience.id) });
    queryClient.invalidateQueries({ queryKey: partnerKeys.experiences });
    queryClient.invalidateQueries({ queryKey: partnerKeys.proposals });
  };

  // ── Contact du jour J (direct) ──
  const [contact, setContact] = useState({
    name: experience.day_contact?.name ?? "",
    phone: experience.day_contact?.phone ?? "",
    language: experience.day_contact?.language ?? "",
  });
  const [savingContact, setSavingContact] = useState(false);
  const saveContact = async () => {
    setSavingContact(true);
    try {
      await setPartnerDayContact(experience.id, contact);
      toast.success(t.qDayContactSaved);
      refresh();
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setSavingContact(false);
    }
  };

  // ── Infos pratiques (proposition) ──
  const original: Record<string, string> = {
    ...Object.fromEntries(PRACTICAL_TEXT_FIELDS.map((field) => [field, ownText(experience, field, lang)])),
    arrive_minutes_before: experience.arrive_minutes_before != null ? String(experience.arrive_minutes_before) : "",
  };
  const [form, setForm] = useState(original);
  const [sending, setSending] = useState(false);
  const set = (field: string) => (value: string) => setForm((current) => ({ ...current, [field]: value }));
  const pending = experience.pending_proposals.some((p) => p.proposal_type === "practical_info");

  const submit = async () => {
    const changed = changedFields(original, form);
    if (Object.keys(changed).length === 0) {
      toast.message(t.qNothingChanged);
      return;
    }
    setSending(true);
    try {
      await submitPartnerProposal({ experienceId: experience.id, type: "practical_info", proposed: { ...changed, lang } });
      toast.success(t.proposalSent);
      refresh();
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("no_change") ? t.qNothingChanged : t.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Hint>{t.qIntro}</Hint>

      {experience.is_primary && (
        <Card className="space-y-4">
          <div>
            <SectionTitle>{t.qDayContactTitle}</SectionTitle>
            <Hint>{t.qDayContactHint}</Hint>
          </div>
          <TextField label={t.qDayContactName} value={contact.name} onChange={(name) => setContact((c) => ({ ...c, name }))} />
          <TextField
            label={t.qDayContactPhone}
            type="tel"
            inputMode="tel"
            dir="ltr"
            placeholder="+972…"
            value={contact.phone}
            onChange={(phone) => setContact((c) => ({ ...c, phone }))}
          />
          <SelectField
            label={t.qDayContactLanguage}
            value={contact.language}
            onChange={(language) => setContact((c) => ({ ...c, language }))}
            options={[{ value: "", label: " " }, ...(["he", "en", "fr"] as const).map((code) => ({ value: code, label: t.langNames[code] }))]}
          />
          <PrimaryButton busy={savingContact} onClick={saveContact}>
            {t.save}
          </PrimaryButton>
        </Card>
      )}

      <Card className="space-y-4">
        {pending && <Notice>{t.proposalPendingNotice}</Notice>}
        <TextAreaField label={t.qMeetingPoint} hint={t.qMeetingPointHint} rows={2} value={form.meeting_point} onChange={set("meeting_point")} />
        <TextField label={t.qAddress} value={form.address} onChange={set("address")} />
        <TextAreaField label={t.qAccess} hint={t.qAccessHint} rows={2} value={form.access_note} onChange={set("access_note")} />
        <TextField
          label={t.qArrive}
          type="number"
          inputMode="numeric"
          min={0}
          max={600}
          dir="ltr"
          className="w-28"
          value={form.arrive_minutes_before}
          onChange={set("arrive_minutes_before")}
        />
        <TextAreaField label={t.qKnow} hint={t.qKnowHint} value={form.know_before_you_go} onChange={set("know_before_you_go")} />
        <TextAreaField label={t.qContingency} hint={t.qContingencyHint} value={form.contingency_note} onChange={set("contingency_note")} />
        <PrimaryButton busy={sending} onClick={submit}>
          {t.qSubmit}
        </PrimaryButton>
      </Card>
    </div>
  );
}
