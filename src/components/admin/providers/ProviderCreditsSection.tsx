import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { errorMessage } from "@/lib/catalogue/queries";
import { formatMoneyByCurrency } from "@/lib/reservations/rules";
import { useSupplierCredits } from "@/lib/reservations/queries";
import type { MoneyByCurrency } from "@/lib/reservations/types";

// Avoirs ouverts chez le prestataire : réservations annulées dont il a gardé l'argent pour une
// prochaine réservation. Ils sont proposés à la création d'une réservation chez lui, et se
// ferment dès qu'ils sont utilisés.

export function ProviderCreditsSection({ providerId }: { providerId: string }) {
  const { data, isLoading, error } = useSupplierCredits(providerId);
  if (isLoading || (data ?? []).length === 0) return null;
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Impossible de charger les avoirs : {errorMessage(error)}
      </div>
    );
  }
  const credits = data ?? [];
  const total: MoneyByCurrency = {};
  for (const credit of credits) total[credit.currency] = (total[credit.currency] ?? 0) + credit.amount;

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
      <h3 className="text-sm font-semibold text-foreground">
        Avoirs ouverts <span className="font-normal text-muted-foreground">{formatMoneyByCurrency(total)}</span>
      </h3>
      <p className="text-xs text-muted-foreground">
        Ce prestataire garde cet argent pour une prochaine réservation. Il est proposé à la création d'une réservation chez lui.
      </p>
      <ul className="space-y-1 text-sm">
        {credits.map((credit) => (
          <li key={credit.id} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium tabular-nums">{formatCurrency(credit.amount, credit.currency)}</span>
            <span className="text-muted-foreground">
              · {credit.product} · {credit.client}
              {credit.date && ` · ${format(parseISO(credit.date), "d MMM yyyy", { locale: fr })}`}
            </span>
            <Link to={`/admin/standalone-bookings/${credit.id}`} className="text-xs underline underline-offset-2 hover:text-red-600">
              voir la réservation annulée
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
