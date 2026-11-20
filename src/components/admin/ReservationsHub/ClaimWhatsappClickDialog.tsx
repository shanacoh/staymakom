/**
 * « Le client a écrit » (liste Clics WhatsApp) : on saisit le prénom et le numéro du client
 * qui a envoyé le message avec cette référence. La demande entre alors dans le flux Réservations.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { claimBoatWhatsappClick } from "@/lib/reservations/actions";
import type { BoatWhatsappClick } from "@/lib/reservations/types";

interface Props {
  click: BoatWhatsappClick;
  onClose: () => void;
  onDone: () => void;
}

const ClaimWhatsappClickDialog = ({ click, onClose, onDone }: Props) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const canSubmit = !!name.trim() && !!phone.trim();
  const save = useMutation({
    mutationFn: () => claimBoatWhatsappClick(click.id, name.trim(), phone.trim()),
    onSuccess: () => {
      toast.success("Demande ajoutée au flux Réservations");
      onDone();
      onClose();
    },
    onError: (error: Error) => toast.error("Enregistrement impossible", { description: error.message }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Le client a écrit</DialogTitle>
          <DialogDescription>
            Réf. {click.ref} · {click.product}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="claim-name">Prénom</Label>
            <Input id="claim-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-phone">Numéro WhatsApp</Label>
            <Input id="claim-phone" type="tel" placeholder="+972..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || save.isPending}>
              Ajouter au flux
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimWhatsappClickDialog;
