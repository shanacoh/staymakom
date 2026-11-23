// Sous chaque section de l'aperçu : l'état de chaque champ (préparé par STAYMAKOM / rempli par vous ;
// confirmé / à confirmer / à remplir) et deux boutons, « Ça me va » et « Proposer une modification ».
// Une modification passe par la table des propositions : rien n'arrive sur le site sans l'équipe.
// Les règles et les infos pratiques s'éditent sur leur propre écran (appliquées directement pour les
// règles, le contact du jour J et le prix public).

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Hint, Notice, Pill, PrimaryButton, QuietButton, TextAreaField, TextField } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { goliveKeys, usePartnerAccess } from "@/lib/partner/access";
import { partnerErrorCode } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { formatFieldValue, NOTE_SECTIONS, sectionState } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import { changedFields } from "@/lib/partner/logic";
import type { ListingField, ListingKind } from "@/lib/partner/types";

const STORY_FIELDS = ["title", "subtitle", "long_copy", "duration"] as const;

interface Props {
  kind: ListingKind;
  targetId: string;
  section: string;
  fields: ListingField[];
  notePending: boolean;
}

export function SectionReview({ kind, targetId, section, fields, notePending }: Props) {
  const { t: base, lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const access = usePartnerAccess();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"idle" | "edit">("idle");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const storyOriginal = Object.fromEntries(
    STORY_FIELDS.map((key) => [key, String(fields.find((f) => f.key === key)?.value ?? "")]),
  ) as Record<string, string>;
  const [story, setStory] = useState(storyOriginal);

  const state = sectionState(fields);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: goliveKeys.listing(access.scope, kind, targetId) });
    queryClient.invalidateQueries({ queryKey: goliveKeys.golive(access.scope) });
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await access.confirmSection(kind, targetId, section);
      toast.success(t.sectionConfirmed);
      refresh();
    } catch {
      toast.error(base.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const sendNote = async () => {
    setBusy(true);
    try {
      await access.submitNote(kind, targetId, section, note);
      toast.success(t.noteSent);
      setNote("");
      setMode("idle");
      refresh();
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("no_change") ? base.qNothingChanged : base.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const sendStory = async () => {
    const changed = changedFields(storyOriginal, story);
    if (Object.keys(changed).length === 0) {
      toast.message(base.qNothingChanged);
      return;
    }
    setBusy(true);
    try {
      await access.submitProposal({ experienceId: targetId, type: "text", proposed: { ...changed, lang } });
      toast.success(base.proposalSent);
      setMode("idle");
      refresh();
    } catch (error) {
      toast.error(partnerErrorCode(error).includes("no_change") ? base.qNothingChanged : base.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  // Où mène « Proposer une modification » : un écran dédié, ou un formulaire ici même.
  const editScreen =
    kind === "experience" && section === "rules"
      ? { to: `${access.base}/rules/${targetId}`, label: t.editRules }
      : kind === "experience" && section === "practical"
        ? { to: `${access.base}/practical/${targetId}`, label: t.editPractical }
        : null;
  const useNote = kind === "hotel" || NOTE_SECTIONS.has(section);

  return (
    <div className="space-y-3 rounded-[12px] border border-neutral-200 bg-white p-4" dir={lang === "he" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-neutral-900">{t.sections[section] ?? section}</h3>
        <Pill tone={state === "confirmed" ? "strong" : state === "to_fill" ? "neutral" : "muted"}>
          {state === "confirmed" ? t.stateConfirmed : state === "to_fill" ? t.stateToFill : t.stateToConfirm}
        </Pill>
      </div>

      <ul className="divide-y divide-neutral-100">
        {fields.map((field) => (
          <li key={field.key} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5 text-[12px]">
            <span className="min-w-0 flex-1">
              <span className="font-medium text-neutral-900">{t.fields[field.key] ?? field.key}</span>
              <span className="block truncate text-neutral-500">{formatFieldValue(field, t, base.weekdaysLong)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-neutral-500">
              <span>{field.source === "partner" ? t.sourcePartner : t.sourceTeam}</span>
              <span aria-hidden>·</span>
              <span className={cn(field.state === "confirmed" ? "font-semibold text-neutral-900" : "text-neutral-500")}>
                {field.state === "confirmed" ? t.stateConfirmed : field.state === "to_fill" ? t.stateToFill : t.stateToConfirm}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {notePending && <Notice>{t.notePending}</Notice>}

      {mode === "edit" && useNote && (
        <div className="space-y-2">
          <TextAreaField label={t.noteLabel} placeholder={t.notePlaceholder} rows={3} value={note} onChange={setNote} />
          <div className="flex gap-2">
            <PrimaryButton busy={busy} disabled={note.trim().length < 2} onClick={sendNote}>
              {base.send}
            </PrimaryButton>
            <QuietButton onClick={() => setMode("idle")}>{base.cancel}</QuietButton>
          </div>
        </div>
      )}

      {mode === "edit" && !useNote && section === "story" && (
        <div className="space-y-2">
          <TextField label={t.fields.title} value={story.title} onChange={(v) => setStory((s) => ({ ...s, title: v }))} />
          <TextField label={t.fields.subtitle} value={story.subtitle} onChange={(v) => setStory((s) => ({ ...s, subtitle: v }))} />
          <TextAreaField label={t.fields.long_copy} rows={6} value={story.long_copy} onChange={(v) => setStory((s) => ({ ...s, long_copy: v }))} />
          <TextField label={t.fields.duration} value={story.duration} onChange={(v) => setStory((s) => ({ ...s, duration: v }))} />
          <Hint>{base.pIntro}</Hint>
          <div className="flex gap-2">
            <PrimaryButton busy={busy} onClick={sendStory}>
              {base.send}
            </PrimaryButton>
            <QuietButton onClick={() => setMode("idle")}>{base.cancel}</QuietButton>
          </div>
        </div>
      )}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          {state !== "confirmed" && fields.some((f) => f.state === "to_confirm") && (
            <PrimaryButton busy={busy} onClick={confirm}>
              {t.ok}
            </PrimaryButton>
          )}
          {editScreen ? (
            <Link
              to={editScreen.to}
              className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-neutral-300 px-5 text-[13px] font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              {editScreen.label}
            </Link>
          ) : (
            <QuietButton onClick={() => setMode("edit")}>{t.propose}</QuietButton>
          )}
        </div>
      )}
    </div>
  );
}
