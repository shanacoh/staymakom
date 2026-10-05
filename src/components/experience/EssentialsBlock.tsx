import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr, he } from "date-fns/locale";
import { Clock, CalendarClock, MapPin, Sparkles, Users, Utensils, Globe, Accessibility, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedField, type Language } from "@/hooks/useLanguage";
import { normalizeLegacyPracticalInfo, kidsLabel, getParkingLabel } from "@/lib/standaloneBadges";
import { buildWhatsappMessageForExperience } from "@/constants/whatsapp";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { trackEssentialsExpanded } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// Sous-ensemble des champs de l'expérience nécessaires au bloc "L'essentiel".
// Tous optionnels : une fiche déjà publiée doit s'afficher sans erreur même
// si rien n'est rempli (une ligne vide n'est simplement jamais affichée).
interface EssentialsExperience {
  id: string;
  slug: string;
  duration?: string | null;
  duration_fr?: string | null;
  duration_he?: string | null;
  min_party: number;
  max_party: number;
  lead_time_days?: number | null;
  has_time_slots?: boolean | null;
  time_slots?: string[] | null;
  available_days?: number[] | null;
  blocked_dates?: string[] | null;
  availability_end_date?: string | null;
  availability_mode?: string | null;
  whitelisted_dates?: string[] | null;
  schedule_note?: string | null;
  schedule_note_fr?: string | null;
  schedule_note_he?: string | null;
  essentials_private_on_request?: boolean | null;
  session_labels?: Record<string, { en?: string; fr?: string; he?: string }> | null;
  city?: string | null;
  city_fr?: string | null;
  city_he?: string | null;
  address?: string | null;
  address_fr?: string | null;
  address_he?: string | null;
  hide_exact_address?: boolean | null;
  access_note?: string | null;
  access_note_fr?: string | null;
  access_note_he?: string | null;
  languages?: string[] | null;
  practical_info?: unknown;
  accessibility_info?: string | null;
  accessibility_info_fr?: string | null;
  accessibility_info_he?: string | null;
  cancellation_policy?: string | null;
  cancellation_policy_fr?: string | null;
  cancellation_policy_he?: string | null;
}

interface EssentialsBlockProps {
  experience: EssentialsExperience;
  experienceTitle: string;
  lang: Language;
  /**
   * Rendu compact (2 colonnes, textes courts, quel que soit la largeur de la
   * fenêtre) — utilisé par l'aperçu du back-office (sprint 5B), jamais par la
   * fiche publique : par défaut (undefined/false), le rendu est strictement
   * identique à avant.
   */
  compact?: boolean;
}

