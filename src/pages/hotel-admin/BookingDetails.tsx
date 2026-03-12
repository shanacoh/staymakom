import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

export default function HotelBookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [extrasNotes, setExtrasNotes] = useState<Record<string, string>>({});

  const { data: booking, isLoading } = useQuery({
    queryKey: ["hotel-booking-detail", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_safe")
        .select(`
          *,
          experiences(title, hero_image),
          booking_extras(*)
        `)
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      
      // Initialize notes state
      if (data.booking_extras) {
        const notesMap: Record<string, string> = {};
        data.booking_extras.forEach((extra: any) => {
          if (extra.notes) notesMap[extra.id] = extra.notes;
        });
        setExtrasNotes(notesMap);
      }
      
      return data;
    },
    enabled: !!bookingId,
  });

  const updateExtraStatusMutation = useMutation({
    mutationFn: async ({ 
      extraId, 
      status, 
      notes 
    }: { 
      extraId: string; 
      status: "pending" | "done" | "unavailable"; 
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("booking_extras")
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq("id", extraId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-booking-detail"] });
      toast.success("Extra updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update extra", {
        description: error.message,
      });
    },
  });

  const handleUpdateExtra = (extraId: string, status: "pending" | "done" | "unavailable") => {
    updateExtraStatusMutation.mutate({
      extraId,
      status,
      notes: extrasNotes[extraId],
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      done: { variant: "default", label: "Done" },
      unavailable: { variant: "destructive", label: "Unavailable" },
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
        <p>Booking not found</p>
      </div>
    );
  }

  const totalExtras = booking?.booking_extras?.length || 0;
  const doneExtras = booking?.booking_extras?.filter((e: any) => e.status === 'done').length || 0;
  const pendingExtras = booking?.booking_extras?.filter((e: any) => e.status === 'pending').length || 0;
  const unavailableExtras = booking?.booking_extras?.filter((e: any) => e.status === 'unavailable').length || 0;
  const progressPercentage = totalExtras > 0 ? (doneExtras / totalExtras) * 100 : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/hotel-admin/bookings")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/hotel-admin/bookings/edit/${bookingId}`)}
        >
          Edit Booking
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Booking ID</div>
              <div className="font-mono text-xs">{booking.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Experience</div>
              <div className="font-medium">{booking.experiences?.title}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Check-in</div>
              <div>{format(new Date(booking.checkin), "MMM d, yyyy")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Check-out</div>
              <div>{format(new Date(booking.checkout), "MMM d, yyyy")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Guests</div>
              <div>{booking.party_size}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Price</div>
              <div className="text-xl font-bold">
                ${booking.total_price} {booking.currency}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room</span>
              <span>${booking.room_price_subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Experience</span>
              <span>${booking.experience_price_subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extras</span>
              <span>${booking.extras_subtotal || 0}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>${booking.total_price}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
          {!booking.booking_extras || booking.booking_extras.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No extras for this booking.
            </p>
          ) : (
            <div className="space-y-4">
              {booking.booking_extras.map((extra: any) => (
                <Card key={extra.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{extra.extra_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {extra.extra_type} • Quantity: {extra.quantity}
                        </div>
                        <div className="text-sm font-medium">
                          ${extra.price}
                        </div>
                      </div>
                      {getStatusBadge(extra.status)}
                    </div>

                    <Textarea
                      placeholder="Add notes about this extra..."
                      value={extrasNotes[extra.id] || ""}
                      onChange={(e) =>
                        setExtrasNotes({ ...extrasNotes, [extra.id]: e.target.value })
                      }
                      className="min-h-[80px]"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={extra.status === "done" ? "default" : "outline"}
                        onClick={() => handleUpdateExtra(extra.id, "done")}
                        disabled={updateExtraStatusMutation.isPending}
                      >
                        Mark as Done
                      </Button>
                      <Button
                        size="sm"
                        variant={extra.status === "unavailable" ? "destructive" : "outline"}
                        onClick={() => handleUpdateExtra(extra.id, "unavailable")}
                        disabled={updateExtraStatusMutation.isPending}
                      >
                        Mark Unavailable
                      </Button>
                      {extra.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateExtra(extra.id, "pending")}
                          disabled={updateExtraStatusMutation.isPending}
                        >
                          Reset to Pending
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
