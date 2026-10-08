import { useState } from "react";
import { ChevronDown, LocateFixed } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { NEAR_ME_RADIUS_KM, type Lang } from "@/lib/regions";
import { regionChoice, zoneChoice, type RegionChoice, type RegionCounts } from "@/lib/regionList/filter";
import { groupByZone, localizedName } from "@/lib/regionList/labels";
import type { RegionList } from "@/lib/regionList/types";

const COPY: Record<Lang, { everywhere: string; nearMe: string; nearHint: string; locating: string }> = {
  fr: { everywhere: "Partout en Israël", nearMe: "Autour de moi", nearHint: `Utilise votre position, à moins de ${NEAR_ME_RADIUS_KM} km`, locating: "Localisation en cours..." },
  en: { everywhere: "Anywhere in Israel", nearMe: "Near me", nearHint: `Uses your location, within ${NEAR_ME_RADIUS_KM} km`, locating: "Locating..." },
  he: { everywhere: "בכל הארץ", nearMe: "קרוב אליי", nearHint: `לפי המיקום שלכם, עד ${NEAR_ME_RADIUS_KM} ק״מ`, locating: "מאתר מיקום..." },
};

export function regionChoiceLabel(choice: RegionChoice, lang: Lang, list: RegionList): string {
  if (choice === null) return COPY[lang].everywhere;
  if (choice === "near") return COPY[lang].nearMe;
  const [kind, slug] = choice.split(":");
  const entry = kind === "zone" ? list.zones.find((z) => z.slug === slug) : list.regions.find((r) => r.slug === slug);
  return entry ? localizedName(entry, lang) : COPY[lang].everywhere;
}

interface RegionFilterProps {
  value: RegionChoice;
  /** Nombre de résultats par zone et par région : celles qui n'ont rien ne sont pas proposées. */
  counts: RegionCounts;
  /** La liste de référence des zones et régions. */
  regionList: RegionList;
  lang: Lang;
  isLocating?: boolean;
  onChange: (choice: RegionChoice) => void;
  onOpen?: () => void;
}

/**
 * Lien discret « Partout en Israël » qui ouvre « Autour de moi » et les 4 zones avec leurs régions : une petite
 * fenêtre sur ordinateur, un panneau qui monte du bas sur téléphone. Ne fait qu'afficher et remonter le
 * choix ; le filtrage lui-même est fait par la page.
 */
export default function RegionFilter({ value, counts, regionList, lang, isLocating = false, onChange, onOpen }: RegionFilterProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const copy = COPY[lang];
  const isRTL = lang === "he";

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) onOpen?.();
  };
  const choose = (choice: RegionChoice) => {
    setOpen(false);
    onChange(choice);
  };

  const trigger = (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 border-b py-1 text-[12.5px] transition-colors",
        value ? "border-[#ad1414] font-semibold text-[#ad1414]" : "border-border text-foreground hover:border-foreground/40"
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#ad1414]" />
      {isLocating ? copy.locating : regionChoiceLabel(value, lang, regionList)}
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );

  // Seules les zones et régions qui ont au moins une expérience sont proposées.
  const zoneGroups = groupByZone(regionList)
    .map(({ zone, regions }) => ({ zone, regions: regions.filter((r) => (counts.regions[r.slug] ?? 0) > 0) }))
    .filter(({ zone }) => (counts.zones[zone.slug] ?? 0) > 0);

  const optionClass = (selected: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-[13px] transition-colors md:py-2",
      isMobile && "py-3 text-sm",
      isRTL ? "text-right" : "text-left",
      selected ? "bg-[#ad1414]/10 font-semibold text-[#ad1414]" : "hover:bg-muted"
    );

  const list = (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <button type="button" className={optionClass(value === null)} onClick={() => choose(null)}>
        {copy.everywhere}
      </button>
      <button type="button" className={optionClass(value === "near")} onClick={() => choose("near")}>
        <span className="flex items-start gap-2">
          <LocateFixed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {copy.nearMe}
            <span className="block text-[11px] font-normal text-muted-foreground">{copy.nearHint}</span>
          </span>
        </span>
      </button>
      <div className="mx-1 my-1.5 border-t border-border" />
      {zoneGroups.map(({ zone, regions }) => (
        <div key={zone.slug}>
          <button
            type="button"
            className={cn(optionClass(value === zoneChoice(zone.slug)), "font-semibold")}
            onClick={() => choose(zoneChoice(zone.slug))}
          >
            {localizedName(zone, lang)}
            <span className="text-[11.5px] font-normal text-muted-foreground">{counts.zones[zone.slug]}</span>
          </button>
          {regions.map((r) => (
            <button
              key={r.slug}
              type="button"
              className={cn(optionClass(value === regionChoice(r.slug)), "ps-6")}
              onClick={() => choose(regionChoice(r.slug))}
            >
              {localizedName(r, lang)}
              <span className="text-[11.5px] font-normal text-muted-foreground">{counts.regions[r.slug]}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh] px-2.5 pb-6">
          <DrawerTitle className="sr-only">{copy.everywhere}</DrawerTitle>
          <div className="overflow-y-auto pt-3">{list}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="max-h-[70vh] w-72 overflow-y-auto rounded-lg p-1.5">
        {list}
      </PopoverContent>
    </Popover>
  );
}
