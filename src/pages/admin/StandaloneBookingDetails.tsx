import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle, Mail, AlertTriangle, CreditCard, Calendar, Users, Clock, MapPin, ExternalLink, Send, ScrollText, Copy, Trash2 } from "lucide-react";
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

export default function AdminStandaloneBookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; revolut: string }>({ open: false, revolut: "" });
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; mode: "paid" | "deposit_paid"; amount: string }>({ open: false, mode: "paid", amount: "" });
  const [notesValue, setNotesValue] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-standalone-booking-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_bookings")
        .select("*, standalone_experiences(title, slug, address, has_time_slots, supplier_booking_url)")
        .eq("id", bookingId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!bookingId,
  });

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
    const c = map[booking.status?.toLowerCase()] || { variant: "outline" as const, label: booking.status || "—" };
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
    const c = map[status] || { variant: "outline" as const, label: status || "—" };
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
          <h1 className="font-sans text-3xl font-bold">Réservation Experience Only</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">{booking.id}</p>
        </div>
        <div className="flex gap-2 items-center">
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
              <p className="font-medium">{booking.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              {booking.customer_email ? (
                <a href={`mailto:${booking.customer_email}`} className="text-sm hover:underline flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />{booking.customer_email}
                </a>
              ) : <p className="text-sm">—</p>}
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
              <p className="font-medium">{booking.standalone_experiences?.title || booking.custom_experience_title || "—"}</p>
              {!booking.standalone_experiences && booking.custom_experience_title && (
                <p className="text-xs text-muted-foreground italic mt-0.5">Pas encore une fiche du catalogue</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {booking.booking_date ? format(parseISO(booking.booking_date), "dd MMM yyyy") : "—"}
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
              {booking.internal_notes || <span className="italic">Aucune note — cliquer pour ajouter</span>}
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
