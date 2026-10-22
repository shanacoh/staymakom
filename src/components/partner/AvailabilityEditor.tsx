// Éditeur de disponibilités, même modèle que le back-office : jours ouverts + dates fermées, ou
// dates ouvertes une à une, et créneaux horaires. Ne fait qu'afficher et proposer la nouvelle
// valeur : les règles sont dans lib/partner/logic.ts.

import { useState } from "react";
import { X } from "lucide-react";
import { AvailabilityCalendar } from "@/components/partner/AvailabilityCalendar";
import { Hint, QuietButton } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { usePartner } from "@/lib/partner/context";
import { addTimeSlot, removeTimeSlot, toggleWeekday } from "@/lib/partner/logic";
import type { PartnerAvailability } from "@/lib/partner/types";
import { formatTimeSlot } from "@/lib/timeSlots";

// Affichés dans l'ordre de la semaine israélienne : dimanche (7) d'abord.
const WEEKDAY_ORDER = [7, 1, 2, 3, 4, 5, 6];

interface Props {
  value: PartnerAvailability;
  onChange: (next: PartnerAvailability) => void;
  bookedDates?: Set<string>;
}

export function AvailabilityEditor({ value, onChange, bookedDates }: Props) {
  const { t, lang } = usePartner();
  const [slotInput, setSlotInput] = useState("");
  const [slotError, setSlotError] = useState(false);

  const byDates = value.availability_mode === "whitelist";

  const addSlot = () => {
    const next = addTimeSlot(value, slotInput);
    setSlotError(!next);
    if (!next) return;
    onChange(next);
    setSlotInput("");
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-[13px] font-semibold text-neutral-900">{t.avModeLabel}</legend>
        {(
          [
            { mode: "blacklist", label: t.avModeDays, hint: t.avModeDaysHint },
            { mode: "whitelist", label: t.avModeDates, hint: t.avModeDatesHint },
          ] as const
        ).map((option) => (
          <label
            key={option.mode}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-[10px] border p-3",
              value.availability_mode === option.mode ? "border-neutral-900 bg-white" : "border-neutral-200 bg-neutral-50",
            )}
          >
            <input
              type="radio"
              name="availability-mode"
              className="mt-0.5 h-4 w-4 accent-neutral-900"
              checked={value.availability_mode === option.mode}
              onChange={() => onChange({ ...value, availability_mode: option.mode })}
            />
            <span>
              <span className="block text-[13px] font-semibold text-neutral-900">{option.label}</span>
              <span className="block text-[12px] leading-relaxed text-neutral-500">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {!byDates && (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-neutral-900">{t.avOpenDays}</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_ORDER.map((day) => {
              const open = value.available_days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={open}
                  onClick={() => onChange(toggleWeekday(value, day))}
                  className={cn(
                    "min-h-[34px] rounded-full border px-3 text-[12px] font-medium",
                    open ? "border-transparent bg-neutral-100 font-semibold text-neutral-900" : "border-neutral-200 bg-white text-neutral-400",
                  )}
                >
                  {t.weekdaysLong[day - 1]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AvailabilityCalendar value={value} onChange={onChange} bookedDates={bookedDates} />

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-neutral-900">{t.avSlots}</p>
        <Hint>{t.avSlotsHint}</Hint>
        {value.time_slots.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.time_slots.map((slot) => (
              <li key={slot} className="flex items-center gap-1 rounded-full bg-neutral-100 py-1 pe-1.5 ps-3 text-[12px] font-semibold text-neutral-900">
                <span dir="ltr">{formatTimeSlot(slot, lang)}</span>
                <button
                  type="button"
                  onClick={() => onChange(removeTimeSlot(value, slot))}
                  aria-label={`${t.cancel} ${slot}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-neutral-200"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            dir="ltr"
            inputMode="numeric"
            value={slotInput}
            placeholder={t.avSlotPlaceholder}
            onChange={(e) => {
              setSlotInput(e.target.value);
              setSlotError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSlot();
              }
            }}
            className="h-[36px] w-28 rounded-[9px] border border-neutral-200 bg-white px-3 text-[14px] focus:border-neutral-900 focus:outline-none"
          />
          <QuietButton onClick={addSlot}>{t.avSlotAdd}</QuietButton>
        </div>
        {slotError && <p className="text-[12px] text-[#ad1414]">{t.avSlotInvalid}</p>}
      </div>
    </div>
  );
}
