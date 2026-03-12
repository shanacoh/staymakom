import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HotelProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: hotelAdmin, isLoading } = useQuery({
    queryKey: ["hotel-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_admins")
        .select("*, hotels(*)")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const hotel = hotelAdmin?.hotels;

  // Form state - only editable fields
  const [formData, setFormData] = useState({
    contact_phone: "",
    contact_website: "",
  });

  // Update form when hotel data loads
  useEffect(() => {
    if (hotel) {
      setFormData({
        contact_phone: hotel.contact_phone || "",
        contact_website: hotel.contact_website || "",
      });
    }
  }, [hotel]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!hotel?.id) throw new Error("Hotel ID not found");

      const { error } = await supabase
        .from("hotels")
        .update({
          contact_phone: formData.contact_phone,
          contact_website: formData.contact_website,
        })
        .eq("id", hotel.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact information updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hotel-admin", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update contact information");
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handlePreview = () => {
    if (hotel?.slug) {
      navigate(`/hotels/${hotel.slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No hotel found for your account</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-sans text-4xl font-bold">Property Information</h1>
        <p className="text-muted-foreground mt-2">
          View your property details and manage operational contact information
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Marketing content (name, descriptions, photos, amenities) is managed by STAYMAKOM Admin. 
          You can only update operational contact information here.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Hotel Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Read-only Marketing Content */}
          <div className="space-y-6 pb-6 border-b">
            <h3 className="font-semibold text-lg">Marketing Content (Read-Only)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Hotel Name</Label>
                <Input value={hotel.name} disabled />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value={hotel?.status} disabled className="capitalize" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                rows={4} 
                value={hotel.story || "No description"} 
                disabled 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={hotel.city || "—"} disabled />
              </div>
              
              <div className="space-y-2">
                <Label>Region</Label>
                <Input value={hotel.region || "—"} disabled />
              </div>
            </div>

            {hotel.highlights && hotel.highlights.length > 0 && (
              <div className="space-y-2">
                <Label>Highlights</Label>
                <Textarea 
                  rows={2} 
                  value={hotel.highlights.join(", ")}
                  disabled 
                />
              </div>
            )}

            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="space-y-2">
                <Label>Amenities</Label>
                <Textarea 
                  rows={2} 
                  value={hotel.amenities.join(", ")}
                  disabled 
                />
              </div>
            )}

            {hotel.hero_image && (
              <div className="space-y-2">
                <Label>Main Cover Image</Label>
                <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={hotel.hero_image}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Editable Operational Contact */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Operational Contact (Editable)</h3>
            
            <div className="space-y-2">
              <Label>Contact Email (From your account)</Label>
              <Input 
                type="email" 
                value={user?.email || ""}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                This email is used for booking notifications
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input 
                id="phone" 
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="Enter contact phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                value={formData.contact_website}
                onChange={(e) => setFormData({ ...formData, contact_website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Contact Info
            </Button>
            <Button 
              variant="outline"
              onClick={handlePreview}
            >
              Preview Public Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
