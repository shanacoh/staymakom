/**
 * RevenueByChannelCard
 * Bloc "CA par canal" du tableau de bord : somme de sell_price des
 * réservations confirmées (standalone + hôtels), groupée par canal
 * d'acquisition, pour le mois en cours et le mois précédent. Les
 * réservations sans canal renseigné (anciennes, avant ce Sprint) sont
 * regroupées sous "Non renseigné".
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHANNEL_LABELS, formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";

const NO_CHANNEL_LABEL = "Non renseigné";

type Row = { channel: string | null; sell_price: number | null; currency: string | null };

// { canal: { devise: montant } }
type ChannelTotals = Record<string, Record<string, number>>;

function accumulate(totals: ChannelTotals, rows: Row[]) {
  rows.forEach((r) => {
    const channel = r.channel || "__none__";
    const currency = r.currency || "ILS";
    const amount = r.sell_price || 0;
    if (!totals[channel]) totals[channel] = {};
    totals[channel][currency] = (totals[channel][currency] || 0) + amount;
  });
}

function ChannelTotalsList({ totals }: { totals: ChannelTotals }) {
  const channels = Object.keys(totals).sort((a, b) => {
    if (a === "__none__") return 1;
    if (b === "__none__") return -1;
    return (CHANNEL_LABELS[a] || a).localeCompare(CHANNEL_LABELS[b] || b);
  });

  if (channels.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune réservation confirmée ce mois-ci.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {channels.map((channel) => (
        <li key={channel} className="flex items-center justify-between text-sm gap-3">
          <span className="text-foreground">{channel === "__none__" ? NO_CHANNEL_LABEL : CHANNEL_LABELS[channel] || channel}</span>
          <span className="font-mono font-semibold text-right">
            {Object.entries(totals[channel])
              .map(([currency, amount]) => formatCurrency(amount, currency))
              .join(" + ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

const RevenueByChannelCard = () => {
  const now = new Date();
  const currentStart = startOfMonth(now);
  const previousStart = startOfMonth(subMonths(now, 1));
  const previousEnd = endOfMonth(previousStart);

  const { data } = useQuery({
    queryKey: ["dashboard-revenue-by-channel", currentStart.toISOString()],
    queryFn: async () => {
      const rangeStart = previousStart.toISOString();

      const [{ data: standalone, error: standaloneError }, { data: hotels, error: hotelsError }] = await Promise.all([
        supabase
          .from("standalone_bookings")
          .select("channel, sell_price, currency, created_at")
          .eq("status", "confirmed")
          .gte("created_at", rangeStart),
        (supabase.from("bookings_hg" as any) as any)
          .select("channel, sell_price, currency, created_at")
          .eq("status", "confirmed")
          .eq("is_cancelled", false)
          .gte("created_at", rangeStart),
      ]);

      if (standaloneError || hotelsError) throw standaloneError || hotelsError;
      return [...(standalone || []), ...(hotels || [])] as (Row & { created_at: string })[];
    },
  });

  const { currentTotals, previousTotals } = useMemo(() => {
    const current: ChannelTotals = {};
    const previous: ChannelTotals = {};
    (data || []).forEach((row) => {
      const createdAt = new Date(row.created_at);
      if (createdAt >= currentStart) accumulate(current, [row]);
      else if (createdAt >= previousStart && createdAt <= previousEnd) accumulate(previous, [row]);
    });
    return { currentTotals: current, previousTotals: previous };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          CA par canal
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2 capitalize">
            {format(currentStart, "MMMM yyyy", { locale: fr })}
          </div>
          <ChannelTotalsList totals={currentTotals} />
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2 capitalize">
            {format(previousStart, "MMMM yyyy", { locale: fr })}
          </div>
          <ChannelTotalsList totals={previousTotals} />
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueByChannelCard;
