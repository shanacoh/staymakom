// Réservations : à venir et passées, uniquement payées.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookingCard } from "@/components/partner/BookingCard";
import { Empty, Hint, PageLoader } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { fetchPartnerBookings, partnerKeys } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { splitBookings, toIsoDate } from "@/lib/partner/logic";

export default function PartnerBookings() {
  const { t } = usePartner();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const { data, isLoading } = useQuery({ queryKey: partnerKeys.bookings, queryFn: fetchPartnerBookings });

  if (isLoading) return <PageLoader label={t.loading} />;
  const groups = splitBookings(data ?? [], toIsoDate(new Date()));
  const shown = groups[tab];

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-[17px] font-semibold tracking-tight">{t.tabBookings}</h1>
        <Hint>{t.bOnlyPaid}</Hint>
      </div>

      <div className="flex gap-1 rounded-full bg-neutral-200/70 p-1" role="tablist">
        {(["upcoming", "past"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "min-h-[32px] flex-1 rounded-full px-3 text-[12px] font-semibold",
              tab === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600",
            )}
          >
            {key === "upcoming" ? t.bUpcoming : t.bPast} · {groups[key].length}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty>{tab === "upcoming" ? t.bEmptyUpcoming : t.bEmptyPast}</Empty>
      ) : (
        <div className="space-y-3">
          {shown.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
}
