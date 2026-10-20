// Calendrier des disponibilités : un mois, un appui sur une date l'ouvre ou la ferme. Partagé entre
// l'accueil (réglage rapide) et la section Disponibilités d'une expérience. Les dates réservées
// portent un point rouge, pour ne pas fermer par mégarde un jour où un client est attendu.

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePartner } from "@/lib/partner/context";
import { formatPartnerMonth } from "@/lib/partner/i18n";
import { isDateOpen, monthCells, toIsoDate, toggleDate } from "@/lib/partner/logic";
import type { PartnerAvailability } from "@/lib/partner/types";

interface Props {
  value: PartnerAvailability;
  onChange: (next: PartnerAvailability) => void;
  bookedDates?: Set<string>;
}

export function AvailabilityCalendar({ value, onChange, bookedDates }: Props) {
  const { t, lang } = usePartner();
  const today = toIsoDate(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const byDates = value.availability_mode === "whitelist";
  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const atCurrentMonth = monthKey <= today.slice(0, 7);
  const moveMonth = (delta: number) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  const hasBookings = !!bookedDates && bookedDates.size > 0;

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={atCurrentMonth}
          onClick={() => moveMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 disabled:opacity-30"
          aria-label="←"
        >
          <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
        <p className="text-[13px] font-semibold capitalize text-neutral-900">{formatPartnerMonth(monthKey, lang)}</p>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300"
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
          const booked = !past && !!bookedDates?.has(date);
          return (
            <button
              key={date}
              type="button"
              disabled={past}
              aria-pressed={open}
              onClick={() => onChange(toggleDate(value, date))}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-[8px] text-[12px] font-medium",
                past && "text-neutral-300",
                !past && open && "bg-neutral-100 font-semibold text-neutral-900 hover:bg-neutral-200",
                !past && !open && "text-neutral-300 line-through hover:bg-neutral-50",
              )}
            >
              {Number(date.slice(8))}
              {booked && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#ad1414]" aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[4px] bg-neutral-200" /> {t.avLegendOpen}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-neutral-300 line-through">12</span> {t.avLegendClosed}
        </span>
        {hasBookings && (
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ad1414]" /> {t.avLegendBooked}
          </span>
        )}
        <span>{byDates ? t.avCalendarDates : t.avCalendarDays}</span>
      </div>
    </div>
  );
}
