import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle, Mail, AlertTriangle, CreditCard, Calendar, Users, Building, ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function AdminReservationDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; revolut: string }>({ open: false, revolut: "" });
  const [forceRefundDialog, setForceRefundDialog] = useState<{ open: boolean; amount: string }>({ open: false, amount: "" });

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-booking-details-hg", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_hg")
        .select("*, experiences2(title, slug), hotels2(name, city)")
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!bookingId,
  });

  const resendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!booking?.id) throw new Error("Réservation introuvable");
      const { error } = await supabase.functions.invoke("admin-resend-email", {
        body: { booking_id: booking.id },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Email de confirmation renvoyé"),
    onError: (error: any) => toast.error("Erreur", { description: error.message }),
  });

  const markRefundDoneMutation = useMutation({
    mutationFn: async (revolut_refund_id: string) => {
      const { error } = await supabase
        .from("bookings_hg")
        .update({
          payment_status: "refunded",
          revolut_refund_id: revolut_refund_id || null,
          refunded_at: new Date().toISOString(),
        } as any)
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-booking-details-hg", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-hg"] });
      setRefundDialog({ open: false, revolut: "" });
      toast.success("Remboursement confirmé et enregistré");
    },
    onError: (error: any) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  const forceRefundMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase
        .from("bookings_hg")
        .update({
          payment_status: "refund_pending",
          refund_amount: amount,
        } as any)
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-booking-details-hg", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-hg"] });
      setForceRefundDialog({ open: false, amount: "" });
      toast.success("Remboursement déclenché — il apparaît maintenant dans la liste");
    },
    onError: (error: any) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  const getStatusBadge = (booking: any) => {
    if (booking.is_cancelled) return <Badge variant="destructive">Cancelled</Badge>;
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      confirmed:     { variant: "default",    label: "Confirmed" },
      pending:       { variant: "outline",    label: "Pending" },
      pendingreview: { variant: "secondary",  label: "Under Review" },
      failed:        { variant: "destructive", label: "Failed" },
    };
    const c = map[booking.status?.toLowerCase()] || { variant: "outline" as const, label: booking.status || "—" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid:           { variant: "default",    label: "Paid" },
      refund_pending: { variant: "destructive", label: "Refund Due" },
      refunded:       { variant: "secondary",  label: "Refunded" },
      unpaid:         { variant: "outline",    label: "Unpaid" },
      no_refund_due:  { variant: "outline",    label: "No Refund" },
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
        <Button variant="ghost" onClick={() => navigate("/admin/bookings")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux réservations
        </Button>
        <p className="text-muted-foreground">Réservation introuvable.</p>
      </div>
    );
  }

  const nights = booking.nights || 1;

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/admin/bookings")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux réservations
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-3xl font-bold">Réservation</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            {booking.hg_booking_id || booking.id}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {getStatusBadge(booking)}
          {getPaymentBadge(booking.payment_status)}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {booking.confirmation_token && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/booking/confirmation/${booking.confirmation_token}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir la page de confirmation
          </Button>
        )}
        {booking.customer_email && !booking.is_cancelled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => resendEmailMutation.mutate()}
            disabled={resendEmailMutation.isPending}
          >
            {resendEmailMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Renvoyer l'email de confirmation
          </Button>
        )}
      </div>

      {/* Refund alert — à rembourser */}
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

      {/* Correction manuelle — annulé mais marqué No Refund à tort */}
      {booking.is_cancelled && booking.payment_status === "no_refund_due" && (
        <div className="rounded-lg border border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-orange-700 font-semibold">
                <AlertTriangle className="h-5 w-5" />
                Remboursement marqué "aucun" — à corriger ?
              </div>
              <p className="text-sm text-orange-700">
                Le système a indiqué qu'aucun remboursement n'était dû, mais si le client avait droit à un remboursement, tu peux le corriger ici.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-orange-400 text-orange-700 hover:bg-orange-100 whitespace-nowrap"
              onClick={() => setForceRefundDialog({ open: true, amount: String(booking.paid_amount ?? booking.sell_price ?? "") })}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Déclencher un remboursement
            </Button>
          </div>
        </div>
      )}

      {/* Client + Séjour */}
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
                  <Mail className="h-3.5 w-3.5" />
                  {booking.customer_email}
                </a>
              ) : <p className="text-sm">—</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Personnes</p>
              <p className="font-medium">{booking.party_size} guest{booking.party_size > 1 ? "s" : ""}</p>
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
              <Calendar className="h-4 w-4" /> Séjour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Hôtel</p>
              <p className="font-medium">{booking.hotels2?.name || "—"}</p>
              {booking.hotels2?.city && <p className="text-xs text-muted-foreground">{booking.hotels2.city}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expérience</p>
              <p className="font-medium">{booking.experiences2?.title || "—"}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Check-in</p>
                <p className="font-medium">{format(parseISO(booking.checkin), "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Check-out</p>
                <p className="font-medium">{format(parseISO(booking.checkout), "dd MMM yyyy")}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durée</p>
              <p className="font-medium">{nights} nuit{nights > 1 ? "s" : ""}</p>
            </div>
            {booking.room_name && (
              <div>
                <p className="text-xs text-muted-foreground">Chambre</p>
                <p className="text-sm">{booking.room_name}</p>
              </div>
            )}
            {booking.board_type && (
              <div>
                <p className="text-xs text-muted-foreground">Formule</p>
                <p className="text-sm">{booking.board_type}</p>
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
            {booking.commission_amount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Commission</p>
                <p className="font-medium">{booking.commission_amount} {booking.currency}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Statut paiement</p>
              {getPaymentBadge(booking.payment_status)}
            </div>
            {booking.paid_at && (
              <div>
                <p className="text-xs text-muted-foreground">Payé le</p>
                <p className="text-sm">{format(parseISO(booking.paid_at), "dd MMM yyyy")}</p>
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
            {booking.payment_status === "refunded" && booking.refund_amount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Remboursé</p>
                <p className="font-medium text-green-700">{booking.refund_amount} {booking.currency}</p>
              </div>
            )}
            {booking.revolut_refund_id && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Référence virement Revolut</p>
                <p className="font-mono text-sm font-semibold">{booking.revolut_refund_id}</p>
              </div>
            )}
            {booking.refunded_at && (
              <div>
                <p className="text-xs text-muted-foreground">Remboursé le</p>
                <p className="text-sm">{format(parseISO(booking.refunded_at), "dd MMM yyyy")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HyperGuest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" /> HyperGuest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Référence HG</p>
              <p className="font-mono text-sm">{booking.hg_booking_id || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Statut HG</p>
              <p className="text-sm">{booking.hg_status || booking.status || "—"}</p>
            </div>
            {booking.rate_plan && (
              <div>
                <p className="text-xs text-muted-foreground">Rate plan</p>
                <p className="text-sm">{booking.rate_plan}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              Entrez la référence du virement Revolut pour garder une trace de ce remboursement.
            </p>
            {booking.refund_amount > 0 && (
              <p className="text-sm font-semibold text-destructive">
                Montant : {booking.refund_amount} {booking.currency}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="revolut-ref-detail">Référence Revolut <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input
                id="revolut-ref-detail"
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

      <Dialog
        open={forceRefundDialog.open}
        onOpenChange={(open) => !open && setForceRefundDialog({ open: false, amount: "" })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Déclencher un remboursement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Entre le montant total à rembourser au client (hôtel + expérience). Ce montant apparaîtra dans la liste des remboursements à traiter.
            </p>
            <div className="space-y-2">
              <Label htmlFor="force-refund-amount">Montant à rembourser ({booking.currency})</Label>
              <Input
                id="force-refund-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder={`ex. ${booking.paid_amount ?? booking.sell_price ?? "0"}`}
                value={forceRefundDialog.amount}
                onChange={(e) => setForceRefundDialog((prev) => ({ ...prev, amount: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && forceRefundMutation.mutate(parseFloat(forceRefundDialog.amount))}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceRefundDialog({ open: false, amount: "" })}>
              Annuler
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => forceRefundMutation.mutate(parseFloat(forceRefundDialog.amount))}
              disabled={forceRefundMutation.isPending || !forceRefundDialog.amount || isNaN(parseFloat(forceRefundDialog.amount))}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Déclencher le remboursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
