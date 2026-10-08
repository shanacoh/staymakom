import { Loader2, Star } from "lucide-react";
import { AiMark } from "@/components/forms/ai/AiMark";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Button, Input, Label } from "@/components/forms/styled";
import { cn } from "@/lib/utils";
import {
  presentationField,
  presentationPlainText,
  resolvePresentation,
  type MoodPresentation,
  type MoodPresentationMap,
  type PresentationLanguage,
  type PresentationTextField,
} from "@/lib/standaloneExperienceForm/moodPresentations";

export interface MoodOption {
  id: string;
  name: string;
  status?: string | null;
}

interface Props {
  /** Les moods cochés, le principal en premier. */
  moods: MoodOption[];
  primaryId: string | null;
  activeMoodId: string | null;
  onActiveMoodChange: (id: string) => void;
  lang: PresentationLanguage;
  /** Présentation du mood principal : les champs de la fiche elle-même. */
  main: MoodPresentation;
  presentations: MoodPresentationMap;
  /** Photos déjà enregistrées de la fiche (couverture + galerie), parmi lesquelles choisir. */
  coverChoices: string[];
  onMainFieldChange: (field: PresentationTextField, value: string) => void;
  onMainCoverChange: (url: string) => void;
  onPresentationChange: (moodId: string, patch: Partial<MoodPresentation>) => void;
  onCustomize: (moodId: string) => void;
  onResetToMain: (moodId: string) => void;
  onMakePrimary: (moodId: string) => void;
  /** « Réécrire pour ce mood » : l'IA réécrit titre, accroche et description de cet onglet. */
  onRewrite?: (moodId: string) => void;
  /** Le mood en cours de réécriture par l'IA, ou null. */
  rewritingMoodId?: string | null;
  /** Vrai si l'IA vient de remplir ce champ de ce mood et que Shana ne l'a pas encore relu. */
  isAiMarked?: (moodId: string, field: PresentationTextField | "cover_image") => boolean;
  /** Messages de validation du mood principal (titre EN, description EN). */
  errors?: { title?: string; long_copy?: string };
  disabled?: boolean;
}

const LANG_LABEL: Record<PresentationLanguage, string> = { fr: "FR", en: "EN", he: "HE" };

const PLACEHOLDERS: Record<PresentationLanguage, { title: string; subtitle: string; long_copy: string }> = {
  fr: { title: "Ex : Dégustation de vins en Galilée", subtitle: "Courte accroche", long_copy: "Description complète de l'expérience..." },
  en: { title: "Ex: Wine tasting in the Galilee", subtitle: "Short hook", long_copy: "Full description of the experience..." },
  he: { title: "כותרת בעברית", subtitle: "תת-כותרת בעברית", long_copy: "תיאור מלא של החוויה..." },
};

