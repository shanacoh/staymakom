/**
 * Spice It Up – V2 Extras Selector
 * Links hotel2_extras to an experience2 via experience2_extras junction table.
 * Selected extras are shown first (reorderable with ↑↓), unselected below.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface ExperienceExtrasSelector2Props {
  experienceId: string;
  hotelIds: string[];
}

const ExperienceExtrasSelector2 = ({ experienceId, hotelIds }: ExperienceExtrasSelector2Props) => {
  const queryClient = useQueryClient();

  // Fetch ALL hotel2_extras from all hotels in the parcours
  const { data: hotelExtras, isLoading: isLoadingExtras } = useQuery({
    queryKey: ["hotel2-extras-for-experience", hotelIds],
    queryFn: async () => {
      if (hotelIds.length === 0) return [];
      const { data, error } = await supabase
        .from("hotel2_extras")
        .select("*")
        .in("hotel_id", hotelIds)
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: hotelIds.length > 0,
  });

  // Fetch selected extras with their position
  const { data: selectedLinks, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["experience2-extras-links", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience2_extras")
        .select("extra_id, position")
        .eq("experience_id", experienceId);
      if (error) throw error;
      return (data || []) as Array<{ extra_id: string; position: number }>;
    },
    enabled: !!experienceId,
  });

  const selectedExtraIds = new Set(selectedLinks?.map((l) => l.extra_id) ?? []);

  // Selected extras sorted by position
  const selectedExtras = (hotelExtras ?? [])
    .filter((e) => selectedExtraIds.has(e.id))
    .sort((a, b) => {
      const pa = selectedLinks?.find((l) => l.extra_id === a.id)?.position ?? 0;
      const pb = selectedLinks?.find((l) => l.extra_id === b.id)?.position ?? 0;
      return pa - pb;
    });

  // Unselected extras
  const unselectedExtras = (hotelExtras ?? []).filter((e) => !selectedExtraIds.has(e.id));

  // Toggle link
  const toggleMutation = useMutation({
    mutationFn: async ({ extraId, isChecked }: { extraId: string; isChecked: boolean }) => {
      if (isChecked) {
        const maxPos = selectedLinks?.length
          ? Math.max(...selectedLinks.map((l) => l.position)) + 1
          : 0;
        const { error } = await (supabase as any)
          .from("experience2_extras")
          .insert([{ experience_id: experienceId, extra_id: extraId, position: maxPos }]);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("experience2_extras")
          .delete()
          .eq("experience_id", experienceId)
          .eq("extra_id", extraId);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experience2-extras-links", experienceId] }),
    onError: (error: Error) => toast.error(error.message),
  });

  // Reorder selected extras
  const reorderMutation = useMutation({
    mutationFn: async ({ extraId, direction }: { extraId: string; direction: 'up' | 'down' }) => {
      const sorted = [...selectedExtras];
      const idx = sorted.findIndex((e) => e.id === extraId);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      // Reassign sequential positions after swap
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      await Promise.all(
        sorted.map((item, i) =>
          (supabase as any)
            .from("experience2_extras")
            .update({ position: i })
            .eq("experience_id", experienceId)
            .eq("extra_id", item.id)
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experience2-extras-links", experienceId] }),
    onError: () => toast.error("Réorganisation échouée"),
  });

  if (isLoadingExtras || isLoadingSelected) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hotelExtras || hotelExtras.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No extras available for the hotels in this experience.
      </p>
    );
  }

  const renderExtra = (extra: any, isSelected: boolean, idx: number) => (
    <div
      key={extra.id}
      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      {isSelected && (
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => reorderMutation.mutate({ extraId: extra.id, direction: 'up' })}
            disabled={idx === 0 || reorderMutation.isPending}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => reorderMutation.mutate({ extraId: extra.id, direction: 'down' })}
            disabled={idx === selectedExtras.length - 1 || reorderMutation.isPending}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {!isSelected && <div className="w-5 flex-shrink-0" />}
      <Switch
        checked={isSelected}
        onCheckedChange={(checked) => toggleMutation.mutate({ extraId: extra.id, isChecked: checked })}
        disabled={toggleMutation.isPending}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{extra.name}</div>
        {extra.name_he && (
          <div className="text-xs text-muted-foreground" dir="rtl">{extra.name_he}</div>
        )}
      </div>
      <div className="text-sm font-semibold text-primary shrink-0">
        {extra.price} {extra.currency} / {extra.pricing_type?.replace("_", " ") || "per booking"}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {selectedExtras.map((extra, idx) => renderExtra(extra, true, idx))}
      {unselectedExtras.map((extra) => renderExtra(extra, false, 0))}
    </div>
  );
};

export default ExperienceExtrasSelector2;
