import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { errorMessage } from "@/lib/catalogue/queries";
import type { PartnerBooking } from "@/lib/partner/types";
import { fetchProviderSettlements, markSettled, partnerAdminKeys, unmarkSettled } from "@/lib/partnerAdmin/queries";

// Règlements au prestataire : la même liste et les mêmes montants que dans son espace partenaire
// (onglet Revenus). C'est ici qu'on saisit « réglé le… » et la référence ; lui les voit, sans plus.

const day = (date: string) => format(parseISO(date), "d MMM yyyy", { locale: fr });

export function ProviderSettlementsSection({ providerId }: { providerId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: partnerAdminKeys.settlements(providerId),
    queryFn: () => fetchProviderSettlements(providerId),
  });
  const [editing, setEditing] = useState<PartnerBooking | null>(null);
  const [form, setForm] = useState({ amount: "", date: "", reference: "" });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: partnerAdminKeys.settlements(providerId) });
    queryClient.invalidateQueries({ queryKey: ["admin-provider-bookings"] });
  };
  const settle = useMutation({
    mutationFn: () => markSettled(editing!.id, { amount: Number(form.amount.replace(",", ".")), date: form.date, reference: form.reference }),
    onSuccess: () => {
      toast.success("Règlement enregistré");
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const undo = useMutation({
    mutationFn: (bookingId: string) => unmarkSettled(bookingId),
    onSuccess: () => {
      toast.success("Règlement annulé : la réservation est de nouveau « à régler »");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const open = (booking: PartnerBooking) => {
    setEditing(booking);
    setForm({
      amount: booking.provider_amount != null ? String(booking.provider_amount) : "",
      date: format(new Date(), "yyyy-MM-dd"),
      reference: "",
    });
  };
  const amount = Number(form.amount.replace(",", "."));
  const canSettle = form.amount.trim() !== "" && Number.isFinite(amount) && amount >= 0 && form.date !== "";

  if (isLoading) return <Skeleton className="h-32 w-full" aria-busy="true" />;
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Impossible de charger les règlements : {errorMessage(error)}
      </div>
    );
  }
  const bookings = data ?? [];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        Règlements au prestataire <span className="font-normal text-muted-foreground">{bookings.length}</span>
      </h3>
      <p className="text-xs text-muted-foreground">
        Les réservations payées, avec le montant qui revient au prestataire : le coût fournisseur saisi sur la réservation s'il existe,
        sinon le prix fournisseur de la fiche multiplié par les participants. C'est exactement ce qu'il voit dans son onglet Revenus.
      </p>
      {bookings.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune réservation payée pour l'instant.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Pers.</TableHead>
                <TableHead className="text-right">Montant prestataire</TableHead>
                <TableHead>Règlement</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    <Link to={`/admin/standalone-bookings/${b.id}`} className="underline underline-offset-2 hover:text-red-600">
                      {day(b.booking_date)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{b.experience_title_fr || b.experience_title}</TableCell>
                  <TableCell className="text-xs">
                    {b.customer_first_name} {b.customer_last_initial ? `${b.customer_last_initial}.` : ""}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{b.party_size}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                    {b.provider_amount == null ? (
                      <span className="rounded-full border border-dashed border-neutral-400 px-2 py-0.5 text-neutral-600">à compléter</span>
                    ) : (
                      formatCurrency(b.provider_amount, b.currency)
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {b.settled ? (
                      <span>
                        <span className="font-semibold">Réglé</span>
                        {b.settled_at && ` le ${day(b.settled_at)}`}
                        {b.settlement_reference && <span className="text-muted-foreground"> · {b.settlement_reference}</span>}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">À régler</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.settled ? (
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" disabled={undo.isPending} onClick={() => undo.mutate(b.id)}>
                        Annuler
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => open(b)}>
                        Marquer réglé
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(isOpen) => !isOpen && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer comme réglé</DialogTitle>
            <DialogDescription>
              {editing && `${editing.experience_title_fr || editing.experience_title} · ${day(editing.booking_date)}`}. Le prestataire verra « Réglé »,
              la date et la référence dans son espace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="settlement-amount">Montant réglé ({editing?.currency})</Label>
              <Input id="settlement-amount" inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Enregistré comme coût fournisseur de la réservation.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settlement-date">Date du règlement</Label>
              <Input id="settlement-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settlement-reference">Référence (facultatif)</Label>
              <Input
                id="settlement-reference"
                placeholder="ex. virement du 15/10, n° 4521"
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button type="button" disabled={!canSettle || settle.isPending} onClick={() => settle.mutate()}>
              {settle.isPending ? "Enregistrement…" : "Enregistrer le règlement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
