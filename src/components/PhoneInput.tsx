import { useEffect, useState, type CSSProperties } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DIAL_CODES, composePhone, countryName, defaultDialCode, isPlausiblePhone, splitPhone } from "@/lib/phone";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";

interface PhoneInputProps {
  /** Numéro complet au format international (« +972541234567 »), ou vide. */
  value: string;
  onChange: (phone: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  onBlur?: () => void;
}

/**
 * Champ téléphone client : indicatif pays + numéro tapé comme d'habitude. Remonte toujours le
 * numéro complet (le 0 national retiré). Un numéro douteux affiche un message, sans rien bloquer.
 */
export function PhoneInput({ value, onChange, disabled, id, className, style, onBlur }: PhoneInputProps) {
  // Langue réelle de la page (en, fr, he, es, ru, de) : messages et noms de pays.
  const { locale } = useLanguage();
  const [dialCode, setDialCode] = useState(() => splitPhone(value, defaultDialCode(locale)).dialCode);
  const [local, setLocal] = useState(() => splitPhone(value, defaultDialCode(locale)).local);
  const [touched, setTouched] = useState(false);

  // Valeur changée de l'extérieur (ex. pré-remplissage depuis le profil) : on réaffiche le champ.
  useEffect(() => {
    if (value !== composePhone(dialCode, local)) {
      const split = splitPhone(value, dialCode);
      setDialCode(split.dialCode);
      setLocal(split.local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (nextDial: string, nextLocal: string) => {
    setDialCode(nextDial);
    setLocal(nextLocal);
    onChange(composePhone(nextDial, nextLocal));
  };

  const showWarning = touched && value !== "" && !isPlausiblePhone(value);

  return (
    <div className="space-y-1">
      {/* Un numéro se lit toujours de gauche à droite, même en hébreu. */}
      <div className="flex gap-2" dir="ltr">
        <Select value={dialCode} onValueChange={(d) => update(d, local)} disabled={disabled}>
          <SelectTrigger className={cn("w-[110px] shrink-0", className)} style={style} aria-label={t(locale, "phoneCountryAria")}>
            {/* Fermé : drapeau + indicatif seulement ; la liste ouverte montre aussi le nom du pays. */}
            <SelectValue>{DIAL_CODES.find((d) => d.code === dialCode)?.label ?? dialCode}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DIAL_CODES.map((d) => (
              <SelectItem key={d.code} value={d.code}>
                {d.label} <span className="text-muted-foreground">{countryName(d.region, locale)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={local}
          onChange={(e) => update(dialCode, e.target.value)}
          onBlur={() => { setTouched(true); onBlur?.(); }}
          disabled={disabled}
          className={className}
          style={style}
          maxLength={25}
        />
      </div>
      {showWarning && <p className="text-xs text-amber-700">{t(locale, "phoneCheck")}</p>}
    </div>
  );
}
