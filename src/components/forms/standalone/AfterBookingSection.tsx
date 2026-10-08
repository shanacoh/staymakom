import type { UseFormRegisterReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input, Label, Textarea } from "@/components/forms/styled";
import { cn } from "@/lib/utils";
import { AiMark } from "@/components/forms/ai/AiMark";
import type { FormLanguage } from "@/components/forms/shared/FormHeaderBar";

type Suffix = "" | "_fr" | "_he";
export type AfterBookingFieldName =
  | `meeting_point${Suffix}`
  | `know_before_you_go${Suffix}`
  | `contingency_note${Suffix}`
  | "arrive_minutes_before"
  | "day_contact_name"
  | "day_contact_phone";

const NO_LANGUAGE = "none";

const CONTACT_LANGUAGES = [
  { code: "he", label: "Hébreu" },
  { code: "en", label: "Anglais" },
  { code: "fr", label: "Français" },
  { code: "ru", label: "Russe" },
  { code: "es", label: "Espagnol" },
  { code: "ar", label: "Arabe" },
];

const LANGS: { lang: FormLanguage; suffix: Suffix; label: string }[] = [
  { lang: "en", suffix: "", label: "EN" },
  { lang: "fr", suffix: "_fr", label: "FR" },
  { lang: "he", suffix: "_he", label: "HE" },
];

interface Props {
  registerField: (name: AfterBookingFieldName, options?: { valueAsNumber?: boolean }) => UseFormRegisterReturn;
  langHidden: (lang: FormLanguage) => boolean;
  /** Adresse et accès saisis dans « Ce qui est commun », dans la langue affichée : rappelés ici sans ressaisie. */
  recap: { address: string; accessNote: string; hideExactAddress: boolean };
  contactLanguage: string | null;
  onContactLanguageChange: (code: string | null) => void;
  /** Vrai si l'IA vient de remplir ce champ et que Shana ne l'a pas encore modifié ni validé. */
  aiMarked?: (name: AfterBookingFieldName) => boolean;
  disabled?: boolean;
}

// Section « Après la réservation » : les infos pratiques envoyées au client une fois qu'il a réservé.
export function AfterBookingSection({ registerField, langHidden, recap, contactLanguage, onContactLanguageChange, aiMarked, disabled }: Props) {
  // Un champ multilingue : un seul des trois est visible, celui de la langue sélectionnée.
  const multilingual = (
    base: "meeting_point" | "know_before_you_go" | "contingency_note",
    label: string,
    placeholder: string,
    multiline: boolean,
  ) =>
    LANGS.map(({ lang, suffix, label: langLabel }) => {
      const name = `${base}${suffix}` as AfterBookingFieldName;
      const rtl = lang === "he";
      const shared = {
        id: name,
        placeholder: rtl ? undefined : placeholder,
        dir: rtl ? ("rtl" as const) : undefined,
        className: cn(rtl && "bg-hebrew-input"),
        disabled,
      };
      return (
        <div key={name} className={cn("space-y-1.5", langHidden(lang) && "hidden")}>
          <Label htmlFor={name}>
            {label} ({langLabel})
            <AiMark show={!!aiMarked?.(name)} />
          </Label>
          {multiline ? <Textarea rows={3} {...shared} {...registerField(name)} /> : <Input {...shared} {...registerField(name)} />}
        </div>
      );
    });

  return (
    <div className="space-y-3">
      {/* Repris de L'essentiel : lecture seule */}
      <div className="rounded-lg border border-[#e9e6e1] bg-[#f5f3f0] p-3 space-y-1 text-[11px] text-[#8a857d]">
        <p className="text-[9px] uppercase tracking-[0.04em]">Repris de L'essentiel</p>
        <p>
          <span className="font-medium">Adresse :</span> {recap.address || "non renseignée"}
          {recap.hideExactAddress && " (masquée sur la fiche, envoyée seulement après réservation)"}
        </p>
        <p>
          <span className="font-medium">Accès sans voiture :</span> {recap.accessNote || "non renseigné"}
        </p>
      </div>

      {multilingual("meeting_point", "Point de rendez-vous", "Ex : devant l'entrée principale, côté parking", false)}

      <div className="space-y-1.5">
        <Label htmlFor="arrive_minutes_before">
          Arriver combien de minutes avant
          <AiMark show={!!aiMarked?.("arrive_minutes_before")} />
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="arrive_minutes_before"
            type="number"
            min={0}
            max={600}
            className="w-24"
            placeholder="15"
            disabled={disabled}
            {...registerField("arrive_minutes_before", { valueAsNumber: true })}
          />
          <span className="text-[11px] text-[#6f6a63]">minutes</span>
        </div>
      </div>

      {multilingual("know_before_you_go", "À savoir", "Ex : chaussures fermées, eau, tenue respectueuse", true)}

      <div className="space-y-1.5">
        <Label>Contact le jour J</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input placeholder="Nom" disabled={disabled} {...registerField("day_contact_name")} />
          <Input placeholder="Téléphone" type="tel" disabled={disabled} {...registerField("day_contact_phone")} />
          <Select
            value={contactLanguage ?? NO_LANGUAGE}
            onValueChange={(next) => onContactLanguageChange(next === NO_LANGUAGE ? null : next)}
            disabled={disabled}
          >
            <SelectTrigger className="h-[29px] rounded-[7px] border-[#e9e6e1] text-[11px]">
              <SelectValue placeholder="Langue parlée" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_LANGUAGE}>Langue non précisée</SelectItem>
              {CONTACT_LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {multilingual("contingency_note", "Météo ou imprévu", "Ex : en cas de pluie, la visite est reportée ou remboursée", true)}
    </div>
  );
}
