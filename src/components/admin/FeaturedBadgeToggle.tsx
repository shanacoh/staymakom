/**
 * Interrupteur "Notre choix" — badge éditorial affiché sur la carte d'une
 * expérience standalone (bateaux en premier usage) côté /boat. Lit et écrit
 * directement standalone_experiences.is_featured, indépendamment du gros
 * formulaire (évite de complexifier son schéma pour un simple booléen).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
  experienceId?: string;
}

export default function FeaturedBadgeToggle({ experienceId }: Props) {
  const queryClient = useQueryClient();
  const queryKey = ["standalone-experience-is-featured", experienceId];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("is_featured")
        .eq("id", experienceId as string)
        .single();
      if (error) throw error;
      return data.is_featured as boolean;
    },
    enabled: !!experienceId,
  });

  const toggleMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase
        .from("standalone_experiences")
        .update({ is_featured: value })
        .eq("id", experienceId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Mis à jour");
    },
    onError: () => toast.error("Impossible de mettre à jour"),
  });

  if (!experienceId) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Sauvegardez d'abord la fiche (brouillon) pour pouvoir régler ce badge.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <Label htmlFor="is-featured-toggle">Badge "Notre choix"</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Affiché sur la carte de cette expérience sur /boat.
        </p>
      </div>
      <Switch
        id="is-featured-toggle"
        checked={!!data}
        onCheckedChange={(checked) => toggleMutation.mutate(checked)}
        disabled={toggleMutation.isPending}
      />
    </div>
  );
}
