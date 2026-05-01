import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, AlertTriangle, CheckCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";

export default function HotelBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: hotelAdmin } = useQuery({
    queryKey: ["hotel-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_admins")
        .select("hotel_id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["hotel-bookings-hg", hotelAdmin?.hotel_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_hg")
        .select("*, experiences2(title, slug), hotels2(name)")
        .eq("hotel_id", hotelAdmin?.hotel_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!hotelAdmin?.hotel_id,
  });

  const markRefundDoneMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings_hg")
        .update({ payment_status: "refunded" } as any)
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-bookings-hg"] });
      toast.success("Refund marked as processed");
    },
    onError: (error: any) => {
      toast.error("Failed to update", { description: error.message });
    },
  });

  const refundsPending = (bookings || []).filter(
    (b: any) => b.payment_status === "refund_pending"
  );

  const getStatusBadge = (booking: any) => {
    if (booking.is_cancelled || booking.status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      confirmed: { variant: "default", label: "Confirmed" },
      pending: { variant: "outline", label: "Pending" },
      pendingreview: { variant: "secondary", label: "Under Review" },
    };
    const c = map[booking.status?.toLowerCase()] || { variant: "outline" as const, label: booking.status || "—" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getPaymentBadge = (booking: any) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      refund_pending: { variant: "destructive", label: "Refund Due" },
      refunded: { variant: "secondary", label: "Refunded" },
      unpaid: { variant: "outline", label: "Unpaid" },
      no_refund_due: { variant: "outline", label: "No Refund" },
    };
    const c = map[booking.payment_status] || { variant: "outline" as const, label: booking.payment_status || "—" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getPriorityBadge = (checkin: string, isCancelled: boolean) => {
    if (isCancelled) return null;
    const days = differenceInDays(parseISO(checkin), new Date());
    if (days === 0) return <Badge variant="destructive" className="text-xs mt-1">Today</Badge>;
    if (days === 1) return <Badge variant="secondary" className="text-xs mt-1">Tomorrow</Badge>;
    if (days > 1 && days <= 7) return <Badge variant="outline" className="text-xs mt-1">In {days} days</Badge>;
    return null;
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="font-sans text-4xl font-bold">Bookings</h1>

      {refundsPending.length > 0 && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="h-5 w-5" />
            {refundsPending.length} booking{refundsPending.length > 1 ? "s" : ""} require{refundsPending.length === 1 ? "s" : ""} a refund
          </div>
          <div className="space-y-2">
            {refundsPending.map((b: any) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded bg-background p-3 text-sm border"
              >
                <div className="space-y-0.5">
                  <p className="font-medium">{b.customer_name}</p>
                  <a
                    href={`mailto:${b.customer_email}`}
                    className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {b.customer_email}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {b.experiences2?.title || "—"} · Cancelled {b.cancelled_at ? format(parseISO(b.cancelled_at), "dd MMM yyyy") : ""}
                  </p>
                  {b.refund_amount > 0 ? (
                    <p className="text-sm font-semibold text-destructive">
                      Refund to issue: {b.refund_amount} {b.currency}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Refund amount: check with client</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markRefundDoneMutation.mutate(b.id)}
                  disabled={markRefundDoneMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Refund Done
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !bookings || bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No bookings yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Booked on</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(bookings as any[]).map((booking) => (
                  <TableRow
                    key={booking.id}
                    className={booking.is_cancelled ? "opacity-60" : ""}
                  >
                    <TableCell className="font-mono text-xs">
                      <div>{(booking.hg_booking_id || booking.id).slice(0, 10)}</div>
                      {getPriorityBadge(booking.checkin, booking.is_cancelled)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{booking.customer_name || "—"}</div>
                      {booking.customer_email && (
                        <a
                          href={`mailto:${booking.customer_email}`}
                          className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {booking.customer_email}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {booking.experiences2?.title || "—"}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(booking.checkin), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(booking.checkout), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>{booking.party_size}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {booking.sell_price} {booking.currency}
                      </div>
                      {booking.payment_status === "refund_pending" && booking.refund_amount > 0 && (
                        <div className="text-xs text-destructive font-medium">
                          Refund: {booking.refund_amount} {booking.currency}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking)}</TableCell>
                    <TableCell>{getPaymentBadge(booking)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(parseISO(booking.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        {booking.payment_status === "refund_pending" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => markRefundDoneMutation.mutate(booking.id)}
                            disabled={markRefundDoneMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Refund Done
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/hotel-admin/bookings/${booking.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
