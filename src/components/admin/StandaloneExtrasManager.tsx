/**
 * StandaloneExtrasManager
 * Gestion des extras propres à une expérience standalone.
 * Pas de catalogue hôtel — chaque expérience a ses propres extras.
 * Table : standalone_extras
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

export interface LocalExtraEntry {
  _localId: string;
  title: string;
  title_fr: string;
  title_he: string;
  description: string;
  price: number;
  currency: string;
  is_available: boolean;
  sort_order: number;
}

interface Props {
  experienceId?: string;
  localExtras?: LocalExtraEntry[];
  onLocalExtrasChange?: (extras: LocalExtraEntry[]) => void;
}

const EMPTY_FORM = { title: "", title_fr: "", title_he: "", description: "", price: 0, currency: "ILS" };

const StandaloneExtrasManager = ({ experienceId, localExtras, onLocalExtrasChange }: Props) => {
  const queryClient = useQueryClient();
  const isLocalMode = !experienceId;

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState(EMPTY_FORM);

  const { data: extras, isLoading } = useQuery({
    queryKey: ["standalone-extras", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_extras")
        .select("*")
        .eq("experience_id", experienceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  const displayItems: any[] = isLocalMode
    ? (localExtras || []).map((e) => ({ ...e, id: e._localId }))
    : (extras || []);

  // ── Local mode ─────────────────────────────────────────────────────────────

  const handleLocalAdd = () => {
    if (!form.title.trim()) { toast.error("Le titre est requis"); return; }
    const entry: LocalExtraEntry = {
      _localId: `local-${Date.now()}`,
      title: form.title,
      title_fr: form.title_fr,
      title_he: form.title_he,
      description: form.description,
      price: form.price,
      currency: form.currency,
      is_available: true,
      sort_order: localExtras?.length || 0,
    };
    onLocalExtrasChange?.([...(localExtras || []), entry]);
    setForm(EMPTY_FORM);
    toast.success("Extra ajouté");
  };

  const handleLocalDelete = (localId: string) => {
    onLocalExtrasChange?.((localExtras || []).filter((e) => e._localId !== localId));
  };

  const handleLocalReorder = (id: string, direction: "up" | "down") => {
    const items = [...(localExtras || [])];
    const idx = items.findIndex((e) => e._localId === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    items.forEach((item, i) => { item.sort_order = i; });
    onLocalExtrasChange?.(items);
  };

  // ── DB mutations ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Le titre est requis");
      const maxOrder = extras?.length ? Math.max(...extras.map((e: any) => e.sort_order)) : -1;
      const { error } = await (supabase as any).from("standalone_extras").insert([{
        experience_id: experienceId,
        title: form.title,
        title_fr: form.title_fr || null,
        title_he: form.title_he || null,
        description: form.description || null,
        price: form.price,
        currency: form.currency,
        is_available: true,
        sort_order: maxOrder + 1,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-extras", experienceId] });
      setForm(EMPTY_FORM);
      toast.success("Extra ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await (supabase as any).from("standalone_extras").update({
        title: editData.title,
        title_fr: editData.title_fr || null,
        title_he: editData.title_he || null,
        description: editData.description || null,
        price: editData.price,
        currency: editData.currency,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-extras", experienceId] });
      setEditingId(null);
      setEditData(EMPTY_FORM);
      toast.success("Extra mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("standalone_extras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-extras", experienceId] }); toast.success("Extra supprimé"); },
    onError: () => toast.error("Impossible de supprimer"),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = displayItems.findIndex((e: any) => e.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= displayItems.length) return;
      const a = displayItems[idx];
      const b = displayItems[swapIdx];
      await Promise.all([
        (supabase as any).from("standalone_extras").update({ sort_order: b.sort_order }).eq("id", a.id),
        (supabase as any).from("standalone_extras").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["standalone-extras", experienceId] }),
    onError: () => toast.error("Réorganisation échouée"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await (supabase as any).from("standalone_extras").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-extras", experienceId] }); },
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
    setEditData({
      title: item.title || "",
      title_fr: item.title_fr || "",
      title_he: item.title_he || "",
      description: item.description || "",
      price: item.price ?? 0,
      currency: item.currency || "ILS",
    });
  };

  if (!isLocalMode && isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Ajouter un extra</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Titre (EN) *</Label>
            <Input placeholder="ex: Airport Transfer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Titre (FR)</Label>
            <Input placeholder="ex: Transfert aéroport" value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Titre (HE)</Label>
            <Input placeholder="העברה לשדה התעופה" value={form.title_he} onChange={(e) => setForm({ ...form, title_he: e.target.value })} dir="rtl" className="bg-hebrew-input" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Description</Label>
            <Input placeholder="Détails optionnels…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Prix</Label>
            <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Devise</Label>
            <Input placeholder="ILS" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} />
          </div>
        </div>
        <Button type="button" onClick={handleAdd} disabled={createMutation.isPending || !form.title.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter l'extra
        </Button>
      </div>

      {/* Liste */}
      {displayItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm italic">Aucun extra pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item: any, idx: number) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                item.is_available !== false ? "border-primary bg-primary/5" : "border-border bg-card opacity-60"
              }`}
            >
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} placeholder="Titre EN" />
                  <Input value={editData.title_fr} onChange={(e) => setEditData({ ...editData, title_fr: e.target.value })} placeholder="Titre FR" />
                  <Input value={editData.title_he} onChange={(e) => setEditData({ ...editData, title_he: e.target.value })} placeholder="כותרת" dir="rtl" className="bg-hebrew-input" />
                  <Input value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} placeholder="Description" />
                  <Input type="number" min={0} value={editData.price} onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })} placeholder="Prix" />
                  <Input value={editData.currency} onChange={(e) => setEditData({ ...editData, currency: e.target.value.toUpperCase() })} placeholder="ILS" maxLength={3} />
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <Button type="button" size="sm" onClick={() => { if (!editData.title.trim()) { toast.error("Titre requis"); return; } updateMutation.mutate({ id: item.id }); }} disabled={updateMutation.isPending}><Save className="w-4 h-4" /></Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData(EMPTY_FORM); }}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                /* Mode lecture */
                <>
                  {!isLocalMode && (
                    <Switch
                      checked={item.is_available !== false}
                      onCheckedChange={() => toggleMutation.mutate({ id: item.id, is_available: !item.is_available })}
                      disabled={toggleMutation.isPending}
                      className="flex-shrink-0 mt-0.5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.title}</div>
                    {item.title_fr && <div className="text-xs text-muted-foreground">{item.title_fr}</div>}
                    {item.title_he && <div className="text-xs text-muted-foreground" dir="rtl">{item.title_he}</div>}
                    {item.description && <div className="text-xs text-muted-foreground mt-0.5 italic">{item.description}</div>}
                  </div>
                  <div className="text-sm font-semibold text-primary flex-shrink-0">
                    {item.price} {item.currency}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isLocalMode && (
                      <Button type="button" size="icon" variant="ghost" onClick={() => startEditing(item)}><Edit2 className="w-4 h-4" /></Button>
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

export default StandaloneExtrasManager;
