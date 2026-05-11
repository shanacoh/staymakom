/**
 * Wrapper around ExperienceCard that uses the unified "From" price formula:
 * cheapest nightly room rate + fixed addons + commissions.
 * Per-person/per-night extras are excluded from the "From" price.
 */
import ExperienceCard from "@/components/ExperienceCard";
import { useFromPrice } from "@/hooks/useExperience2Price";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AvailabilityRule } from "@/lib/availabilityUtils";

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

  // Fetch les règles de dispo pour filtrer le prix "À partir de" sur les bonnes dates
  const { data: availabilityRules = [] } = useQuery<AvailabilityRule[]>({
    queryKey: ["availability_rules_card", experience.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience2_availability_rules" as any)
        .select("id, rule_type, days_of_week, date_from, date_to, specific_dates")
        .eq("experience_id", experience.id)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as AvailabilityRule[];
    },
    staleTime: 5 * 60_000,
  });

  const { fromPriceILS } = useFromPrice(
    experience.id,
    hyperguestPropertyId ?? null,
    availabilityRules,
    experience.preferred_board_type ?? null,
  );

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
