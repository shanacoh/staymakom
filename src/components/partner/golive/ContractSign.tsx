// Signature du contrat hôtel : ses informations pré-remplies (modifiables, elles mettent à jour sa
// fiche), un résumé des termes clés en clair, le texte complet consultable, nom, fonction, signature
// au doigt, « je suis autorisé à signer pour l'hôtel ». La base enregistre la trace (version, date et
// heure, nom, fonction, signature, utilisateur, IP, navigateur) ; le PDF part ensuite par email.

import { useState } from "react";
import { toast } from "sonner";
import { Card, Hint, Notice, PrimaryButton, SectionTitle, TextField } from "@/components/partner/ui";
import { SignaturePad } from "@/components/partner/golive/SignaturePad";
import { finalizePartnerContract, partnerErrorCode, signPartnerContract } from "@/lib/partner/api";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";

/** Le texte du contrat avec ses variables remplies, tel qu'il sera signé. */
export function renderContract(text: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce((out, [key, value]) => out.split(`{{${key}}}`).join(value ?? ""), text);
}

export function ContractSign() {
  const { t: base, lang, setSession } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const session = usePartnerSession();
  const vars = session.contract_variables;
  const [company, setCompany] = useState({
    company: vars?.company ?? "",
    registration_number: vars?.registration_number ?? "",
    address: vars?.address ?? "",
  });
  const [signerName, setSignerName] = useState(vars?.signatory_name ?? session.provider.contact_name ?? "");
  const [signerTitle, setSignerTitle] = useState(vars?.signatory_title ?? "");
  const [signature, setSignature] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [busy, setBusy] = useState(false);

  const terms = session.terms;
  const contractText = terms.text_en ?? "";
  const notReady = !terms.commission_ready || terms.current_version == null || ["", "À coller"].includes(contractText.trim());
  if (notReady) {
    return <Notice>{!terms.commission_ready ? t.commissionNotReady : t.contractNotReady}</Notice>;
  }

  const filled = renderContract(contractText, {
    ...(vars ?? {}),
    ...company,
    signatory_name: signerName,
    signatory_title: signerTitle,
  } as Record<string, string>);
  const canSign = authorized && !!signature && signerName.trim().length >= 2 && signerTitle.trim().length >= 2;

  const sign = async () => {
    if (!signature) {
      toast.error(t.signatureMissing);
      return;
    }
    setBusy(true);
    try {
      const result = await signPartnerContract({
        version: terms.current_version!,
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim(),
        signature,
        authorized,
        company,
      });
      // Le PDF et les emails partent en arrière-plan : la signature est déjà enregistrée.
      finalizePartnerContract(result.acceptance_id).catch(() => {});
      toast.success(t.signed);
      setSession(result.session);
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("terms_version_outdated") ? base.termsOutdated : base.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className="text-[17px] font-semibold tracking-tight">{t.contractTitle}</h1>
        <Hint>{t.contractIntro}</Hint>
      </div>

      <Card className="space-y-3">
        <SectionTitle>{t.yourInfo}</SectionTitle>
        <p className="text-[13px] text-neutral-700">
          {t.hotelName} : <strong className="text-neutral-900">{vars?.hotel_name}</strong>
        </p>
        <TextField label={t.company} value={company.company} onChange={(v) => setCompany((c) => ({ ...c, company: v }))} />
        <TextField
          label={t.registration}
          dir="ltr"
          value={company.registration_number}
          onChange={(v) => setCompany((c) => ({ ...c, registration_number: v }))}
        />
        <TextField label={t.address} value={company.address} onChange={(v) => setCompany((c) => ({ ...c, address: v }))} />
      </Card>

      <Card className="space-y-2">
        <SectionTitle>{t.keyTerms}</SectionTitle>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-neutral-700">
          <li>· {t.keyCommission(vars?.commission ?? "")}</li>
          <li>· {t.keyHyperguest}</li>
          <li>· {t.keyFullText}</li>
        </ul>
        <button type="button" onClick={() => setShowFull((v) => !v)} className="text-[13px] font-medium text-neutral-900 underline underline-offset-4">
          {t.readFull}
        </button>
        {showFull && (
          <div
            dir="ltr"
            className="max-h-[50vh] overflow-y-auto whitespace-pre-line rounded-[10px] border border-neutral-200 bg-neutral-50 p-4 text-[12px] leading-relaxed text-neutral-800"
          >
            {filled}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t.signerName} autoComplete="name" value={signerName} onChange={setSignerName} />
          <TextField label={t.signerTitle} value={signerTitle} onChange={setSignerTitle} />
        </div>
        <SignaturePad label={t.signHere} clearLabel={t.clearSignature} onChange={setSignature} />
        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-neutral-900">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-neutral-900"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
          />
          {t.authorized}
        </label>
        <PrimaryButton busy={busy} disabled={!canSign} onClick={sign}>
          {t.sign}
        </PrimaryButton>
        <Notice>{base.termsRecord}</Notice>
      </Card>
    </div>
  );
}
