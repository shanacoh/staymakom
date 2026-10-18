// Brouillon des disponibilités d'une expérience : on modifie à l'écran, rien ne part avant
// « Enregistrer ». Partagé entre l'accueil et la section Disponibilités d'une expérience.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { partnerKeys, setPartnerAvailability } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import type { PartnerAvailability } from "@/lib/partner/types";

export function useAvailabilityDraft(experienceId: string, initial: PartnerAvailability) {
  const { t } = usePartner();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<PartnerAvailability>(initial);
  const [draft, setDraft] = useState<PartnerAvailability>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    try {
      const applied = await setPartnerAvailability(experienceId, draft);
      setSaved(applied);
      setDraft(applied);
      toast.success(t.avSaved);
      queryClient.invalidateQueries({ queryKey: partnerKeys.experience(experienceId) });
      queryClient.invalidateQueries({ queryKey: partnerKeys.experiences });
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return { draft, setDraft, dirty, saving, save };
}
