import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle, Mail, AlertTriangle, CreditCard, Calendar, Users, Building, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function AdminReservationDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const markRefundDoneMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bookings_hg")
        .update({ payment_status: "refunded" } as any)
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-booking-details-hg", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-hg"] });
      toast.success("Remboursement marqué comme effectué");
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

      {/* Refund alert */}
      {booking.payment_status === "refund_pending" && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertTriangle className="h-5 w-5" />
                Remboursement requis
              </div>
              {booking.refund_amount > 0 ? (
                <p className="text-sm">
                  Montant à rembourser au client :{" "}
                  <span className="font-bold">{booking.refund_amount} {booking.currency}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Montant à vérifier directement avec le client.</p>
              )}
              <a href={`mailto:${booking.customer_email}`} className="text-sm text-destructive underline flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {booking.customer_email}
              </a>
            </div>
            <Button
              variant="outline"
              onClick={() => markRefundDoneMutation.mutate()}
              disabled={markRefundDoneMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Remboursement effectué
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
    </div>
  );
}
