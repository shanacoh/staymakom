/**
 * Fenêtre « Réserver chez le prestataire » d'une réservation payée.
 * Le canal de la fiche décide du destinataire : WhatsApp du prestataire (demande), ou de l'agent
 * de Shana qui réserve sur le site du prestataire. En deux temps : message envoyé, puis résa confirmée.
 * Rien ne part tout seul : Shana relit le message et appuie elle-même sur Envoyer dans WhatsApp.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  fetchBookingAgentWhatsapp,
  fetchBookingForProviderBooking,
  markProviderBooked,
  markProviderBookingRequested,
  saveBookingAgentWhatsapp,
} from "@/lib/reservations/actions";
import {
  buildAgentBookingMessage,
  buildProviderBookingMessage,
  buildWhatsAppLink,
  providerBookingTarget,
  type ProviderBookingInfo,
} from "@/lib/reservations/whatsapp";
import type { ReservationRow } from "@/lib/reservations/types";

interface Props {
  row: ReservationRow;
  onClose: () => void;
  onDone: () => void;
}

const AGENT_QUERY_KEY = ["admin-booking-agent-whatsapp"];

const errorToast = (error: Error) => toast.error("Action impossible", { description: error.message });

function AgentNumberForm() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const save = useMutation({
    mutationFn: () => saveBookingAgentWhatsapp(phone.trim()),
    onSuccess: () => {
      toast.success("Numéro de l'agent enregistré");
      queryClient.invalidateQueries({ queryKey: AGENT_QUERY_KEY });
    },
    onError: errorToast,
  });
  return (
    <div className="space-y-1.5 rounded-md border border-dashed p-3">
      <Label htmlFor="agent-whatsapp" className="text-xs">
        Numéro WhatsApp de ton agent (à saisir une seule fois)
      </Label>
      <div className="flex gap-2">
        <Input id="agent-whatsapp" type="tel" placeholder="+972…" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button variant="outline" disabled={phone.replace(/[^\d]/g, "").length < 8 || save.isPending} onClick={() => save.mutate()}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

export default function ProviderBookingDialog({ row, onClose, onDone }: Props) {
  const [editedMessage, setEditedMessage] = useState<string | null>(null);
  const alreadySent = !!row.sentToProviderAt;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-provider-booking", row.id],
    queryFn: () => fetchBookingForProviderBooking(row.id),
  });
  const channel = data?.internal?.booking_channel ?? data?.provider?.booking_channel ?? null;
  const target = providerBookingTarget(channel);
  const { data: agentPhone, isLoading: agentLoading } = useQuery({
    queryKey: AGENT_QUERY_KEY,
    queryFn: fetchBookingAgentWhatsapp,
    enabled: !!data && target === "agent",
  });

  const markSent = useMutation({
    mutationFn: () => markProviderBookingRequested(row.id),
    onSuccess: () => {
      toast.success("Message envoyé : en attente de confirmation");
      onDone();
      onClose();
    },
    onError: errorToast,
  });
  const markBooked = useMutation({
    mutationFn: () => markProviderBooked(row.id),
    onSuccess: () => {
      toast.success("Résa confirmée chez le prestataire");
      onDone();
      onClose();
    },
    onError: errorToast,
  });

  const booking = data?.booking;
  const bookingUrl = data?.internal?.supplier_booking_url || data?.provider?.booking_url || null;
  const info: ProviderBookingInfo | null = booking
    ? {
        experience: booking.custom_experience_title || booking.standalone_experiences?.title || row.product,
        date: booking.booking_date,
        timeSlot: booking.time_slot,
        adults: booking.adults_count,
        children: booking.children_count,
        partySize: booking.party_size,
        customerName: booking.customer_name || row.client,
        specialRequests: booking.special_requests,
        ref: row.ref,
        bookingUrl,
        instructions: data?.internal?.booking_instructions,
      }
    : null;
  const builtMessage = info ? (target === "agent" ? buildAgentBookingMessage(info) : buildProviderBookingMessage(info)) : "";
  const message = editedMessage ?? builtMessage;
  const recipientPhone = target === "agent" ? agentPhone : data?.provider?.whatsapp;
  const recipientLabel = target === "agent" ? "ton agent" : data?.provider?.name || row.partner || "le prestataire";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copié");
    } catch {
      toast.error("Impossible de copier le message");
    }
  };

  const loading = isLoading || (target === "agent" && agentLoading);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{alreadySent ? "Confirmer la résa prestataire" : "Réserver chez le prestataire"}</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {alreadySent && (
              <p className="text-sm text-muted-foreground">
                Le message a déjà été envoyé. Quand {recipientLabel} confirme, clique sur « C'est réservé ».
              </p>
            )}
            <p className="text-sm">
              {target === "agent"
                ? "Cette fiche se réserve sur le site du prestataire : le message part à ton agent."
                : "Cette fiche se réserve par message : le message part au prestataire."}
            </p>
            {target === "agent" && !bookingUrl && (
              <p className="text-sm text-amber-700">
                Aucun lien de réservation sur la fiche : ajoute-le (bloc prestataire de la fiche expérience).
              </p>
            )}
            {target === "agent" && !agentPhone && <AgentNumberForm />}
            {target === "provider" && !recipientPhone && (
              <p className="text-sm text-amber-700">
                Aucun numéro WhatsApp pour ce prestataire : ajoute-le dans sa fiche (Partenaires), ou copie le message.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="provider-booking-message" className="text-xs text-muted-foreground">
                Message pour {recipientLabel} (modifiable)
              </Label>
              <Textarea
                id="provider-booking-message"
                rows={10}
                value={message}
                onChange={(e) => setEditedMessage(e.target.value)}
              />
            </div>
          </div>
        )}
        <DialogFooter className="flex-wrap gap-2">
          {!alreadySent && (
            <Button variant="ghost" disabled={markBooked.isPending} onClick={() => markBooked.mutate()}>
              Déjà réservé
            </Button>
          )}
          <Button variant="outline" disabled={loading} onClick={copyMessage}>
            <Copy className="h-4 w-4" />
            Copier
          </Button>
          {recipientPhone && !loading && (
            // Vrai lien cliquable : le navigateur ne le bloque pas comme une fenêtre surgissante.
            <Button asChild variant={alreadySent ? "outline" : "default"}>
              <a
                href={buildWhatsAppLink(recipientPhone, message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => !alreadySent && markSent.mutate()}
              >
                <MessageCircle className="h-4 w-4" />
                {alreadySent ? "Relancer sur WhatsApp" : "Ouvrir WhatsApp"}
              </a>
            </Button>
          )}
          {!recipientPhone && !alreadySent && !loading && (
            <Button variant="outline" disabled={markSent.isPending} onClick={() => markSent.mutate()}>
              Marquer comme envoyé
            </Button>
          )}
          {alreadySent && (
            <Button disabled={markBooked.isPending} onClick={() => markBooked.mutate()}>
              C'est réservé
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
