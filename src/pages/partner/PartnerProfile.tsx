// Profil : ses informations et son contact du jour J par défaut (un seul bloc, champs courts côte
// à côte), puis un bloc « Compte » qui regroupe ses utilisateurs et les conditions acceptées.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileFields, profileDraftOf, type ProfileDraft } from "@/components/partner/ProfileFields";
import { Card, Hint, Pill, PrimaryButton, SectionTitle, SelectField, TextField } from "@/components/partner/ui";
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

  const languageOptions = [{ value: "", label: " " }, ...(["he", "en", "fr"] as const).map((code) => ({ value: code, label: t.langNames[code] }))];

  return (
    <>
      <h1 className="text-[17px] font-semibold tracking-tight">{t.tabProfile}</h1>

      <Card className="space-y-4">
        <SectionTitle>{t.fInfo}</SectionTitle>
        {/* Non modifiable ici : affiché en texte, pas en champ grisé qui ressemble à un champ à remplir. */}
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div className="min-w-0">
            <p className="text-[12px] text-neutral-500">{t.fName}</p>
            <p className="truncate font-medium text-neutral-900">{provider.name}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] text-neutral-500">{t.fEmail}</p>
            <p className="truncate font-medium text-neutral-900" dir="ltr" title={t.fEmailHint}>
              {provider.email ?? session.user_email ?? ""}
            </p>
          </div>
        </div>
        <ProfileFields draft={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />

        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <div>
            <p className="text-[12px] font-semibold text-neutral-900">{t.fDayContact}</p>
            <Hint>{t.fDayContactHint}</Hint>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              options={languageOptions}
            />
            <div className="flex items-end justify-end">
              <PrimaryButton className="w-full sm:w-auto" busy={saving} onClick={save}>
                {t.save}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Card>

      {/* Utilisateurs et conditions : de la consultation, regroupés en un seul bloc court. */}
      <Card className="space-y-3">
        <SectionTitle>{t.fAccount}</SectionTitle>
        <ul className="divide-y divide-neutral-100">
          {(users.data ?? []).map((user) => (
            <li key={user.email} className="flex items-center justify-between gap-3 py-2 first:pt-0">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-neutral-900" dir="ltr">
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
        <Hint>{t.fUsersHint}</Hint>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
          <p className="text-[12px] text-neutral-600">
            {terms.accepted_version ? t.fTermsAccepted(terms.accepted_version, formatPartnerDate(terms.accepted_at, lang)) : t.fTerms}
            {terms.signer_name && <span className="text-neutral-400"> · {terms.signer_name}</span>}
          </p>
          <button
            type="button"
            onClick={() => setShowTerms((shown) => !shown)}
            className="text-[12px] font-medium text-neutral-700 underline underline-offset-4"
          >
            {t.fTermsRead}
          </button>
        </div>
        {showTerms && (
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-line rounded-[9px] border border-neutral-200 bg-neutral-50 p-3 text-[12px] leading-relaxed text-neutral-800">
            {termsText(terms, lang)}
          </div>
        )}
      </Card>
    </>
  );
}
