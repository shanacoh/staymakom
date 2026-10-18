// Disponibilités d'une expérience : le prestataire les gère seul, c'est appliqué tout de suite
// (et tracé côté base : qui, quand, avant, après).

import { useQuery } from "@tanstack/react-query";
import { AvailabilityEditor } from "@/components/partner/AvailabilityEditor";
import { Card, Hint, Pill, PrimaryButton } from "@/components/partner/ui";
import { fetchPartnerBookings, partnerKeys } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { bookedDates } from "@/lib/partner/logic";
import { useAvailabilityDraft } from "@/lib/partner/useAvailabilityDraft";
import type { PartnerExperienceDetail } from "@/lib/partner/types";

/** Barre « Enregistrer » collée en bas de l'écran : on ne quitte pas la page en oubliant d'enregistrer. */
export function AvailabilitySaveBar({ dirty, saving, onSave }: { dirty: boolean; saving: boolean; onSave: () => void }) {
  const { t } = usePartner();
  return (
    <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-full border border-neutral-200 bg-white p-2 ps-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <span className="text-[13px] text-neutral-600">{dirty ? <Pill tone="urgent">{t.avUnsaved}</Pill> : t.saved}</span>
      <PrimaryButton className="w-auto" busy={saving} disabled={!dirty} onClick={onSave}>
        {t.save}
      </PrimaryButton>
    </div>
  );
}

export function AvailabilitySection({ experience }: { experience: PartnerExperienceDetail }) {
  const { t } = usePartner();
  const { draft, setDraft, dirty, saving, save } = useAvailabilityDraft(experience.id, experience.availability);
  const bookings = useQuery({ queryKey: partnerKeys.bookings, queryFn: fetchPartnerBookings });

  return (
    <div className="space-y-4">
      <Hint>{t.avIntro}</Hint>
      <Card>
        <AvailabilityEditor value={draft} onChange={setDraft} bookedDates={bookedDates(bookings.data ?? [], experience.id)} />
      </Card>
      <AvailabilitySaveBar dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}
