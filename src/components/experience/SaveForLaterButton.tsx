import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveForLaterButtonProps {
  experienceId: string;
  lang?: string;
  variant?: "full" | "icon";
  // legacy props kept for compatibility, no longer used
  checkin?: string;
  checkout?: string;
  partySize?: number;
  roomCode?: string;
  roomName?: string;
}

export function SaveForLaterButton({
  experienceId,
  lang = "en",
}: SaveForLaterButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const t = {
    add: lang === "he" ? "שמור למועדפים" : lang === "fr" ? "Ajouter aux favoris" : "Save to favorites",
    saved: lang === "he" ? "שמור במועדפים" : lang === "fr" ? "Enregistré" : "Saved",
    loginRequired: lang === "he" ? "יש להתחבר תחילה" : lang === "fr" ? "Connectez-vous d'abord" : "Please log in first",
    added: lang === "he" ? "נוסף למועדפים" : lang === "fr" ? "Ajouté aux favoris" : "Added to favorites",
    removed: lang === "he" ? "הוסר מהמועדפים" : lang === "fr" ? "Retiré des favoris" : "Removed from favorites",
    error: lang === "he" ? "שגיאה" : lang === "fr" ? "Erreur" : "Error",
  };

  const { data: wishlistStatus } = useQuery({
    queryKey: ["wishlist-status", experienceId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, deleted_at")
        .eq("user_id", user.id)
        .eq("experience_id", experienceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isInWishlist = !!(wishlistStatus && !wishlistStatus.deleted_at);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("not-authenticated");

      if (!isInWishlist) {
        if (wishlistStatus?.deleted_at) {
          const { error } = await supabase
            .from("wishlist")
            .update({ deleted_at: null })
            .eq("id", wishlistStatus.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("wishlist")
            .insert({ user_id: user.id, experience_id: experienceId });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("wishlist")
          .update({ deleted_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("experience_id", experienceId)
          .is("deleted_at", null);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-status", experienceId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(isInWishlist ? t.removed : t.added);
    },
    onError: (err: Error) => {
      if (err.message === "not-authenticated") {
        toast.error(t.loginRequired);
      } else {
        toast.error(t.error);
      }
    },
  });

  const handleClick = () => {
    if (!user) {
      toast.error(t.loginRequired);
      return;
    }
    mutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full flex items-center justify-center gap-2 text-sm",
        isInWishlist ? "text-rose-500 hover:text-rose-600" : "text-muted-foreground hover:text-foreground",
      )}
      onClick={handleClick}
      disabled={mutation.isPending}
    >
      <Heart
        className="h-4 w-4"
        fill={isInWishlist ? "currentColor" : "none"}
        strokeWidth={isInWishlist ? 0 : 1.5}
      />
      {isInWishlist ? t.saved : t.add}
    </Button>
  );
}
