/**
 * Confirmation avant de supprimer définitivement une ligne depuis la grille de Saisie.
 * Rappelle ce qui part avec la ligne (l'argent déjà encaissé, les liens de paiement).
 */

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { deleteReservationRow } from "@/lib/reservations/actions";
import type { ReservationRow } from "@/lib/reservations/types";

interface Props {
  row: ReservationRow | null;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteReservationDialog = ({ row, onClose, onDeleted }: Props) => {
  const remove = useMutation({
    mutationFn: (target: ReservationRow) => deleteReservationRow(target.source === "request" ? "request" : "booking", target.id),
    onSuccess: () => {
      toast.success("Ligne supprimée");
      onDeleted();
      onClose();
    },
    onError: (error: Error) => toast.error("Suppression impossible", { description: error.message }),
  });

  if (!row) return null;
  const isRequest = row.source === "request";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer cette {isRequest ? "demande" : "réservation"} ?</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product || "sans produit"}
            {row.amount !== null && ` · ${formatCurrency(row.amount, row.currency)}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>La suppression est définitive : la ligne ne pourra pas être récupérée depuis le back-office.</p>
          {row.collected > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              {formatCurrency(row.collected, row.currency)} ont déjà été encaissés sur cette réservation. La supprimer
              efface cette trace, mais ne rembourse pas le client et n'annule pas les liens de paiement déjà envoyés.
              Pour une vraie réservation, passe plutôt son statut en « Annulée ».
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Garder la ligne
          </Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(row)}>
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteReservationDialog;
