import { useFromPrice } from "@/hooks/useExperience2Price";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { AvailabilityRule } from "@/lib/availabilityUtils";
import type { HeroKeyFact, HeroLang } from "@/lib/heroKeyFacts";
import HeroKeyFacts from "@/components/experience/HeroKeyFacts";

interface HotelHeroKeyFactsProps {
  facts: HeroKeyFact[];
  experienceId: string;
  hyperguestPropertyId?: string | null;
  preferredBoardType?: string | null;
  minParty?: number;
  minNights?: number;
  availabilityRules?: AvailabilityRule[];
  onSeeDates: () => void;
  lang: HeroLang;
}

// Fiche hôtel + expérience : le prix « à partir de » est LU avec le même outil
// (useFromPrice) et les mêmes réglages que la barre du bas sur mobile (StickyPriceBar).
// Il remplace l'ancien encart prix affiché au-dessus du panneau de réservation
// (HeroBookingPreview2, qui n'est plus affiché). Aucun calcul ici.
const HotelHeroKeyFacts = ({
  facts,
  experienceId,
  hyperguestPropertyId,
  preferredBoardType = null,
  minParty = 2,
  minNights = 1,
  availabilityRules = [],
  onSeeDates,
  lang,
}: HotelHeroKeyFactsProps) => {
  const { symbol, convert } = useCurrency();
  const { fromPriceILS, hasHyperguest } = useFromPrice(
    experienceId,
    hyperguestPropertyId ?? null,
    availabilityRules,
    preferredBoardType,
    minParty,
  );

  const displayPrice = fromPriceILS ? Math.round(convert(fromPriceILS)) : null;
  const hasPrice = hasHyperguest && !!displayPrice && displayPrice > 0;

  // Le prix lu est celui d'une nuit. On n'écrit « / séjour » que si le séjour
  // minimum est d'une nuit ; sinon « / nuit », pour ne jamais annoncer le prix
  // d'une nuit comme celui du séjour entier.
  const unit =
    minNights <= 1
      ? lang === "he" ? "/ לשהייה" : lang === "fr" ? "/ séjour" : "/ stay"
      : lang === "he" ? "/ ללילה" : lang === "fr" ? "/ nuit" : "/ night";

  return (
    <HeroKeyFacts
      facts={facts}
      fromPrice={hasPrice ? { amount: `${symbol}${displayPrice}`, unit } : null}
      onSeeDates={onSeeDates}
      lang={lang}
    />
  );
};

export default HotelHeroKeyFacts;
