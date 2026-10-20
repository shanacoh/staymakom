// Les deux chiffres de l'accueil : réservations à venir et total généré pour le prestataire.
// Jamais le prix client ni la marge : la base n'envoie que la part du prestataire.

import { Link } from "react-router-dom";
import { usePartner } from "@/lib/partner/context";
import { formatMoney } from "@/lib/partner/logic";
import type { RevenueTotal } from "@/lib/partner/logic";

interface Props {
  upcomingCount: number;
  totals: RevenueTotal[];
}

const tile =
  "block rounded-[12px] p-3.5 transition-opacity hover:opacity-90";
const label = "text-[10px] font-semibold uppercase tracking-[0.1em]";

export function HomeStats({ upcomingCount, totals }: Props) {
  const { t } = usePartner();
  const [main, ...others] = totals;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        to="/partner/bookings"
        className={`${tile} border border-neutral-200/80 bg-white`}
      >
        <p className={`${label} text-neutral-500`}>{t.homeStatUpcoming}</p>
        <p className="mt-1 text-[22px] font-bold tracking-tight text-neutral-900">
          {upcomingCount}
        </p>
      </Link>

      <Link
        to="/partner/revenue"
        className={`${tile} border border-neutral-200/80 bg-white`}
      >
        <p className={`${label} text-neutral-500`}>{t.homeStatEarned}</p>
        <p
          className="mt-1 text-[22px] font-bold tracking-tight text-neutral-900"
          dir="ltr"
        >
          {main
            ? formatMoney(main.total, main.currency)
            : formatMoney(0, "ILS")}
        </p>
        {others.map((other) => (
          <p
            key={other.currency}
            className="text-[12px] font-semibold text-neutral-900"
            dir="ltr"
          >
            + {formatMoney(other.total, other.currency)}
          </p>
        ))}
        {main && main.due > 0 && (
          <p className="mt-0.5 text-[11px] text-neutral-500">
            {t.homeStatDue(formatMoney(main.due, main.currency))}
          </p>
        )}
      </Link>
    </div>
  );
}
