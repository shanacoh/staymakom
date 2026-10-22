/**
 * CreateManualHotelBookingDialog
 * Formulaire pour qu'un admin saisisse une réservation hôtel pour un client
 * contacté en direct (téléphone, WhatsApp, email) — symétrique de
 * CreateManualStandaloneBookingDialog. Crée la réservation comme confirmée,
 * source "manual_admin", sans envoyer d'email. L'hôtel vient du catalogue ou
 * s'écrit en clair ; l'email du client et le coût de l'hôtel sont facultatifs ;
 * le paiement client (non payé, acompte, payé) et celui de l'hôtel se saisissent
 * dès la création. La ligne apparaît aussitôt dans la page Réservations.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CURRENCY_OPTIONS, CHANNEL_OPTIONS } from "@/components/admin/BookingsGrid/columnTypes";
import { RESERVATIONS_QUERY_KEY } from "@/lib/reservations/queries";

// Valeur du menu des hôtels qui ouvre la saisie d'un nom en clair.
const OTHER_HOTEL = "__other__";

type ClientPaymentChoice = "unpaid" | "deposit_paid" | "paid";

const CLIENT_PAYMENT_CHOICES: { value: ClientPaymentChoice; label: string }[] = [
  { value: "unpaid", label: "Non payé" },
  { value: "deposit_paid", label: "Acompte reçu" },
  { value: "paid", label: "Payé en totalité" },
];

const EMPTY_FORM = {
  hotel_id: "",
  hotel_name: "",
  checkin: "",
  checkout: "",
  party_size: 1,
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  sell_price: "",
  net_price: "",
  currency: "ILS",
  client_payment: "unpaid" as ClientPaymentChoice,
  deposit_amount: "",
  supplier_paid: false,
  internal_notes: "",
  channel: "whatsapp",
  channel_detail: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toAmount = (value: string) => (value.trim() === "" ? null : parseFloat(value.replace(",", ".")));

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

  const isOtherHotel = form.hotel_id === OTHER_HOTEL;
  const sellPrice = toAmount(form.sell_price);
  const netPrice = toAmount(form.net_price);
  const depositAmount = toAmount(form.deposit_amount);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnectez-vous");

      const { data, error } = await supabase.functions.invoke("create-hotel-manual-booking", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          hotel_id: isOtherHotel ? undefined : form.hotel_id,
          hotel_name: isOtherHotel ? form.hotel_name.trim() : undefined,
          checkin: form.checkin,
          checkout: form.checkout,
          party_size: form.party_size,
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim() || undefined,
          customer_phone: form.customer_phone || undefined,
          sell_price: sellPrice,
          net_price: netPrice ?? undefined,
          currency: form.currency,
          client_payment: form.client_payment,
          deposit_amount: form.client_payment === "deposit_paid" ? depositAmount : undefined,
          supplier_paid: form.supplier_paid && netPrice !== null,
          internal_notes: form.internal_notes || undefined,
          channel: form.channel,
          channel_detail: form.channel_detail || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { booking_id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
      onOpenChange(false);
      resetForm();
      toast.success("Réservation d'hôtel créée", {
        description: "Elle est dans la liste. L'email de confirmation s'envoie depuis sa fiche.",
        action: { label: "Ouvrir la fiche", onClick: () => navigate(`/admin/reservations/${data.booking_id}`) },
      });
    },
    onError: (e: Error) => toast.error("Erreur", { description: e.message }),
  });

  const validAmount = (value: number | null) => value !== null && !Number.isNaN(value) && value >= 0;
  const depositValid =
    form.client_payment !== "deposit_paid" ||
    (depositAmount !== null && !Number.isNaN(depositAmount) && depositAmount > 0 && sellPrice !== null && depositAmount < sellPrice);

  const canSubmit =
    (isOtherHotel ? !!form.hotel_name.trim() : !!form.hotel_id) &&
    !!form.checkin &&
    !!form.checkout &&
    form.checkout > form.checkin &&
    !!form.customer_name.trim() &&
    validAmount(sellPrice) &&
    (netPrice === null || validAmount(netPrice)) &&
    depositValid &&
    !!form.channel;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation hôtel manuelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Pour un client contacté en direct (téléphone, WhatsApp, email). La réservation est créée comme confirmée,
            sans email au client : il s'envoie ensuite depuis la fiche.
          </p>

          <div className="space-y-1.5">
            <Label>Hôtel *</Label>
            <Select value={form.hotel_id} onValueChange={(v) => setForm((f) => ({ ...f, hotel_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un hôtel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OTHER_HOTEL}>Autre hôtel (hors catalogue)</SelectItem>
                {hotels?.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isOtherHotel && (
              <Input
                autoFocus
                placeholder="Nom de l'hôtel"
                aria-label="Nom de l'hôtel"
                value={form.hotel_name}
                onChange={(e) => setForm((f) => ({ ...f, hotel_name: e.target.value }))}
              />
            )}
          </div>

          <div className="grid grid-cols-[1fr_1fr_90px] gap-3">
            <div className="space-y-1.5">
              <Label>Arrivée *</Label>
              <Input type="date" value={form.checkin} onChange={(e) => setForm((f) => ({ ...f, checkin: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Départ *</Label>
              <Input type="date" value={form.checkout} onChange={(e) => setForm((f) => ({ ...f, checkout: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Pers. *</Label>
              <Input
                type="number"
                min={1}
                value={form.party_size}
                onChange={(e) => setForm((f) => ({ ...f, party_size: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nom du client *</Label>
            <Input value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.customer_phone} onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
              <Input type="email" value={form.customer_email} onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label>Prix total client *</Label>
              <Input type="number" min={0} step="0.01" value={form.sell_price} onChange={(e) => setForm((f) => ({ ...f, sell_price: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Coût hôtel</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Vide = à saisir"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Paiement client</Label>
              <Select
                value={form.client_payment}
                onValueChange={(v) => setForm((f) => ({ ...f, client_payment: v as ClientPaymentChoice }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_PAYMENT_CHOICES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.client_payment === "deposit_paid" && (
              <div className="space-y-1.5">
                <Label>Montant de l'acompte *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.deposit_amount}
                  onChange={(e) => setForm((f) => ({ ...f, deposit_amount: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="hotel-supplier-paid"
              checked={form.supplier_paid && netPrice !== null}
              disabled={netPrice === null}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, supplier_paid: checked === true }))}
            />
            <Label htmlFor="hotel-supplier-paid" className="font-normal">
              Hôtel déjà payé
              {netPrice === null && <span className="text-muted-foreground"> (saisir d'abord le coût)</span>}
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Canal *</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un canal" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Précision <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
              <Input
                placeholder='ex: "Israel Women"'
                value={form.channel_detail}
                onChange={(e) => setForm((f) => ({ ...f, channel_detail: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes internes</Label>
            <Textarea
              rows={2}
              placeholder="ex: réservé par WhatsApp le..."
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
