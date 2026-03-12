import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as LucideIcons from "lucide-react";

interface HotelExtrasManagerProps {
  hotelId: string;
}

// Common icons for extras
const AVAILABLE_ICONS = [
  "Wine", "Car", "Flower2", "Gift", "Utensils", "Sparkles", "Heart", 
  "Star", "Coffee", "Music", "Camera", "Plane", "Bike", "Baby",
  "Dog", "Wifi", "Tv", "AirVent", "UtensilsCrossed", "Soup",
  "Bus", "Train", "Carrot", "Apple", "Cherry", "Pizza", "IceCream",
  "Cake", "Martini", "Beer", "GlassWater", "CupSoda", "Milk",
  "ShoppingBag", "ShoppingCart", "Package", "Shirt", "Palmtree",
  "Mountain", "Waves", "Snowflake", "Sun", "Moon", "CloudRain",
  "Umbrella", "Glasses", "Watch", "Crown", "Gem", "Key",
  "Bath", "Bed", "Lamp", "Armchair", "Sofa", "DoorOpen",
  "Dumbbell", "Activity", "Volleyball", "Trophy", "Medal", "Flag",
  "Map", "MapPin", "Compass", "Navigation", "Anchor", "Ship",
  "Sailboat", "Rocket", "Tent", "Backpack", "Briefcase", "BookOpen",
  "Newspaper", "Pen", "MessageCircle", "Phone", "Mail", "Bell",
  "Calendar", "Clock", "Timer", "Zap", "Battery", "Plug",
  "Lightbulb", "Flame", "Droplet", "Wind", "Leaf", "Trees",
  "Flower", "Sprout", "Bug", "Bird", "Fish", "Rabbit"
];

const PRICING_TYPES = [
  { value: "per_booking", label: "Per Experience (one-time)" },
  { value: "per_night", label: "Per Night" },
  { value: "per_person", label: "Per Guest" },
];

const CURRENCIES = ["ILS", "USD", "EUR", "GBP"];

export const HotelExtrasManager = ({ hotelId }: HotelExtrasManagerProps) => {
  const queryClient = useQueryClient();
  const [newExtra, setNewExtra] = useState({
    name_en: "",
    name_he: "",
    price: "",
    currency: "ILS",
    pricing_type: "per_booking",
    icon: "Gift",
  });

  const { data: extras, isLoading } = useQuery({
    queryKey: ["hotel-extras", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extras")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newExtra) => {
      const { error } = await supabase.from("extras").insert({
        hotel_id: hotelId,
        name: data.name_en,
        name_he: data.name_he,
        price: parseFloat(data.price),
        currency: data.currency,
        pricing_type: data.pricing_type as "per_booking" | "per_person" | "per_night",
        image_url: data.icon,
        is_available: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-extras", hotelId] });
      toast.success("Extra added");
      setNewExtra({ name_en: "", name_he: "", price: "", currency: "ILS", pricing_type: "per_booking", icon: "Gift" });
    },
    onError: () => {
      toast.error("Error adding extra");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (extraId: string) => {
      const { error } = await supabase
        .from("extras")
        .delete()
        .eq("id", extraId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-extras", hotelId] });
      toast.success("Extra deleted");
    },
    onError: () => {
      toast.error("Error deleting extra");
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
      toast.success("Extra availability updated");
    },
    onError: () => {
      toast.error("Error updating extra availability");
    },
  });

  const handleAddExtra = () => {
    if (!newExtra.name_en || !newExtra.price) {
      toast.error("Please fill in at least the English name and price");
      return;
    }
    createMutation.mutate(newExtra);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <LucideIcons.Gift className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Extras */}
      {extras && extras.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Existing Extras</h4>
          {extras.map((extra) => (
            <Card key={extra.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {renderIcon(extra.image_url || "Gift")}
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">{extra.name}</p>
                      <p className="text-xs text-muted-foreground">English</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" dir="rtl">{extra.name_he || "-"}</p>
                      <p className="text-xs text-muted-foreground">Hebrew</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{extra.price} {extra.currency}</p>
                      <p className="text-xs text-muted-foreground">Price</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {PRICING_TYPES.find(t => t.value === extra.pricing_type)?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">Pricing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={extra.is_available}
                      onCheckedChange={(checked) =>
                        toggleAvailableMutation.mutate({ id: extra.id, is_available: checked })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(extra.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Extra Form */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-4">
          <h4 className="font-medium text-sm">Add New Extra</h4>
          
          <div className="grid grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={newExtra.icon}
                onValueChange={(value) => setNewExtra({ ...newExtra, icon: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {renderIcon(newExtra.icon)}
                      <span className="text-xs">{newExtra.icon}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-[300px]">
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        {renderIcon(icon)}
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title (English) *</Label>
              <Input
                value={newExtra.name_en}
                onChange={(e) => setNewExtra({ ...newExtra, name_en: e.target.value })}
                placeholder="e.g., Airport Transfer"
              />
            </div>

            <div className="space-y-2">
              <Label>Title (Hebrew)</Label>
              <Input
                value={newExtra.name_he}
                onChange={(e) => setNewExtra({ ...newExtra, name_he: e.target.value })}
                placeholder="כותרת בעברית"
                dir="rtl"
                className="bg-hebrew-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                value={newExtra.price}
                onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={newExtra.currency}
                onValueChange={(value) => setNewExtra({ ...newExtra, currency: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pricing Type</Label>
              <Select
                value={newExtra.pricing_type}
                onValueChange={(value) => setNewExtra({ ...newExtra, pricing_type: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {PRICING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddExtra}
            disabled={createMutation.isPending}
            size="sm"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Extra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
