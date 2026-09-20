/**
 * CreateManualHotelBookingDialog
 * Formulaire pour qu'un admin saisisse une réservation hôtel pour un client
 * contacté en direct (téléphone, WhatsApp, email) — symétrique de
 * CreateManualStandaloneBookingDialog. Crée la réservation comme confirmée,
 * source "manual_admin", sans marquer le paiement ni envoyer l'email — ça se
 * fait ensuite depuis la fiche détail, une fois le paiement reçu.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CURRENCY_OPTIONS } from "@/components/admin/BookingsGrid/columnTypes";

const EMPTY_FORM = {
  hotel_id: "",
  checkin: "",
  checkout: "",
  party_size: 1,
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  sell_price: "",
  net_price: "",
  currency: "ILS",
  internal_notes: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateManualHotelBookingDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: hotels } = useQuery({
    queryKey: ["hotels2-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels2").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const resetForm = () => setForm(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnectez-vous");

      const { data, error } = await supabase.functions.invoke("create-hotel-manual-booking", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          hotel_id: form.hotel_id,
          checkin: form.checkin,
          checkout: form.checkout,
          party_size: form.party_size,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone || undefined,
          sell_price: parseFloat(String(form.sell_price)),
          net_price: form.net_price !== "" ? parseFloat(String(form.net_price)) : undefined,
          currency: form.currency,
          internal_notes: form.internal_notes || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-hg"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-hg-grid"] });
      onOpenChange(false);
      resetForm();
      toast.success("Réservation créée — marquez le paiement et envoyez l'email depuis la fiche");
      navigate(`/admin/reservations/${data.booking_id}`);
    },
    onError: (e: Error) => toast.error("Erreur", { description: e.message }),
  });

  const canSubmit =
    !!form.hotel_id &&
    !!form.checkin &&
    !!form.checkout &&
    !!form.customer_name.trim() &&
    !!form.customer_email.trim() &&
    form.sell_price !== "" &&
    !Number.isNaN(parseFloat(String(form.sell_price)));

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation hôtel manuelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Pour un client contacté en direct (téléphone, WhatsApp, email). La réservation sera créée comme confirmée
            — vous pourrez ensuite marquer le paiement et envoyer l'email de confirmation depuis la fiche.
          </p>

          <div className="space-y-1.5">
            <Label>Hôtel *</Label>
            <Select value={form.hotel_id} onValueChange={(v) => setForm((f) => ({ ...f, hotel_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un hôtel" />
              </SelectTrigger>
              <SelectContent>
                {hotels?.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Arrivée *</Label>
              <Input type="date" value={form.checkin} onChange={(e) => setForm((f) => ({ ...f, checkin: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Départ *</Label>
              <Input type="date" value={form.checkout} onChange={(e) => setForm((f) => ({ ...f, checkout: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Personnes *</Label>
            <Input
              type="number"
              min={1}
              value={form.party_size}
              onChange={(e) => setForm((f) => ({ ...f, party_size: parseInt(e.target.value) || 1 }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nom du client *</Label>
            <Input value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email du client *</Label>
              <Input type="email" value={form.customer_email} onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.customer_phone} onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label>Prix total client *</Label>
              <Input type="number" min={0} step="0.01" value={form.sell_price} onChange={(e) => setForm((f) => ({ ...f, sell_price: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Coût net hôtel</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Interne"
                value={form.net_price}
                onChange={(e) => setForm((f) => ({ ...f, net_price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Devise</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes internes</Label>
            <Textarea
              rows={2}
              placeholder="ex: réservé par téléphone le..."
              value={form.internal_notes}
              onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Annuler
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer la réservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateManualHotelBookingDialog;
