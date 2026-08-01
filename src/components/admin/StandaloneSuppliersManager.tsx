/**
 * StandaloneSuppliersManager
 * Liste des prestataires proposant la même expérience (ex: un bateau
 * disponible chez plusieurs loueurs à des prix différents), avec leur
 * contact WhatsApp. Un seul prestataire est marqué "principal" (étoile) :
 * c'est son prix qui sert de référence pour la suggestion de prix de vente
 * (voir StandaloneExperienceForm). Le prix de vente reste fixé manuellement
 * sur la fiche (base_price) ; chaque ligne affiche l'écart en % et en
 * montant entre ce prix de vente et le prix du prestataire.
 * Table : standalone_experience_suppliers
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Save, X, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  experienceId?: string;
  sellPrice: number;
  currencySymbol?: string;
}

const EMPTY_FORM = { supplier_name: "", whatsapp: "", price: 0 };

function computeGap(sellPrice: number, price: number): { percent: number | null; amount: number } {
  const amount = Math.round((sellPrice - price) * 100) / 100;
  const percent = price > 0 ? Math.round(((sellPrice - price) / price) * 1000) / 10 : null;
  return { percent, amount };
}

const StandaloneSuppliersManager = ({ experienceId, sellPrice, currencySymbol = "" }: Props) => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState(EMPTY_FORM);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["standalone-experience-suppliers", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experience_suppliers")
        .select("*")
        .eq("experience_id", experienceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  const displayItems: any[] = suppliers || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.supplier_name.trim()) throw new Error("Le nom du prestataire est requis");
      const maxOrder = displayItems.length ? Math.max(...displayItems.map((s) => s.sort_order)) : -1;
      const { error } = await (supabase as any).from("standalone_experience_suppliers").insert([{
        experience_id: experienceId,
        supplier_name: form.supplier_name,
        whatsapp: form.whatsapp || null,
        price: form.price,
        is_active: true,
        // Le tout premier prestataire ajouté devient automatiquement principal.
        is_primary: displayItems.length === 0,
        sort_order: maxOrder + 1,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-experience-suppliers", experienceId] });
      setForm(EMPTY_FORM);
      toast.success("Prestataire ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await (supabase as any).from("standalone_experience_suppliers").update({
        supplier_name: editData.supplier_name,
        whatsapp: editData.whatsapp || null,
        price: editData.price,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-experience-suppliers", experienceId] });
      setEditingId(null);
      setEditData(EMPTY_FORM);
      toast.success("Prestataire mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await (supabase as any).from("standalone_experience_suppliers").delete().eq("id", item.id);
      if (error) throw error;
      // Si on supprime le principal, on désigne automatiquement le suivant
      // pour ne jamais laisser le calcul de marge sans référence.
      if (item.is_primary) {
        const next = displayItems.find((s) => s.id !== item.id);
        if (next) {
          await (supabase as any).from("standalone_experience_suppliers").update({ is_primary: true }).eq("id", next.id);
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-experience-suppliers", experienceId] }); toast.success("Prestataire supprimé"); },
    onError: () => toast.error("Impossible de supprimer"),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = displayItems.findIndex((s) => s.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= displayItems.length) return;
      const a = displayItems[idx];
      const b = displayItems[swapIdx];
      await Promise.all([
        (supabase as any).from("standalone_experience_suppliers").update({ sort_order: b.sort_order }).eq("id", a.id),
        (supabase as any).from("standalone_experience_suppliers").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["standalone-experience-suppliers", experienceId] }),
    onError: () => toast.error("Réorganisation échouée"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("standalone_experience_suppliers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["standalone-experience-suppliers", experienceId] }); },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      // On retire d'abord l'étoile des autres, puis on la pose sur celui
      // choisi (jamais les deux à la fois : un seul principal à tout moment).
      const { error: clearError } = await (supabase as any)
        .from("standalone_experience_suppliers")
        .update({ is_primary: false })
        .eq("experience_id", experienceId)
        .neq("id", id);
      if (clearError) throw clearError;
      const { error } = await (supabase as any).from("standalone_experience_suppliers").update({ is_primary: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standalone-experience-suppliers", experienceId] });
      toast.success("Prestataire principal mis à jour");
    },
    onError: () => toast.error("Impossible de définir le prestataire principal"),
  });

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditData({
      supplier_name: item.supplier_name || "",
      whatsapp: item.whatsapp || "",
      price: item.price ?? 0,
    });
  };

  if (!experienceId) {
    return (
      <p className="text-muted-foreground text-center py-4 text-sm italic">
        Sauvegardez d'abord le bateau (brouillon) pour pouvoir ajouter des prestataires.
      </p>
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Ajouter un prestataire</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Société / prestataire *</Label>
            <Input placeholder="ex: BALAGUNA" value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">WhatsApp</Label>
            <Input placeholder="ex: +972 50 000 0000" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Prix</Label>
            <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.supplier_name.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter le prestataire
        </Button>
      </div>

      {/* Liste */}
      {displayItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm italic">Aucun prestataire pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item: any, idx: number) => {
            const { percent, amount } = computeGap(sellPrice, item.price);
            const isLoss = percent != null && percent < 0;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                  item.is_active !== false ? "border-primary bg-primary/5" : "border-border bg-card opacity-60"
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
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input value={editData.supplier_name} onChange={(e) => setEditData({ ...editData, supplier_name: e.target.value })} placeholder="Société / prestataire" />
                    <Input value={editData.whatsapp} onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })} placeholder="WhatsApp" />
                    <Input type="number" min={0} value={editData.price} onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })} placeholder="Prix" />
                    <div className="md:col-span-3 flex gap-2 justify-end">
                      <Button type="button" size="sm" onClick={() => { if (!editData.supplier_name.trim()) { toast.error("Nom requis"); return; } updateMutation.mutate({ id: item.id }); }} disabled={updateMutation.isPending}><Save className="w-4 h-4" /></Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData(EMPTY_FORM); }}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Switch
                      checked={item.is_active !== false}
                      onCheckedChange={() => toggleMutation.mutate({ id: item.id, is_active: !item.is_active })}
                      disabled={toggleMutation.isPending}
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        {item.supplier_name}
                        {item.is_primary && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400 px-1.5 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-current" /> Principal
                          </span>
                        )}
                      </div>
                      {item.whatsapp && <div className="text-xs text-muted-foreground">WhatsApp : {item.whatsapp}</div>}
                    </div>
                    <div className="text-sm font-semibold flex-shrink-0 text-right">
                      <div>{item.price} {currencySymbol}</div>
                      <div className={cn("text-xs font-normal", isLoss ? "text-destructive" : "text-primary")}>
                        {percent != null ? `${percent > 0 ? "+" : ""}${percent}%` : "—"}
                        {" · "}
                        {amount > 0 ? "+" : ""}{amount} {currencySymbol}
                      </div>
                      <div className="text-[11px] font-normal text-muted-foreground">vs prix de vente</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Définir comme prestataire principal"
                        onClick={() => setPrimaryMutation.mutate(item.id)}
                        disabled={item.is_primary || setPrimaryMutation.isPending}
                      >
                        <Star className={cn("w-4 h-4", item.is_primary && "fill-amber-500 text-amber-500")} />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => startEditing(item)}><Edit2 className="w-4 h-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StandaloneSuppliersManager;
