import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import ExperienceCard from "@/components/ExperienceCard";
import CompactExperienceCard from "@/components/account/CompactExperienceCard";

interface RecommendedExperiencesProps {
  userId?: string;
  limit?: number;
  title?: string;
  subtitle?: string;
  excludeIds?: string[];
  compact?: boolean;
}

export default function RecommendedExperiences({
  userId,
  limit = 3,
  title = "You might also like",
  subtitle = "Based on your favorites and interests",
  excludeIds = [],
  compact = false,
}: RecommendedExperiencesProps) {
  // Fetch user's interests and wishlist categories
  const { data: userPreferences } = useQuery({
    queryKey: ["user-preferences", userId],
    queryFn: async () => {
      if (!userId) return { interests: [], wishlistCategoryIds: [] };

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("interests")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch wishlist experience IDs, then look up their categories
      const { data: wishlistData } = await supabase
        .from("wishlist")
        .select("experience_id")
        .eq("user_id", userId)
        .is("deleted_at", null);

      let wishlistCategoryIds: string[] = [];
      if (wishlistData && wishlistData.length > 0) {
        const expIds = wishlistData.map((w) => w.experience_id).filter(Boolean);
        if (expIds.length > 0) {
          const { data: exps } = await supabase
            .from("experiences2")
            .select("category_id")
            .in("id", expIds);
          wishlistCategoryIds = [...new Set((exps || []).map((e) => e.category_id).filter(Boolean) as string[])];
        }
      }

      return {
        interests: (profile?.interests as string[]) || [],
        wishlistCategoryIds,
      };
    },
    enabled: !!userId,
  });

  // Fetch recommended experiences from V2
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommended-experiences", userId, userPreferences, excludeIds, limit],
    queryFn: async () => {
      let query = supabase
        .from("experiences2")
        .select(`
          id, slug, title, title_he, subtitle, hero_image, thumbnail_image, photos, base_price, currency, category_id,
          experience2_hotels(
            position,
            hotel:hotels2(id, name, name_he, city, city_he, hero_image)
          )
        `)
        .eq("status", "published")
        .limit(limit + excludeIds.length);

      if (userPreferences?.wishlistCategoryIds?.length) {
        query = query.in("category_id", userPreferences.wishlistCategoryIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return { ...exp, hotels: primaryHotel || null };
      });

      // Filter out test experiences and zero-price experiences
      const filtered = mapped.filter((exp) => {
        if (excludeIds.includes(exp.id)) return false;
        
        // Hide if price is 0
        if (!exp.base_price || exp.base_price === 0) return false;
        
        // Hide if title contains "test" (case-insensitive)
        const title = (exp.title || "").toLowerCase();
        if (title.includes("test")) return false;
        
        return true;
      });

      return filtered.slice(0, limit);
    },
    enabled: !!userId,
  });

  // Get wishlist IDs to show heart state
  const { data: wishlistIds } = useQuery({
    queryKey: ["wishlist-ids", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("wishlist")
        .select("experience_id")
        .eq("user_id", userId)
        .is("deleted_at", null);
      return data?.map((w) => w.experience_id) || [];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 pt-6 border-t border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="font-serif text-lg text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>

      {compact ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/30 rounded-xl p-2">
          {recommendations.map((exp) => (
            <CompactExperienceCard
              key={exp.id}
              experience={exp}
              isInWishlist={wishlistIds?.includes(exp.id)}
              userId={userId}
              rating={8.5 + Math.random() * 0.5}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((exp) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              isInWishlist={wishlistIds?.includes(exp.id)}
              userId={userId}
              rating={8.5 + Math.random() * 0.5}
              reviewCount={50 + Math.floor(Math.random() * 950)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
