/**
 * « Marquer à vérifier » (clic droit dans la Saisie) : la ligne prend une bordure rouge et une
 * icône, avec une note facultative. L'équivalent des cellules rouges de l'Excel de Shana.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { flagRow } from "@/lib/reservations/actions";
import type { ReservationRow } from "@/lib/reservations/types";

interface Props {
  row: ReservationRow;
  onClose: () => void;
  onDone: () => void;
}

const FlagRowDialog = ({ row, onClose, onDone }: Props) => {
  const [note, setNote] = useState(row.checkNote ?? "");
  const save = useMutation({
    mutationFn: () => flagRow(row.source, row.id, note.trim() || null),
    onSuccess: () => {
      toast.success(row.flagged ? "Note mise à jour" : "Ligne marquée à vérifier");
      onDone();
      onClose();
    },
    onError: (error: Error) => toast.error("Enregistrement impossible", { description: error.message }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row.flagged ? "Modifier la note" : "Marquer à vérifier"}</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="flag-note">Ce qu'il faut vérifier (facultatif)</Label>
            <Textarea id="flag-note" rows={3} autoFocus value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={save.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlagRowDialog;
