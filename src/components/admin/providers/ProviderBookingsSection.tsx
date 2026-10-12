import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { errorMessage } from "@/lib/catalogue/queries";
import { countsInFigures, monthlyStats, splitByDate } from "@/lib/providers/compute";
import type { ProviderBooking } from "@/lib/providers/types";

// Les réservations d'un prestataire et ses chiffres par mois.

// Neutre : une information manquante n'est pas une urgence.
const TO_COMPLETE = <span className="rounded-full border border-dashed border-neutral-400 px-2 py-0.5 text-neutral-600">à compléter</span>;

const PAYMENT_LABEL: Record<string, string> = {
  paid: "payée",
  deposit_paid: "acompte payé",
  pending: "non payée",
  failed: "paiement échoué",
  refund_pending: "remboursement en cours",
  refunded: "remboursée",
};

const bookingUrl = (b: ProviderBooking) => (b.kind === "hotel" ? `/admin/reservations/${b.id}` : `/admin/standalone-bookings/${b.id}`);
const day = (date: string) => format(parseISO(date), "d MMM yyyy", { locale: fr });
const monthName = (month: string) => format(parseISO(`${month}-01`), "MMMM yyyy", { locale: fr });

function BookingTable({ title, bookings, empty }: { title: string; bookings: ProviderBooking[]; empty: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        {title} <span className="font-normal text-muted-foreground">{bookings.length}</span>
      </h3>
      {bookings.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Pers.</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead className="text-right">Revenu prestataire</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={`${b.kind}-${b.id}`}>
                  <TableCell className="whitespace-nowrap text-xs">
                    <Link to={bookingUrl(b)} className="underline underline-offset-2 hover:text-red-600">
                      {day(b.date)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{b.client}</TableCell>
                  <TableCell className="text-xs">{b.product}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{b.partySize ?? "–"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">{formatCurrency(b.amount, b.currency)}</TableCell>
                  <TableCell className="text-xs">
                    {countsInFigures(b) ? (
                      PAYMENT_LABEL[b.paymentStatus ?? ""]
                    ) : (
                      <span className="text-muted-foreground">
                        {PAYMENT_LABEL[b.paymentStatus ?? ""] ?? "non payée"} · hors chiffres
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                    {b.providerNet == null ? TO_COMPLETE : formatCurrency(b.providerNet, b.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

interface ProviderBookingsSectionProps {
  bookings: ProviderBooking[] | undefined;
  isLoading: boolean;
  error: unknown;
}

export function ProviderBookingsSection({ bookings, isLoading, error }: ProviderBookingsSectionProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const { upcoming, past } = useMemo(() => splitByDate(bookings ?? [], today), [bookings, today]);
  const stats = useMemo(() => monthlyStats(bookings ?? []), [bookings]);

  if (isLoading) return <Skeleton className="h-40 w-full" aria-busy="true" />;
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Impossible de charger les réservations : {errorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Chiffres par mois</h3>
        <p className="text-xs text-muted-foreground">
          Uniquement les réservations réellement payées (payées en entier ou acompte encaissé), hors annulations, rangées par mois de
          prestation. Le revenu du prestataire vient du coût fournisseur saisi sur la réservation ; à défaut, du prix fournisseur de la
          fiche quand il retombe sur le montant payé. Sinon : « à compléter ».
        </p>
        {stats.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune réservation payée pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Mois</TableHead>
                  <TableHead className="text-right">Réservations</TableHead>
                  <TableHead className="text-right">Chiffre d'affaires</TableHead>
                  <TableHead className="text-right">Revenu net prestataire</TableHead>
                  <TableHead className="text-right">Marge STAYMAKOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s) => (
                  <TableRow key={`${s.month}-${s.currency}`}>
                    <TableCell className="text-xs capitalize">{monthName(s.month)}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{s.count}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{formatCurrency(s.revenue, s.currency)}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {s.providerNet == null ? (
                        <>
                          {TO_COMPLETE}
                          <span className="text-muted-foreground">
                            {" "}
                            · {s.missing} résa sans coût
                          </span>
                        </>
                      ) : (
                        formatCurrency(s.providerNet, s.currency)
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {s.margin == null ? TO_COMPLETE : formatCurrency(s.margin, s.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <BookingTable title="Réservations à venir" bookings={upcoming} empty="Aucune réservation à venir." />
      <BookingTable title="Réservations passées" bookings={past} empty="Aucune réservation passée." />
    </div>
  );
}
