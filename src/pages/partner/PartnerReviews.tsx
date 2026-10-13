// Avis : les avis publiés sur les expériences du prestataire.

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Card, Empty, PageLoader } from "@/components/partner/ui";
import { fetchPartnerReviews, partnerKeys } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { formatPartnerDate } from "@/lib/partner/i18n";
import { displayText } from "@/lib/partner/logic";

export default function PartnerReviews() {
  const { t, lang } = usePartner();
  const { data, isLoading } = useQuery({ queryKey: partnerKeys.reviews, queryFn: fetchPartnerReviews });

  if (isLoading) return <PageLoader label={t.loading} />;
  const reviews = data ?? [];

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">{t.tabReviews}</h1>
      {reviews.length === 0 ? (
        <Empty>{t.vEmpty}</Empty>
      ) : (
        reviews.map((review) => (
          <Card key={review.id} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-neutral-900">
                  {review.customer_first_name}
                  {review.customer_last_initial ? ` ${review.customer_last_initial}.` : ""}
                </p>
                <p className="truncate text-[12px] text-neutral-500">
                  {displayText(review as unknown as Record<string, unknown>, "experience_title", lang)} · {formatPartnerDate(review.review_date, lang)}
                </p>
              </div>
              {review.rating != null && (
                <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-neutral-900" dir="ltr">
                  <Star className="h-4 w-4 fill-neutral-900" aria-hidden />
                  {review.rating}/5
                </span>
              )}
            </div>
            {review.comment && <p className="whitespace-pre-line text-[14px] leading-relaxed text-neutral-800">{review.comment}</p>}
            {review.staff_reply && (
              <p className="rounded-[10px] bg-neutral-100 px-3 py-2 text-[13px] leading-relaxed text-neutral-700">
                <span className="font-semibold">{t.vReply} : </span>
                {review.staff_reply}
              </p>
            )}
          </Card>
        ))
      )}
    </>
  );
}
