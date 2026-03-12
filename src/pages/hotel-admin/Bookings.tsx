import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X, Eye } from "lucide-react";
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
    queryKey: ["hotel-bookings", hotelAdmin?.hotel_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_safe")
        .select("*, experiences(title), booking_extras(*)")
        .eq("hotel_id", hotelAdmin?.hotel_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hotelAdmin?.hotel_id,
  });

  // Mutation for updating booking status
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { 
      bookingId: string; 
      status: "pending" | "hold" | "accepted" | "paid" | "confirmed" | "failed" | "cancelled" 
    }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", bookingId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
      
      const action = variables.status === "confirmed" ? "accepted" : "declined";
      toast.success(`Booking ${action}`, {
        description: `The booking has been ${action} successfully.`,
      });
    },
    onError: (error: any) => {
      toast.error("Failed to update booking", {
        description: error.message || "Unable to update booking status.",
      });
    },
  });

  const handleAcceptBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "confirmed" });
  };

  const handleDeclineBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "cancelled" });
  };

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

  const getExtrasStatus = (bookingExtras: any[]) => {
    if (!bookingExtras || bookingExtras.length === 0) {
      return <Badge variant="outline" className="text-xs">No extras</Badge>;
    }
    
    const total = bookingExtras.length;
    const pending = bookingExtras.filter(e => e.status === 'pending').length;
    const done = bookingExtras.filter(e => e.status === 'done').length;
    const unavailable = bookingExtras.filter(e => e.status === 'unavailable').length;

    // Determine color: GREEN (all done), RED (nothing handled), YELLOW (partial)
    let variant: "default" | "destructive" | "secondary" = "secondary";
    if (total > 0 && pending === 0 && done > 0) {
      variant = "default"; // GREEN - all done
    } else if (total > 0 && done === 0 && pending > 0) {
      variant = "destructive"; // RED - nothing handled
    } else if (total > 0 && done > 0 && pending > 0) {
      variant = "secondary"; // YELLOW - partially handled
    }

    return (
      <div className="flex items-center gap-1">
        <Badge variant={variant} className="text-xs">
          {done}/{total} done
        </Badge>
        {pending > 0 && <span className="text-xs text-muted-foreground">· {pending} pending</span>}
      </div>
    );
  };

  const getPriorityBadge = (checkin: string) => {
    const checkinDate = new Date(checkin);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkinDate.setHours(0, 0, 0, 0);
    
    const diffTime = checkinDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return <Badge variant="destructive" className="text-xs">Arriving Today</Badge>;
    } else if (diffDays === 1) {
      return <Badge variant="secondary" className="text-xs">Arriving Tomorrow</Badge>;
    } else if (diffDays > 1 && diffDays <= 3) {
      return <Badge variant="outline" className="text-xs">Upcoming</Badge>;
    }
    return null;
  };

  return (
    <div className="p-8">
      <h1 className="font-sans text-4xl font-bold mb-8">Bookings</h1>

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
            <p className="text-muted-foreground text-center py-8">
              No bookings yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Extras</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">
                      {booking.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{booking.experiences?.title}</TableCell>
                    <TableCell>
                      {new Date(booking.checkin).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.checkout).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{booking.party_size}</TableCell>
                    <TableCell>
                      ${booking.total_price} {booking.currency}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status || "pending")}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(booking.checkin)}
                    </TableCell>
                    <TableCell>
                      {getExtrasStatus(booking.booking_extras)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptBooking(booking.id)}
                              disabled={updateBookingStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeclineBooking(booking.id)}
                              disabled={updateBookingStatusMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </>
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
