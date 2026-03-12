/**
 * Wrapper around ExperienceCard that uses the unified "From" price formula:
 * cheapest nightly room rate + fixed addons + commissions.
 * Per-person/per-night extras are excluded from the "From" price.
 */
import ExperienceCard from "@/components/ExperienceCard";
import { useFromPrice } from "@/hooks/useExperience2Price";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Experience2CardWithPriceProps {
  experience: any;
  primaryHotel: any;
  hyperguestPropertyId?: string | null;
  addons?: Array<{ type: string; value: number; is_active: boolean }>;
  linkPrefix?: string;
  linkSuffix?: string;
  index?: number;
}

export default function Experience2CardWithPrice({
  experience,
  primaryHotel,
  hyperguestPropertyId,
  addons,
  linkPrefix = "/experience",
  linkSuffix,
  index = 0,
}: Experience2CardWithPriceProps) {
  const { convert } = useCurrency();

  const { fromPriceILS } = useFromPrice(experience.id, hyperguestPropertyId ?? null);

  // Convert ILS → display currency, hide if no price
  const displayPrice = fromPriceILS ? Math.round(convert(fromPriceILS)) : 0;

  const cardExperience = {
    ...experience,
    hotels: primaryHotel || null,
    experience_highlight_tags: experience.experience2_highlight_tags || [],
    base_price: displayPrice, // 0 = hidden by ExperienceCard
  };

  return (
    <ExperienceCard
      experience={cardExperience}
      linkPrefix={linkPrefix}
      linkSuffix={linkSuffix}
      index={index}
    />
  );
}
