/**
 * StandaloneRateOptionsManager
 * Gestion des options tarifaires d'une expérience standalone : une liste libre
 * de formules (libellé + prix), ex: "12h — Menu Découverte" à 150₪.
 * Prix géré comme le prix principal de la fiche : coût fournisseur × marge
 * (marge partagée avec la carte "Prix de l'expérience") = prix client.
 * Table : standalone_rate_options
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

interface Props {
  experienceId?: string;
  hasChildPrice?: boolean;
  markupPercent: number;
}

const EMPTY_FORM = { label: "", label_fr: "", label_he: "", supplier_price_adult: 0, supplier_price_child: 0 };

function computeSellPrice(supplierPrice: number, markupPercent: number): number {
  return Math.round(supplierPrice * (1 + markupPercent / 100) * 100) / 100;
}

const StandaloneRateOptionsManager = ({ experienceId, hasChildPrice, markupPercent }: Props) => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState(EMPTY_FORM);

  const { data: options, isLoading } = useQuery({
    queryKey: ["standalone-rate-options", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_rate_options")
        .select("*")
        .eq("experience_id", experienceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  const displayItems: any[] = options || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.label.trim()) throw new Error("Le libellé est requis");
      const maxOrder = displayItems.length ? Math.max(...displayItems.map((o) => o.sort_order)) : -1;
      const { error } = await (supabase as any).from("standalone_rate_options").insert([{
        experience_id: experienceId,
        label: form.label,
        label_fr: form.label_fr || null,
        label_he: form.label_he || null,
        supplier_price_adult: form.supplier_price_adult,
        supplier_price_child: hasChildPrice ? form.supplier_price_child : null,
        price_adult: computeSellPrice(form.supplier_price_adult, markupPercent),
        price_child: hasChildPrice ? computeSellPrice(form.supplier_price_child, markupPercent) : null,
        is_available: true,
        sort_order: maxOrder + 1,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-rate-options", experienceId] });
      setForm(EMPTY_FORM);
      toast.success("Option tarifaire ajoutée");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await (supabase as any).from("standalone_rate_options").update({
        label: editData.label,
        label_fr: editData.label_fr || null,
        label_he: editData.label_he || null,
        supplier_price_adult: editData.supplier_price_adult,
        supplier_price_child: hasChildPrice ? editData.supplier_price_child : null,
        price_adult: computeSellPrice(editData.supplier_price_adult, markupPercent),
        price_child: hasChildPrice ? computeSellPrice(editData.supplier_price_child, markupPercent) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-rate-options", experienceId] });
      setEditingId(null);
      setEditData(EMPTY_FORM);
      toast.success("Option mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("standalone_rate_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-rate-options", experienceId] }); toast.success("Option supprimée"); },
    onError: () => toast.error("Impossible de supprimer"),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = displayItems.findIndex((o) => o.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= displayItems.length) return;
      const a = displayItems[idx];
      const b = displayItems[swapIdx];
      await Promise.all([
        (supabase as any).from("standalone_rate_options").update({ sort_order: b.sort_order }).eq("id", a.id),
        (supabase as any).from("standalone_rate_options").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["standalone-rate-options", experienceId] }),
    onError: () => toast.error("Réorganisation échouée"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await (supabase as any).from("standalone_rate_options").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-rate-options", experienceId] }); },
  });

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditData({
      label: item.label || "",
      label_fr: item.label_fr || "",
      label_he: item.label_he || "",
      supplier_price_adult: item.supplier_price_adult ?? 0,
      supplier_price_child: item.supplier_price_child ?? 0,
    });
  };

  if (!experienceId) {
    return (
      <p className="text-muted-foreground text-center py-4 text-sm italic">
        Sauvegardez d'abord l'expérience (brouillon) pour pouvoir ajouter des options tarifaires.
      </p>
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Ajouter une option tarifaire</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Libellé (EN) *</Label>
            <Input placeholder="ex: 12pm — Tasting Menu" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Libellé (FR)</Label>
            <Input placeholder="ex: 12h — Menu Découverte" value={form.label_fr} onChange={(e) => setForm({ ...form, label_fr: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Libellé (HE)</Label>
            <Input placeholder="12:00 - תפריט טעימות" value={form.label_he} onChange={(e) => setForm({ ...form, label_he: e.target.value })} dir="rtl" className="bg-hebrew-input" />
          </div>
          <div />
          <div className="space-y-1">
            <Label className="text-sm">Prix fournisseur / adulte</Label>
            <Input type="number" min={0} value={form.supplier_price_adult} onChange={(e) => setForm({ ...form, supplier_price_adult: parseFloat(e.target.value) || 0 })} />
            <p className="text-xs text-muted-foreground">
              Prix client (marge {markupPercent}%) : <span className="font-semibold text-primary">{computeSellPrice(form.supplier_price_adult, markupPercent)}</span>
            </p>
          </div>
          {hasChildPrice && (
            <div className="space-y-1">
              <Label className="text-sm">Prix fournisseur / enfant</Label>
              <Input type="number" min={0} value={form.supplier_price_child} onChange={(e) => setForm({ ...form, supplier_price_child: parseFloat(e.target.value) || 0 })} />
              <p className="text-xs text-muted-foreground">
                Prix client (marge {markupPercent}%) : <span className="font-semibold text-primary">{computeSellPrice(form.supplier_price_child, markupPercent)}</span>
              </p>
            </div>
          )}
        </div>
        <Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.label.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter l'option
        </Button>
      </div>

      {/* Liste */}
      {displayItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm italic">Aucune option tarifaire pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item: any, idx: number) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                item.is_available !== false ? "border-primary bg-primary/5" : "border-border bg-card opacity-60"
              }`}
            >
              <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                <button type="button" onClick={() => reorderMutation.mutate({ id: item.id, direction: "up" })} disabled={idx === 0} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => reorderMutation.mutate({ id: item.id, direction: "down" })} disabled={idx === displayItems.length - 1} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {editingId === item.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input value={editData.label} onChange={(e) => setEditData({ ...editData, label: e.target.value })} placeholder="Libellé EN" />
                  <Input value={editData.label_fr} onChange={(e) => setEditData({ ...editData, label_fr: e.target.value })} placeholder="Libellé FR" />
                  <Input value={editData.label_he} onChange={(e) => setEditData({ ...editData, label_he: e.target.value })} placeholder="תווית" dir="rtl" className="bg-hebrew-input" />
                  <div />
                  <div className="space-y-1">
                    <Input type="number" min={0} value={editData.supplier_price_adult} onChange={(e) => setEditData({ ...editData, supplier_price_adult: parseFloat(e.target.value) || 0 })} placeholder="Prix fournisseur adulte" />
                    <p className="text-xs text-muted-foreground">
                      Prix client : <span className="font-semibold text-primary">{computeSellPrice(editData.supplier_price_adult, markupPercent)}</span>
                    </p>
                  </div>
                  {hasChildPrice && (
                    <div className="space-y-1">
                      <Input type="number" min={0} value={editData.supplier_price_child} onChange={(e) => setEditData({ ...editData, supplier_price_child: parseFloat(e.target.value) || 0 })} placeholder="Prix fournisseur enfant" />
                      <p className="text-xs text-muted-foreground">
                        Prix client : <span className="font-semibold text-primary">{computeSellPrice(editData.supplier_price_child, markupPercent)}</span>
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <Button type="button" size="sm" onClick={() => { if (!editData.label.trim()) { toast.error("Libellé requis"); return; } updateMutation.mutate({ id: item.id }); }} disabled={updateMutation.isPending}><Save className="w-4 h-4" /></Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData(EMPTY_FORM); }}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <Switch
                    checked={item.is_available !== false}
                    onCheckedChange={() => toggleMutation.mutate({ id: item.id, is_available: !item.is_available })}
                    disabled={toggleMutation.isPending}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.label}</div>
                    {item.label_fr && <div className="text-xs text-muted-foreground">{item.label_fr}</div>}
                    {item.label_he && <div className="text-xs text-muted-foreground" dir="rtl">{item.label_he}</div>}
                  </div>
                  <div className="text-sm font-semibold text-primary flex-shrink-0 text-right">
                    <div>{item.price_adult} / adulte</div>
                    {hasChildPrice && item.price_child != null && (
                      <div className="text-xs font-normal">{item.price_child} / enfant</div>
                    )}
                    {item.supplier_price_adult != null && (
                      <div className="text-[11px] font-normal text-muted-foreground">coût: {item.supplier_price_adult}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button type="button" size="icon" variant="ghost" onClick={() => startEditing(item)}><Edit2 className="w-4 h-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default StandaloneRateOptionsManager;
