import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface ExperienceExtrasSelectorProps {
  experienceId: string;
  hotelId: string;
}

interface EditingExtra {
  id: string;
  name: string;
  name_he: string;
  description: string;
  description_he: string;
  price: string;
  pricing_type: string;
}

const ExperienceExtrasSelector = ({ experienceId, hotelId }: ExperienceExtrasSelectorProps) => {
  const queryClient = useQueryClient();
  const [editingExtra, setEditingExtra] = useState<EditingExtra | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch ALL hotel extras (not just available ones)
  const { data: hotelExtras, isLoading: isLoadingExtras } = useQuery({
    queryKey: ["hotel-extras", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extras")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("is_available", { ascending: false })
        .order("sort_order");

      if (error) throw error;
      return data;
    },
  });

  // Fetch selected extras for this experience
  const { data: selectedExtras, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["experience-extras-links", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_extras")
        .select("extra_id")
        .eq("experience_id", experienceId);

      if (error) throw error;
      return data.map(item => item.extra_id);
    },
  });

  // Toggle link between experience and extra
  const toggleExtraMutation = useMutation({
    mutationFn: async ({ extraId, isChecked }: { extraId: string; isChecked: boolean }) => {
      if (isChecked) {
        const { error } = await supabase
          .from("experience_extras")
          .insert([{ experience_id: experienceId, extra_id: extraId }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("experience_extras")
          .delete()
          .eq("experience_id", experienceId)
          .eq("extra_id", extraId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience-extras-links", experienceId] });
      toast.success("Extras updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle availability mutation
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
      toast.success("Extra visibility updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Delete extra mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First remove all experience_extras links
      await supabase.from("experience_extras").delete().eq("extra_id", id);
      // Then delete the extra
      const { error } = await supabase.from("extras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-extras", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["experience-extras-links", experienceId] });
      toast.success("Extra deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Update extra mutation
  const updateMutation = useMutation({
    mutationFn: async (extra: EditingExtra) => {
      const { error } = await supabase
        .from("extras")
        .update({
          name: extra.name,
          name_he: extra.name_he || null,
          description: extra.description || null,
          description_he: extra.description_he || null,
          price: parseFloat(extra.price),
          pricing_type: extra.pricing_type as "per_booking" | "per_person" | "per_night",
        })
        .eq("id", extra.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-extras", hotelId] });
      setEditDialogOpen(false);
      setEditingExtra(null);
      toast.success("Extra updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleEditClick = (extra: NonNullable<typeof hotelExtras>[0]) => {
    setEditingExtra({
      id: extra.id,
      name: extra.name,
      name_he: extra.name_he || "",
      description: extra.description || "",
      description_he: extra.description_he || "",
      price: String(extra.price),
      pricing_type: extra.pricing_type || "per_booking",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingExtra) {
      updateMutation.mutate(editingExtra);
    }
  };

  if (isLoadingExtras || isLoadingSelected) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hotelExtras || hotelExtras.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No extras available for this hotel yet.</p>
        <p className="text-sm mt-1">Hotel admins can create extras in their back-office.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {hotelExtras.map((extra) => (
          <div
            key={extra.id}
            className={`flex items-start gap-3 p-3 border border-border rounded-lg bg-card ${
              !extra.is_available ? "opacity-60" : ""
            }`}
          >
            {/* Grip handle for reordering */}
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move mt-1 flex-shrink-0" />
            
            {/* Extra details */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{extra.name}</div>
              {extra.name_he && (
                <div className="text-xs text-muted-foreground" dir="rtl">
                  {extra.name_he}
                </div>
              )}
              <div className="text-xs font-semibold text-primary mt-0.5">
                {extra.price} {extra.currency} / {extra.pricing_type?.replace("_", " ") || "per booking"}
              </div>
            </div>

            {/* Actions: Switch + Edit + Delete */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={extra.is_available ?? true}
                onCheckedChange={() => toggleAvailableMutation.mutate({
                  id: extra.id,
                  is_available: !extra.is_available
                })}
                disabled={toggleAvailableMutation.isPending}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                onClick={() => handleEditClick(extra)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" size="icon" variant="ghost">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Extra?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{extra.name}" and remove it from all experiences. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMutation.mutate(extra.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Extra</DialogTitle>
          </DialogHeader>
          
          {editingExtra && (
            <div className="space-y-6 py-4">
              {/* Bilingual layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* English column */}
                <div className="space-y-4">
                  <div className="bg-muted/30 p-2 rounded text-sm font-medium">English</div>
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      placeholder="Name"
                      value={editingExtra.name}
                      onChange={(e) => setEditingExtra(prev => prev ? {...prev, name: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Description"
                      value={editingExtra.description}
                      onChange={(e) => setEditingExtra(prev => prev ? {...prev, description: e.target.value} : null)}
                    />
                  </div>
                </div>
                
                {/* Hebrew column */}
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-2 rounded text-sm font-medium">עברית</div>
                  <div>
                    <Label htmlFor="edit-name-he">שם</Label>
                    <Input
                      id="edit-name-he"
                      placeholder="שם"
                      dir="rtl"
                      className="bg-blue-50/50"
                      value={editingExtra.name_he}
                      onChange={(e) => setEditingExtra(prev => prev ? {...prev, name_he: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description-he">תיאור</Label>
                    <Textarea
                      id="edit-description-he"
                      placeholder="תיאור"
                      dir="rtl"
                      className="bg-blue-50/50"
                      value={editingExtra.description_he}
                      onChange={(e) => setEditingExtra(prev => prev ? {...prev, description_he: e.target.value} : null)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Price and pricing type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    placeholder="Price"
                    value={editingExtra.price}
                    onChange={(e) => setEditingExtra(prev => prev ? {...prev, price: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pricing-type">Pricing Type</Label>
                  <Select
                    value={editingExtra.pricing_type}
                    onValueChange={(v) => setEditingExtra(prev => prev ? {...prev, pricing_type: v} : null)}
                  >
                    <SelectTrigger id="edit-pricing-type">
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
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExperienceExtrasSelector;
