// Proposer une modification sur une expérience : textes, photos, prix fournisseur.
// Rien de tout cela n'est appliqué ici : chaque bloc envoie une proposition à valider.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PhotoPicker } from "@/components/partner/PhotoPicker";
import { Card, Hint, Notice, PrimaryButton, SectionTitle, TextAreaField, TextField } from "@/components/partner/ui";
import { partnerErrorCode, partnerKeys, submitPartnerProposal } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { changedFields, formatMoney, ownText } from "@/lib/partner/logic";
import type { PartnerExperienceDetail, ProposalType } from "@/lib/partner/types";

const TEXT_FIELDS = ["title", "subtitle", "long_copy", "duration"] as const;

export function ProposalSection({ experience }: { experience: PartnerExperienceDetail }) {
  const { t, lang } = usePartner();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState<ProposalType | null>(null);

  const originalTexts: Record<string, string> = Object.fromEntries(TEXT_FIELDS.map((field) => [field, ownText(experience, field, lang)]));
  const [texts, setTexts] = useState(originalTexts);
  const [photos, setPhotos] = useState<string[]>([]);
  const [price, setPrice] = useState({ adult: "", child: "" });

  const pending = (type: ProposalType) => experience.pending_proposals.some((p) => p.proposal_type === type);

  const send = async (type: ProposalType, proposed: Record<string, unknown>, onDone: () => void) => {
    if (Object.keys(proposed).length === 0) {
      toast.message(t.qNothingChanged);
      return;
    }
    setSending(type);
    try {
      await submitPartnerProposal({ experienceId: experience.id, type, proposed: { ...proposed, lang }, note });
      toast.success(t.proposalSent);
      onDone();
      setNote("");
      queryClient.invalidateQueries({ queryKey: partnerKeys.experience(experience.id) });
      queryClient.invalidateQueries({ queryKey: partnerKeys.proposals });
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("no_change") ? t.qNothingChanged : t.errorGeneric);
    } finally {
      setSending(null);
    }
  };

  const currentPrice = experience.supplier_price;
  const priceProposal = {
    ...(price.adult.trim() ? { supplier_price_adult: price.adult.trim().replace(",", ".") } : {}),
    ...(price.child.trim() ? { supplier_price_child: price.child.trim().replace(",", ".") } : {}),
  };

  return (
    <div className="space-y-4">
      <Hint>{t.pIntro}</Hint>

      <Card className="space-y-4">
        <TextAreaField label={t.pNote} hint={t.pNoteHint} optional={t.optional} rows={2} value={note} onChange={setNote} />
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t.pTexts}</SectionTitle>
        {pending("text") && <Notice>{t.proposalPendingNotice}</Notice>}
        <TextField label={t.pTitle} value={texts.title} onChange={(v) => setTexts((c) => ({ ...c, title: v }))} />
        <TextAreaField label={t.pSubtitle} rows={2} value={texts.subtitle} onChange={(v) => setTexts((c) => ({ ...c, subtitle: v }))} />
        <TextAreaField label={t.pDescription} rows={7} value={texts.long_copy} onChange={(v) => setTexts((c) => ({ ...c, long_copy: v }))} />
        <TextField label={t.pDuration} value={texts.duration} onChange={(v) => setTexts((c) => ({ ...c, duration: v }))} />
        <PrimaryButton busy={sending === "text"} disabled={sending !== null} onClick={() => send("text", changedFields(originalTexts, texts), () => {})}>
          {t.pSubmit}
        </PrimaryButton>
      </Card>

      <Card className="space-y-4">
        <div>
          <SectionTitle>{t.pPhotos}</SectionTitle>
          <Hint>{t.pPhotosHint}</Hint>
        </div>
        {pending("photos") && <Notice>{t.proposalPendingNotice}</Notice>}
        <PhotoPicker photos={photos} onChange={setPhotos} />
        {photos.length > 0 && (
          <PrimaryButton busy={sending === "photos"} disabled={sending !== null} onClick={() => send("photos", { photos }, () => setPhotos([]))}>
            {t.pSubmit}
          </PrimaryButton>
        )}
      </Card>

      {experience.is_primary && (
        <Card className="space-y-4">
          <div>
            <SectionTitle>{t.pPrice}</SectionTitle>
            <Hint>{t.pPriceHint}</Hint>
          </div>
          {pending("price") && <Notice>{t.proposalPendingNotice}</Notice>}
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t.pPriceAdult}
              inputMode="decimal"
              dir="ltr"
              hint={currentPrice?.adult ? t.pPriceCurrent(formatMoney(currentPrice.adult, experience.currency)) : undefined}
              value={price.adult}
              onChange={(adult) => setPrice((c) => ({ ...c, adult }))}
            />
            <TextField
              label={t.pPriceChild}
              optional={t.optional}
              inputMode="decimal"
              dir="ltr"
              hint={currentPrice?.child ? t.pPriceCurrent(formatMoney(currentPrice.child, experience.currency)) : undefined}
              value={price.child}
              onChange={(child) => setPrice((c) => ({ ...c, child }))}
            />
          </div>
          <PrimaryButton
            busy={sending === "price"}
            disabled={sending !== null}
            onClick={() => send("price", priceProposal, () => setPrice({ adult: "", child: "" }))}
          >
            {t.pSubmit}
          </PrimaryButton>
        </Card>
      )}
    </div>
  );
}
