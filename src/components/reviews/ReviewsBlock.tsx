import { useEffect, useRef, useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReviewRow } from "@/hooks/useReviewsSummary";
import { trackReviewsBlockScrolled } from "@/lib/analytics";

type SortOption = "recent" | "top_rated";
type Lang = "fr" | "en" | "he";

const T: Record<string, Record<Lang, string>> = {
  title: { fr: "Avis", en: "Reviews", he: "ביקורות" },
  reviewsWord: { fr: "avis", en: "reviews", he: "ביקורות" },
  empty: { fr: "Les premiers avis arrivent bientôt.", en: "First reviews coming soon.", he: "ביקורות ראשונות בקרוב." },
  verified: { fr: "Avis vérifié", en: "Verified review", he: "ביקורת מאומתת" },
  sortRecent: { fr: "Plus récents", en: "Most recent", he: "החדשים ביותר" },
  sortTop: { fr: "Mieux notés", en: "Top rated", he: "המדורגים ביותר" },
  staffReply: { fr: "Réponse de STAYMAKOM", en: "Reply from STAYMAKOM", he: "תגובת STAYMAKOM" },
  collectionNotice: {
    fr: "Avis collectés auprès de nos clients après leur expérience, publiés uniquement avec leur accord.",
    en: "Reviews collected from our customers after their experience, published only with their consent.",
    he: "ביקורות שנאספו מלקוחותינו לאחר החוויה, מתפרסמות רק בהסכמתן.",
  },
  showAll: { fr: "Afficher les {n} avis", en: "Show all {n} reviews", he: "הצג את כל {n} הביקורות" },
};

function t(key: keyof typeof T, lang: Lang) {
  return T[key][lang] || T[key].en;
}

function displayName(firstName: string, lastInitial: string | null) {
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

function formatMonthYear(dateStr: string | null, lang: Lang) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

interface ReviewsBlockProps {
  reviews: ReviewRow[];
  averageRating: number | null;
  lang?: Lang;
  scope?: string;
  entityId?: string;
}

export function ReviewsBlock({ reviews, averageRating, lang = "en", scope, entityId }: ReviewsBlockProps) {
  const [sort, setSort] = useState<SortOption>("recent");
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTrackedScroll = useRef(false);

  useEffect(() => {
    if (!sectionRef.current || !scope) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedScroll.current) {
          hasTrackedScroll.current = true;
          trackReviewsBlockScrolled(scope, entityId);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [scope, entityId]);

  if (!reviews || reviews.length === 0) {
    return (
      <section ref={sectionRef} className="py-8 border-b border-border" id="reviews-block">
        <p className="italic text-muted-foreground text-sm">{t("empty", lang)}</p>
      </section>
    );
  }

  const sorted = [...reviews].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    if (sort === "top_rated") return (b.rating || 0) - (a.rating || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayed = showAll ? sorted : sorted.slice(0, 6);

  return (
    <section ref={sectionRef} className="py-6 border-b border-border" id="reviews-block">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-2">{t("title", lang)}</h2>
          <div className="flex items-center gap-3">
            {averageRating != null && (
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-foreground text-foreground" />
                <span className="text-xl font-serif font-bold">{averageRating.toFixed(1)}</span>
              </div>
            )}
            {averageRating != null && <span className="text-muted-foreground">·</span>}
            <span className="text-base">
              {reviews.length} {t("reviewsWord", lang)}
            </span>
          </div>
        </div>
        {reviews.length > 5 && (
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("sortRecent", lang)}</SelectItem>
              <SelectItem value="top_rated">{t("sortTop", lang)}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-5">{t("collectionNotice", lang)}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayed.map((review) => (
          <div key={review.id} className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">{review.customer_first_name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{displayName(review.customer_first_name, review.customer_last_initial)}</p>
                <p className="text-xs text-muted-foreground">{formatMonthYear(review.review_date, lang)}</p>
              </div>
              {review.booking_id && (
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-green-700 font-medium">
                  <BadgeCheck className="h-3.5 w-3.5" /> {t("verified", lang)}
                </span>
              )}
            </div>

            {review.rating != null && (
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < (review.rating as number) ? "fill-foreground text-foreground" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
            )}

            {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}

            {review.staff_reply && (
              <div className="ml-4 pl-3 border-l-2 border-border">
                <p className="text-xs font-medium text-foreground">{t("staffReply", lang)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{review.staff_reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {reviews.length > 6 && !showAll && (
        <Button variant="outline" className="mt-6" onClick={() => setShowAll(true)}>
          {t("showAll", lang).replace("{n}", String(reviews.length))}
        </Button>
      )}
    </section>
  );
}

export default ReviewsBlock;
