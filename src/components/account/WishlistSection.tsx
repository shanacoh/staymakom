import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ExperienceCard from "@/components/ExperienceCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrency } from "@/contexts/CurrencyContext";

interface WishlistSectionProps {
  userId?: string;
}

export default function WishlistSection({ userId }: WishlistSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { convert } = useCurrency();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ["wishlist", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: wishlistData, error } = await supabase
        .from("wishlist")
        .select("id, experience_id, experience_type, created_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!wishlistData || wishlistData.length === 0) return [];

      const idsByType = (type: string) =>
        [...new Set(wishlistData.filter((w) => w.experience_type === type).map((w) => w.experience_id).filter(Boolean))];

      const experiences2Ids = idsByType("experiences2");
      const standaloneIds = idsByType("standalone");

      const [experiences2Res, standaloneRes] = await Promise.all([
        experiences2Ids.length
          ? supabase
              .from("experiences2")
              .select(`
                id, slug, title, title_he, subtitle, hero_image, thumbnail_image, photos, base_price, currency,
                experience2_hotels(
                  position,
                  hotel:hotels2(id, name, name_he, city, city_he, hero_image)
                )
              `)
              .in("id", experiences2Ids)
              .eq("status", "published")
          : Promise.resolve({ data: [] as any[] }),
        standaloneIds.length
          ? (supabase as any)
              .from("standalone_experiences")
              .select("id, slug, title, title_he, subtitle, hero_image, photos, base_price, base_price_type, currency, city, city_he, region, region_he")
              .in("id", standaloneIds)
              .eq("status", "published")
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const mappedExperiences2 = (experiences2Res.data || []).map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return { ...exp, hotels: primaryHotel || null, isStandaloneExperience: false };
      });

      const mappedStandalone = (standaloneRes.data || []).map((exp: any) => ({
        ...exp,
        hotels: (exp.city || exp.region) ? { city: exp.city, city_he: exp.city_he, region: exp.region, region_he: exp.region_he } : null,
        isStandaloneExperience: true,
      }));

      const expMap = new Map<string, any>([
        ...mappedExperiences2.map((e) => [`experiences2:${e.id}`, e] as const),
        ...mappedStandalone.map((e) => [`standalone:${e.id}`, e] as const),
      ]);

      return wishlistData
        .map((w) => ({ ...w, experience: expMap.get(`${w.experience_type}:${w.experience_id}`) || null }))
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
            experience={{
              ...exp,
              // base_price est stocké en NIS en base : on le convertit dans la devise affichée à l'utilisateur.
              base_price: exp.base_price ? Math.round(convert(exp.base_price)) : exp.base_price,
            }}
            isInWishlist={true}
            onWishlistToggle={handleWishlistRemove}
            userId={userId}
            isStandaloneExperience={exp.isStandaloneExperience}
            linkPrefix={exp.isStandaloneExperience ? "/standalone-experience" : "/experience"}
          />
        );
      })}
    </div>
  );
}
