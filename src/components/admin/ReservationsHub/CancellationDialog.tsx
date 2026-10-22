/**
 * Panneau « Annuler / Rembourser » d'une réservation d'expérience ou d'hôtel. Côté client :
 * ce qu'il avait payé, le remboursement (aucun, partiel, total), son moyen et s'il est fait.
 * Côté prestataire : rien à récupérer, à récupérer, récupéré ou gardé en avoir. La marge de
 * l'annulation s'affiche en direct. Rien n'est viré ni envoyé au client : on note ce qui est
 * fait ou à faire. Seul l'email automatique d'annulation au prestataire peut partir.
 */

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { saveCancellation } from "@/lib/reservations/actions";
import {
  REFUND_METHOD_OPTIONS,
  SUPPLIER_REFUND_OPTIONS,
  buildCancellationPatch,
  cancellationDefaults,
  cancellationError,
  refundOf,
  type CancellationInput,
  type RefundChoice,
} from "@/lib/reservations/cancellation";
import type { RefundMethod, ReservationRow, SupplierRefundStatus } from "@/lib/reservations/types";

interface Props {
  row: ReservationRow;
  onClose: () => void;
  onDone: () => void;
}

const parseAmount = (raw: string): number | null => {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
};

const text = (value: number | null) => (value === null ? "" : String(value));

const CancellationDialog = ({ row, onClose, onDone }: Props) => {
  const defaults = useMemo(() => cancellationDefaults(row), [row]);
  const [paid, setPaid] = useState(text(defaults.paid));
  const [refundChoice, setRefundChoice] = useState<RefundChoice>(defaults.refundChoice);
  const [refundAmount, setRefundAmount] = useState(text(defaults.refundAmount));
  const [refundMethod, setRefundMethod] = useState<RefundMethod | null>(defaults.refundMethod);
  const [refundDone, setRefundDone] = useState(defaults.refundDone);
  const [supplierChoice, setSupplierChoice] = useState<SupplierRefundStatus>(defaults.supplierChoice);
  const [supplierAmount, setSupplierAmount] = useState(text(defaults.supplierAmount));
  const [notifyProvider, setNotifyProvider] = useState(defaults.notifyProvider);

  const alreadyCancelled = row.status === "annulee";
  const input: CancellationInput = {
    paid: parseAmount(paid) ?? Number.NaN,
    refundChoice,
    refundAmount: parseAmount(refundAmount),
    refundMethod,
    refundDone,
    supplierChoice,
    supplierAmount: parseAmount(supplierAmount),
    notifyProvider,
  };
  const error = cancellationError(row, input);
  const refund = error ? 0 : refundOf(input);
  const kept = error ? null : input.paid - refund;

  const save = useMutation({
    mutationFn: () => saveCancellation(row.source, row.id, buildCancellationPatch(row, input)),
    onSuccess: () => {
      toast.success(alreadyCancelled ? "Annulation mise à jour" : "Réservation annulée");
      onDone();
      onClose();
    },
    onError: (e: Error) => toast.error("Enregistrement impossible", { description: e.message }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{alreadyCancelled ? "Annulation et remboursement" : "Annuler / Rembourser"}</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product}. Rien n'est viré ni envoyé au client : tu notes ce qui est fait ou à faire.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!error) save.mutate();
          }}
        >
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Client</h3>
            <div className="space-y-1.5">
              <Label htmlFor="cancel-paid">Le client avait payé ({row.currency})</Label>
              <Input id="cancel-paid" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label>Remboursement</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={refundChoice}
                onValueChange={(v) => v && setRefundChoice(v as RefundChoice)}
                className="justify-start"
              >
                <ToggleGroupItem value="none">Aucun</ToggleGroupItem>
                <ToggleGroupItem value="partial">Partiel</ToggleGroupItem>
                <ToggleGroupItem value="total">Total</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {refundChoice !== "none" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {refundChoice === "partial" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cancel-refund">Montant remboursé</Label>
                    <Input id="cancel-refund" inputMode="decimal" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="cancel-method">Moyen</Label>
                  <Select value={refundMethod ?? ""} onValueChange={(v) => setRefundMethod(v as RefundMethod)}>
                    <SelectTrigger id="cancel-method">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFUND_METHOD_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox id="cancel-refund-done" checked={refundDone} onCheckedChange={(c) => setRefundDone(c === true)} />
                  <Label htmlFor="cancel-refund-done" className="font-normal">
                    Remboursement déjà fait (sinon : à faire)
                  </Label>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Prestataire</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cancel-supplier">Argent versé au prestataire</Label>
                <Select value={supplierChoice} onValueChange={(v) => setSupplierChoice(v as SupplierRefundStatus)}>
                  <SelectTrigger id="cancel-supplier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_REFUND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {supplierChoice !== "none" && (
                <div className="space-y-1.5">
                  <Label htmlFor="cancel-supplier-amount">Montant</Label>
                  <Input
                    id="cancel-supplier-amount"
                    inputMode="decimal"
                    value={supplierAmount}
                    onChange={(e) => setSupplierAmount(e.target.value)}
                  />
                </div>
              )}
            </div>
            {supplierChoice === "avoir" && (
              <p className="text-xs text-muted-foreground">
                L'avoir apparaîtra sur la fiche du prestataire et sera proposé à ta prochaine réservation chez lui.
              </p>
            )}
            {row.source === "booking" && !alreadyCancelled && (
              <div className="flex items-center gap-2">
                <Checkbox id="cancel-notify" checked={notifyProvider} onCheckedChange={(c) => setNotifyProvider(c === true)} />
                <Label htmlFor="cancel-notify" className="font-normal">
                  Envoyer au prestataire l'email automatique d'annulation (s'il avait été prévenu de la réservation)
                </Label>
              </div>
            )}
          </section>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              <span>
                Staymakom garde {formatCurrency(kept, row.currency)}
                {refund > 0 && ` · ${formatCurrency(refund, row.currency)} ${refundDone ? "remboursé" : "à rembourser"}`}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button type="submit" disabled={!!error || save.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CancellationDialog;
