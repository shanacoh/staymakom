/**
 * Wrapper around ExperienceCard that uses the unified "From" price formula:
 * cheapest nightly room rate + fixed addons + commissions.
 * Per-person/per-night extras are excluded from the "From" price.
 *
 * availabilityRules must be passed by the parent page (batched in a single
 * query for all cards) — do NOT fetch them inside this component.
 */
import ExperienceCard from "@/components/ExperienceCard";
import { useFromPrice } from "@/hooks/useExperience2Price";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getAutoBadgeTagsFromPracticalInfo, normalizeLegacyPracticalInfo } from "@/lib/standaloneBadges";
import type { AvailabilityRule } from "@/lib/availabilityUtils";

interface Experience2CardWithPriceProps {
  experience: any;
  primaryHotel: any;
  hyperguestPropertyId?: string | null;
  addons?: Array<{ type: string; value: number; is_active: boolean }>;
  availabilityRules?: AvailabilityRule[];
  linkPrefix?: string;
  linkSuffix?: string;
  index?: number;
  badge?: string | null;
  reviewCount?: number;
  rating?: number | null;
}

export default function Experience2CardWithPrice({
  experience,
  primaryHotel,
  hyperguestPropertyId,
  addons,
  availabilityRules = [],
  linkPrefix = "/experience",
  linkSuffix,
  index = 0,
  badge,
  reviewCount = 0,
  rating = null,
}: Experience2CardWithPriceProps) {
  const { convert } = useCurrency();

  const { fromPriceILS } = useFromPrice(
    experience.id,
    hyperguestPropertyId ?? null,
    availabilityRules,
    experience.preferred_board_type ?? null,
  );

  const displayPrice = fromPriceILS ? Math.round(convert(fromPriceILS)) : 0;

  const autoBadgeTags = getAutoBadgeTagsFromPracticalInfo(
    normalizeLegacyPracticalInfo((primaryHotel as any)?.practical_info)
  ).map((tag) => ({ highlight_tags: tag }));

  const editorialTags = (experience.experience2_highlight_tags ?? []);

  const cardExperience = {
    ...experience,
    hotels: primaryHotel || null,
    experience_highlight_tags: [...autoBadgeTags, ...editorialTags],
    base_price: displayPrice,
  };

  return (
    <ExperienceCard
      experience={cardExperience}
      linkPrefix={linkPrefix}
      linkSuffix={linkSuffix}
      index={index}
      badge={badge}
      reviewCount={reviewCount}
      rating={rating}
    />
  );
}
