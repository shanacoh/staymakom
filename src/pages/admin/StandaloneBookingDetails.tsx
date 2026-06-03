import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle, Mail, AlertTriangle, CreditCard, Calendar, Users, Clock, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function AdminStandaloneBookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; revolut: string }>({ open: false, revolut: "" });
  const [notesValue, setNotesValue] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-standalone-booking-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_bookings")
        .select("*, standalone_experiences(title, slug, address, has_time_slots)")
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

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-3xl font-bold">Réservation Experience Only</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">{booking.id}</p>
        </div>
        <div className="flex gap-2 items-center">
          {getStatusBadge(booking)}
          {getPaymentBadge(booking.payment_status)}
        </div>
      </div>

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
              <p className="font-medium">{booking.standalone_experiences?.title || "—"}</p>
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
            {booking.standalone_experiences?.address && (
              <div>
                <p className="text-xs text-muted-foreground">Lieu</p>
                <p className="text-sm flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  {booking.standalone_experiences.address}
                </p>
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
    </div>
  );
}
