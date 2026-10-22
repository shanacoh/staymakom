/**
 * « Classer non converti » (onglet Itinéraire) : le dossier est archivé avec un motif, sans être
 * supprimé. Il reste dans le groupe « Non convertis », d'où « Réactiver » le fait revenir.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { classifyDossierLost } from "@/lib/reservations/actions";
import { DOSSIER_LOST_REASON_OPTIONS } from "@/lib/reservations/itineraries";
import type { DossierLostReason, ItineraryDossier } from "@/lib/reservations/types";

interface Props {
  dossier: ItineraryDossier;
  onClose: () => void;
  onDone: () => void;
}

const LostDossierDialog = ({ dossier, onClose, onDone }: Props) => {
  const [reason, setReason] = useState<DossierLostReason | "">(dossier.lostReason ?? "");
  const [note, setNote] = useState(dossier.lostNote ?? "");
  const save = useMutation({
    mutationFn: () => classifyDossierLost(dossier.id, reason as DossierLostReason, note.trim() || null),
    onSuccess: () => {
      toast.success("Dossier classé non converti");
      onDone();
      onClose();
    },
    onError: (error: Error) => toast.error("Action impossible", { description: error.message }),
  });
  const valid = reason !== "" && (reason !== "autre" || note.trim() !== "");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Classer non converti</DialogTitle>
          <DialogDescription>
            {dossier.name}
            {dossier.client ? ` · ${dossier.client}` : ""}. Le dossier est archivé, rien n'est supprimé.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="dossier-lost-reason">Motif</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as DossierLostReason)}>
              <SelectTrigger id="dossier-lost-reason">
                <SelectValue placeholder="Choisir un motif" />
              </SelectTrigger>
              <SelectContent>
                {DOSSIER_LOST_REASON_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dossier-lost-note">Note {reason === "autre" ? "" : "(facultatif)"}</Label>
            <Textarea id="dossier-lost-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!valid || save.isPending}>
              Classer non converti
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LostDossierDialog;
