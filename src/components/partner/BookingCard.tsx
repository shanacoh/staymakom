// Une réservation vue par le prestataire. Du client : prénom et initiale, langue, demandes
// particulières. Rien d'autre n'arrive jusqu'ici (la base ne l'envoie pas).

import { CalendarDays, Clock, Users } from "lucide-react";
import { Pill } from "@/components/partner/ui";
import { usePartner } from "@/lib/partner/context";
import { formatPartnerDate } from "@/lib/partner/i18n";
import { displayText } from "@/lib/partner/logic";
import type { PartnerBooking } from "@/lib/partner/types";

export const customerLabel = (booking: PartnerBooking) =>
  `${booking.customer_first_name}${booking.customer_last_initial ? ` ${booking.customer_last_initial}.` : ""}`;

export function BookingCard({ booking, compact = false }: { booking: PartnerBooking; compact?: boolean }) {
  const { t, lang } = usePartner();
  const people = [t.bAdults(booking.adults), booking.children > 0 ? t.bChildren(booking.children) : null].filter(Boolean).join(", ");

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-neutral-900">
            {displayText(booking as unknown as Record<string, unknown>, "experience_title", lang)}
          </h3>
          <p className="mt-0.5 text-[13px] text-neutral-600">{customerLabel(booking)}</p>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-neutral-400" dir="ltr">
          {booking.ref}
        </span>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-neutral-800">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          <dd>{formatPartnerDate(booking.booking_date, lang, true)}</dd>
        </div>
        {booking.time_slot && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
            <dd dir="ltr">{booking.time_slot}</dd>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          <dd>{people}</dd>
        </div>
      </dl>

      {!compact && (booking.customer_language || booking.special_requests) && (
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3 text-[13px]">
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
