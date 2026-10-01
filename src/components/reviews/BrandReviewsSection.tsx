import { Star } from "lucide-react";
import { useReviewsSummary } from "@/hooks/useReviewsSummary";

type Lang = "fr" | "en" | "he";

const T: Record<string, Record<Lang, string>> = {
  title: { fr: "Ce qu'on dit de STAYMAKOM", en: "What people say about STAYMAKOM", he: "מה אומרים על STAYMAKOM" },
};

function displayName(firstName: string, lastInitial: string | null) {
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

// Avis sur la marque en général (pas sur une expérience précise), affichés sur la home.
// Invisible tant qu'aucun avis marque n'est publié : pas de contenu vide à montrer.
export function BrandReviewsSection({ lang = "en" }: { lang?: Lang }) {
  const { data } = useReviewsSummary({ scope: "brand" });
  const reviews = data?.reviews ?? [];

  if (reviews.length === 0) return null;

  const sorted = [...reviews].sort((a, b) => (a.is_pinned === b.is_pinned ? 0 : a.is_pinned ? -1 : 1));

  return (
    <section className="py-12 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-8 text-center">
          {T.title[lang] || T.title.en}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sorted.slice(0, 6).map((review) => (
            <div key={review.id} className="rounded-xl border border-border p-5 space-y-2">
              {review.rating != null && (
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < (review.rating as number) ? "fill-foreground text-foreground" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
              )}
              {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
              <p className="text-sm font-medium">{displayName(review.customer_first_name, review.customer_last_initial)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BrandReviewsSection;
