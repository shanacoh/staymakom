import { Button } from "@/components/ui/button";

interface HeroBookingPreviewProps {
  basePrice: number;
  basePriceType: string;
  currency: string;
  lang: 'en' | 'he' | 'fr';
  onViewDates: () => void;
}

const HeroBookingPreview = ({
  basePrice,
  basePriceType,
  currency,
  lang,
  onViewDates
}: HeroBookingPreviewProps) => {
  const priceLabel = basePriceType === 'per_person' 
    ? (lang === 'he' ? 'לאדם' : lang === 'fr' ? 'par voyageur' : 'per person')
    : (lang === 'he' ? 'להזמנה' : lang === 'fr' ? 'par réservation' : 'per booking');

  const currencySymbol = currency === 'USD' ? '$' : '€';
  const formattedPrice = lang === 'he' 
    ? `${currencySymbol}${basePrice}`
    : `${basePrice} ${currencySymbol}`;

  return (
    <div className="hidden md:block">
      <div className="bg-muted/30 rounded-xl p-3 lg:p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Price info */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-foreground">
                {lang === 'he' ? 'מ-' : lang === 'fr' ? 'À partir de ' : 'From '}
              </span>
              <span className="text-base lg:text-lg font-semibold text-foreground underline">
                {formattedPrice}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{priceLabel}</p>
            {/* Cancellation info removed — dynamic data not available at this level */}
          </div>

          {/* Right: CTA Button */}
          <Button 
            onClick={onViewDates}
            variant="cta"
            className="px-4 text-sm uppercase tracking-wide"
          >
            {lang === 'he' ? 'לתאריכים' : lang === 'fr' ? 'Voir les dates' : 'View dates'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroBookingPreview;
