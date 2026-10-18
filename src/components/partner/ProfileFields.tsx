// Les champs d'identité du prestataire, utilisés à la première connexion et dans l'onglet Profil.
// Ils sont appliqués directement : c'est son identité, pas du contenu publié.
// La raison sociale et le numéro fiscal ne sont plus demandés au prestataire : ils restent en base
// et l'équipe les saisit dans la fiche prestataire du back-office. Comme ils ne sont plus envoyés,
// la base garde leur valeur actuelle.

import { TextField } from "@/components/partner/ui";
import { usePartner } from "@/lib/partner/context";
import type { PartnerProvider } from "@/lib/partner/types";

export interface ProfileDraft {
  contact_name: string;
  whatsapp: string;
  address: string;
}

export const profileDraftOf = (provider: PartnerProvider): ProfileDraft => ({
  contact_name: provider.contact_name ?? "",
  whatsapp: provider.whatsapp ?? "",
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
      <TextField label={t.fAddress} autoComplete="street-address" value={draft.address} onChange={(v) => onChange({ address: v })} />
    </div>
  );
}
