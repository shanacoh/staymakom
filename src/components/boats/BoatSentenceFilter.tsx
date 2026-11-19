/**
 * Colonne de filtre "façon phrase" pour /boat : personnes, port, durée, date
 * et moment de la journée choisis en une seule fois, la grille de résultats
 * (dans Boats.tsx) se met à jour en direct. Remplace l'ancien pop-up de
 * recherche : ici un seul geste, pas de formulaire à valider.
 */
import { cn } from "@/lib/utils";
import { Minus, Plus, ShieldCheck, CalendarIcon } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { toLocalDateStr } from "@/lib/boatAvailability";
import { format } from "date-fns";
import { dateFnsLocale } from "@/lib/dateFnsLocale";
import { tPage, uiGroup } from "@/lib/translations";

export type CityFilter = "any" | "Tel Aviv" | "Herzliya";
export type DurationBucket = "2h" | "3h" | "4h" | "other";
export type DateBucket = "today_tomorrow" | "this_week" | "later" | null;
export type TimeOfDay = "daytime" | "sunset" | null;

export interface BoatFilterState {
  persons: number;
  city: CityFilter;
  duration: DurationBucket;
  dateBucket: DateBucket;
  // Uniquement quand dateBucket === "later" : date précise optionnelle, choisie
  // via un petit calendrier qui n'apparaît que pour ce cas-là — garde les deux
  // autres boutons (aujourd'hui/demain, dans la semaine) aussi légers qu'avant.
  specificDate: string | null;
  timeOfDay: TimeOfDay;
}

interface Props {
  value: BoatFilterState;
  onChange: (next: BoatFilterState) => void;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm border whitespace-nowrap transition-colors",
        active
          ? "bg-[#ad1414] text-white border-[#ad1414]"
          : "bg-white text-foreground border-border hover:border-[#ad1414]/40"
      )}
    >
      {children}
    </button>
  );
}

// Questions fréquentes : textes dans translations.ts (boatFaq…), traduits dans chaque langue.
const FAQ_ITEMS = [
  { q: "boatFaqSkipperQ", a: "boatFaqSkipperA" },
  { q: "boatFaqIncludedQ", a: "boatFaqIncludedA" },
  { q: "boatFaqFoodQ", a: "boatFaqFoodA" },
  { q: "boatFaqExtraPersonQ", a: "boatFaqExtraPersonA" },
] as const;

export default function BoatSentenceFilter({ value, onChange }: Props) {
  const { locale } = useLanguage();
  const set = <K extends keyof BoatFilterState>(key: K, val: BoatFilterState[K]) => onChange({ ...value, [key]: val });

  const t = uiGroup("boatSentenceFilter");

  const dateLocale = dateFnsLocale(locale);

  return (
    <div className="h-full overflow-y-auto px-5 py-6 space-y-6 bg-[#FAF6EF]">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">{t.eyebrow}</p>
        <h1 className="font-sans text-base sm:text-lg font-bold leading-tight text-foreground">{t.title}</h1>
        <p className="text-xs text-muted-foreground leading-snug">{t.subtitle}</p>
      </div>

      <div className="space-y-2.5 text-sm leading-loose">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-foreground">{t.weAre}</span>
          <span className="flex items-center gap-1 border rounded-full px-1.5 py-0.5 bg-white">
            <button type="button" onClick={() => set("persons", Math.max(1, value.persons - 1))} className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted">
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[1.5ch] text-center text-sm font-semibold">{value.persons}</span>
            <button type="button" onClick={() => set("persons", value.persons + 1)} className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted">
              <Plus className="h-3 w-3" />
            </button>
          </span>
          <span className="text-foreground">, {t.departFrom}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Pill active={value.city === "Tel Aviv"} onClick={() => set("city", "Tel Aviv")}>Tel Aviv</Pill>
          <Pill active={value.city === "Herzliya"} onClick={() => set("city", "Herzliya")}>Herzliya</Pill>
          <Pill active={value.city === "any"} onClick={() => set("city", "any")}>{t.any}</Pill>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-foreground">{t.forDuration}</span>
          <Pill active={value.duration === "2h"} onClick={() => set("duration", "2h")}>2h</Pill>
          <Pill active={value.duration === "3h"} onClick={() => set("duration", "3h")}>3h</Pill>
          <Pill active={value.duration === "4h"} onClick={() => set("duration", "4h")}>4h</Pill>
          <Pill active={value.duration === "other"} onClick={() => set("duration", "other")}>{t.other}</Pill>
          <span className="text-foreground">,</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Pill active={value.dateBucket === "today_tomorrow"} onClick={() => onChange({ ...value, dateBucket: value.dateBucket === "today_tomorrow" ? null : "today_tomorrow", specificDate: null })}>{t.todayTomorrow}</Pill>
          <Pill active={value.dateBucket === "this_week"} onClick={() => onChange({ ...value, dateBucket: value.dateBucket === "this_week" ? null : "this_week", specificDate: null })}>{t.thisWeek}</Pill>
          <Pill active={value.dateBucket === "later"} onClick={() => onChange({ ...value, dateBucket: value.dateBucket === "later" ? null : "later", specificDate: null })}>{t.later}</Pill>
          {value.dateBucket === "later" && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="flex items-center gap-1 text-xs text-[#ad1414] underline underline-offset-2">
                  <CalendarIcon className="h-3 w-3" />
                  {value.specificDate ? format(new Date(value.specificDate + "T12:00:00"), "d MMM", { locale: dateLocale }) : t.pickDate}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarPicker
                  mode="single"
                  selected={value.specificDate ? new Date(value.specificDate + "T12:00:00") : undefined}
                  onSelect={(d) => set("specificDate", d ? toLocalDateStr(d) : null)}
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          )}
          <span className="text-foreground">,</span>
          <Pill active={value.timeOfDay === "daytime"} onClick={() => set("timeOfDay", value.timeOfDay === "daytime" ? null : "daytime")}>{t.daytime}</Pill>
          <Pill active={value.timeOfDay === "sunset"} onClick={() => set("timeOfDay", value.timeOfDay === "sunset" ? null : "sunset")}>{t.sunset}</Pill>
          <span className="text-foreground">.</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">{t.faqTitle}</p>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="rounded-xl border bg-white p-3">
              <p className="text-sm font-semibold text-foreground">{tPage(item.q)}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tPage(item.a)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border bg-white p-3">
        <ShieldCheck className="h-4 w-4 text-[#ad1414] shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{t.policy}</p>
      </div>
    </div>
  );
}