// Section « Présentation par mood » : un onglet par mood coché. Chaque mood peut avoir sa photo de
// couverture, son titre, son accroche et sa description ; tout le reste de la fiche est commun.
export function MoodPresentationSection({
  moods,
  primaryId,
  activeMoodId,
  onActiveMoodChange,
  lang,
  main,
  presentations,
  coverChoices,
  onMainFieldChange,
  onMainCoverChange,
  onPresentationChange,
  onCustomize,
  onResetToMain,
  onMakePrimary,
  onRewrite,
  rewritingMoodId = null,
  isAiMarked,
  errors,
  disabled,
}: Props) {
  if (moods.length === 0) {
    return (
      <p className="text-[11px] text-[#6f6a63]">
        Coche au moins un mood dans la section Rangement : son onglet apparaîtra ici.
      </p>
    );
  }

  const activeId = moods.some((m) => m.id === activeMoodId) ? (activeMoodId as string) : moods[0].id;
  const { presentation, isOwn, isPrimary } = resolvePresentation(main, presentations, activeId, primaryId);
  const activeMood = moods.find((m) => m.id === activeId)!;
  const isRtl = lang === "he";
  const titleField = presentationField("title", lang);
  const subtitleField = presentationField("subtitle", lang);
  const longCopyField = presentationField("long_copy", lang);

  const changeField = (field: PresentationTextField, value: string) => {
    if (isPrimary) onMainFieldChange(field, value);
    else onPresentationChange(activeId, { [field]: value });
  };
  const changeCover = (url: string) => {
    if (isPrimary) onMainCoverChange(url);
    else onPresentationChange(activeId, { cover_image: url });
  };

  const marked = (field: PresentationTextField | "cover_image", moodId = activeId) => !!isAiMarked?.(moodId, field);
  const moodMarked = (moodId: string) =>
    marked("cover_image", moodId) || (["title", "subtitle", "long_copy"] as const).some((part) =>
      (["en", "fr", "he"] as const).some((l) => marked(presentationField(part, l), moodId)),
    );

  const rewriting = rewritingMoodId === activeId;
  // Sans mood coché (onglet « Présentation principale »), il n'y a pas d'angle à donner à l'IA.
  const rewriteButton = (
    <button
      type="button"
      onClick={() => onRewrite?.(activeId)}
      disabled={disabled || !onRewrite || !activeId || rewritingMoodId !== null}
      title={!activeId ? "Coche d'abord un mood dans la section Rangement" : "L'IA réécrit titre, accroche et description pour ce mood, à partir de la fiche"}
      className={cn(
        "px-2 py-1 rounded-[8px] border border-dashed text-[11px] inline-flex items-center gap-1 transition-colors",
        disabled || !onRewrite || !activeId || rewritingMoodId !== null
          ? "border-[#e9e6e1] text-[#b3aea6] cursor-not-allowed"
          : "border-[#5b3fc4] text-[#5b3fc4] hover:bg-[#f3efff]",
      )}
    >
      {rewriting ? <Loader2 className="h-3 w-3 animate-spin" /> : "✦"}
      {rewriting ? "Réécriture en cours, environ 30 secondes" : "Réécrire pour ce mood"}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Onglets : un par mood coché */}
      <div className="flex flex-wrap gap-1 border-b border-[#e9e6e1]">
        {moods.map((mood) => {
          const active = mood.id === activeId;
          const customized = mood.id !== primaryId && !!presentations[mood.id];
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => onActiveMoodChange(mood.id)}
              className={cn(
                "px-2.5 py-1.5 text-[11px] border-b-2 -mb-px flex items-center gap-1 transition-colors",
                active ? "border-[#1a1814] text-[#1a1814] font-semibold" : "border-transparent text-[#6f6a63] hover:text-[#1a1814]",
              )}
            >
              {mood.id === primaryId && <span aria-label="Mood principal">★</span>}
              {mood.name}
              {customized && <span className="text-[9px] text-[#6f6a63] font-normal">· version propre</span>}
              <AiMark show={moodMarked(mood.id)} />
            </button>
          );
        })}
      </div>

      {/* Mood non principal sans version propre : contenu du principal, en gris et en lecture seule */}
      {!isOwn ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#e9e6e1] bg-[#f5f3f0] p-3 space-y-2 text-[#8a857d]" dir={isRtl ? "rtl" : undefined}>
            <p className="text-[9px] uppercase tracking-[0.04em]" dir="ltr">
              Repris du mood principal · lecture seule
            </p>
            <div className="flex gap-3">
              {presentation.cover_image && (
                <img src={presentation.cover_image} alt="" className="h-16 w-24 rounded-md object-cover opacity-70 shrink-0" />
              )}
              <div className="min-w-0 space-y-1">
                <p className="text-[12px] font-semibold">{presentation[titleField] || "Pas de titre dans cette langue"}</p>
                <p className="text-[11px]">{presentation[subtitleField] || "Pas d'accroche dans cette langue"}</p>
              </div>
            </div>
            <p className="text-[11px] line-clamp-4">
              {presentationPlainText(presentation[longCopyField] || "") || "Pas de description dans cette langue"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => onCustomize(activeId)} disabled={disabled}>
              Personnaliser pour ce mood
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onMakePrimary(activeId)} disabled={disabled}>
              <Star className="h-3 w-3 mr-1" /> En faire le mood principal
            </Button>
            {rewriteButton}
          </div>
          <p className="text-[10px] text-[#6f6a63]">
            Tant que tu ne personnalises pas, « {activeMood.name} » affiche exactement la présentation du mood principal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Photo de couverture, choisie parmi les photos de la fiche */}
          <div className="space-y-1.5">
            <Label>
              Photo de couverture pour ce mood
              <AiMark show={marked("cover_image")} />
            </Label>
            {coverChoices.length === 0 ? (
              <p className="text-[11px] text-[#6f6a63]">
                Ajoute d'abord des photos dans la section Galerie, puis enregistre : elles seront proposées ici.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coverChoices.map((url) => {
                  const selected = presentation.cover_image === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => changeCover(url)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={cn(
                        "relative h-14 w-20 rounded-md overflow-hidden border-2 transition-colors",
                        selected ? "border-[#1a1814]" : "border-transparent opacity-70 hover:opacity-100",
                      )}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {selected && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#1a1814] text-white text-[8px] uppercase tracking-wide text-center">
                          Couverture
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`mood-title-${activeId}`}>
              Titre ({LANG_LABEL[lang]}){isPrimary && lang === "en" && <span className="text-destructive"> *</span>}
              <AiMark show={marked(titleField)} />
            </Label>
            <Input
              id={`mood-title-${activeId}`}
              value={presentation[titleField]}
              onChange={(e) => changeField(titleField, e.target.value)}
              placeholder={PLACEHOLDERS[lang].title}
              dir={isRtl ? "rtl" : undefined}
              className={cn(isRtl && "bg-hebrew-input")}
              disabled={disabled}
            />
            {isPrimary && lang === "en" && errors?.title && <p className="text-destructive text-xs">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`mood-subtitle-${activeId}`}>
              Accroche ({LANG_LABEL[lang]})
              <AiMark show={marked(subtitleField)} />
            </Label>
            <Input
              id={`mood-subtitle-${activeId}`}
              value={presentation[subtitleField]}
              onChange={(e) => changeField(subtitleField, e.target.value)}
              placeholder={PLACEHOLDERS[lang].subtitle}
              dir={isRtl ? "rtl" : undefined}
              className={cn(isRtl && "bg-hebrew-input")}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Description ({LANG_LABEL[lang]}){isPrimary && lang === "en" && <span className="text-destructive"> *</span>}
              <AiMark show={marked(longCopyField)} />
            </Label>
            {/* La clé recrée l'éditeur quand on change de mood ou de langue : chaque texte a le sien. */}
            <RichTextEditor
              key={`${activeId}-${lang}`}
              content={presentation[longCopyField] || ""}
              onChange={(html) => changeField(longCopyField, html)}
              placeholder={PLACEHOLDERS[lang].long_copy}
              dir={isRtl ? "rtl" : "ltr"}
            />
            {isPrimary && lang === "en" && errors?.long_copy && <p className="text-destructive text-xs">{errors.long_copy}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!isPrimary && (
              <Button type="button" variant="outline" size="sm" onClick={() => onMakePrimary(activeId)} disabled={disabled}>
                <Star className="h-3 w-3 mr-1" /> En faire le mood principal
              </Button>
            )}
            {rewriteButton}
            {!isPrimary && (
              <button
                type="button"
                onClick={() => onResetToMain(activeId)}
                disabled={disabled}
                className="text-[11px] text-[#6f6a63] underline hover:text-destructive ml-auto"
              >
                Revenir à la présentation principale
              </button>
            )}
          </div>
          {isPrimary && moods.length > 1 && (
            <p className="text-[10px] text-[#6f6a63]">
              ★ Mood principal : c'est cette présentation que reprennent les moods sans version propre.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
