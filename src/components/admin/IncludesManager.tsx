import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Edit2, Save, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
interface IncludesManagerProps {
  experienceId: string;
}
const IncludesManager = ({
  experienceId
}: IncludesManagerProps) => {
  const queryClient = useQueryClient();
  const [newInclude, setNewInclude] = useState({
    title: "",
    title_he: "",
    icon_url: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    title_he: ""
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const {
    data: includes,
    isLoading
  } = useQuery({
    queryKey: ["experience-includes", experienceId],
    queryFn: async () => {
      const {
        data,
        error
      } = await (supabase as any).from("experience_includes").select("*").eq("experience_id", experienceId).order("order_index");
      if (error) throw error;
      return data;
    }
  });
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const {
      error: uploadError
    } = await supabase.storage.from('experience-images').upload(filePath, file);
    if (uploadError) throw uploadError;
    const {
      data
    } = supabase.storage.from('experience-images').getPublicUrl(filePath);
    return data.publicUrl;
  };
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newInclude.title.trim()) {
        throw new Error("Title is required");
      }
      setIsUploading(true);
      let imageUrl = newInclude.icon_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const maxOrder = includes?.length ? Math.max(...includes.map((i: any) => i.order_index)) : -1;
      const {
        error
      } = await (supabase as any).from("experience_includes").insert([{
        experience_id: experienceId,
        title: newInclude.title,
        title_he: newInclude.title_he || null,
        icon_url: imageUrl || null,
        order_index: maxOrder + 1,
        published: true
      }]);
      if (error) throw error;
      setIsUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experience-includes", experienceId]
      });
      setNewInclude({
        title: "",
        title_he: "",
        icon_url: ""
      });
      setImageFile(null);
      setImagePreview(null);
      toast.success("Item added successfully");
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast.error(error.message);
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      icon_url
    }: {
      id: string;
      icon_url: string | null;
    }) => {
      let finalIconUrl = icon_url;
      if (editImageFile) {
        finalIconUrl = await uploadImage(editImageFile);
      }
      const {
        error
      } = await (supabase as any).from("experience_includes").update({
        title: editData.title,
        title_he: editData.title_he || null,
        icon_url: finalIconUrl
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experience-includes", experienceId]
      });
      setEditingId(null);
      setEditData({
        title: "",
        title_he: ""
      });
      setEditImageFile(null);
      setEditImagePreview(null);
      toast.success("Item updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await (supabase as any).from("experience_includes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experience-includes", experienceId]
      });
      toast.success("Item deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete item");
    }
  });
  const togglePublishedMutation = useMutation({
    mutationFn: async ({
      id,
      published
    }: {
      id: string;
      published: boolean;
    }) => {
      const {
        error
      } = await (supabase as any).from("experience_includes").update({
        published
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experience-includes", experienceId]
      });
      toast.success("Item updated");
    }
  });
  const startEditing = (include: any) => {
    setEditingId(include.id);
    setEditData({
      title: include.title || "",
      title_he: include.title_he || ""
    });
    setEditImagePreview(include.icon_url);
    setEditImageFile(null);
  };
  const cancelEditing = () => {
    setEditingId(null);
    setEditData({
      title: "",
      title_he: ""
    });
    setEditImageFile(null);
    setEditImagePreview(null);
  };
  const saveEdit = (include: any) => {
    if (!editData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    updateMutation.mutate({
      id: include.id,
      icon_url: include.icon_url
    });
  };
  if (isLoading) return <div>Loading...</div>;
  return <Card>
      
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <h4 className="font-medium">Add new item</h4>
          
          <div className="flex items-end gap-3">
            <div className="w-32 flex-shrink-0">
              <Label className="text-sm font-medium">Icon Image *</Label>
              <Button type="button" variant="outline" className="w-full justify-start mt-2" onClick={() => document.getElementById('new-include-image')?.click()}>
                <ImageIcon className="w-4 h-4 mr-2" />
                {imageFile ? "Change" : "Choose"}
              </Button>
              <input id="new-include-image" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              {imagePreview && <div className="mt-2 relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-20 object-cover rounded-lg border" />
                  <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background" onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>}
            </div>

            <div className="flex-1">
              <Label htmlFor="title">Title EN *</Label>
              <Input id="title" placeholder="e.g., Breakfast Included" value={newInclude.title} onChange={e => setNewInclude({
              ...newInclude,
              title: e.target.value
            })} className="mt-2" />
            </div>

            <div className="flex-1">
              <Label htmlFor="title_he">Title HE (כותרת)</Label>
              <Input id="title_he" placeholder="למשל: ארוחת בוקר כלולה" value={newInclude.title_he} onChange={e => setNewInclude({
              ...newInclude,
              title_he: e.target.value
            })} dir="rtl" className="bg-hebrew-input mt-2" />
            </div>

            <Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || isUploading || !newInclude.title.trim()} className="flex-shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Add"}
            </Button>
          </div>
        </div>

        {!includes || includes.length === 0 ? <p className="text-muted-foreground text-center py-4">No items yet</p> : <div className="space-y-2">
            {includes.map((include: any) => <div key={include.id} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move mt-1 flex-shrink-0" />
                
                {editingId === include.id ? <div className="flex-1 flex items-center gap-3">
                    <div className="w-20 flex-shrink-0">
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`edit-image-${include.id}`)?.click()}>
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <input id={`edit-image-${include.id}`} type="file" accept="image/*" onChange={handleEditImageSelect} className="hidden" />
                      {editImagePreview && <img src={editImagePreview} alt="Preview" className="w-full h-16 object-cover rounded-lg border mt-2" />}
                    </div>
                    
                    <Input value={editData.title} onChange={e => setEditData({
              ...editData,
              title: e.target.value
            })} placeholder="Title EN" className="flex-1" />
                    
                    <Input value={editData.title_he} onChange={e => setEditData({
              ...editData,
              title_he: e.target.value
            })} placeholder="כותרת HE" dir="rtl" className="bg-hebrew-input flex-1" />
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button type="button" size="sm" onClick={() => saveEdit(include)} disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelEditing} disabled={updateMutation.isPending}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div> : <>
                    {include.icon_url && <img src={include.icon_url} alt={include.title} className="w-12 h-12 object-cover rounded flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {include.title}
                      </div>
                      {include.title_he && <div className="text-xs text-muted-foreground" dir="rtl">
                          {include.title_he}
                        </div>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch checked={include.published} onCheckedChange={() => togglePublishedMutation.mutate({
                id: include.id,
                published: !include.published
              })} />
                      <Button type="button" size="icon" variant="ghost" onClick={() => startEditing(include)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => deleteMutation.mutate(include.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </>}
              </div>)}
          </div>}
      </CardContent>
    </Card>;
};
export default IncludesManager;