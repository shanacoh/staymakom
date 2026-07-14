/**
 * IncludesManagerStandalone
 * Même UI que IncludesManager2, branché sur standalone_experience_includes.
 * Pas de HotelPhotoPickerDialog (pas d'hôtel lié).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { buildImageFileName } from "@/lib/utils";

export interface LocalIncludeEntry {
  _localId: string;
  title: string;
  title_fr: string;
  title_he: string;
  icon_url: string;
  published: boolean;
  order_index: number;
}

interface Props {
  experienceId?: string;
  localIncludes?: LocalIncludeEntry[];
  onLocalIncludesChange?: (includes: LocalIncludeEntry[]) => void;
}

const IncludesManagerStandalone = ({ experienceId, localIncludes, onLocalIncludesChange }: Props) => {
  const queryClient = useQueryClient();
  const isLocalMode = !experienceId;

  const [newInclude, setNewInclude] = useState({ title: "", title_fr: "", title_he: "", icon_url: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", title_fr: "", title_he: "", icon_url: "" });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const { data: includes, isLoading } = useQuery({
    queryKey: ["standalone-includes", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experience_includes")
        .select("*")
        .eq("experience_id", experienceId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  const displayItems: any[] = isLocalMode
    ? (localIncludes || []).map((li) => ({ ...li, id: li._localId }))
    : (includes || []);

  const uploadImage = async (file: File, itemTitle?: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = buildImageFileName(itemTitle, fileExt);
    const { error: uploadError } = await supabase.storage.from("experience-images").upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("experience-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── Local mode ─────────────────────────────────────────────────────────────

  const handleLocalAdd = async () => {
    if (!newInclude.title.trim()) { toast.error("Le titre est requis"); return; }
    let imageUrl = newInclude.icon_url;
    if (imageFile) {
      setIsUploading(true);
      try { imageUrl = await uploadImage(imageFile, newInclude.title); } catch { toast.error("Upload échoué"); setIsUploading(false); return; }
      setIsUploading(false);
    }
    const entry: LocalIncludeEntry = {
      _localId: `local-${Date.now()}`,
      title: newInclude.title,
      title_fr: newInclude.title_fr,
      title_he: newInclude.title_he,
      icon_url: imageUrl,
      published: true,
      order_index: localIncludes?.length || 0,
    };
    onLocalIncludesChange?.([...(localIncludes || []), entry]);
    setNewInclude({ title: "", title_fr: "", title_he: "", icon_url: "" });
    setImageFile(null);
    setImagePreview(null);
    toast.success("Élément ajouté");
  };

  const handleLocalDelete = (localId: string) => {
    onLocalIncludesChange?.((localIncludes || []).filter((i) => i._localId !== localId));
  };

  const handleLocalReorder = (id: string, direction: "up" | "down") => {
    const items = [...(localIncludes || [])];
    const idx = items.findIndex((i) => i._localId === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    items.forEach((item, i) => { item.order_index = i; });
    onLocalIncludesChange?.(items);
  };

  // ── DB mutations ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newInclude.title.trim()) throw new Error("Le titre est requis");
      setIsUploading(true);
      let imageUrl = newInclude.icon_url;
      if (imageFile) imageUrl = await uploadImage(imageFile, newInclude.title);
      const maxOrder = includes?.length ? Math.max(...includes.map((i: any) => i.order_index)) : -1;
      const { error } = await (supabase as any).from("standalone_experience_includes").insert([{
        experience_id: experienceId,
        title: newInclude.title,
        title_fr: newInclude.title_fr || null,
        title_he: newInclude.title_he || null,
        icon_url: imageUrl || null,
        order_index: maxOrder + 1,
        published: true,
      }]);
      if (error) throw error;
      setIsUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-includes", experienceId] });
      setNewInclude({ title: "", title_fr: "", title_he: "", icon_url: "" });
      setImageFile(null);
      setImagePreview(null);
      toast.success("Élément ajouté");
    },
    onError: (e: Error) => { setIsUploading(false); toast.error(e.message); },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      title: string;
      title_fr: string;
      title_he: string;
      icon_url: string;
      imageFile?: File | null;
      closeAfter?: boolean;
      silent?: boolean;
    }) => {
      let finalIconUrl = payload.icon_url || null;
      if (payload.imageFile) finalIconUrl = await uploadImage(payload.imageFile, payload.title);
      const { error } = await (supabase as any).from("standalone_experience_includes").update({
        title: payload.title,
        title_fr: payload.title_fr || null,
        title_he: payload.title_he || null,
        icon_url: finalIconUrl,
      }).eq("id", payload.id);
      if (error) throw error;
      return finalIconUrl;
    },
    onSuccess: (finalIconUrl, payload) => {
      queryClient.invalidateQueries({ queryKey: ["standalone-includes", experienceId] });
      if (payload.imageFile) {
        // L'image vient d'être uploadée : on synchronise l'aperçu sans fermer la ligne d'édition
        setEditData((prev) => ({ ...prev, icon_url: finalIconUrl || "" }));
        setEditImageFile(null);
      }
      if (payload.closeAfter) {
        setEditingId(null);
        setEditData({ title: "", title_fr: "", title_he: "", icon_url: "" });
        setEditImageFile(null);
        setEditImagePreview(null);
      }
      if (!payload.silent) toast.success("Élément mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commitEdit = (id: string, opts?: { imageFile?: File | null; closeAfter?: boolean; silent?: boolean }) => {
    if (!editData.title.trim()) return;
    updateMutation.mutate({
      id,
      title: editData.title,
      title_fr: editData.title_fr,
      title_he: editData.title_he,
      icon_url: editData.icon_url,
      imageFile: opts?.imageFile ?? null,
      closeAfter: opts?.closeAfter ?? false,
      silent: opts?.silent ?? true,
    });
  };

  const handleCloseEditing = (id: string) => {
    if (!editData.title.trim()) { cancelEditing(); return; }
    commitEdit(id, { closeAfter: true, silent: true });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("standalone_experience_includes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-includes", experienceId] }); toast.success("Élément supprimé"); },
    onError: () => toast.error("Impossible de supprimer"),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = displayItems.findIndex((i: any) => i.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= displayItems.length) return;
      const a = displayItems[idx];
      const b = displayItems[swapIdx];
      await Promise.all([
        (supabase as any).from("standalone_experience_includes").update({ order_index: b.order_index }).eq("id", a.id),
        (supabase as any).from("standalone_experience_includes").update({ order_index: a.order_index }).eq("id", b.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["standalone-includes", experienceId] }),
    onError: () => toast.error("Réorganisation échouée"),
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await (supabase as any).from("standalone_experience_includes").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-includes", experienceId] }); toast.success("Mis à jour"); },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (isLocalMode) handleLocalAdd();
    else createMutation.mutate();
  };

  const handleDelete = (id: string) => {
    if (isLocalMode) handleLocalDelete(id);
    else deleteMutation.mutate(id);
  };

  const handleReorder = (id: string, direction: "up" | "down") => {
    if (isLocalMode) handleLocalReorder(id, direction);
    else reorderMutation.mutate({ id, direction });
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditData({ title: item.title || "", title_fr: item.title_fr || "", title_he: item.title_he || "", icon_url: item.icon_url || "" });
    setEditImagePreview(item.icon_url);
    setEditImageFile(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ title: "", title_fr: "", title_he: "", icon_url: "" });
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  if (!isLocalMode && isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Ajouter un élément</h4>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-32 flex-shrink-0 space-y-2">
            <Label className="text-sm">Image</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => document.getElementById("standalone-include-image")?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
            <input id="standalone-include-image" type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                setNewInclude((p) => ({ ...p, icon_url: "" }));
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-16 object-cover rounded-lg border" referrerPolicy="no-referrer" />
                <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background" onClick={() => { setImageFile(null); setImagePreview(null); setNewInclude((p) => ({ ...p, icon_url: "" })); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[120px] space-y-1">
            <Label className="text-sm">Titre (EN) *</Label>
            <Input placeholder="ex: Breakfast included" value={newInclude.title} onChange={(e) => setNewInclude({ ...newInclude, title: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[120px] space-y-1">
            <Label className="text-sm">Titre (FR)</Label>
            <Input placeholder="ex: Petit-déjeuner inclus" value={newInclude.title_fr} onChange={(e) => setNewInclude({ ...newInclude, title_fr: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[120px] space-y-1">
            <Label className="text-sm">Titre (HE)</Label>
            <Input placeholder="למשל: ארוחת בוקר כלולה" value={newInclude.title_he} onChange={(e) => setNewInclude({ ...newInclude, title_he: e.target.value })} dir="rtl" className="bg-hebrew-input" />
          </div>
          <Button type="button" onClick={handleAdd} disabled={createMutation.isPending || isUploading || !newInclude.title.trim()} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            {isUploading ? "Upload…" : "Ajouter"}
          </Button>
        </div>
      </div>

      {/* Liste */}
      {displayItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm italic">Aucun élément pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item: any, idx: number) => (
            <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
              {/* Réordonnancement */}
              <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                <button type="button" onClick={() => handleReorder(item.id, "up")} disabled={idx === 0} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => handleReorder(item.id, "down")} disabled={idx === displayItems.length - 1} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {editingId === item.id && !isLocalMode ? (
                /* Mode édition */
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  <div className="w-24 flex-shrink-0 space-y-1">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => document.getElementById(`edit-standalone-img-${item.id}`)?.click()}>
                      <Upload className="w-4 h-4" />
                    </Button>
                    <input id={`edit-standalone-img-${item.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setEditImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                        commitEdit(item.id, { imageFile: file, silent: false });
                      }
                    }} />
                    {editImagePreview && <img src={editImagePreview} alt="Preview" className="w-full h-16 object-cover rounded-lg border" referrerPolicy="no-referrer" />}
                  </div>
                  <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} onBlur={() => commitEdit(item.id)} placeholder="Titre EN" className="flex-1 min-w-[100px]" />
                  <Input value={editData.title_fr} onChange={(e) => setEditData({ ...editData, title_fr: e.target.value })} onBlur={() => commitEdit(item.id)} placeholder="Titre FR" className="flex-1 min-w-[100px]" />
                  <Input value={editData.title_he} onChange={(e) => setEditData({ ...editData, title_he: e.target.value })} onBlur={() => commitEdit(item.id)} placeholder="כותרת HE" dir="rtl" className="bg-hebrew-input flex-1 min-w-[100px]" />
                  <div className="flex gap-2 flex-shrink-0">
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleCloseEditing(item.id)}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                /* Mode lecture */
                <>
                  {item.icon_url && <img src={item.icon_url} alt={item.title} className="w-12 h-12 object-cover rounded flex-shrink-0" referrerPolicy="no-referrer" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.title}</div>
                    {item.title_fr && <div className="text-xs text-muted-foreground">{item.title_fr}</div>}
                    {item.title_he && <div className="text-xs text-muted-foreground" dir="rtl">{item.title_he}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isLocalMode && (
                      <>
                        <Switch checked={item.published} onCheckedChange={() => togglePublishedMutation.mutate({ id: item.id, published: !item.published })} />
                        <Button type="button" size="icon" variant="ghost" onClick={() => startEditing(item)}><Edit2 className="w-4 h-4" /></Button>
                      </>
                    )}
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default IncludesManagerStandalone;
