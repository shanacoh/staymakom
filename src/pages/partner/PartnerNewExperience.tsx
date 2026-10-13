// Proposer une nouvelle expérience : un formulaire court qui crée une proposition, pas une fiche.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PhotoPicker } from "@/components/partner/PhotoPicker";
import { Card, Hint, PrimaryButton, TextAreaField, TextField } from "@/components/partner/ui";
import { partnerKeys, submitPartnerProposal } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";

const EMPTY = { title: "", description: "", duration: "", location: "", supplier_price_adult: "", supplier_price_child: "" };

export default function PartnerNewExperience() {
  const { t, lang } = usePartner();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const set = (field: keyof typeof EMPTY) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error(t.nTitleRequired);
      return;
    }
    setSending(true);
    try {
      await submitPartnerProposal({
        experienceId: null,
        type: "new_experience",
        proposed: {
          ...form,
          supplier_price_adult: form.supplier_price_adult.trim().replace(",", "."),
          supplier_price_child: form.supplier_price_child.trim().replace(",", "."),
          photos,
          lang,
        },
      });
      toast.success(t.proposalSent);
      queryClient.invalidateQueries({ queryKey: partnerKeys.proposals });
      navigate("/partner");
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">{t.nTitle}</h1>
        <Hint>{t.nIntro}</Hint>
      </div>
      <Card className="space-y-4">
        <TextField label={t.nName} value={form.title} onChange={set("title")} />
        <TextAreaField label={t.nDescription} rows={6} value={form.description} onChange={set("description")} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t.nDuration} placeholder="2h" value={form.duration} onChange={set("duration")} />
          <TextField label={t.nLocation} value={form.location} onChange={set("location")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t.pPriceAdult} inputMode="decimal" dir="ltr" value={form.supplier_price_adult} onChange={set("supplier_price_adult")} />
          <TextField
            label={t.pPriceChild}
            optional={t.optional}
            inputMode="decimal"
            dir="ltr"
            value={form.supplier_price_child}
            onChange={set("supplier_price_child")}
          />
        </div>
        <Hint>{t.pPriceHint}</Hint>
        <div className="space-y-2">
          <p className="text-[13px] font-semibold text-neutral-900">{t.pPhotos}</p>
          <PhotoPicker photos={photos} onChange={setPhotos} />
        </div>
        <PrimaryButton busy={sending} onClick={submit}>
          {t.pSubmit}
        </PrimaryButton>
      </Card>
    </>
  );
}
