import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  presentationField,
  resolvePresentation,
  type MoodPresentation,
  type MoodPresentationMap,
  type PresentationLanguage,
} from "@/lib/standaloneExperienceForm/moodPresentations";
import type { MoodOption } from "./MoodPresentationSection";

interface Props {
  moods: MoodOption[];
  primaryId: string | null;
  activeMoodId: string | null;
  onActiveMoodChange: (id: string) => void;
  lang: PresentationLanguage;
  main: MoodPresentation;
  presentations: MoodPresentationMap;
  experienceId: string | null | undefined;
  /** Badges calculés à partir des informations clés (casher, enfants, parking...). */
  autoBadges: string[];
  city: string;
  /** Prix déjà mis en forme (ex. « 228 ₪ »), ou vide. */
  priceLabel: string;
}

interface TagLabels {
  label_en: string;
  label_fr?: string | null;
  label_he?: string | null;
}

// Aperçu en direct : la carte de l'expérience telle qu'elle apparaîtra dans le mood choisi
// (photo, titre, accroche, badges, ville, prix). Affichage seul, rien n'est enregistré ici.
export function MoodPreviewCard({
  moods,
  primaryId,
  activeMoodId,
  onActiveMoodChange,
  lang,
  main,
  presentations,
  experienceId,
  autoBadges,
  city,
  priceLabel,
}: Props) {
  // Même début de clé que le sélecteur de badges : l'aperçu se met à jour dès qu'un badge est coché.
  const { data: editorialTags } = useQuery({
    queryKey: ["standalone-highlight-tags", experienceId, "labels"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experience_highlight_tags")
        .select("position, highlight_tags(label_en, label_fr, label_he)")
        .eq("experience_id", experienceId)
        .order("position");
      if (error) throw error;
      return (data || []).map((r: any) => r.highlight_tags).filter(Boolean) as TagLabels[];
    },
    enabled: !!experienceId,
  });

  const activeId = moods.some((m) => m.id === activeMoodId) ? (activeMoodId as string) : moods[0]?.id ?? null;
  const { presentation } = activeId
    ? resolvePresentation(main, presentations, activeId, primaryId)
    : { presentation: main };
  const tagLabel = (t: TagLabels) => (lang === "fr" ? t.label_fr : lang === "he" ? t.label_he : t.label_en) || t.label_en;
  const badges = [...(editorialTags ?? []).map(tagLabel), ...autoBadges].slice(0, 4);
  const rtl = lang === "he";

  return (
    <div className="space-y-2">
      {moods.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {moods.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => onActiveMoodChange(mood.id)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
                mood.id === activeId
                  ? "bg-[#1a1814] text-white border-[#1a1814]"
                  : "bg-white text-[#1a1814] border-[#e9e6e1] hover:border-[#1a1814]/40",
              )}
            >
              {mood.id === primaryId && "★ "}
              {mood.name}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-[#e9e6e1] overflow-hidden bg-white">
        <div
          className="h-32 bg-muted"
          style={
            presentation.cover_image
              ? { backgroundImage: `url(${presentation.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="p-3 space-y-1.5" dir={rtl ? "rtl" : undefined}>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {badges.map((b) => (
                <span key={b} className="px-1.5 py-0.5 rounded-full bg-[#f5f3f0] text-[9px] text-[#1a1814]">
                  {b}
                </span>
              ))}
            </div>
          )}
          <p className="font-extrabold uppercase text-sm leading-tight">
            {presentation[presentationField("title", lang)] || "Titre de l'expérience"}
          </p>
          <p className="text-xs text-muted-foreground">
            {presentation[presentationField("subtitle", lang)] || "Accroche de l'expérience…"}
          </p>
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
            <span className="flex items-center gap-1 text-[#6f6a63] min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{city || "Ville"}</span>
            </span>
            {priceLabel && <span className="font-semibold shrink-0" dir="ltr">{priceLabel}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
