import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "@/constants/layout";
import { useFromPrice } from "@/hooks/useExperience2Price";
import { useCurrency } from "@/contexts/CurrencyContext";

interface StickyPriceBarProps {
  experienceId: string;
  currency: string;
  lang: 'en' | 'he' | 'fr';
  onViewDates: () => void;
  footerRef: React.RefObject<HTMLElement>;
  hyperguestPropertyId?: string | null;
  selectedExtrasTotal?: number;
  minParty?: number;
  minNights?: number;
}

const StickyPriceBar = ({
  experienceId,
  currency,
  lang,
  onViewDates,
  footerRef,
  hyperguestPropertyId,
  selectedExtrasTotal = 0,
  minParty = 2,
  minNights = 1,
}: StickyPriceBarProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const { symbol, convert } = useCurrency();

  const { fromPriceILS, hasHyperguest } = useFromPrice(experienceId, hyperguestPropertyId ?? null);

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

  const handleClick = () => {
    // On mobile, open the sheet; on desktop this would scroll
    onViewDates();
  };

  if (!hasHyperguest || !displayPrice || displayPrice <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "md:hidden fixed left-0 right-0 z-40 bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all duration-300",
        isHidden ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
      style={{ bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}
    >
      <div className="px-4">
        <button
          onClick={handleClick}
          className="flex items-center justify-between py-3 w-full text-left"
        >
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[13px] font-medium" style={{ color: '#B85C4A' }}>
              ● {lang === 'he' ? 'הכי משתלם' : 'Best rate available'}
            </span>
            <span className="text-[13px] text-muted-foreground">—</span>
            <span className="text-[13px] font-semibold text-foreground">
              {lang === 'he' ? `מ-${symbol}${displayPrice}` : `from ${symbol}${displayPrice}`}
            </span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-foreground shrink-0 ml-3"
            style={{ borderBottom: '1px solid currentColor' }}
          >
            {lang === 'he' ? 'לתאריכים' : 'VIEW DATES'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default StickyPriceBar;
