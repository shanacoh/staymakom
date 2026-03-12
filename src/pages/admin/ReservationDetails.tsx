import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function AdminReservationDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-booking-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          experiences(title),
          hotels(name),
          customers(first_name, last_name),
          booking_extras(*)
        `)
        .eq("id", bookingId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      paid: { variant: "default", label: "Paid" },
      hold: { variant: "secondary", label: "On Hold" },
      accepted: { variant: "default", label: "Accepted" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getExtraStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      done: { variant: "default", label: "Done" },
      unavailable: { variant: "secondary", label: "Unavailable" },
    };

    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Booking not found</p>
      </div>
    );
  }

  // Calculate extras progress
  const totalExtras = booking?.booking_extras?.length || 0;
  const doneExtras = booking?.booking_extras?.filter((e: any) => e.status === 'done').length || 0;
  const pendingExtras = booking?.booking_extras?.filter((e: any) => e.status === 'pending').length || 0;
  const unavailableExtras = booking?.booking_extras?.filter((e: any) => e.status === 'unavailable').length || 0;
  const progressPercentage = totalExtras > 0 ? (doneExtras / totalExtras) * 100 : 0;

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/reservations")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Reservations
      </Button>

      <h1 className="font-sans text-4xl font-bold mb-8">Reservation Details</h1>

      {/* Booking Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono text-xs">{booking.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(booking.status || "pending")}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hotel</p>
              <p>{booking.hotels?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience</p>
              <p>{booking.experiences?.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p>{booking.customers?.first_name} {booking.customers?.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Party Size</p>
              <p>{booking.party_size} guests</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-in</p>
              <p>{new Date(booking.checkin).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-out</p>
              <p>{new Date(booking.checkout).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="font-semibold">${booking.total_price} {booking.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-xs">{new Date(booking.created_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Experience</span>
            <span>${booking.experience_price_subtotal}</span>
          </div>
          {booking.room_price_subtotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room</span>
              <span>${booking.room_price_subtotal}</span>
            </div>
          )}
          {booking.extras_subtotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extras</span>
              <span>${booking.extras_subtotal}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${booking.total_price} {booking.currency}</span>
          </div>
        </CardContent>
      </Card>

      {/* Extras / Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Extras / Tasks</CardTitle>
            {totalExtras > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {doneExtras} / {totalExtras} completed ({Math.round(progressPercentage)}%)
                </div>
                <div className="flex gap-2 text-xs">
                  {pendingExtras > 0 && <Badge variant="outline">{pendingExtras} pending</Badge>}
                  {unavailableExtras > 0 && <Badge variant="secondary">{unavailableExtras} unavailable</Badge>}
                </div>
              </div>
            )}
          </div>
          {totalExtras > 0 && (
            <Progress value={progressPercentage} className="mt-4" />
          )}
        </CardHeader>
        <CardContent>
          {!booking?.booking_extras || booking.booking_extras.length === 0 ? (
            <p className="text-muted-foreground">No extras for this booking.</p>
          ) : (
            <div className="space-y-4">
              {booking.booking_extras.map((extra: any) => (
                <Card key={extra.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{extra.extra_name}</h3>
                          {getExtraStatusBadge(extra.status)}
                        </div>
                        {extra.extra_type && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Type: {extra.extra_type}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Quantity: {extra.quantity} × ${extra.unit_price} = ${extra.price}
                        </p>
                        {extra.updated_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last updated: {new Date(extra.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {extra.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{extra.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
