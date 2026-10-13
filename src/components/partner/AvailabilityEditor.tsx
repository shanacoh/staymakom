// Éditeur de disponibilités, même modèle que le back-office : jours ouverts + dates fermées, ou
// dates ouvertes une à une, et créneaux horaires. Ne fait qu'afficher et proposer la nouvelle
// valeur : les règles sont dans lib/partner/logic.ts.

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Hint, QuietButton } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { usePartner } from "@/lib/partner/context";
import { formatPartnerMonth } from "@/lib/partner/i18n";
import { addTimeSlot, isDateOpen, monthCells, removeTimeSlot, toIsoDate, toggleDate, toggleWeekday } from "@/lib/partner/logic";
import type { PartnerAvailability } from "@/lib/partner/types";

// Affichés dans l'ordre de la semaine israélienne : dimanche (7) d'abord.
const WEEKDAY_ORDER = [7, 1, 2, 3, 4, 5, 6];

interface Props {
  value: PartnerAvailability;
  onChange: (next: PartnerAvailability) => void;
}

export function AvailabilityEditor({ value, onChange }: Props) {
  const { t, lang } = usePartner();
  const today = toIsoDate(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [slotInput, setSlotInput] = useState("");
  const [slotError, setSlotError] = useState(false);

  const byDates = value.availability_mode === "whitelist";
  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const atCurrentMonth = monthKey <= today.slice(0, 7);
  const moveMonth = (delta: number) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const addSlot = () => {
    const next = addTimeSlot(value, slotInput);
    setSlotError(!next);
    if (!next) return;
    onChange(next);
    setSlotInput("");
  };

  return (
    <div className="space-y-6">
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
              <span className="block text-[14px] font-semibold text-neutral-900">{option.label}</span>
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
                    "min-h-[40px] rounded-full border px-3.5 text-[13px] font-medium",
                    open ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-500",
                  )}
                >
                  {t.weekdaysLong[day - 1]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            disabled={atCurrentMonth}
            onClick={() => moveMonth(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 disabled:opacity-30"
            aria-label="←"
          >
            <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </button>
          <p className="text-[14px] font-semibold capitalize text-neutral-900">{formatPartnerMonth(monthKey, lang)}</p>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300"
            aria-label="→"
          >
            <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {t.weekdaysShort.map((name) => (
            <span key={name} className="py-1 text-[11px] font-medium text-neutral-400">
              {name}
            </span>
          ))}
          {monthCells(cursor.year, cursor.month).map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />;
            const past = date < today;
            const open = isDateOpen(value, date);
            return (
              <button
                key={date}
                type="button"
                disabled={past}
                aria-pressed={open}
                onClick={() => onChange(toggleDate(value, date))}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-[10px] text-[14px] font-medium",
                  past && "text-neutral-300",
                  !past && open && "bg-neutral-900 text-white",
                  !past && !open && "border border-neutral-200 bg-white text-neutral-400 line-through",
                )}
              >
                {Number(date.slice(8))}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-neutral-900" /> {t.avLegendOpen}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] border border-neutral-300 bg-white" /> {t.avLegendClosed}
          </span>
          <span>{byDates ? t.avCalendarDates : t.avCalendarDays}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-neutral-900">{t.avSlots}</p>
        <Hint>{t.avSlotsHint}</Hint>
        {value.time_slots.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.time_slots.map((slot) => (
              <li key={slot} className="flex items-center gap-1 rounded-full bg-neutral-900 py-1 pe-1.5 ps-3 text-[13px] font-medium text-white">
                <span dir="ltr">{slot}</span>
                <button
                  type="button"
                  onClick={() => onChange(removeTimeSlot(value, slot))}
                  aria-label={`${t.cancel} ${slot}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20"
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
            className="h-[42px] w-28 rounded-[10px] border border-neutral-300 bg-white px-3 text-[15px] focus:border-neutral-900 focus:outline-none"
          />
          <QuietButton onClick={addSlot}>{t.avSlotAdd}</QuietButton>
        </div>
        {slotError && <p className="text-[12px] text-[#ad1414]">{t.avSlotInvalid}</p>}
      </div>
    </div>
  );
}
