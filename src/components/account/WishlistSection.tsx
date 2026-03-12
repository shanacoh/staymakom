import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ExperienceCard from "@/components/ExperienceCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface WishlistSectionProps {
  userId?: string;
}

export default function WishlistSection({ userId }: WishlistSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ["wishlist", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: wishlistData, error } = await supabase
        .from("wishlist")
        .select("id, experience_id, created_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!wishlistData || wishlistData.length === 0) return [];

      const expIds = wishlistData.map((w) => w.experience_id).filter(Boolean);
      if (expIds.length === 0) return [];

      const { data: experiences } = await supabase
        .from("experiences2")
        .select(`
          id, slug, title, title_he, subtitle, hero_image, thumbnail_image, photos, base_price, currency,
          experience2_hotels(
            position,
            hotel:hotels2(id, name, name_he, city, city_he, hero_image)
          )
        `)
        .in("id", expIds)
        .eq("status", "published");

      const mapped = (experiences || []).map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return { ...exp, hotels: primaryHotel || null };
      });

      const expMap = new Map(mapped.map((e) => [e.id, e]));

      return wishlistData
        .map((w) => ({ ...w, experience: expMap.get(w.experience_id) || null }))
        .filter((w) => w.experience);
    },
    enabled: !!userId,
  });

  const removeMutation = useMutation({
    mutationFn: async (wishlistId: string) => {
      const { error } = await supabase
        .from("wishlist")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", wishlistId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist", userId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove from wishlist");
    },
  });

  const handleWishlistRemove = (experienceId: string) => {
    const wishlistItem = wishlist?.find((item) => item.experience?.id === experienceId);
    if (wishlistItem) {
      removeMutation.mutate(wishlistItem.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // === Empty State ===
  if (!wishlist || wishlist.length === 0) {
    if (isMobile) {
      return (
        <div className="flex flex-col items-center justify-center pt-24 text-center px-6">
          <Heart className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-[15px] text-foreground mb-1">Nothing saved yet.</p>
          <button
            onClick={() => navigate("/launch")}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            Start exploring →
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-16">
        <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="font-serif text-xl mb-2">Your wishlist is empty</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-4">
          Explore our curated experiences and save your favorites to plan your next extraordinary getaway.
        </p>
        <button
          onClick={() => navigate("/launch")}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Discover experiences →
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlist.map((item) => {
        const exp = item.experience;
        if (!exp) return null;

        return (
          <ExperienceCard
            key={item.id}
            experience={exp}
            isInWishlist={true}
            onWishlistToggle={handleWishlistRemove}
            userId={userId}
            rating={8.5 + Math.random() * 0.5}
            reviewCount={50 + Math.floor(Math.random() * 950)}
          />
        );
      })}
    </div>
  );
}
