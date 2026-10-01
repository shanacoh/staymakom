/**
 * BoatPriceVariantsManager
 * Variantes de prix par durée pour une expérience sur demande (usage principal : bateaux).
 * Chaque variante a sa propre capacité max, son prix d'achat (peut manquer) et son prix
 * de vente (prix de groupe, pas par personne). La marge se calcule automatiquement dessus,
 * en ₪, en % et par heure. Remplace à terme les champs de prix uniques sur la fiche.
 * Table : standalone_experience_price_variants
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  experienceId?: string;
  currencySymbol?: string;
}

type PriceVariant = {
  id: string;
  duration_label: string;
  duration_minutes: number | null;
  max_capacity: number;
  purchase_price: number | null;
  sale_price: number;
};

type FormState = {
  duration_minutes: number;
  duration_label: string;
  max_capacity: number;
  purchase_price: string;
  sale_price: number;
};

const DURATION_PRESETS = [
  { minutes: 60, label: "1h" },
  { minutes: 90, label: "1h30" },
  { minutes: 120, label: "2h" },
  { minutes: 180, label: "3h" },
  { minutes: 240, label: "4h" },
];

const EMPTY_FORM: FormState = { duration_minutes: 60, duration_label: "1h", max_capacity: 0, purchase_price: "", sale_price: 0 };

function computeMargin(salePrice: number, purchasePrice: number | null, durationMinutes: number | null) {
  if (purchasePrice == null) return { amount: null, percent: null, perHour: null };
  const amount = Math.round((salePrice - purchasePrice) * 100) / 100;
  const percent = purchasePrice > 0 ? Math.round((amount / purchasePrice) * 1000) / 10 : null;
  const perHour = durationMinutes ? Math.round((amount / (durationMinutes / 60)) * 100) / 100 : null;
  return { amount, percent, perHour };
}

export default function BoatPriceVariantsManager({ experienceId, currencySymbol = "₪" }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<FormState>(EMPTY_FORM);

  const queryKey = ["standalone-experience-price-variants", experienceId];

  const { data: variants, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experience_price_variants")
        .select("*")
        .eq("experience_id", experienceId as string)
        .order("duration_minutes", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as PriceVariant[];
    },
    enabled: !!experienceId,
  });

  const list = variants ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.max_capacity || form.max_capacity <= 0) throw new Error("Capacité max requise");
      if (!form.sale_price || form.sale_price <= 0) throw new Error("Prix de vente requis");
      const { error } = await supabase.from("standalone_experience_price_variants").insert({
        experience_id: experienceId as string,
        duration_label: form.duration_label,
        duration_minutes: form.duration_minutes,
        max_capacity: form.max_capacity,
        purchase_price: form.purchase_price === "" ? null : Number(form.purchase_price),
        sale_price: form.sale_price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm(EMPTY_FORM);
      toast.success("Variante ajoutée");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("standalone_experience_price_variants")
        .update({
          duration_label: editData.duration_label,
          duration_minutes: editData.duration_minutes,
          max_capacity: editData.max_capacity,
          purchase_price: editData.purchase_price === "" ? null : Number(editData.purchase_price),
          sale_price: editData.sale_price,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
      toast.success("Variante mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("standalone_experience_price_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Variante supprimée");
    },
    onError: () => toast.error("Impossible de supprimer"),
  });

  const startEditing = (item: PriceVariant) => {
    setEditingId(item.id);
    setEditData({
      duration_minutes: item.duration_minutes ?? 60,
      duration_label: item.duration_label,
      max_capacity: item.max_capacity,
      purchase_price: item.purchase_price == null ? "" : String(item.purchase_price),
      sale_price: item.sale_price,
    });
  };

  const applyPreset = (minutes: number, setter: (f: FormState) => void, current: FormState) => {
    const preset = DURATION_PRESETS.find((p) => p.minutes === minutes);
    setter({ ...current, duration_minutes: minutes, duration_label: preset?.label ?? current.duration_label });
  };

  if (!experienceId) {
    return (
      <p className="text-muted-foreground text-center py-4 text-sm italic">
        Sauvegardez d'abord la fiche (brouillon) pour pouvoir ajouter des variantes de prix.
      </p>
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Ajouter une durée</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Durée</Label>
            <Select
              value={String(form.duration_minutes)}
              onValueChange={(v) => applyPreset(Number(v), setForm, form)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_PRESETS.map((p) => (
                  <SelectItem key={p.minutes} value={String(p.minutes)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Capacité max *</Label>
            <Input type="number" min={1} value={form.max_capacity || ""} onChange={(e) => setForm({ ...form, max_capacity: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Prix d'achat</Label>
            <Input type="number" min={0} placeholder="Coût manquant" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Prix de vente (groupe) *</Label>
            <Input type="number" min={0} value={form.sale_price || ""} onChange={(e) => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm italic">Aucune variante de prix pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {list.map((item) => {
            const margin = computeMargin(item.sale_price, item.purchase_price, item.duration_minutes);
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg border-border bg-card">
                {isEditing ? (
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Select value={String(editData.duration_minutes)} onValueChange={(v) => applyPreset(Number(v), setEditData, editData)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DURATION_PRESETS.map((p) => (
                          <SelectItem key={p.minutes} value={String(p.minutes)}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" min={1} value={editData.max_capacity} onChange={(e) => setEditData({ ...editData, max_capacity: parseInt(e.target.value) || 0 })} placeholder="Capacité max" />
                    <Input type="number" min={0} value={editData.purchase_price} onChange={(e) => setEditData({ ...editData, purchase_price: e.target.value })} placeholder="Prix d'achat" />
                    <Input type="number" min={0} value={editData.sale_price} onChange={(e) => setEditData({ ...editData, sale_price: parseFloat(e.target.value) || 0 })} placeholder="Prix de vente" />
                    <div className="md:col-span-4 flex gap-2 justify-end">
                      <Button type="button" size="sm" onClick={() => updateMutation.mutate(item.id)} disabled={updateMutation.isPending}><Save className="w-4 h-4" /></Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.duration_label} · jusqu'à {item.max_capacity} pers.</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.purchase_price != null ? `Achat : ${item.purchase_price} ${currencySymbol}` : (
                          <span className="text-destructive font-medium">Coût manquant</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold flex-shrink-0 text-right">
                      <div>{item.sale_price} {currencySymbol}</div>
                      <div className={cn("text-xs font-normal", margin.amount != null && margin.amount < 0 ? "text-destructive" : "text-primary")}>
                        {margin.amount != null ? `${margin.amount > 0 ? "+" : ""}${margin.amount} ${currencySymbol}` : "—"}
                        {margin.percent != null && ` · ${margin.percent}%`}
                      </div>
                      <div className="text-[11px] font-normal text-muted-foreground">
                        {margin.perHour != null ? `${margin.perHour} ${currencySymbol}/h de marge` : "marge/h : —"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button type="button" size="icon" variant="ghost" onClick={() => startEditing(item)}><Edit2 className="w-4 h-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
}
