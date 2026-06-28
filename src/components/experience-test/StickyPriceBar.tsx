import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useFromPrice } from "@/hooks/useExperience2Price";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { AvailabilityRule } from "@/lib/availabilityUtils";

interface StickyPriceBarProps {
  experienceId: string;
  currency: string;
  lang: 'en' | 'he' | 'fr';
  onViewDates: () => void;
  footerRef: React.RefObject<HTMLElement>;
  hyperguestPropertyId?: string | null;
  /** Pension préférée de l'hôtel (hotels2.preferred_board_type) — propagée pour cohérence des prix. */
  preferredBoardType?: string | null;
  selectedExtrasTotal?: number;
  minParty?: number;
  minNights?: number;
  availabilityRules?: AvailabilityRule[];
}

const StickyPriceBar = ({
  experienceId,
  currency,
  lang,
  onViewDates,
  footerRef,
  hyperguestPropertyId,
  preferredBoardType = null,
  selectedExtrasTotal = 0,
  minParty = 2,
  minNights = 1,
  availabilityRules = [],
}: StickyPriceBarProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const { symbol, convert } = useCurrency();

  const { fromPriceILS, hasHyperguest } = useFromPrice(
    experienceId,
    hyperguestPropertyId ?? null,
    availabilityRules,
    preferredBoardType,
  );

  const displayPrice = fromPriceILS ? Math.round(convert(fromPriceILS)) : null;

  useEffect(() => {
    const handleScroll = () => {
      if (footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect();
        setIsHidden(footerRect.top < window.innerHeight);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [footerRef]);

  if (!hasHyperguest || !displayPrice || displayPrice <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "md:hidden fixed left-0 right-0 bottom-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-x-hidden",
        isHidden ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="px-4">
        <button
          onClick={onViewDates}
          className="flex items-center justify-between py-3.5 w-full text-left min-h-[52px]"
        >
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-foreground whitespace-nowrap">
                {lang === 'he' ? `מ-${symbol}${displayPrice}` : lang === 'fr' ? `à partir de ${symbol}${displayPrice}` : `from ${symbol}${displayPrice}`}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {lang === 'he' ? 'הכי משתלם · ל-2 אנשים' : lang === 'fr' ? 'Meilleur tarif · 2 personnes' : 'Best rate · 2 guests'}
            </span>
          </div>
          <span className="rounded-full bg-foreground text-background text-xs font-semibold px-5 py-2.5 shrink-0 ml-3 whitespace-nowrap">
            {lang === 'he' ? 'הזמן' : lang === 'fr' ? 'Réserver' : 'Book'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default StickyPriceBar;
