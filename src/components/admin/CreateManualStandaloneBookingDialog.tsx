/**
 * CreateManualStandaloneBookingDialog
 * Formulaire pour qu'un admin saisisse une réservation "Experience Only" pour
 * un client contacté en direct (téléphone, WhatsApp, email). Crée la
 * réservation comme confirmée, sans marquer le paiement ni envoyer l'email —
 * ça se fait ensuite depuis la fiche détail, une fois le paiement reçu.
 */

import { useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = ["ILS", "USD", "EUR"];

const EMPTY_MANUAL_FORM = {
  isCustomExperience: false,
  experience_id: "",
  custom_experience_title: "",
  custom_currency: "ILS",
  booking_date: "",
  time_slot: "",
  selected_rate_option_id: "",
  adults: 1,
  children: 0,
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  sell_price: "",
  supplier_cost: "",
  internal_notes: "",
  custom_regulations: "",
  custom_address: "",
};

// Requêtes à rafraîchir après création, quelle que soit la page d'où le dialog est ouvert.
const BOOKING_LIST_QUERY_KEYS = [
  ["admin-standalone-bookings"],
  ["admin-standalone-bookings-hub"],
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateManualStandaloneBookingDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM);

  const { data: publishedExperiences } = useQuery({
    queryKey: ["admin-standalone-experiences-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id, title, currency, base_price, base_price_child, base_price_type, has_child_price, has_time_slots, time_slots, has_rate_options, min_party, max_party")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data as any[];
    },
    enabled: open,
  });

  const selectedExperience = publishedExperiences?.find((e) => e.id === manualForm.experience_id);

  const { data: rateOptions } = useQuery({
    queryKey: ["admin-standalone-rate-options-for-manual", manualForm.experience_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_rate_options")
        .select("id, label, label_fr, price_adult, price_child")
        .eq("experience_id", manualForm.experience_id)
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
    enabled: open && !!selectedExperience?.has_rate_options && !!manualForm.experience_id,
  });

  const selectedRateOption = rateOptions?.find((o) => o.id === manualForm.selected_rate_option_id);

  const suggestedPrice = useMemo(() => {
    if (!selectedExperience) return null;
    const adults = manualForm.adults || 0;
    const children = manualForm.children || 0;
    if (selectedExperience.has_rate_options) {
      if (!selectedRateOption) return null;
      const childUnit = selectedExperience.has_child_price && selectedRateOption.price_child != null
        ? selectedRateOption.price_child
        : selectedRateOption.price_adult;
      return selectedRateOption.price_adult * adults + childUnit * children;
    }
    if (selectedExperience.base_price_type === "fixed") return selectedExperience.base_price;
    if (selectedExperience.has_child_price && selectedExperience.base_price_child && children > 0) {
      return selectedExperience.base_price * adults + selectedExperience.base_price_child * children;
    }
    return selectedExperience.base_price * (adults + children);
  }, [selectedExperience, selectedRateOption, manualForm.adults, manualForm.children]);

  const resetManualForm = () => setManualForm(EMPTY_MANUAL_FORM);

  const createManualBookingMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnectez-vous");

      const { data, error } = await supabase.functions.invoke("create-standalone-manual-booking", {
        headers: { Authorization: `Bearer ${token}` },
        body: manualForm.isCustomExperience ? {
          custom_experience_title: manualForm.custom_experience_title,
          currency: manualForm.custom_currency,
          booking_date: manualForm.booking_date,
          time_slot: manualForm.time_slot || undefined,
          adults: manualForm.adults,
          children: manualForm.children,
          customer_name: manualForm.customer_name,
          customer_email: manualForm.customer_email,
          customer_phone: manualForm.customer_phone || undefined,
          sell_price: parseFloat(String(manualForm.sell_price)),
          supplier_cost: manualForm.supplier_cost !== "" ? parseFloat(String(manualForm.supplier_cost)) : undefined,
          internal_notes: manualForm.internal_notes || undefined,
          custom_regulations: manualForm.custom_regulations || undefined,
          custom_address: manualForm.custom_address || undefined,
        } : {
          experience_id: manualForm.experience_id,
          booking_date: manualForm.booking_date,
          time_slot: manualForm.time_slot || undefined,
          selected_rate_option_id: manualForm.selected_rate_option_id || undefined,
          adults: manualForm.adults,
          children: manualForm.children,
          customer_name: manualForm.customer_name,
          customer_email: manualForm.customer_email,
          customer_phone: manualForm.customer_phone || undefined,
          sell_price: parseFloat(String(manualForm.sell_price)),
          supplier_cost: manualForm.supplier_cost !== "" ? parseFloat(String(manualForm.supplier_cost)) : undefined,
          currency: selectedExperience?.currency,
          internal_notes: manualForm.internal_notes || undefined,
          custom_regulations: manualForm.custom_regulations || undefined,
          custom_address: manualForm.custom_address || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data: any) => {
      BOOKING_LIST_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      onOpenChange(false);
      resetManualForm();
      toast.success("Réservation créée — marquez le paiement et envoyez l'email depuis la fiche");
      navigate(`/admin/standalone-bookings/${data.booking_id}`);
    },
    onError: (e: Error) => toast.error("Erreur", { description: e.message }),
  });

  const canSubmitManualBooking =
    (manualForm.isCustomExperience ? !!manualForm.custom_experience_title.trim() : !!manualForm.experience_id) &&
    !!manualForm.booking_date &&
    !!manualForm.customer_name.trim() &&
    !!manualForm.customer_email.trim() &&
    manualForm.sell_price !== "" &&
    !Number.isNaN(parseFloat(String(manualForm.sell_price))) &&
    (manualForm.isCustomExperience || !selectedExperience?.has_time_slots || !!manualForm.time_slot) &&
    (manualForm.isCustomExperience || !selectedExperience?.has_rate_options || !!manualForm.selected_rate_option_id);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetManualForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation manuelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Pour un client contacté en direct (téléphone, WhatsApp, email). La réservation sera créée comme confirmée —
            vous pourrez ensuite marquer le paiement et envoyer l'email de confirmation depuis la fiche de la réservation.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Expérience pas encore sur le site</Label>
              <p className="text-xs text-muted-foreground">Pour une prestation qui n'a pas encore de fiche catalogue</p>
            </div>
            <Switch
              checked={manualForm.isCustomExperience}
              onCheckedChange={(checked) => setManualForm((f) => ({
                ...f,
                isCustomExperience: checked,
                experience_id: "",
                custom_experience_title: "",
                time_slot: "",
                selected_rate_option_id: "",
              }))}
            />
          </div>

          {manualForm.isCustomExperience ? (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label>Nom de l'expérience *</Label>
                <Input
                  placeholder="ex: Boat Celebration Day"
                  value={manualForm.custom_experience_title}
                  onChange={(e) => setManualForm((f) => ({ ...f, custom_experience_title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Devise</Label>
                <Select
                  value={manualForm.custom_currency}
                  onValueChange={(v) => setManualForm((f) => ({ ...f, custom_currency: v }))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Expérience *</Label>
              <Select
                value={manualForm.experience_id}
                onValueChange={(v) => setManualForm((f) => ({ ...f, experience_id: v, time_slot: "", selected_rate_option_id: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une expérience" />
                </SelectTrigger>
                <SelectContent>
                  {publishedExperiences?.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>{exp.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Date de la réservation *</Label>
            <Input
              type="date"
              value={manualForm.booking_date}
              onChange={(e) => setManualForm((f) => ({ ...f, booking_date: e.target.value }))}
            />
          </div>

          {manualForm.isCustomExperience && (
            <div className="space-y-1.5">
              <Label>Créneau horaire</Label>
              <Input
                placeholder="ex: 14h30 - 17h30"
                value={manualForm.time_slot}
                onChange={(e) => setManualForm((f) => ({ ...f, time_slot: e.target.value }))}
              />
            </div>
          )}

          {!manualForm.isCustomExperience && selectedExperience?.has_time_slots && (
            <div className="space-y-1.5">
              <Label>Créneau horaire *</Label>
              <Select
                value={manualForm.time_slot}
                onValueChange={(v) => setManualForm((f) => ({ ...f, time_slot: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un créneau" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedExperience.time_slots as string[])?.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!manualForm.isCustomExperience && selectedExperience?.has_rate_options && (
            <div className="space-y-1.5">
              <Label>Option tarifaire *</Label>
              <Select
                value={manualForm.selected_rate_option_id}
                onValueChange={(v) => setManualForm((f) => ({ ...f, selected_rate_option_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une option" />
                </SelectTrigger>
                <SelectContent>
                  {rateOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label_fr || opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Adultes *</Label>
              <Input
                type="number"
                min={1}
                value={manualForm.adults}
                onChange={(e) => setManualForm((f) => ({ ...f, adults: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Enfants</Label>
              <Input
                type="number"
                min={0}
                value={manualForm.children}
                onChange={(e) => setManualForm((f) => ({ ...f, children: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nom du client *</Label>
            <Input
              value={manualForm.customer_name}
              onChange={(e) => setManualForm((f) => ({ ...f, customer_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email du client *</Label>
              <Input
                type="email"
                value={manualForm.customer_email}
                onChange={(e) => setManualForm((f) => ({ ...f, customer_email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={manualForm.customer_phone}
                onChange={(e) => setManualForm((f) => ({ ...f, customer_phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix total client ({manualForm.isCustomExperience ? manualForm.custom_currency : selectedExperience?.currency || "—"}) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={manualForm.sell_price}
                onChange={(e) => setManualForm((f) => ({ ...f, sell_price: e.target.value }))}
              />
              {suggestedPrice != null && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setManualForm((f) => ({ ...f, sell_price: String(suggestedPrice) }))}
                >
                  Utiliser le prix suggéré : {suggestedPrice} {selectedExperience?.currency}
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Coût réel prestataire</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Interne, non visible du client"
                value={manualForm.supplier_cost}
                onChange={(e) => setManualForm((f) => ({ ...f, supplier_cost: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Adresse et directions <span className="text-muted-foreground font-normal">(visible du client, si rempli)</span></Label>
            <Textarea
              rows={2}
              placeholder="ex: Ponton B, Marina de Herzliya — se présenter 15 min avant"
              value={manualForm.custom_address}
              onChange={(e) => setManualForm((f) => ({ ...f, custom_address: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Règlement / conditions particulières <span className="text-muted-foreground font-normal">(visible du client, si rempli)</span></Label>
            <Textarea
              rows={3}
              placeholder="ex: annulation gratuite jusqu'à 48h avant, pièce d'identité requise..."
              value={manualForm.custom_regulations}
              onChange={(e) => setManualForm((f) => ({ ...f, custom_regulations: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes internes</Label>
            <Textarea
              rows={2}
              placeholder="ex: réservé par téléphone le..."
              value={manualForm.internal_notes}
              onChange={(e) => setManualForm((f) => ({ ...f, internal_notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetManualForm(); }}>
            Annuler
          </Button>
          <Button
            onClick={() => createManualBookingMutation.mutate()}
            disabled={!canSubmitManualBooking || createManualBookingMutation.isPending}
          >
            {createManualBookingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer la réservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateManualStandaloneBookingDialog;
