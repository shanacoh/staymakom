// Les champs d'identité du prestataire, utilisés à la première connexion et dans l'onglet Profil.
// Ils sont appliqués directement : c'est son identité, pas du contenu publié.

import { TextField } from "@/components/partner/ui";
import { usePartner } from "@/lib/partner/context";
import type { PartnerProvider } from "@/lib/partner/types";

export interface ProfileDraft {
  contact_name: string;
  whatsapp: string;
  legal_name: string;
  tax_id: string;
  address: string;
}

export const profileDraftOf = (provider: PartnerProvider): ProfileDraft => ({
  contact_name: provider.contact_name ?? "",
  whatsapp: provider.whatsapp ?? "",
  legal_name: provider.legal_name ?? "",
  tax_id: provider.tax_id ?? "",
  address: provider.address ?? "",
});

export function ProfileFields({ draft, onChange }: { draft: ProfileDraft; onChange: (patch: Partial<ProfileDraft>) => void }) {
  const { t } = usePartner();
  return (
    <div className="space-y-4">
      <TextField label={t.fContactName} autoComplete="name" value={draft.contact_name} onChange={(v) => onChange({ contact_name: v })} />
      <TextField
        label={t.fWhatsapp}
        type="tel"
        inputMode="tel"
        dir="ltr"
        placeholder="+972…"
        value={draft.whatsapp}
        onChange={(v) => onChange({ whatsapp: v })}
      />
      <TextField label={t.fLegalName} value={draft.legal_name} onChange={(v) => onChange({ legal_name: v })} />
      <TextField label={t.fTaxId} dir="ltr" value={draft.tax_id} onChange={(v) => onChange({ tax_id: v })} />
      <TextField label={t.fAddress} autoComplete="street-address" value={draft.address} onChange={(v) => onChange({ address: v })} />
    </div>
  );
}
