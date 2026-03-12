import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ExtrasManagement() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [newExtra, setNewExtra] = useState({
    name: "",
    name_he: "",
    description: "",
    description_he: "",
    price: "",
    pricing_type: "per_booking" as "per_booking" | "per_night" | "per_person",
    image_url: "",
  });

  const isAdmin = role === "admin";

  // Fetch hotel admin's hotel ID (for hotel_admin users)
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
    enabled: !!user?.id && !isAdmin,
  });

  // Fetch all hotels (for admin users)
  const { data: hotels } = useQuery({
    queryKey: ["hotels-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Determine which hotel_id to use
  const hotelId = isAdmin ? selectedHotelId : hotelAdmin?.hotel_id;

  // Fetch hotel extras
  const { data: extras, isLoading } = useQuery({
    queryKey: ["hotel-extras", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extras")
        .select("*")
        .eq("hotel_id", hotelId!)
        .order("sort_order");

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newExtra.name.trim() || !newExtra.price) {
        throw new Error("Name and price are required");
      }

      const maxOrder = extras?.length ? Math.max(...extras.map(e => e.sort_order || 0)) : -1;
      
      const { error } = await supabase
        .from("extras")
        .insert([{
          hotel_id: hotelId,
          name: newExtra.name,
          name_he: newExtra.name_he || null,
          description: newExtra.description || null,
          description_he: newExtra.description_he || null,
          price: parseFloat(newExtra.price),
          pricing_type: newExtra.pricing_type,
          image_url: newExtra.image_url || null,
          sort_order: maxOrder + 1,
          is_available: true,
          currency: "ILS",
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-extras", hotelId] });
      setNewExtra({ 
        name: "", 
        name_he: "",
        description: "", 
        description_he: "",
        price: "", 
        pricing_type: "per_booking", 
        image_url: "" 
      });
      toast.success("Extra added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("extras")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-extras", hotelId] });
      toast.success("Extra deleted");
    },
  });

  const toggleAvailableMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from("extras")
        .update({ is_available })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-extras", hotelId] });
      toast.success("Extra updated");
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-sans text-4xl font-bold">Extras Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage extras and add-ons that can be assigned to your experiences
        </p>
      </div>

      {/* Hotel Selector for Admins */}
      {isAdmin && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <Label>Select Hotel</Label>
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a hotel to manage extras" />
                </SelectTrigger>
                <SelectContent>
                  {hotels?.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hotelId && (
        <Alert>
          <AlertDescription>
            {isAdmin 
              ? "Please select a hotel to manage extras."
              : "Loading hotel information..."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && hotelId && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {hotelId && !isLoading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Add New Extra</CardTitle>
              <CardDescription>Create extras that guests can add to their bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bilingual Name & Description - Side by Side */}
              <div className="grid grid-cols-2 gap-6">
                {/* English Column */}
                <div className="space-y-4">
                  <div className="bg-muted/30 p-3 rounded">
                    <h5 className="text-sm font-medium">English Version</h5>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Airport Transfer"
                      value={newExtra.name}
                      onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe this extra..."
                      value={newExtra.description}
                      onChange={(e) => setNewExtra({ ...newExtra, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Hebrew Column */}
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-3 rounded">
                    <h5 className="text-sm font-medium">Hebrew Version (עברית)</h5>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name_he">שם</Label>
                    <Input
                      id="name_he"
                      placeholder="למשל: הסעה מהשדה"
                      value={newExtra.name_he}
                      onChange={(e) => setNewExtra({ ...newExtra, name_he: e.target.value })}
                      dir="rtl"
                      className="bg-blue-50/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description_he">תיאור</Label>
                    <Textarea
                      id="description_he"
                      placeholder="תאר את התוספת..."
                      value={newExtra.description_he}
                      onChange={(e) => setNewExtra({ ...newExtra, description_he: e.target.value })}
                      rows={4}
                      dir="rtl"
                      className="bg-blue-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Price & Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (ILS) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newExtra.price}
                    onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Type</Label>
                  <Select
                    value={newExtra.pricing_type}
                    onValueChange={(value) => setNewExtra({ ...newExtra, pricing_type: value as "per_booking" | "per_night" | "per_person" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_booking">Per Booking</SelectItem>
                      <SelectItem value="per_person">Per Person</SelectItem>
                      <SelectItem value="per_night">Per Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ImageUpload
                label="Extra Image (optional)"
                bucket="experience-images"
                value={newExtra.image_url}
                onChange={(url) => setNewExtra({ ...newExtra, image_url: url })}
                description="Image for this add-on"
              />

              <Button 
                onClick={() => createMutation.mutate()} 
                disabled={createMutation.isPending || !newExtra.name || !newExtra.price}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Extra
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Extras ({extras?.length || 0})</CardTitle>
              <CardDescription>Manage existing extras for your hotel</CardDescription>
            </CardHeader>
            <CardContent>
              {extras && extras.length > 0 ? (
                <div className="space-y-3">
                  {extras.map((extra) => (
                    <div
                      key={extra.id}
                      className="flex items-start gap-4 p-4 border border-border rounded-lg"
                    >
                      {extra.image_url && (
                        <img 
                          src={extra.image_url} 
                          alt={extra.name} 
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-lg">
                          {extra.name}
                          {extra.name_he && (
                            <span className="text-muted-foreground ml-3 text-sm" dir="rtl">/ {extra.name_he}</span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-primary mt-1">
                          {extra.price} {extra.currency} / {extra.pricing_type.replace("_", " ")}
                        </div>
                        {(extra.description || extra.description_he) && (
                          <div className="text-sm text-muted-foreground mt-2">
                            {extra.description}
                            {extra.description_he && (
                              <span className="block mt-1" dir="rtl">{extra.description_he}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            {extra.is_available ? "Active" : "Inactive"}
                          </Label>
                          <Switch
                            checked={extra.is_available || false}
                            onCheckedChange={(checked) => 
                              toggleAvailableMutation.mutate({ id: extra.id, is_available: checked })
                            }
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(extra.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No extras yet. Create your first extra above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
