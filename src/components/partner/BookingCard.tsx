// Une réservation vue par le prestataire. Du client : prénom et initiale, langue, demandes
// particulières. Rien d'autre n'arrive jusqu'ici (la base ne l'envoie pas).

import { CalendarDays, Clock, Users } from "lucide-react";
import { Pill } from "@/components/partner/ui";
import { usePartner } from "@/lib/partner/context";
import { formatPartnerDate } from "@/lib/partner/i18n";
import { displayText } from "@/lib/partner/logic";
import type { PartnerBooking } from "@/lib/partner/types";
import { formatTimeSlot } from "@/lib/timeSlots";

export const customerLabel = (booking: PartnerBooking) =>
  `${booking.customer_first_name}${booking.customer_last_initial ? ` ${booking.customer_last_initial}.` : ""}`;

export function BookingCard({ booking, compact = false }: { booking: PartnerBooking; compact?: boolean }) {
  const { t, lang } = usePartner();
  const people = [t.bAdults(booking.adults), booking.children > 0 ? t.bChildren(booking.children) : null].filter(Boolean).join(", ");
  const title = displayText(booking as unknown as Record<string, unknown>, "experience_title", lang);

  // Version courte (accueil) : une ligne par réservation, à poser dans une liste.
  if (compact) {
    const weekday = t.weekdaysShort[new Date(`${booking.booking_date}T12:00:00`).getDay()];
    return (
      <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[9px] bg-neutral-100 leading-none">
          <span className="text-[9px] font-medium uppercase text-neutral-500">{weekday}</span>
          <span className="mt-0.5 text-[14px] font-semibold text-neutral-900">{Number(booking.booking_date.slice(8))}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-neutral-900">{title}</p>
          <p className="truncate text-[12px] text-neutral-500">
            {customerLabel(booking)} · {people}
          </p>
        </div>
        {booking.time_slot && (
          <span className="shrink-0 text-[12px] font-medium text-neutral-700" dir="ltr">
            {formatTimeSlot(booking.time_slot, lang)}
          </span>
        )}
      </div>
    );
  }

  return (
    <article className="rounded-[12px] border border-neutral-200/80 bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-neutral-900">{title}</h3>
          <p className="mt-0.5 text-[13px] text-neutral-600">{customerLabel(booking)}</p>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-neutral-400" dir="ltr">
          {booking.ref}
        </span>
      </div>

      <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-neutral-700">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          <dd>{formatPartnerDate(booking.booking_date, lang, true)}</dd>
        </div>
        {booking.time_slot && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
            <dd dir="ltr">{formatTimeSlot(booking.time_slot, lang)}</dd>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          <dd>{people}</dd>
        </div>
      </dl>

      {(booking.customer_language || booking.special_requests) && (
        <div className="mt-2.5 space-y-1.5 border-t border-neutral-100 pt-2.5 text-[12px]">
          {booking.customer_language && (
            <p className="flex items-center gap-2 text-neutral-600">
              {t.bCustomerLanguage}
              <Pill>{t.langNames[booking.customer_language as keyof typeof t.langNames] ?? booking.customer_language}</Pill>
            </p>
          )}
          {booking.special_requests && (
            <p className="text-neutral-800">
              <span className="font-semibold">{t.bRequests} : </span>
              {booking.special_requests}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
