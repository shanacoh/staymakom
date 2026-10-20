// Tant que la version en vigueur des conditions n'est pas acceptée, le partenaire ne voit que cet écran.
// Première connexion : il vérifie d'abord ses informations, puis accepte les conditions.
// Nouvelle version publiée : il ne voit que les conditions à accepter de nouveau.

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Card, Hint, Notice, PrimaryButton, QuietButton, TextField } from "@/components/partner/ui";
import { LanguageSwitch, PartnerBrand } from "@/components/partner/PartnerShell";
import { ProfileFields, profileDraftOf, type ProfileDraft } from "@/components/partner/ProfileFields";
import { acceptPartnerTerms, partnerErrorCode, updatePartnerProfile } from "@/lib/partner/api";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import type { PartnerLang, PartnerTerms } from "@/lib/partner/types";

/** Le texte des conditions dans la langue de l'espace ; à défaut, la première langue rédigée. */
export function termsText(terms: PartnerTerms, lang: PartnerLang): string {
  const texts = { he: terms.text_he, en: terms.text_en, fr: terms.text_fr };
  return [texts[lang], texts.en, texts.fr, texts.he].find((text) => text && text.trim() !== "") ?? "";
}

export default function PartnerOnboarding() {
  const { t, lang, setSession } = usePartner();
  const session = usePartnerSession();
  const { signOut } = useAuth();
  const firstTime = !session.terms.accepted_version;

  const [step, setStep] = useState<"profile" | "terms">(firstTime ? "profile" : "terms");
  const [draft, setDraft] = useState<ProfileDraft>(() => profileDraftOf(session.provider));
  const [signerName, setSignerName] = useState(session.provider.contact_name ?? "");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true);
    try {
      const next = await updatePartnerProfile({ ...draft, language: lang });
      setSession(next);
      if (!signerName.trim()) setSignerName(draft.contact_name);
      setStep("terms");
      window.scrollTo({ top: 0 });
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (session.terms.current_version == null) return;
    setBusy(true);
    try {
      setSession(await acceptPartnerTerms(session.terms.current_version, signerName.trim()));
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("terms_version_outdated") ? t.termsOutdated : t.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-5">
      <div className="mb-6 flex items-center justify-between">
        <PartnerBrand />
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <QuietButton className="min-h-9 px-3 text-[13px]" onClick={() => signOut()}>
            {t.logout}
          </QuietButton>
        </div>
      </div>

      {step === "profile" ? (
        <Card className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">1 / 2 · {session.provider.name}</p>
            <h1 className="text-[17px] font-semibold tracking-tight">{t.onboardingProfileTitle}</h1>
            <Hint>{t.onboardingProfileIntro}</Hint>
          </div>
          <ProfileFields draft={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
          <PrimaryButton busy={busy} onClick={saveProfile}>
            {t.onboardingContinue}
          </PrimaryButton>
        </Card>
      ) : (
        <Card className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {firstTime ? "2 / 2 · " : ""}
              {session.terms.current_version != null && t.termsVersion(session.terms.current_version)}
            </p>
            <h1 className="text-[17px] font-semibold tracking-tight">{t.termsTitle}</h1>
            <Hint>{firstTime ? t.termsIntroFirst : t.termsIntroUpdated}</Hint>
          </div>

          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-line rounded-[10px] border border-neutral-200 bg-neutral-50 p-4 text-[13px] leading-relaxed text-neutral-800">
            {termsText(session.terms, lang)}
          </div>

          <TextField label={t.termsSignerLabel} autoComplete="name" value={signerName} onChange={setSignerName} />

          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-neutral-900">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 accent-neutral-900"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            {t.termsCheckbox}
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <PrimaryButton busy={busy} disabled={!agreed || signerName.trim().length < 2} onClick={accept}>
              {t.termsAccept}
            </PrimaryButton>
            {firstTime && (
              <QuietButton disabled={busy} onClick={() => setStep("profile")}>
                {t.back}
              </QuietButton>
            )}
          </div>
          <Notice>{t.termsRecord}</Notice>
        </Card>
      )}
    </div>
  );
}
