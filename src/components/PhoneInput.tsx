import { useEffect, useState, type CSSProperties } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DIAL_CODES, composePhone, defaultDialCode, isPlausiblePhone, splitPhone } from "@/lib/phone";

const MESSAGES = {
  en: { country: "Country code", check: "This number looks incomplete. Please check it so we can reach you on WhatsApp." },
  fr: { country: "Indicatif pays", check: "Ce numéro semble incomplet. Vérifiez-le pour que l'on puisse vous joindre sur WhatsApp." },
  he: { country: "קידומת מדינה", check: "נראה שהמספר חסר. בדקו אותו כדי שנוכל ליצור קשר בוואטסאפ." },
};

interface PhoneInputProps {
  /** Numéro complet au format international (« +972541234567 »), ou vide. */
  value: string;
  onChange: (phone: string) => void;
  lang: string;
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
export function PhoneInput({ value, onChange, lang, disabled, id, className, style, onBlur }: PhoneInputProps) {
  const t = MESSAGES[lang as keyof typeof MESSAGES] ?? MESSAGES.en;
  const [dialCode, setDialCode] = useState(() => splitPhone(value, defaultDialCode(lang)).dialCode);
  const [local, setLocal] = useState(() => splitPhone(value, defaultDialCode(lang)).local);
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
          <SelectTrigger className={cn("w-[110px] shrink-0", className)} style={style} aria-label={t.country}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIAL_CODES.map((d) => (
              <SelectItem key={d.code} value={d.code}>{d.label}</SelectItem>
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
      {showWarning && <p className="text-xs text-amber-700">{t.check}</p>}
    </div>
  );
}
