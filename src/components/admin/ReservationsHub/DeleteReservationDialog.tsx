/**
 * Confirmation avant de supprimer une ou plusieurs lignes depuis la grille de Saisie.
 * La même fenêtre sert pour tous les types de ligne. Les lignes partent dans la corbeille,
 * d'où elles peuvent être restaurées. Rappelle ce que la suppression ne fait pas
 * (rembourser un client, annuler une chambre chez l'hôtel).
 */

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { deleteReservationRows } from "@/lib/reservations/actions";
import { formatMoneyByCurrency } from "@/lib/reservations/rules";
import type { MoneyByCurrency, ReservationRow } from "@/lib/reservations/types";

interface Props {
  // Lignes à supprimer. Vide : la fenêtre est fermée.
  rows: ReservationRow[];
  onClose: () => void;
  onDeleted: () => void;
}

const WARNING_CLASS = "rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900";
const MAX_LISTED = 8;

const DeleteReservationDialog = ({ rows, onClose, onDeleted }: Props) => {
  const remove = useMutation({
    mutationFn: (targets: ReservationRow[]) => deleteReservationRows(targets),
    onSuccess: (_data, targets) => {
      toast.success(targets.length > 1 ? `${targets.length} lignes mises à la corbeille` : "Ligne mise à la corbeille");
      onDeleted();
      onClose();
    },
    onError: (error: Error) => toast.error("Suppression impossible", { description: error.message }),
  });

  if (rows.length === 0) return null;

  const collected: MoneyByCurrency = {};
  for (const row of rows) {
    if (row.collected > 0) collected[row.currency] = (collected[row.currency] ?? 0) + row.collected;
  }
  const hasCollected = Object.keys(collected).length > 0;
  const hasLiveHotel = rows.some((row) => row.source === "hotel" && row.status === "confirmee");
  const hasDossier = rows.some((row) => row.source === "dossier");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rows.length > 1 ? `Supprimer ces ${rows.length} lignes ?` : "Supprimer cette ligne ?"}</DialogTitle>
          <DialogDescription>
            {rows.length > 1 ? "Elles partent" : "Elle part"} dans la corbeille : tu peux {rows.length > 1 ? "les" : "la"} restaurer
            depuis la puce « Corbeille ».
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {rows.slice(0, MAX_LISTED).map((row) => (
              <li key={row.key} className="truncate">
                <span className="font-medium text-foreground">{row.client}</span> · {row.product || "sans produit"}
                {row.amount !== null && ` · ${formatCurrency(row.amount, row.currency)}`}
              </li>
            ))}
            {rows.length > MAX_LISTED && <li>et {rows.length - MAX_LISTED} autres lignes</li>}
          </ul>
          {hasCollected && (
            <p className={WARNING_CLASS}>
              {formatMoneyByCurrency(collected)} ont déjà été encaissés sur {rows.length > 1 ? "ces lignes" : "cette ligne"}.
              Supprimer ne rembourse pas le client et n'annule pas les liens de paiement déjà envoyés.
            </p>
          )}
          {hasLiveHotel && (
            <p className={WARNING_CLASS}>
              Une réservation d'hôtel encore confirmée est dans la liste. La supprimer ici n'annule pas la chambre auprès de
              l'hôtel.
            </p>
          )}
          {hasDossier && (
            <p className={WARNING_CLASS}>Un dossier de voyage est dans la liste : il disparaît aussi de la page Itinéraires.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {rows.length > 1 ? "Garder les lignes" : "Garder la ligne"}
          </Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(rows)}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteReservationDialog;