const LANGUAGE_NAMES: Record<string, Record<Language, string>> = {
  fr: { en: "French", fr: "Français", he: "צרפתית" },
  en: { en: "English", fr: "Anglais", he: "אנגלית" },
  he: { en: "Hebrew", fr: "Hébreu", he: "עברית" },
  ru: { en: "Russian", fr: "Russe", he: "רוסית" },
  es: { en: "Spanish", fr: "Espagnol", he: "ספרדית" },
  ar: { en: "Arabic", fr: "Arabe", he: "ערבית" },
};

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Les 3 prochaines dates disponibles à partir d'aujourd'hui (+ délai de réservation),
// selon le mode d'ouverture des dates (liste blanche ou jours de semaine récurrents).
function getUpcomingSessionDates(experience: EssentialsExperience, minDate: Date, maxResults = 3): string[] {
  if (experience.availability_mode === "whitelist") {
    return (experience.whitelisted_dates ?? [])
      .filter((d) => new Date(d + "T00:00:00") >= minDate)
      .sort()
      .slice(0, maxResults);
  }
  const availableJsDays = (experience.available_days ?? [1, 2, 3, 4, 5, 6, 7]).map((n) => (n === 7 ? 0 : n));
  const blockedSet = new Set(experience.blocked_dates ?? []);
  const endDate = experience.availability_end_date ? new Date(experience.availability_end_date + "T23:59:59") : null;
  const results: string[] = [];
  const cursor = new Date(minDate);
  for (let i = 0; i < 180 && results.length < maxResults; i++) {
    if (endDate && cursor > endDate) break;
    const dateStr = toLocalDateStr(cursor);
    if (availableJsDays.includes(cursor.getDay()) && !blockedSet.has(dateStr)) {
      results.push(dateStr);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}

export default function EssentialsBlock({ experience, experienceTitle, lang, compact = false }: EssentialsBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: includes } = useQuery({
    queryKey: ["experience-includes", experience.id, "standalone"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experience_includes")
        .select("*")
        .eq("experience_id", experience.id)
        .eq("published", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const practicalInfo = normalizeLegacyPracticalInfo(experience.practical_info);
  const dateLocale = lang === "fr" ? fr : lang === "he" ? he : undefined;

  const leadTimeDays = experience.lead_time_days ?? 0;
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  minDate.setDate(minDate.getDate() + leadTimeDays);

  const upcomingDates = getUpcomingSessionDates(experience, minDate);

  // ── Ligne "Prochaines séances" ──────────────────────────────────────────
  const nextSessionsContent = (() => {
    if (upcomingDates.length === 0) {
      let entrySource: string | undefined;
      try {
        entrySource = sessionStorage.getItem("staymakom_entry_source") || undefined;
      } catch {
        entrySource = undefined;
      }
      const message = encodeURIComponent(
        buildWhatsappMessageForExperience(lang, entrySource, experienceTitle)
      );
      return (
        <div className="space-y-1">
          <span>
            {lang === "he" ? "תאריכים לפי בקשה" : lang === "fr" ? "Prochaines dates sur demande" : "Next dates on request"}
          </span>
          {" "}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#ad1414] underline"
          >
            WhatsApp
          </a>
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {upcomingDates.map((dateStr) => {
            const date = new Date(dateStr + "T12:00:00");
            const formatted = format(date, "EEE d MMM", { locale: dateLocale });
            const customLabel = experience.session_labels?.[dateStr]?.[lang];
            const timePart =
              experience.has_time_slots && (experience.time_slots?.length ?? 0) > 0
                ? ` · ${experience.time_slots![0]}`
                : "";
            const pillText = customLabel ? `${customLabel} · ${formatted}${timePart}` : `${formatted}${timePart}`;
            return (
              <span
                key={dateStr}
                className="rounded-full bg-[#efece8] px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {pillText}
              </span>
            );
          })}
        </div>
        {experience.schedule_note && (
          <p className="text-xs text-muted-foreground">
            {getLocalizedField(experience, "schedule_note", lang) as string || experience.schedule_note}
          </p>
        )}
        {experience.essentials_private_on_request && (
          <p className="text-xs text-muted-foreground">
            {lang === "he" ? "ניתן לבקש מושב פרטי" : lang === "fr" ? "Séance privée possible sur demande" : "Private session possible on request"}
          </p>
        )}
      </div>
    );
  })();

  // ── Ligne "Lieu" ─────────────────────────────────────────────────────────
  const locationContent = (() => {
    const city = (getLocalizedField(experience, "city", lang) as string) || experience.city;
    const addressDisplay = experience.hide_exact_address
      ? (lang === "he" ? "הכתובת המדויקת תישלח בעת ההזמנה" : lang === "fr" ? "Adresse exacte envoyée à la réservation" : "Exact address sent upon booking")
      : (getLocalizedField(experience, "address", lang) as string) || experience.address;
    const mainLine = [city, addressDisplay].filter(Boolean).join(", ");
    const accessNote = (getLocalizedField(experience, "access_note", lang) as string) || experience.access_note;
    const parkingLabel = getParkingLabel(practicalInfo.parking, lang);
    if (!mainLine && !accessNote && !parkingLabel) return null;
    return (
      <div className="space-y-0.5">
        {mainLine && <p>{mainLine}</p>}
        {accessNote && <p className="text-xs text-muted-foreground">{accessNote}</p>}
        {parkingLabel && <p className="text-xs text-muted-foreground">{parkingLabel}</p>}
      </div>
    );
  })();

  // ── Ligne "Inclus" ───────────────────────────────────────────────────────
  const includesContent = (() => {
    if (!includes || includes.length === 0) return null;
    const titles = includes.map(
      (item: any) => (lang === "he" ? item.title_he || item.title : lang === "fr" ? item.title_fr || item.title : item.title)
    );
    return titles.join(", ");
  })();

  // ── Ligne "Pour qui" ─────────────────────────────────────────────────────
  const forWhomContent = (() => {
    const partySize =
      lang === "he" ? `${experience.min_party}-${experience.max_party} אנשים` : lang === "fr" ? `${experience.min_party}-${experience.max_party} personnes` : `${experience.min_party}-${experience.max_party} guests`;
    const kidsPart =
      practicalInfo.kids.status === "yes" && practicalInfo.kids.from_age != null
        ? kidsLabel(practicalInfo.kids.from_age, lang)
        : null;
    return kidsPart ? `${partySize}, ${kidsPart.toLowerCase()}` : partySize;
  })();

  // ── Ligne "Casher" ───────────────────────────────────────────────────────
  const kosherContent =
    practicalInfo.kosher === "yes"
      ? (lang === "he" ? "כן" : lang === "fr" ? "Oui" : "Yes")
      : practicalInfo.kosher === "no"
      ? (lang === "he" ? "לא" : lang === "fr" ? "Non" : "No")
      : null;

  // ── Ligne "Langue" ───────────────────────────────────────────────────────
  const languagesContent = (() => {
    const codes = experience.languages ?? [];
    if (codes.length === 0) return null;
    return codes.map((code) => LANGUAGE_NAMES[code]?.[lang] ?? code).join(", ");
  })();

  // ── Lignes restantes ─────────────────────────────────────────────────────
  const accessibilityContent = (getLocalizedField(experience, "accessibility_info", lang) as string) || experience.accessibility_info || null;
  const cancellationContent = (getLocalizedField(experience, "cancellation_policy", lang) as string) || experience.cancellation_policy || null;
  const durationContent = (getLocalizedField(experience, "duration", lang) as string) || experience.duration || null;

  const rows = [
    {
      key: "duration",
      icon: Clock,
      label: lang === "he" ? "משך" : lang === "fr" ? "Durée" : "Duration",
      content: durationContent,
    },
    {
      key: "next_sessions",
      icon: CalendarClock,
      label: lang === "he" ? "מועדים קרובים" : lang === "fr" ? "Prochaines séances" : "Next sessions",
      content: nextSessionsContent,
    },
    {
      key: "location",
      icon: MapPin,
      label: lang === "he" ? "מיקום" : lang === "fr" ? "Lieu" : "Location",
      content: locationContent,
    },
    {
      key: "includes",
      icon: Sparkles,
      label: lang === "he" ? "כלול" : lang === "fr" ? "Inclus" : "Included",
      content: includesContent,
    },
    {
      key: "for_whom",
      icon: Users,
      label: lang === "he" ? "למי מתאים" : lang === "fr" ? "Pour qui" : "For who",
      content: forWhomContent,
    },
    {
      key: "kosher",
      icon: Utensils,
      label: lang === "he" ? "כשר" : lang === "fr" ? "Casher" : "Kosher",
      content: kosherContent,
    },
    {
      key: "languages",
      icon: Globe,
      label: lang === "he" ? "שפה" : lang === "fr" ? "Langue" : "Language",
      content: languagesContent,
    },
    {
      key: "accessibility",
      icon: Accessibility,
      label: lang === "he" ? "נגישות" : lang === "fr" ? "Accessibilité" : "Accessibility",
      content: accessibilityContent,
    },
    {
      key: "cancellation",
      icon: AlertCircle,
      label: lang === "he" ? "מדיניות ביטול" : lang === "fr" ? "Annulation" : "Cancellation",
      content: cancellationContent,
    },
  ].filter((row) => row.content);

  if (rows.length === 0) return null;

  return (
    <section
      className={cn("rounded-2xl border border-[#e9e6e1] bg-[#faf8f6]", compact ? "p-3" : "p-4 md:p-5")}
      dir={lang === "he" ? "rtl" : "ltr"}
    >
      <h2 className={cn("font-serif font-medium text-foreground", compact ? "text-sm mb-2" : "text-lg md:text-xl mb-4")}>
        {lang === "he" ? "בקצרה" : lang === "fr" ? "L'essentiel" : "The essentials"}
      </h2>
      <div className={cn("grid", compact ? "grid-cols-2 gap-x-3 gap-y-2" : "grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4")}>
        {rows.map((row, index) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className={cn("flex items-start gap-2", index >= 6 && !expanded && (compact ? "hidden" : "hidden md:flex"))}
            >
              <Icon className={cn("text-[#ad1414] mt-0.5 shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <div className={cn("min-w-0", compact ? "text-xs" : "text-sm")}>
                <div className={cn("uppercase tracking-wide text-muted-foreground", compact ? "text-[9px]" : "text-[10px]")}>{row.label}</div>
                <div className={cn("text-foreground", compact && "truncate")}>{row.content}</div>
              </div>
            </div>
          );
        })}
      </div>
      {rows.length > 6 && !expanded && (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            trackEssentialsExpanded(experience.slug);
          }}
          className="md:hidden mt-3 text-sm font-semibold text-[#ad1414] underline"
        >
          {lang === "he" ? "הצג הכול" : lang === "fr" ? "Voir tout" : "See all"}
        </button>
      )}
    </section>
  );
}
