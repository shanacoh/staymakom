/**
 * Liste derrière la puce « Corbeille » : les lignes supprimées depuis la page Réservations.
 * Chacune peut être restaurée : elle revient à l'identique, avec ce qui lui était rattaché.
 */

import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { restoreDeletedReservation } from "@/lib/reservations/actions";
import type { DeletedReservation, ReservationSource } from "@/lib/reservations/types";

const SOURCE_LABELS: Record<ReservationSource, string> = {
  booking: "Expérience ou bateau",
  request: "Demande",
  hotel: "Hôtel",
  dossier: "Dossier de voyage",
};

interface Props {
  items: DeletedReservation[];
  onRestored: () => void;
}

const DeletedReservationsTable = ({ items, onRestored }: Props) => {
  const restore = useMutation({
    mutationFn: (item: DeletedReservation) => restoreDeletedReservation(item.id),
    onSuccess: () => {
      toast.success("Ligne restaurée");
      onRestored();
    },
    onError: (error: Error) => toast.error("Restauration impossible", { description: error.message }),
  });

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Corbeille</h2>
        <p className="text-xs text-muted-foreground">
          Lignes supprimées de la page Réservations. Elles ne comptent dans aucun total tant qu'elles sont ici.
        </p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center text-sm text-muted-foreground">La corbeille est vide.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>Supprimée le</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {format(parseISO(item.deletedAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{SOURCE_LABELS[item.source]}</TableCell>
                  <TableCell className="font-medium">{item.client}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{item.product || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    {item.amount !== null && item.currency ? formatCurrency(item.amount, item.currency) : "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button size="sm" variant="outline" disabled={restore.isPending} onClick={() => restore.mutate(item)}>
                      <Undo2 className="h-3.5 w-3.5" />
                      Restaurer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default DeletedReservationsTable;
