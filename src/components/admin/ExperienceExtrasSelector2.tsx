/**
 * Spice It Up – V2 Extras Selector
 * Links hotel2_extras to an experience2 via experience2_extras junction table.
 * Same pattern as V1 ExperienceExtrasSelector but for V2 tables.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
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

  // Fetch selected extras for this experience
  const { data: selectedExtraIds, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["experience2-extras-links", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience2_extras")
        .select("extra_id")
        .eq("experience_id", experienceId);
      if (error) throw error;
      return (data || []).map((item: any) => item.extra_id as string);
    },
    enabled: !!experienceId,
  });

  // Toggle link
  const toggleMutation = useMutation({
    mutationFn: async ({ extraId, isChecked }: { extraId: string; isChecked: boolean }) => {
      if (isChecked) {
        const { error } = await (supabase as any)
          .from("experience2_extras")
          .insert([{ experience_id: experienceId, extra_id: extraId }]);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience2-extras-links", experienceId] });
      toast.success("Extras updated");
    },
    onError: (error: Error) => toast.error(error.message),
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

  return (
    <div className="space-y-2">
      {hotelExtras.map((extra) => {
        const isSelected = selectedExtraIds?.includes(extra.id) ?? false;
        return (
          <div
            key={extra.id}
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
              isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
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
      })}
    </div>
  );
};

export default ExperienceExtrasSelector2;
