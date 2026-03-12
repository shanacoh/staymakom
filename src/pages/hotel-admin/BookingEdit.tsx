import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function BookingEdit() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    checkin: "",
    checkout: "",
    party_size: 2,
    notes: "",
  });

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-edit", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          experiences(title, hotel_id),
          hotels(name),
          booking_extras(*)
        `)
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  // Pre-fill form when booking data loads
  useEffect(() => {
    if (booking) {
      setFormData({
        checkin: booking.checkin,
        checkout: booking.checkout,
        party_size: booking.party_size,
        notes: booking.notes || "",
      });
    }
  }, [booking]);

  const updateBookingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("bookings")
        .update({
          checkin: data.checkin,
          checkout: data.checkout,
          party_size: data.party_size,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-booking-detail", bookingId] });
      toast.success("Booking updated successfully");
      navigate(`/hotel-admin/bookings/${bookingId}`);
    },
    onError: (error: any) => {
      toast.error("Failed to update booking", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingMutation.mutate(formData);
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

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/hotel-admin/bookings/${bookingId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Booking Details
        </Button>
      </div>

      <h1 className="font-sans text-4xl font-bold mb-8">Edit Booking</h1>

      <Card>
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Experience</p>
            <p className="font-semibold">{booking.experiences?.title}</p>
            <p className="text-sm text-muted-foreground mt-2">Hotel: {booking.hotels?.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in Date</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={formData.checkin}
                  onChange={(e) =>
                    setFormData({ ...formData, checkin: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out Date</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={formData.checkout}
                  onChange={(e) =>
                    setFormData({ ...formData, checkout: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party_size">Number of Guests</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                max="20"
                value={formData.party_size}
                onChange={(e) =>
                  setFormData({ ...formData, party_size: parseInt(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any notes about this booking..."
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updateBookingMutation.isPending}
              >
                {updateBookingMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/hotel-admin/bookings/${bookingId}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
