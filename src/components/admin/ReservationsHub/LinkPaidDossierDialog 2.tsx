/**
 * « Lier un dossier payé » : choisir un dossier de voyage existant et le marquer payé, avec
 * la date, le montant convenu et le montant encaissé. Encaissé inférieur au total = acompte.
 * Le dossier apparaît alors dans l'onglet Itinéraire.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { markDossierPaid } from "@/lib/reservations/actions";
import { useUnpaidDossiers } from "@/lib/reservations/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
}

const parseAmount = (raw: string): number | null => {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) || n < 0 ? null : n;
};

const LinkPaidDossierDialog = ({ open, onOpenChange, onLinked }: Props) => {
  const { data: dossiers, isLoading } = useUnpaidDossiers(open);
  const [dossierId, setDossierId] = useState("");
  const [paidOn, setPaidOn] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [total, setTotal] = useState("");
  const [collected, setCollected] = useState("");

  const dossier = dossiers?.find((d) => d.id === dossierId);

  useEffect(() => {
    if (!open) {
      setDossierId("");
      setTotal("");
      setCollected("");
      setPaidOn(format(new Date(), "yyyy-MM-dd"));
    }
  }, [open]);

  // Le prix de la proposition sert de point de départ : il reste modifiable.
  const selectDossier = (id: string) => {
    setDossierId(id);
    const proposed = dossiers?.find((d) => d.id === id)?.proposedTotal;
    const text = proposed === null || proposed === undefined ? "" : String(proposed);
    setTotal(text);
    setCollected(text);
  };

  const totalValue = parseAmount(total);
  const collectedValue = parseAmount(collected);
  const tooMuch = totalValue !== null && collectedValue !== null && collectedValue > totalValue;
  const valid = !!dossierId && !!paidOn && totalValue !== null && collectedValue !== null && collectedValue > 0 && !tooMuch;
  const balance = valid ? totalValue - collectedValue : 0;

  const link = useMutation({
    mutationFn: () => markDossierPaid(dossierId, { paidOn, total: totalValue as number, collected: collectedValue as number }),
    onSuccess: () => {
      toast.success(balance > 0 ? "Dossier lié, acompte enregistré" : "Dossier lié et marqué payé");
      onLinked();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error("Impossible de lier le dossier", { description: error.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) link.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Lier un dossier payé</DialogTitle>
            <DialogDescription>
              Le dossier choisi passe en « Payé » et apparaît dans l'onglet Itinéraire, avec ses lignes de réservation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Dossier</Label>
            <Select value={dossierId} onValueChange={selectDossier}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Chargement..." : "Choisir un dossier pas encore payé"} />
              </SelectTrigger>
              <SelectContent>
                {(dossiers ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isLoading && (dossiers ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">Aucun dossier en attente de paiement.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="dossier-paid-on">Date du paiement</Label>
              <Input id="dossier-paid-on" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dossier-total">Montant total{dossier ? ` (${dossier.currency})` : ""}</Label>
              <Input id="dossier-total" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dossier-collected">Montant encaissé</Label>
              <Input id="dossier-collected" inputMode="decimal" value={collected} onChange={(e) => setCollected(e.target.value)} />
            </div>
          </div>

          {tooMuch && <p className="text-xs text-destructive">Le montant encaissé ne peut pas dépasser le montant total.</p>}
          {valid && balance > 0 && dossier && (
            <p className="text-xs text-muted-foreground">
              Acompte : il restera {formatCurrency(balance, dossier.currency)} à encaisser. La ligne proposera « Confirmer le solde ».
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!valid || link.isPending}>
              Lier le dossier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkPaidDossierDialog;
