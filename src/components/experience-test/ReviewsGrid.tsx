import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr, he } from "date-fns/locale";

interface Review {
  id: string;
  text: string;
  rating: number;
  created_at: string;
  customer_id?: string;
}

interface ReviewsGridProps {
  reviews: Review[];
  lang?: string;
}

const ReviewsGrid = ({ reviews, lang = "en" }: ReviewsGridProps) => {
  const [showAll, setShowAll] = useState(false);

  if (!reviews || reviews.length === 0) return null;

  const getLocale = () => {
    if (lang === "he") return he;
    return fr;
  };

  // Calculate average rating
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  // Generate fake names for display (in real app, fetch from customers)
  const fakeNames = [
    { name: "Sarah", location: "Tel Aviv, Israël" },
    { name: "Marc", location: "Paris, France" },
    { name: "Emma", location: "New York, USA" },
    { name: "Yoav", location: "Jérusalem, Israël" },
    { name: "Claire", location: "Lyon, France" },
    { name: "David", location: "Londres, UK" },
    { name: "Maya", location: "Haifa, Israël" },
    { name: "Thomas", location: "Berlin, Allemagne" },
  ];

  const displayedReviews = showAll ? reviews : reviews.slice(0, 6);

  return (
    <section className="py-6 border-b border-border">
      {/* Header with rating */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-foreground text-foreground" />
          <span className="text-xl font-serif font-bold">{averageRating.toFixed(2)}</span>
        </div>
        <span className="text-muted-foreground">·</span>
        <span className="text-base">
          {reviews.length} {lang === "he" ? "ביקורות" : lang === "en" ? "reviews" : "avis"}
        </span>
      </div>

      {/* Reviews grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedReviews.map((review, index) => {
          const fakePerson = fakeNames[index % fakeNames.length];
          const timeAgo = formatDistanceToNow(new Date(review.created_at), {
            addSuffix: false,
            locale: getLocale(),
          });

          return (
            <div key={review.id} className="space-y-3">
              {/* Reviewer info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">
                    {fakePerson.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{fakePerson.name}</p>
                  <p className="text-xs text-muted-foreground">{fakePerson.location}</p>
                </div>
              </div>

              {/* Rating and date */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < review.rating
                          ? "fill-foreground text-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">· {timeAgo}</span>
              </div>

              {/* Review text */}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {review.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Show more button */}
      {reviews.length > 6 && !showAll && (
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setShowAll(true)}
        >
          {lang === "he" 
            ? `הצג את כל ${reviews.length} הביקורות`
            : lang === "en" 
              ? `Show all ${reviews.length} reviews`
              : `Afficher les ${reviews.length} avis`
          }
        </Button>
      )}
    </section>
  );
};

export default ReviewsGrid;
