import { Star, BadgeCheck } from "lucide-react";
import type { ReviewRow } from "@/hooks/useReviewsSummary";

type Lang = "fr" | "en" | "he";

interface ReviewsTeaserProps {
  reviews: ReviewRow[];
  lang?: Lang;
  onSeeAllClick?: () => void;
}

// 2-3 avis courts affichés près du bouton Réserver / Demander la dispo, pour rassurer
// sans attendre que le visiteur descende jusqu'au bloc complet plus bas sur la page.
export function ReviewsTeaser({ reviews, lang = "en", onSeeAllClick }: ReviewsTeaserProps) {
  if (!reviews || reviews.length === 0) return null;
  const picked = reviews.filter((r) => r.comment).slice(0, 3);
  if (picked.length === 0) return null;

  return (
    <div className="space-y-2 py-3">
      {picked.map((r) => (
        <button
          key={r.id}
          onClick={onSeeAllClick}
          className="block w-full text-left text-xs text-muted-foreground border-l-2 border-border pl-2 hover:border-foreground transition-colors"
        >
          <span className="flex items-center gap-1 mb-0.5">
            {r.rating != null && (
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-2.5 w-2.5 ${i < (r.rating as number) ? "fill-foreground text-foreground" : "text-muted-foreground/40"}`}
                  />
                ))}
              </span>
            )}
            <span className="font-medium text-foreground">
              {r.customer_first_name}
              {r.customer_last_initial ? ` ${r.customer_last_initial}.` : ""}
            </span>
            {r.booking_id && <BadgeCheck className="h-3 w-3 text-green-700" />}
          </span>
          <span className="line-clamp-2">{r.comment}</span>
        </button>
      ))}
    </div>
  );
}

export default ReviewsTeaser;
