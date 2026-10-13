// Disponibilités d'une expérience : le prestataire les gère seul, c'est appliqué tout de suite
// (et tracé côté base : qui, quand, avant, après).

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AvailabilityEditor } from "@/components/partner/AvailabilityEditor";
import { Card, Hint, Pill, PrimaryButton } from "@/components/partner/ui";
import { partnerKeys, setPartnerAvailability } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import type { PartnerAvailability, PartnerExperienceDetail } from "@/lib/partner/types";

export function AvailabilitySection({ experience }: { experience: PartnerExperienceDetail }) {
  const { t } = usePartner();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<PartnerAvailability>(experience.availability);
  const [draft, setDraft] = useState<PartnerAvailability>(experience.availability);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    try {
      const applied = await setPartnerAvailability(experience.id, draft);
      setSaved(applied);
      setDraft(applied);
      toast.success(t.avSaved);
      queryClient.invalidateQueries({ queryKey: partnerKeys.experience(experience.id) });
      queryClient.invalidateQueries({ queryKey: partnerKeys.experiences });
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Hint>{t.avIntro}</Hint>
      <Card>
        <AvailabilityEditor value={draft} onChange={setDraft} />
      </Card>
      {/* Reste visible en bas de l'écran : on ne quitte pas la page en oubliant d'enregistrer. */}
      <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-full border border-neutral-200 bg-white p-2 ps-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <span className="text-[13px] text-neutral-600">{dirty ? <Pill tone="urgent">{t.avUnsaved}</Pill> : t.saved}</span>
        <PrimaryButton className="w-auto" busy={saving} disabled={!dirty} onClick={save}>
          {t.save}
        </PrimaryButton>
      </div>
    </div>
  );
}
