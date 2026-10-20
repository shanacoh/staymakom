// Revenus : pour chaque réservation payée, le montant qui revient au prestataire et son état
// « à régler / réglé », avec les totaux par mois. Jamais le prix client ni la marge : la base ne
// les envoie pas.

import { useQuery } from "@tanstack/react-query";
import { customerLabel } from "@/components/partner/BookingCard";
import { Card, Empty, Hint, PageLoader, Pill } from "@/components/partner/ui";
import { fetchPartnerBookings, partnerKeys } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { formatPartnerDate, formatPartnerMonth } from "@/lib/partner/i18n";
import { displayText, formatMoney, monthlyRevenue } from "@/lib/partner/logic";

export default function PartnerRevenue() {
  const { t, lang } = usePartner();
  const { data, isLoading } = useQuery({ queryKey: partnerKeys.bookings, queryFn: fetchPartnerBookings });

  if (isLoading) return <PageLoader label={t.loading} />;
  const bookings = data ?? [];
  const months = monthlyRevenue(bookings);

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-[17px] font-semibold tracking-tight">{t.tabRevenue}</h1>
        <Hint>{t.rIntro}</Hint>
      </div>

      {months.length === 0 ? (
        <Empty>{t.rEmpty}</Empty>
      ) : (
        months.map((month) => {
          const rows = bookings
            .filter((b) => b.booking_date.startsWith(month.month) && b.currency === month.currency)
            .sort((a, b) => b.booking_date.localeCompare(a.booking_date));
          return (
            <Card key={`${month.month}-${month.currency}`} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[14px] font-bold capitalize text-neutral-900">{formatPartnerMonth(month.month, lang)}</h2>
                  <p className="text-[12px] text-neutral-500">{t.rBookings(month.count)}</p>
                </div>
                <div className="text-end">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">{t.rMonthTotal}</p>
                  <p className="text-base font-bold text-neutral-900" dir="ltr">
                    {formatMoney(month.total, month.currency)}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="rounded-[10px] bg-neutral-100 px-3 py-2">
                  <dt className="text-neutral-500">{t.rDue}</dt>
                  <dd className="font-semibold text-neutral-900" dir="ltr">
                    {formatMoney(month.due, month.currency)}
                  </dd>
                </div>
                <div className="rounded-[10px] bg-neutral-100 px-3 py-2">
                  <dt className="text-neutral-500">{t.rSettled}</dt>
                  <dd className="font-semibold text-neutral-900" dir="ltr">
                    {formatMoney(month.settled, month.currency)}
                  </dd>
                </div>
              </dl>

              <ul className="divide-y divide-neutral-100">
                {rows.map((booking) => (
                  <li key={booking.id} className="flex items-start justify-between gap-3 py-2.5 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-neutral-900">
                        {displayText(booking as unknown as Record<string, unknown>, "experience_title", lang)}
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        {formatPartnerDate(booking.booking_date, lang)} · {customerLabel(booking)} · {booking.party_size}
                      </p>
                      {booking.settled && (
                        <p className="text-[12px] text-neutral-500">
                          {booking.settled_at ? t.rSettledOn(formatPartnerDate(booking.settled_at, lang)) : t.rSettled}
                          {booking.settlement_reference && ` · ${t.rReference} ${booking.settlement_reference}`}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 space-y-1 text-end">
                      {booking.provider_amount == null ? (
                        <Pill tone="muted">{t.rUnknown}</Pill>
                      ) : (
                        <>
                          <p className="text-[13px] font-semibold text-neutral-900" dir="ltr">
                            {formatMoney(booking.provider_amount, booking.currency)}
                          </p>
                          <Pill tone={booking.settled ? "strong" : "neutral"}>{booking.settled ? t.rSettled : t.rDue}</Pill>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}
    </>
  );
}
