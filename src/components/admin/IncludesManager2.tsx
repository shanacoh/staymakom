import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Card removed – parent form wraps this component
import { Plus, Trash2, GripVertical, Edit2, Save, X, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import HotelPhotoPickerDialog from "@/components/admin/HotelPhotoPickerDialog";

export interface LocalIncludeEntry {
  _localId: string;
  title: string;
  title_he: string;
  icon_url: string;
  published: boolean;
  order_index: number;
}

interface IncludesManager2Props {
  experienceId?: string;
  hotelIds?: string[];
  /** Local mode props (used when no experienceId yet) */
  localIncludes?: LocalIncludeEntry[];
  onLocalIncludesChange?: (includes: LocalIncludeEntry[]) => void;
}

const IncludesManager2 = ({ experienceId, hotelIds = [], localIncludes, onLocalIncludesChange }: IncludesManager2Props) => {
  const queryClient = useQueryClient();
  const isLocalMode = !experienceId;

  const [newInclude, setNewInclude] = useState({ title: "", title_he: "", icon_url: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", title_he: "", icon_url: "" });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const { data: includes, isLoading } = useQuery({
    queryKey: ["experience2-includes", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience2_includes")
        .select("*")
        .eq("experience_id", experienceId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  // Determine items to display
  const displayItems: any[] = isLocalMode ? (localIncludes || []).map(li => ({ ...li, id: li._localId })) : (includes || []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setNewInclude((prev) => ({ ...prev, icon_url: "" }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditData((prev) => ({ ...prev, icon_url: "" }));
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleHotelPhotoSelect = (url: string) => {
    setImageFile(null);
    setImagePreview(url);
    setNewInclude((prev) => ({ ...prev, icon_url: url }));
  };

  const handleEditHotelPhotoSelect = (url: string) => {
    setEditImageFile(null);
    setEditImagePreview(url);
    setEditData((prev) => ({ ...prev, icon_url: url }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("experience-images").upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("experience-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- Local mode: add ---
  const handleLocalAdd = async () => {
    if (!newInclude.title.trim()) { toast.error("Title is required"); return; }
    let imageUrl = newInclude.icon_url;
    if (imageFile) {
      setIsUploading(true);
      try { imageUrl = await uploadImage(imageFile); } catch { toast.error("Upload failed"); setIsUploading(false); return; }
      setIsUploading(false);
    }
    const newEntry: LocalIncludeEntry = {
      _localId: `local-${Date.now()}`,
      title: newInclude.title,
      title_he: newInclude.title_he,
      icon_url: imageUrl,
      published: true,
      order_index: (localIncludes?.length || 0),
    };
    onLocalIncludesChange?.([...(localIncludes || []), newEntry]);
    setNewInclude({ title: "", title_he: "", icon_url: "" });
    setImageFile(null);
    setImagePreview(null);
    toast.success("Item added");
  };

  const handleLocalDelete = (localId: string) => {
    onLocalIncludesChange?.((localIncludes || []).filter(i => i._localId !== localId));
    toast.success("Item removed");
  };

  // --- DB mutations ---
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newInclude.title.trim()) throw new Error("Title is required");
      setIsUploading(true);
      let imageUrl = newInclude.icon_url;
      if (imageFile) imageUrl = await uploadImage(imageFile);
      const maxOrder = includes?.length ? Math.max(...includes.map((i: any) => i.order_index)) : -1;
      const { error } = await (supabase as any).from("experience2_includes").insert([{
        experience_id: experienceId,
        title: newInclude.title,
        title_he: newInclude.title_he || null,
        icon_url: imageUrl || null,
        order_index: maxOrder + 1,
        published: true,
      }]);
      if (error) throw error;
      setIsUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience2-includes", experienceId] });
      setNewInclude({ title: "", title_he: "", icon_url: "" });
      setImageFile(null);
      setImagePreview(null);
      toast.success("Item added successfully");
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      let finalIconUrl = editData.icon_url || null;
      if (editImageFile) finalIconUrl = await uploadImage(editImageFile);
      const { error } = await (supabase as any).from("experience2_includes").update({
        title: editData.title,
        title_he: editData.title_he || null,
        icon_url: finalIconUrl,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience2-includes", experienceId] });
      setEditingId(null);
      setEditData({ title: "", title_he: "", icon_url: "" });
      setEditImageFile(null);
      setEditImagePreview(null);
      toast.success("Item updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("experience2_includes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience2-includes", experienceId] });
      toast.success("Item deleted");
    },
    onError: () => toast.error("Failed to delete item"),
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await (supabase as any).from("experience2_includes").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience2-includes", experienceId] });
      toast.success("Item updated");
    },
  });

  const startEditing = (include: any) => {
    setEditingId(include.id);
    setEditData({ title: include.title || "", title_he: include.title_he || "", icon_url: include.icon_url || "" });
    setEditImagePreview(include.icon_url);
    setEditImageFile(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ title: "", title_he: "", icon_url: "" });
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const saveEdit = (include: any) => {
    if (!editData.title.trim()) { toast.error("Title is required"); return; }
    updateMutation.mutate({ id: include.id });
  };

  if (!isLocalMode && isLoading) return <div>Loading...</div>;

  const hasHotels = hotelIds.length > 0;

  const handleAdd = () => {
    if (isLocalMode) handleLocalAdd();
    else createMutation.mutate();
  };

  const handleDelete = (id: string) => {
    if (isLocalMode) handleLocalDelete(id);
    else deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Add new item</h4>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-36 flex-shrink-0 space-y-2">
            <Label className="text-sm font-medium">Image</Label>
            <div className="flex gap-1">
              {hasHotels && (
                <HotelPhotoPickerDialog
                  hotelIds={hotelIds}
                  onSelect={handleHotelPhotoSelect}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="flex-1">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Gallery
                    </Button>
                  }
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => document.getElementById("new-include2-image")?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
              <input id="new-include2-image" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-20 object-cover rounded-lg border" referrerPolicy="no-referrer" />
                <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background" onClick={() => { setImageFile(null); setImagePreview(null); setNewInclude((p) => ({ ...p, icon_url: "" })); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="title2">Title EN *</Label>
            <Input id="title2" placeholder="e.g., Breakfast Included" value={newInclude.title} onChange={(e) => setNewInclude({ ...newInclude, title: e.target.value })} className="mt-1" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="title_he2">Title HE (כותרת)</Label>
            <Input id="title_he2" placeholder="למשל: ארוחת בוקר כלולה" value={newInclude.title_he} onChange={(e) => setNewInclude({ ...newInclude, title_he: e.target.value })} dir="rtl" className="bg-hebrew-input mt-1" />
          </div>
          <Button type="button" onClick={handleAdd} disabled={createMutation.isPending || isUploading || !newInclude.title.trim()} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Add"}
          </Button>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm">No items yet</p>
      ) : (
        <div className="space-y-2">
          {displayItems.map((include: any) => (
            <div key={include.id} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move mt-1 flex-shrink-0" />
              {editingId === include.id && !isLocalMode ? (
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  <div className="w-24 flex-shrink-0 space-y-1">
                    <div className="flex gap-1">
                      {hasHotels && (
                        <HotelPhotoPickerDialog
                          hotelIds={hotelIds}
                          onSelect={handleEditHotelPhotoSelect}
                          trigger={
                            <Button type="button" variant="outline" size="icon" className="h-8 w-8">
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                          }
                        />
                      )}
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => document.getElementById(`edit-image2-${include.id}`)?.click()}>
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <input id={`edit-image2-${include.id}`} type="file" accept="image/*" onChange={handleEditImageSelect} className="hidden" />
                    {editImagePreview && <img src={editImagePreview} alt="Preview" className="w-full h-16 object-cover rounded-lg border" referrerPolicy="no-referrer" />}
                  </div>
                  <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} placeholder="Title EN" className="flex-1 min-w-[100px]" />
                  <Input value={editData.title_he} onChange={(e) => setEditData({ ...editData, title_he: e.target.value })} placeholder="כותרת HE" dir="rtl" className="bg-hebrew-input flex-1 min-w-[100px]" />
                  <div className="flex gap-2 flex-shrink-0">
                    <Button type="button" size="sm" onClick={() => saveEdit(include)} disabled={updateMutation.isPending}><Save className="w-4 h-4" /></Button>
                    <Button type="button" size="sm" variant="ghost" onClick={cancelEditing} disabled={updateMutation.isPending}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  {include.icon_url && <img src={include.icon_url} alt={include.title} className="w-12 h-12 object-cover rounded flex-shrink-0" referrerPolicy="no-referrer" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{include.title}</div>
                    {include.title_he && <div className="text-xs text-muted-foreground" dir="rtl">{include.title_he}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isLocalMode && (
                      <>
                        <Switch checked={include.published} onCheckedChange={() => togglePublishedMutation.mutate({ id: include.id, published: !include.published })} />
                        <Button type="button" size="icon" variant="ghost" onClick={() => startEditing(include)}><Edit2 className="w-4 h-4" /></Button>
                      </>
                    )}
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(include.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncludesManager2;