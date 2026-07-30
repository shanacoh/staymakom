/**
 * EditStandaloneBookingDialog
 * Corrige les champs d'une réservation "Experience Only" déjà créée (client,
 * date, créneau, participants, prix, adresse, règlement) via un UPDATE en
 * place — contrairement à CreateManualStandaloneBookingDialog qui, même en
 * mode "duplicateFrom", crée toujours une nouvelle réservation avec sa
 * propre référence.
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  booking_date: "",
  time_slot: "",
  adults_count: 1,
  children_count: 0,
  sell_price: "",
  supplier_cost: "",
  custom_address: "",
  custom_regulations: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any | null;
}

const EditStandaloneBookingDialog = ({ open, onOpenChange, booking }: Props) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open || !booking) return;
    setForm({
      customer_name: booking.customer_name || "",
      customer_email: booking.customer_email || "",
      customer_phone: booking.customer_phone || "",
      booking_date: booking.booking_date || "",
      time_slot: booking.time_slot || "",
      adults_count: booking.adults_count ?? booking.party_size ?? 1,
      children_count: booking.children_count ?? 0,
      sell_price: booking.sell_price != null ? String(booking.sell_price) : "",
      supplier_cost: booking.supplier_cost != null ? String(booking.supplier_cost) : "",
      custom_address: booking.custom_address || "",
      custom_regulations: booking.custom_regulations || "",
    });
  }, [open, booking]);

  const updateBookingMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("Réservation introuvable");
      const adults = form.adults_count || 1;
      const children = form.children_count || 0;
      const { error } = await supabase
        .from("standalone_bookings")
        .update({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone || null,
          booking_date: form.booking_date,
          time_slot: form.time_slot || null,
          adults_count: adults,
          children_count: children,
          party_size: adults + children,
          sell_price: parseFloat(String(form.sell_price)),
          supplier_cost: form.supplier_cost !== "" ? parseFloat(String(form.supplier_cost)) : null,
          custom_address: form.custom_address || null,
          custom_regulations: form.custom_regulations || null,
        } as any)
        .eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-booking-details", booking?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-bookings-hub"] });
      toast.success("Réservation mise à jour");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Erreur", { description: e.message }),
  });

  const canSubmit =
    !!form.customer_name.trim() &&
    !!form.customer_email.trim() &&
    !!form.booking_date &&
    form.sell_price !== "" &&
    !Number.isNaN(parseFloat(String(form.sell_price)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la réservation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {(booking?.standalone_experiences?.title || booking?.custom_experience_title) && (
            <p className="text-sm text-muted-foreground">
              Expérience : <span className="font-medium text-foreground">
                {booking.standalone_experiences?.title || booking.custom_experience_title}
              </span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Nom du client *</Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email du client *</Label>
              <Input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={form.customer_phone}
                onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date de la réservation *</Label>
              <Input
                type="date"
                value={form.booking_date}
                onChange={(e) => setForm((f) => ({ ...f, booking_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Créneau horaire</Label>
              <Input
                placeholder="ex: 14h30 - 17h30"
                value={form.time_slot}
                onChange={(e) => setForm((f) => ({ ...f, time_slot: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Adultes *</Label>
              <Input
                type="number"
                min={1}
                value={form.adults_count}
                onChange={(e) => setForm((f) => ({ ...f, adults_count: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Enfants</Label>
              <Input
                type="number"
                min={0}
                value={form.children_count}
                onChange={(e) => setForm((f) => ({ ...f, children_count: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix total client ({booking?.currency || "—"}) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.sell_price}
                onChange={(e) => setForm((f) => ({ ...f, sell_price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Coût réel prestataire</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Interne, non visible du client"
                value={form.supplier_cost}
                onChange={(e) => setForm((f) => ({ ...f, supplier_cost: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Adresse et directions <span className="text-muted-foreground font-normal">(visible du client, si rempli)</span></Label>
            <Textarea
              rows={2}
              placeholder="ex: Ponton B, Marina de Herzliya — se présenter 15 min avant"
              value={form.custom_address}
              onChange={(e) => setForm((f) => ({ ...f, custom_address: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Règlement / conditions particulières <span className="text-muted-foreground font-normal">(visible du client, si rempli)</span></Label>
            <Textarea
              rows={3}
              placeholder="ex: annulation gratuite jusqu'à 48h avant, pièce d'identité requise..."
              value={form.custom_regulations}
              onChange={(e) => setForm((f) => ({ ...f, custom_regulations: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => updateBookingMutation.mutate()}
            disabled={!canSubmit || updateBookingMutation.isPending}
          >
            {updateBookingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditStandaloneBookingDialog;
