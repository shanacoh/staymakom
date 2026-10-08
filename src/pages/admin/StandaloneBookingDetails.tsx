import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STANDALONE_EXPERIENCE_INTERNAL, fetchInternalFields } from "@/lib/internalFields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle, Mail, AlertTriangle, CreditCard, Calendar, Users, Clock, MapPin, ExternalLink, Send, ScrollText, Copy, Trash2, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import CreateManualStandaloneBookingDialog from "@/components/admin/CreateManualStandaloneBookingDialog";
import EditStandaloneBookingDialog from "@/components/admin/EditStandaloneBookingDialog";
import { trackReviewRequestSent } from "@/lib/analytics";

export default function AdminStandaloneBookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; revolut: string }>({ open: false, revolut: "" });
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; mode: "paid" | "deposit_paid"; amount: string }>({ open: false, mode: "paid", amount: "" });
  const [notesValue, setNotesValue] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customDepositDialog, setCustomDepositDialog] = useState<{ open: boolean; mode: "fixed" | "percentage"; value: string }>({ open: false, mode: "fixed", value: "" });
  const [forceBalanceUnlock, setForceBalanceUnlock] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-standalone-booking-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_bookings")
        .select("*, standalone_experiences(title, slug, address, has_time_slots, deposit_type, deposit_amount)")
        .eq("id", bookingId!)
        .single();
      if (error) throw error;
      const booking = data as any;
      // Le lien de réservation fournisseur est rangé à part, réservé aux admins.
      if (booking.standalone_experiences && booking.standalone_experience_id) {
        const { supplier_booking_url } = await fetchInternalFields(STANDALONE_EXPERIENCE_INTERNAL, booking.standalone_experience_id);
        booking.standalone_experiences = { ...booking.standalone_experiences, supplier_booking_url };
      }
      return booking;
    },
    enabled: !!bookingId,
  });

  const { data: payments } = useQuery({
    queryKey: ["admin-standalone-booking-payments", bookingId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_booking_payments")
        .select("id, kind, amount, currency, status, checkout_url, created_at, paid_at")
        .eq("booking_id", bookingId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as { id: string; kind: string; amount: number; currency: string; status: string; checkout_url: string | null; created_at: string; paid_at: string | null }[];
    },
    enabled: !!bookingId,
  });

  const generatePaymentLinkMutation = useMutation({
    mutationFn: async (params: { kind: "deposit" | "balance"; manual_deposit?: { mode: "fixed" | "percentage"; value: number } }) => {
      const { data, error } = await supabase.functions.invoke("create-booking-payment-link", {
        body: { booking_id: bookingId, kind: params.kind, manual_deposit: params.manual_deposit },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Échec de la création du lien");
      return data as { checkout_url: string; amount: number; currency: string; kind: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-booking-payments", bookingId] });
      toast.success("Lien de paiement créé");
      setCustomDepositDialog({ open: false, mode: "fixed", value: "" });
    },
    onError: (error: any) => toast.error("Impossible de créer le lien", { description: error.context?.body?.error || error.message }),
  });

  const sendPaymentLinkEmailMutation = useMutation({
    mutationFn: async (payment_id: string) => {
      const { data, error } = await supabase.functions.invoke("send-booking-payment-link-email", {
        body: { payment_id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Échec de l'envoi de l'email");
    },
    onSuccess: () => toast.success("Email envoyé au client"),
    onError: (error: any) => toast.error("Impossible d'envoyer l'email", { description: error.context?.body?.error || error.message }),
  });

  const sendPaymentLinkOnWhatsApp = (checkoutUrl: string, kind: string) => {
    if (!booking?.customer_phone) return;
    const digits = booking.customer_phone.replace(/[^\d]/g, "");
    const label = kind === "deposit" ? "l'acompte" : "le solde";
    const text = `Bonjour ${booking.customer_name}, voici le lien pour régler ${label} de votre réservation "${booking.standalone_experiences?.title || ""}" : ${checkoutUrl}`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const { data: existingReviewRequest } = useQuery({
    queryKey: ["admin-standalone-booking-review-request", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, token, status, sent_at")
        .eq("booking_type", "standalone_bookings")
        .eq("booking_id", bookingId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  const requestReviewMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .insert({ booking_type: "standalone_bookings", booking_id: bookingId, channel: "whatsapp", lang: "en", status: "sent_j1" })
        .select("token")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-booking-review-request", bookingId] });
      trackReviewRequestSent("standalone_bookings", "whatsapp", "en");
      const digits = (booking.customer_phone || "").replace(/[^\d]/g, "");
      const link = `https://staymakom.com/avis/${data.token}`;
      const text = `Bonjour ${booking.customer_name}, merci encore pour votre réservation "${booking.standalone_experiences?.title || ""}" ! Pourriez-vous nous laisser un avis ? ${link}`;
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank");
    },
    onError: (error: any) => toast.error("Impossible de créer la demande d'avis", { description: error.message }),
  });

  const copyPaymentLink = async (checkoutUrl: string) => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const totalPaid = (payments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const hasPendingDeposit = (payments ?? []).some((p) => p.kind === "deposit" && p.status === "pending");
  const hasPendingBalance = (payments ?? []).some((p) => p.kind === "balance" && p.status === "pending");
  const isFullyPaidViaPayments = booking ? totalPaid >= Number(booking.sell_price) : false;
  const depositRule = booking?.standalone_experiences as { deposit_type?: string; deposit_amount?: number } | null;
  const hasConfiguredDepositRule = !!depositRule?.deposit_type && depositRule.deposit_type !== "none" && !!depositRule?.deposit_amount;

  const markRefundDoneMutation = useMutation({
    mutationFn: async (revolut_refund_id: string) => {
      const { error } = await supabase
        .from("standalone_bookings")
        .update({
          payment_status: "refunded",
          revolut_refund_id: revolut_refund_id || null,
          refunded_at: new Date().toISOString(),
        } as any)
        .eq("id", bookingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-booking-details", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-bookings"] });
      setRefundDialog({ open: false, revolut: "" });
      toast.success("Remboursement confirmé et enregistré");
    },
    onError: (error: any) => toast.error("Erreur", { description: error.message }),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const update: Record<string, unknown> = { payment_status: paymentDialog.mode };
      if (paymentDialog.mode === "deposit_paid") {
        const amount = parseFloat(paymentDialog.amount);
        if (Number.isNaN(amount) || amount <= 0) throw new Error("Montant d'acompte invalide");
        update.deposit_amount = amount;
      } else {
        update.deposit_amount = null;
      }
      const { error } = await supabase
        .from("standalone_bookings")
        .update(update as any)
        .eq("id", bookingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-booking-details", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-bookings-hub"] });
      setPaymentDialog({ open: false, mode: "paid", amount: "" });
      toast.success("Paiement enregistré");
    },
    onError: (error: any) => toast.error("Erreur", { description: error.message }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-standalone-booking-confirmation", {
        body: { confirmation_token: booking.confirmation_token },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-booking-details", bookingId] });
      toast.success("Email de confirmation envoyé");
    },
    onError: (error: any) => toast.error("Erreur", { description: error.message }),
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("standalone_bookings")
        .delete()
        .eq("id", bookingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-bookings-hub"] });
      toast.success("Réservation supprimée");
      navigate("/admin/standalone-bookings");
    },
    onError: (error: any) => toast.error("Erreur", { description: error.message }),
  });

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("standalone_bookings")
        .update({ internal_notes: notesValue } as any)
        .eq("id", bookingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-booking-details", bookingId] });
      setEditingNotes(false);
      toast.success("Notes enregistrées");
    },
    onError: (error: any) => toast.error("Erreur", { description: error.message }),
  });

  const getStatusBadge = (booking: any) => {
    if (booking.is_cancelled) return <Badge variant="destructive">Annulé</Badge>;
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      confirmed: { variant: "default",    label: "Confirmé" },
      pending:   { variant: "outline",    label: "En attente" },
      cancelled: { variant: "destructive", label: "Annulé" },
    };
    const c = map[booking.status?.toLowerCase()] || { variant: "outline" as const, label: booking.status || "-" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid:           { variant: "default",     label: "Payé" },
      deposit_paid:   { variant: "secondary",   label: "Acompte versé" },
      refund_pending: { variant: "destructive", label: "Remb. dû" },
      refunded:       { variant: "secondary",   label: "Remboursé" },
      pending:        { variant: "outline",     label: "Impayé" },
      failed:         { variant: "destructive", label: "Échoué" },
    };
    const c = map[status] || { variant: "outline" as const, label: status || "-" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate("/admin/standalone-bookings")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux réservations
        </Button>
        <p className="text-muted-foreground">Réservation introuvable.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/admin/standalone-bookings")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux réservations
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Réservation Experience Only</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">{booking.id}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDuplicateOpen(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
          {booking.source === "manual_admin" && <Badge variant="outline">Réservation manuelle</Badge>}
          {getStatusBadge(booking)}
          {getPaymentBadge(booking.payment_status)}
        </div>
      </div>

      {booking.source === "manual_admin" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
          {(booking.payment_status === "pending") ? (
            <Button
              size="sm"
              onClick={() => setPaymentDialog({ open: true, mode: "paid", amount: "" })}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Confirmer le paiement
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPaymentDialog({
                open: true,
                mode: booking.payment_status === "deposit_paid" ? "deposit_paid" : "paid",
                amount: booking.deposit_amount != null ? String(booking.deposit_amount) : "",
              })}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Modifier le paiement
            </Button>
          )}
        </div>
      )}

      {!booking.is_cancelled && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {booking.confirmation_email_sent_at ? "Renvoyer l'email de confirmation" : "Envoyer l'email de confirmation"}
          </Button>

          <p className="text-xs text-muted-foreground">
            {booking.confirmation_email_sent_at
              ? `Email envoyé le ${format(parseISO(booking.confirmation_email_sent_at), "dd MMM yyyy à HH:mm")}`
              : "Email jamais envoyé"}
          </p>
        </div>
      )}

      {/* Alerte remboursement à effectuer */}
      {booking.payment_status === "refund_pending" && (
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                <AlertTriangle className="h-6 w-6" />
                REMBOURSEMENT À EFFECTUER
              </div>
              {booking.refund_amount > 0 ? (
                <p className="text-base font-semibold text-destructive">
                  Montant : {booking.refund_amount} {booking.currency}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Montant à vérifier avec le client.</p>
              )}
              <a href={`mailto:${booking.customer_email}`} className="text-sm text-destructive underline flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {booking.customer_email}
              </a>
            </div>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setRefundDialog({ open: true, revolut: "" })}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer le remboursement
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation remboursement effectué */}
      {booking.payment_status === "refunded" && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle className="h-5 w-5" />
            Remboursement effectué
          </div>
          {booking.refunded_at && (
            <p className="text-sm text-green-700 mt-1">Le {format(parseISO(booking.refunded_at), "dd MMM yyyy à HH:mm")}</p>
          )}
          {booking.revolut_refund_id && (
            <p className="text-sm mt-1">Référence Revolut : <span className="font-mono font-semibold">{booking.revolut_refund_id}</span></p>
          )}
        </div>
      )}

      {/* Client + Détails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Nom</p>
              <p className="font-medium">{booking.customer_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              {booking.customer_email ? (
                <a href={`mailto:${booking.customer_email}`} className="text-sm hover:underline flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />{booking.customer_email}
                </a>
              ) : <p className="text-sm">-</p>}
            </div>
            {booking.customer_phone && (
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="text-sm">{booking.customer_phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Personnes</p>
              <p className="font-medium">{booking.party_size} personne{booking.party_size > 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Réservé le</p>
              <p className="text-sm">{format(parseISO(booking.created_at), "dd MMM yyyy à HH:mm")}</p>
            </div>
            {booking.cancelled_at && (
              <div>
                <p className="text-xs text-muted-foreground">Annulé le</p>
                <p className="text-sm text-destructive">{format(parseISO(booking.cancelled_at), "dd MMM yyyy à HH:mm")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Expérience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Expérience</p>
              <p className="font-medium">{booking.standalone_experiences?.title || booking.custom_experience_title || "-"}</p>
              {!booking.standalone_experiences && booking.custom_experience_title && (
                <p className="text-xs text-muted-foreground italic mt-0.5">Pas encore une fiche du catalogue</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {booking.booking_date ? format(parseISO(booking.booking_date), "dd MMM yyyy") : "-"}
              </p>
            </div>
            {booking.time_slot && (
              <div>
                <p className="text-xs text-muted-foreground">Créneau</p>
                <p className="font-medium flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {booking.time_slot}
                </p>
              </div>
            )}
            {(booking.custom_address || booking.standalone_experiences?.address) && (
              <div>
                <p className="text-xs text-muted-foreground">Lieu</p>
                <p className="text-sm flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  {booking.custom_address || booking.standalone_experiences?.address}
                </p>
              </div>
            )}
            {booking.custom_regulations && (
              <div>
                <p className="text-xs text-muted-foreground">Règlement / conditions</p>
                <p className="text-sm flex items-start gap-1.5 whitespace-pre-line">
                  <ScrollText className="h-4 w-4 mt-0.5 shrink-0" />
                  {booking.custom_regulations}
                </p>
              </div>
            )}
            {booking.standalone_experiences?.supplier_booking_url && (
              <div>
                <p className="text-xs text-muted-foreground">Lien de réservation fournisseur</p>
                <a
                  href={booking.standalone_experiences.supplier_booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  Réserver chez le fournisseur
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Montant encaissé</p>
              <p className="text-xl font-bold">{booking.sell_price} {booking.currency}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Statut paiement</p>
              {getPaymentBadge(booking.payment_status)}
            </div>
            {booking.payment_status === "deposit_paid" && booking.deposit_amount != null && (
              <div>
                <p className="text-xs text-muted-foreground">Acompte versé</p>
                <p className="text-sm font-medium">{booking.deposit_amount} {booking.currency}</p>
              </div>
            )}
            {booking.payment_status === "deposit_paid" && booking.deposit_amount != null && (
              <div>
                <p className="text-xs text-muted-foreground">Solde restant</p>
                <p className="text-sm font-semibold">{(booking.sell_price - booking.deposit_amount).toFixed(2)} {booking.currency}</p>
              </div>
            )}
            {booking.supplier_cost != null && (
              <div>
                <p className="text-xs text-muted-foreground">Coût prestataire <span className="italic">(interne)</span></p>
                <p className="text-sm font-medium">{booking.supplier_cost} {booking.currency}</p>
              </div>
            )}
            {booking.supplier_cost != null && (
              <div>
                <p className="text-xs text-muted-foreground">Marge <span className="italic">(interne)</span></p>
                <p className="text-sm font-semibold text-primary">{(booking.sell_price - booking.supplier_cost).toFixed(2)} {booking.currency}</p>
              </div>
            )}
            {booking.revolut_order_id && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Référence Revolut</p>
                <p className="font-mono text-xs">{booking.revolut_order_id}</p>
              </div>
            )}
            {booking.payment_status === "refund_pending" && booking.refund_amount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Remboursement dû</p>
                <p className="font-bold text-destructive">{booking.refund_amount} {booking.currency}</p>
              </div>
            )}
            {booking.revolut_refund_id && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Référence virement</p>
                <p className="font-mono text-sm font-semibold">{booking.revolut_refund_id}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liens de paiement — acompte / solde, générés en 1 clic (vrai paiement Revolut) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" /> Liens de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking && (
            <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Prix total</p>
                <p className="text-lg font-bold">{Number(booking.sell_price).toLocaleString()} {booking.currency}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Payé</p>
                <p className={`text-lg font-bold ${totalPaid > 0 ? "text-green-600" : ""}`}>{totalPaid.toLocaleString()} {booking.currency}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reste à payer</p>
                {isFullyPaidViaPayments ? (
                  <p className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Soldé
                  </p>
                ) : (
                  <p className="text-lg font-bold text-amber-600">
                    {(Number(booking.sell_price) - totalPaid).toLocaleString()} {booking.currency}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {hasConfiguredDepositRule ? (
              <Button
                size="sm"
                variant="outline"
                disabled={hasPendingDeposit || generatePaymentLinkMutation.isPending}
                onClick={() => generatePaymentLinkMutation.mutate({ kind: "deposit" })}
              >
                {generatePaymentLinkMutation.isPending && generatePaymentLinkMutation.variables?.kind === "deposit" && !generatePaymentLinkMutation.variables?.manual_deposit && (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                )}
                Générer lien d'acompte
              </Button>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">Acompte (pas de règle configurée) :</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hasPendingDeposit || generatePaymentLinkMutation.isPending}
                  onClick={() => generatePaymentLinkMutation.mutate({ kind: "deposit", manual_deposit: { mode: "fixed", value: 500 } })}
                >
                  {generatePaymentLinkMutation.isPending && generatePaymentLinkMutation.variables?.manual_deposit?.mode === "fixed" && generatePaymentLinkMutation.variables?.manual_deposit?.value === 500 && (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  )}
                  500₪
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hasPendingDeposit || generatePaymentLinkMutation.isPending}
                  onClick={() => generatePaymentLinkMutation.mutate({ kind: "deposit", manual_deposit: { mode: "percentage", value: 30 } })}
                >
                  {generatePaymentLinkMutation.isPending && generatePaymentLinkMutation.variables?.manual_deposit?.mode === "percentage" && generatePaymentLinkMutation.variables?.manual_deposit?.value === 30 && (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  )}
                  30%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hasPendingDeposit || generatePaymentLinkMutation.isPending}
                  onClick={() => setCustomDepositDialog({ open: true, mode: "fixed", value: "" })}
                >
                  Montant / % libre
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant={!isFullyPaidViaPayments && !hasPendingBalance && totalPaid > 0 ? "default" : "outline"}
              disabled={isFullyPaidViaPayments || hasPendingBalance || generatePaymentLinkMutation.isPending || (hasPendingDeposit && !forceBalanceUnlock)}
              onClick={() => generatePaymentLinkMutation.mutate({ kind: "balance" })}
            >
              {generatePaymentLinkMutation.isPending && generatePaymentLinkMutation.variables?.kind === "balance" && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Générer lien de solde
            </Button>
            {hasPendingDeposit && !forceBalanceUnlock && (
              <Button size="sm" variant="link" className="h-7 text-xs text-muted-foreground" onClick={() => setForceBalanceUnlock(true)}>
                Débloquer quand même
              </Button>
            )}
          </div>

          {hasPendingDeposit && forceBalanceUnlock && (
            <p className="text-xs font-medium text-destructive">⚠️ L'acompte n'est pas encore payé : tu vas générer un lien de solde pour le prix total.</p>
          )}

          <Dialog open={customDepositDialog.open} onOpenChange={(open) => setCustomDepositDialog((d) => ({ ...d, open }))}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Acompte : montant ou pourcentage libre</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={customDepositDialog.mode} onValueChange={(v: "fixed" | "percentage") => setCustomDepositDialog((d) => ({ ...d, mode: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Montant fixe ({booking?.currency})</SelectItem>
                    <SelectItem value="percentage">Pourcentage du prix total</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <Label>{customDepositDialog.mode === "fixed" ? `Montant (${booking?.currency})` : "Pourcentage (%)"}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={customDepositDialog.value}
                    onChange={(e) => setCustomDepositDialog((d) => ({ ...d, value: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomDepositDialog({ open: false, mode: "fixed", value: "" })}>Annuler</Button>
                <Button
                  disabled={!customDepositDialog.value || Number(customDepositDialog.value) <= 0 || generatePaymentLinkMutation.isPending}
                  onClick={() => generatePaymentLinkMutation.mutate({
                    kind: "deposit",
                    manual_deposit: { mode: customDepositDialog.mode, value: Number(customDepositDialog.value) },
                  })}
                >
                  {generatePaymentLinkMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Générer le lien
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {payments && payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm ${
                    p.status === "paid" ? "border-green-200 bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {p.status === "paid" && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                    <div>
                      <span className="font-medium capitalize">{p.kind === "deposit" ? "Acompte" : "Solde"}</span>{" "}
                      <span className={p.status === "paid" ? "text-green-700 font-medium" : "text-muted-foreground"}>
                        {p.amount} {p.currency}
                      </span>
                      {p.status === "paid" && p.paid_at && (
                        <p className="text-xs text-green-700/80">Payé le {format(parseISO(p.paid_at), "dd MMM yyyy à HH:mm")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status !== "paid" && (
                      <Badge variant={p.status === "pending" ? "secondary" : "destructive"}>
                        {p.status === "pending" ? "En attente" : p.status}
                      </Badge>
                    )}
                    {p.status === "pending" && p.checkout_url && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyPaymentLink(p.checkout_url!)}>
                          <Copy className="h-3 w-3 mr-1" /> Copier le lien
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={sendPaymentLinkEmailMutation.isPending && sendPaymentLinkEmailMutation.variables === p.id}
                          onClick={() => sendPaymentLinkEmailMutation.mutate(p.id)}
                        >
                          {sendPaymentLinkEmailMutation.isPending && sendPaymentLinkEmailMutation.variables === p.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Mail className="h-3 w-3 mr-1" />
                          )}
                          Envoyer par email
                        </Button>
                        {booking.customer_phone && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => sendPaymentLinkOnWhatsApp(p.checkout_url!, p.kind)}>
                            <Send className="h-3 w-3 mr-1 text-green-700" /> Envoyer sur WhatsApp
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Aucun lien généré pour l'instant.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" /> Avis client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {existingReviewRequest ? (
            <p className="text-sm text-muted-foreground">
              Demande déjà envoyée le {format(parseISO(existingReviewRequest.sent_at), "dd/MM/yyyy")}
              {existingReviewRequest.status === "submitted" ? " : avis déposé." : "."}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Envoie le même lien que l'email automatique J+1, directement sur WhatsApp.
            </p>
          )}
          {booking.customer_phone && (
            <Button
              size="sm"
              variant="outline"
              disabled={requestReviewMutation.isPending}
              onClick={() => requestReviewMutation.mutate()}
            >
              {requestReviewMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1.5 text-green-700" />
              )}
              Demander un avis sur WhatsApp
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Notes internes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes internes</CardTitle>
        </CardHeader>
        <CardContent>
          {editingNotes ? (
            <div className="space-y-3">
              <Textarea
                rows={4}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Ajouter une note interne..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveNotesMutation.mutate()} disabled={saveNotesMutation.isPending}>
                  {saveNotesMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>Annuler</Button>
              </div>
            </div>
          ) : (
            <div
              className="min-h-[60px] text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => {
                setNotesValue(booking.internal_notes || "");
                setEditingNotes(true);
              }}
            >
              {booking.internal_notes || <span className="italic">Aucune note : cliquer pour ajouter</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog confirmation paiement */}
      <Dialog
        open={paymentDialog.open}
        onOpenChange={(open) => !open && setPaymentDialog({ open: false, mode: "paid", amount: "" })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Confirmer le paiement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={paymentDialog.mode}
                onValueChange={(v) => setPaymentDialog((prev) => ({ ...prev, mode: v as "paid" | "deposit_paid" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Payée intégralement</SelectItem>
                  <SelectItem value="deposit_paid">Acompte versé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentDialog.mode === "deposit_paid" && (
              <div className="space-y-1.5">
                <Label>Montant de l'acompte ({booking.currency})</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentDialog.amount}
                  onChange={(e) => setPaymentDialog((prev) => ({ ...prev, amount: e.target.value }))}
                  autoFocus
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false, mode: "paid", amount: "" })}>
              Annuler
            </Button>
            <Button
              onClick={() => confirmPaymentMutation.mutate()}
              disabled={
                confirmPaymentMutation.isPending ||
                (paymentDialog.mode === "deposit_paid" && (paymentDialog.amount === "" || Number.isNaN(parseFloat(paymentDialog.amount))))
              }
            >
              {confirmPaymentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog remboursement */}
      <Dialog
        open={refundDialog.open}
        onOpenChange={(open) => !open && setRefundDialog({ open: false, revolut: "" })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <CheckCircle className="h-5 w-5" />
              Confirmer le remboursement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Entrez la référence du virement Revolut pour garder une trace.
            </p>
            {booking.refund_amount > 0 && (
              <p className="text-sm font-semibold text-destructive">
                Montant : {booking.refund_amount} {booking.currency}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="revolut-ref">Référence Revolut <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input
                id="revolut-ref"
                placeholder="ex. REV-2026-XXXXXX"
                value={refundDialog.revolut}
                onChange={(e) => setRefundDialog((prev) => ({ ...prev, revolut: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && markRefundDoneMutation.mutate(refundDialog.revolut)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog({ open: false, revolut: "" })}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => markRefundDoneMutation.mutate(refundDialog.revolut)}
              disabled={markRefundDoneMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmer le remboursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateManualStandaloneBookingDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        duplicateFrom={booking}
      />

      <EditStandaloneBookingDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={booking}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et ne peut pas être annulée. La réservation de{" "}
              <strong>{booking.customer_name || "ce client"}</strong> sera supprimée pour toujours,
              y compris son historique de paiement. Si le client a déjà payé, pensez à gérer le
              remboursement séparément avant de supprimer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBookingMutation.mutate()}
              disabled={deleteBookingMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBookingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
