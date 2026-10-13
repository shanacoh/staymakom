// Profil : ses informations, son contact du jour J par défaut, ses utilisateurs et les conditions
// qu'il a acceptées (version, date, texte consultable).

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileFields, profileDraftOf, type ProfileDraft } from "@/components/partner/ProfileFields";
import { Card, Hint, Pill, PrimaryButton, QuietButton, SectionTitle, SelectField, TextField } from "@/components/partner/ui";
import { fetchPartnerUsers, partnerKeys, updatePartnerProfile } from "@/lib/partner/api";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import { formatPartnerDate } from "@/lib/partner/i18n";
import { termsText } from "./PartnerOnboarding";

export default function PartnerProfile() {
  const { t, lang, setSession } = usePartner();
  const session = usePartnerSession();
  const { provider, terms } = session;
  const users = useQuery({ queryKey: partnerKeys.users, queryFn: fetchPartnerUsers });

  const [draft, setDraft] = useState<ProfileDraft>(() => profileDraftOf(provider));
  const [dayContact, setDayContact] = useState({
    day_contact_name: provider.day_contact_name ?? "",
    day_contact_whatsapp: provider.day_contact_whatsapp ?? "",
    day_contact_language: provider.day_contact_language ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      setSession(await updatePartnerProfile({ ...draft, ...dayContact }));
      toast.success(t.saved);
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">{t.tabProfile}</h1>

      <Card className="space-y-4">
        <SectionTitle>{t.fInfo}</SectionTitle>
        <TextField label={t.fName} value={provider.name} disabled onChange={() => {}} />
        <TextField label={t.fEmail} hint={t.fEmailHint} dir="ltr" value={provider.email ?? session.user_email ?? ""} disabled onChange={() => {}} />
        <ProfileFields draft={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
      </Card>

      <Card className="space-y-4">
        <div>
          <SectionTitle>{t.fDayContact}</SectionTitle>
          <Hint>{t.fDayContactHint}</Hint>
        </div>
        <TextField
          label={t.qDayContactName}
          value={dayContact.day_contact_name}
          onChange={(v) => setDayContact((c) => ({ ...c, day_contact_name: v }))}
        />
        <TextField
          label={t.qDayContactPhone}
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="+972…"
          value={dayContact.day_contact_whatsapp}
          onChange={(v) => setDayContact((c) => ({ ...c, day_contact_whatsapp: v }))}
        />
        <SelectField
          label={t.qDayContactLanguage}
          value={dayContact.day_contact_language}
          onChange={(v) => setDayContact((c) => ({ ...c, day_contact_language: v }))}
          options={[{ value: "", label: " " }, ...(["he", "en", "fr"] as const).map((code) => ({ value: code, label: t.langNames[code] }))]}
        />
      </Card>

      <PrimaryButton busy={saving} onClick={save}>
        {t.save}
      </PrimaryButton>

      <Card className="space-y-3">
        <div>
          <SectionTitle>{t.fUsers}</SectionTitle>
          <Hint>{t.fUsersHint}</Hint>
        </div>
        <ul className="divide-y divide-neutral-100">
          {(users.data ?? []).map((user) => (
            <li key={user.email} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-neutral-900" dir="ltr">
                  {user.email}
                </p>
                <p className="text-[12px] text-neutral-500">
                  {user.last_login_at ? t.fLastLogin(formatPartnerDate(user.last_login_at, lang)) : t.fNeverLogged}
                </p>
              </div>
              {user.is_me && <Pill>{t.fYou}</Pill>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>{t.fTerms}</SectionTitle>
        {terms.accepted_version && (
          <div className="text-[14px] text-neutral-800">
            <p>{t.fTermsAccepted(terms.accepted_version, formatPartnerDate(terms.accepted_at, lang))}</p>
            {terms.signer_name && <p className="text-[13px] text-neutral-500">{t.fTermsSigner(terms.signer_name)}</p>}
          </div>
        )}
        <QuietButton onClick={() => setShowTerms((shown) => !shown)}>{t.fTermsRead}</QuietButton>
        {showTerms && (
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-line rounded-[10px] border border-neutral-200 bg-neutral-50 p-4 text-[14px] leading-relaxed text-neutral-800">
            {termsText(terms, lang)}
          </div>
        )}
      </Card>
    </>
  );
}
