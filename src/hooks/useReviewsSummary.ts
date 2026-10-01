import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewRow {
  id: string;
  customer_first_name: string;
  customer_last_initial: string | null;
  rating: number | null;
  comment: string | null;
  lang: string | null;
  review_date: string | null;
  created_at: string;
  is_pinned: boolean;
  booking_id: string | null;
  staff_reply: string | null;
}

export type ReviewsScope = "standalone_experience" | "experience2" | "brand";

interface UseReviewsSummaryParams {
  scope: ReviewsScope;
  entityId?: string;
  // Pour /boat : quand ce bateau précis n'a pas encore d'avis, on élargit aux autres bateaux.
  fallbackExperienceIds?: string[];
}

interface ReviewsSummary {
  reviews: ReviewRow[];
  count: number;
  // Règle métier : la moyenne ne s'affiche qu'à partir de 3 avis notés publiés.
  averageRating: number | null;
  usedFallback: boolean;
}

const REVIEW_COLUMNS =
  "id, customer_first_name, customer_last_initial, rating, comment, lang, review_date, created_at, is_pinned, booking_id, staff_reply";

export function useReviewsSummary({ scope, entityId, fallbackExperienceIds }: UseReviewsSummaryParams) {
  return useQuery<ReviewsSummary>({
    queryKey: ["reviews-summary", scope, entityId, fallbackExperienceIds],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select(REVIEW_COLUMNS)
        .eq("moderation_status", "published")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (scope === "brand") {
        query = query.eq("scope", "brand");
      } else if (scope === "standalone_experience") {
        query = query.eq("scope", "standalone_experience").eq("standalone_experience_id", entityId as string);
      } else {
        query = query.eq("scope", "experience2").eq("experience2_id", entityId as string);
      }

      const { data, error } = await query;
      if (error) throw error;

      let reviews = (data || []) as ReviewRow[];
      let usedFallback = false;

      if (scope === "standalone_experience" && reviews.length === 0 && fallbackExperienceIds && fallbackExperienceIds.length > 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("reviews")
          .select(REVIEW_COLUMNS)
          .eq("moderation_status", "published")
          .eq("scope", "standalone_experience")
          .in("standalone_experience_id", fallbackExperienceIds)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
        if (!fallbackError && fallbackData) {
          reviews = fallbackData as ReviewRow[];
          usedFallback = true;
        }
      }

      const ratedReviews = reviews.filter((r) => r.rating != null);
      const averageRating =
        ratedReviews.length >= 3
          ? ratedReviews.reduce((acc, r) => acc + (r.rating as number), 0) / ratedReviews.length
          : null;

      return {
        reviews,
        count: reviews.length,
        averageRating,
        usedFallback,
      };
    },
    enabled: scope === "brand" || !!entityId,
  });
}
