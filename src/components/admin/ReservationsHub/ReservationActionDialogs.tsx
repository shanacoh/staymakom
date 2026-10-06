/**
 * Fenêtres ouvertes par les boutons « Prochaine action » de la page Réservations :
 * envoi au prestataire, réponse du prestataire, conversion d'une demande en réservation,
 * lien de solde, encaissement, coût fournisseur et paiement du fournisseur.
 * Une seule fenêtre à la fois, choisie d'après l'action de la ligne.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateManualStandaloneBookingDialog from "@/components/admin/CreateManualStandaloneBookingDialog";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import {
  fetchBookingContact,
  fetchRequestForAction,
  getOrCreateBalanceLink,
  linkRequestToBooking,
  markClientPaid,
  markRequestSentToProvider,
  markSupplierPaid,
  recordProviderAnswer,
  saveSupplierCost,
  type BalanceLink,
} from "@/lib/reservations/actions";
import { buildProviderMessage, buildWhatsAppLink } from "@/lib/reservations/whatsapp";
import type { NextAction, ReservationRow } from "@/lib/reservations/types";

export interface PendingAction {
  row: ReservationRow;
  action: NextAction;
}

interface Props {
  pending: PendingAction | null;
  onClose: () => void;
  // Appelé après chaque modification enregistrée, pour rafraîchir la liste.
  onDone: () => void;
}

interface DialogProps {
  row: ReservationRow;
  onClose: () => void;
  onDone: () => void;
}

const errorToast = (error: Error) => toast.error("Action impossible", { description: error.message });

const Loading = () => (
  <div className="flex justify-center py-6">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

function SendToProviderDialog({ row, onClose, onDone }: DialogProps) {
  const { data: request, isLoading } = useQuery({
    queryKey: ["admin-reservation-request", row.id],
    queryFn: () => fetchRequestForAction(row.id),
  });
  const provider = request?.standalone_experiences?.providers;
  const message = request ? buildProviderMessage(request) : "";

  const markSent = useMutation({
    mutationFn: () => markRequestSentToProvider(row.id),
    onSuccess: () => {
      toast.success("Demande marquée comme envoyée au prestataire");
      onDone();
      onClose();
    },
    onError: errorToast,
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer au prestataire</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Loading />
        ) : provider?.whatsapp ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Message pour {provider.name}</Label>
              <p className="rounded-md border bg-muted/40 p-3 text-sm">{message}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              {/* Vrai lien cliquable : le navigateur ne le bloque pas comme une fenêtre surgissante. */}
              <Button asChild>
                <a
                  href={buildWhatsAppLink(provider.whatsapp, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markSent.mutate()}
                >
                  <MessageCircle className="h-4 w-4" />
                  Ouvrir WhatsApp
                </a>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Aucun numéro WhatsApp n'est enregistré pour le prestataire de cette expérience. Ajoute-le dans sa fiche
              (Partenaires), ou contacte-le autrement puis marque la demande comme envoyée.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button variant="outline" disabled={markSent.isPending} onClick={() => markSent.mutate()}>
                Marquer comme envoyée
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProviderAnswerDialog({ row, onClose, onDone }: DialogProps) {
  const answer = useMutation({
    mutationFn: (available: boolean) => recordProviderAnswer(row.id, available),
    onSuccess: (_data, available) => {
      toast.success(available ? "Dispo confirmée" : "Demande fermée : pas de disponibilité");
      onDone();
      onClose();
    },
    onError: errorToast,
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réponse du prestataire</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product}. Le prestataire a-t-il de la disponibilité ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={answer.isPending} onClick={() => answer.mutate(false)}>
            Pas disponible
          </Button>
          <Button disabled={answer.isPending} onClick={() => answer.mutate(true)}>
            Dispo confirmée
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dispo OK : le prix doit être fixé avant tout lien de paiement. On ouvre donc la création de
// réservation, préremplie avec la demande. La réservation créée s'ouvre ensuite sur sa fiche,
// où se génère le lien d'acompte ou de paiement.
function ConvertRequestDialog({ row, onClose, onDone }: DialogProps) {
  const { data: request } = useQuery({
    queryKey: ["admin-reservation-request", row.id],
    queryFn: () => fetchRequestForAction(row.id),
  });
  if (!request) return null;
  return (
    <CreateManualStandaloneBookingDialog
      open
      onOpenChange={(open) => !open && onClose()}
      duplicateFrom={{
        standalone_experience_id: request.experience_id,
        booking_date: request.requested_date || "",
        adults_count: request.adults,
        children_count: request.children,
        customer_name: request.customer_name,
        customer_email: request.customer_email,
        customer_phone: request.customer_phone,
        internal_notes:
          [
            request.party_max ? `Fourchette demandée : ${request.adults}-${request.party_max} personnes` : null,
            request.message ? `Demande initiale : ${request.message}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
      }}
      onBookingCreated={async (bookingId) => {
        try {
          await linkRequestToBooking(row.id, bookingId);
        } catch (error) {
          toast.error("Réservation créée, mais la demande n'a pas pu être marquée convertie", {
            description: (error as Error).message,
          });
        }
        onDone();
      }}
    />
  );
}

function BalanceLinkDialog({ row, onClose, onDone }: DialogProps) {
  const balance = (row.amount ?? 0) - row.collected;
  const [link, setLink] = useState<BalanceLink | null>(null);
  const { data: contact } = useQuery({
    queryKey: ["admin-reservation-contact", row.id],
    queryFn: () => fetchBookingContact(row.id),
  });

  const createLink = useMutation({
    mutationFn: () => getOrCreateBalanceLink(row.id, balance),
    onSuccess: (created) => {
      setLink(created);
      onDone();
    },
    onError: errorToast,
  });

  const message = link
    ? `Bonjour ${contact?.customer_name ?? row.client}, voici le lien pour régler le solde de votre réservation "${contact?.title ?? row.product}" : ${link.checkoutUrl}`
    : "";

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.checkoutUrl);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible : sélectionne le lien et copie-le à la main");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lien de solde</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product}. Reste à payer : {formatCurrency(balance, row.currency)}.
          </DialogDescription>
        </DialogHeader>
        {link ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Lien de paiement · {formatCurrency(link.amount, link.currency)}
              </Label>
              <p className="break-all rounded-md border bg-muted/40 p-3 text-sm">{link.checkoutUrl}</p>
              {contact && !contact.customer_phone && (
                <p className="text-xs text-muted-foreground">
                  Pas de numéro de téléphone pour ce client : copie le lien et envoie-le par un autre moyen.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4" />
                Copier le lien
              </Button>
              {contact?.customer_phone && (
                <Button asChild>
                  <a href={buildWhatsAppLink(contact.customer_phone, message)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Envoyer sur WhatsApp
                  </a>
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button disabled={createLink.isPending} onClick={() => createLink.mutate()}>
              {createLink.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer le lien de solde
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  row,
  onClose,
  onDone,
  title,
  question,
  confirmLabel,
  successMessage,
  run,
}: DialogProps & {
  title: string;
  question: string;
  confirmLabel: string;
  successMessage: string;
  run: () => Promise<void>;
}) {
  const mutation = useMutation({
    mutationFn: run,
    onSuccess: () => {
      toast.success(successMessage);
      onDone();
      onClose();
    },
    onError: errorToast,
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {row.client} · {row.product}. {question}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupplierCostDialog({ row, onClose, onDone }: DialogProps) {
  const [value, setValue] = useState("");
  const cost = parseFloat(value.replace(",", "."));
  const valid = value.trim() !== "" && !Number.isNaN(cost) && cost >= 0;
  const margin = valid && row.amount !== null ? row.amount - cost : null;

  const save = useMutation({
    mutationFn: () => saveSupplierCost(row.id, cost),
    onSuccess: () => {
      toast.success("Coût fournisseur enregistré");
      onDone();
      onClose();
    },
    onError: errorToast,
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Coût fournisseur</DialogTitle>
            <DialogDescription>
              {row.client} · {row.product}. Montant client : {formatCurrency(row.amount, row.currency)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="supplier-cost">Ce que tu dois au fournisseur ({row.currency})</Label>
            <Input
              id="supplier-cost"
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
            {margin !== null && (
              <p className="text-xs text-muted-foreground">Marge : {formatCurrency(margin, row.currency)}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!valid || save.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ReservationActionDialogs = ({ pending, onClose, onDone }: Props) => {
  if (!pending) return null;
  const { row, action } = pending;
  // La clé remonte la fenêtre à chaque nouvelle ligne, pour repartir d'un état vierge.
  const common = { row, onClose, onDone };
  const instance = row.key;

  switch (action.kind) {
    case "send_to_provider":
      return <SendToProviderDialog key={instance} {...common} />;
    case "confirm_availability":
      return <ProviderAnswerDialog key={instance} {...common} />;
    case "send_deposit_link":
    case "send_payment_link":
      return <ConvertRequestDialog key={instance} {...common} />;
    case "send_balance_link":
      return <BalanceLinkDialog key={instance} {...common} />;
    case "confirm_collection":
      return (
        <ConfirmDialog
          key={instance}
          {...common}
          title="Confirmer l'encaissement"
          question={`As-tu bien reçu ${formatCurrency(row.amount, row.currency)} du client ? La réservation passera en « Payé ».`}
          confirmLabel="Oui, c'est encaissé"
          successMessage="Encaissement confirmé"
          run={() => markClientPaid(row.id)}
        />
      );
    case "enter_supplier_cost":
      return <SupplierCostDialog key={instance} {...common} />;
    case "pay_supplier":
      return (
        <ConfirmDialog
          key={instance}
          {...common}
          title="Paiement du fournisseur"
          question={`As-tu bien payé ${formatCurrency(row.supplierCost, row.currency)} au fournisseur ? Cette action ne déclenche aucun virement, elle note seulement que c'est fait.`}
          confirmLabel="Oui, c'est payé"
          successMessage="Fournisseur noté comme payé"
          run={() => markSupplierPaid(row.id)}
        />
      );
  }
};

export default ReservationActionDialogs;
