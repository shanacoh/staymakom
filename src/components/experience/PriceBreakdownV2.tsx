// =============================================================================
// src/components/experience/PriceBreakdownV2.tsx
// Clean price breakdown — "Your stay" unified model + service fee
// =============================================================================

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check } from "lucide-react";
import type { PriceBreakdownV2 as PriceBreakdownType } from "@/types/experience2_addons";
import { DualPrice } from "@/components/ui/DualPrice";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PriceBreakdownV2Props {
  breakdown: PriceBreakdownType | null;
  isLoading?: boolean;
  className?: string;
  lang?: "en" | "he" | "fr";
  /** Raw rate plan for extracting HyperGuest taxes */
  ratePlanPrices?: any;
  /** Optional extras to display */
  selectedExtras?: Array<{ name: string; name_he?: string | null; price: number; currency: string; pricing_type: string }>;
  extrasTotal?: number;
  adults?: number;
  nights?: number;
  /** Show the full breakdown (for checkout step 3) */
  showFullBreakdown?: boolean;
  /** Hotel name for display */
  hotelName?: string;
  /** Room name for display */
  roomName?: string;
  /** Date string for display */
  dateLabel?: string;
}

const translations = {
  en: {
    title: "PRICE BREAKDOWN",
    yourStay: "Your stay",
    included: "included",
    optionalExtras: "Optional extras",
    total: "TOTAL",
    nights: "night",
    nightsPlural: "nights",
    guests: "guest",
    guestsPlural: "guests",
    noData: "Select a room and rate plan to see the price breakdown.",
    vatTooltip: "Foreign visitors with a B/2 visa are exempt from VAT.\nIsraeli residents pay 18% VAT directly at the hotel upon check-in.\nThis amount is not collected by STAYMAKOM.",
    serviceFee: "STAYMAKOM service fee",
  },
  he: {
    title: "פירוט מחיר",
    yourStay: "השהייה שלך",
    included: "כלול",
    optionalExtras: "תוספות",
    total: 'סה"כ',
    nights: "לילה",
    nightsPlural: "לילות",
    guests: "אורח",
    guestsPlural: "אורחים",
    noData: "בחר חדר ותכנית תעריף כדי לראות פירוט מחירים.",
    vatTooltip: "מבקרים זרים עם אשרת B/2 פטורים ממע\"מ.\nתושבי ישראל משלמים 18% מע\"מ ישירות במלון בעת הצ'ק-אין.\nסכום זה אינו נגבה על ידי STAYMAKOM.",
    serviceFee: "עמלת שירות STAYMAKOM",
  },
  fr: {
    title: "DÉTAIL DU PRIX",
    yourStay: "Votre séjour",
    included: "inclus",
    optionalExtras: "Extras optionnels",
    total: "TOTAL",
    nights: "nuit",
    nightsPlural: "nuits",
    guests: "voyageur",
    guestsPlural: "voyageurs",
    noData: "Sélectionnez une chambre et un plan tarifaire pour voir le détail du prix.",
    vatTooltip: "Les visiteurs étrangers munis d'un visa B/2 sont exemptés de TVA.\nLes résidents israéliens paient 18% de TVA directement à l'hôtel lors du check-in.\nCe montant n'est pas perçu par STAYMAKOM.",
    serviceFee: "Frais de service STAYMAKOM",
  },
};

function useFmt() {
  const { symbol, convert } = useCurrency();
  return (amount: number): string => {
    const converted = convert(amount);
    return `${symbol}${converted.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };
}

/** Hook to fetch service fee from global settings */
function useServiceFee() {
  return useQuery({
    queryKey: ["global-service-fee"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("service_fee")
        .eq("key", "site_config")
        .maybeSingle();
      if (error || !data) return 0;
      return (data as any).service_fee ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function PriceBreakdownV2({
  breakdown,
  isLoading = false,
  className = "",
  lang = "en",
  ratePlanPrices,
  selectedExtras,
  extrasTotal = 0,
  adults,
  nights: nightsProp,
  showFullBreakdown = false,
  hotelName,
  roomName,
  dateLabel,
}: PriceBreakdownV2Props) {
  const t = translations[lang];
  const fmt = useFmt();
  const { data: serviceFee = 0 } = useServiceFee();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!breakdown) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground italic">{t.noData}</p>
        </CardContent>
      </Card>
    );
  }

  const b = breakdown;
  const nightsCount = nightsProp ?? b.nights;
  const guestsCount = adults ?? b.guests;
  const hasExtras = selectedExtras && selectedExtras.length > 0;
  const totalWithExtras = b.finalTotal + extrasTotal + (serviceFee || 0);

  // Get the first pricing addon name for the "included" line
  const includedAddonName = b.pricingAddonLines.length > 0 ? b.pricingAddonLines[0].name : null;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.12em] font-medium" style={{ color: '#8C7B6B', fontFamily: 'Inter, sans-serif' }}>
          {t.title}
        </p>
        <p className="text-[11px]" style={{ color: '#8C7B6B' }}>
          {nightsCount} {nightsCount === 1 ? t.nights : t.nightsPlural} · {guestsCount} {guestsCount === 1 ? t.guests : t.guestsPlural}
        </p>
      </div>

      <Separator className="mb-4" />

      {/* Full breakdown details (hotel, dates, room) */}
      {showFullBreakdown && (hotelName || roomName || dateLabel) && (
        <div className="mb-3 space-y-1">
          {hotelName && <p className="text-[12px]" style={{ color: '#8C7B6B' }}>{hotelName}</p>}
          {dateLabel && <p className="text-[12px]" style={{ color: '#8C7B6B' }}>{dateLabel}</p>}
          {roomName && <p className="text-[12px]" style={{ color: '#8C7B6B' }}>{roomName}</p>}
          <Separator className="my-2" />
        </div>
      )}

      {/* Your stay */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[14px] font-medium" style={{ color: '#2C2520' }}>{t.yourStay}</span>
        <span className="text-[14px] font-medium" style={{ color: '#2C2520' }}>{fmt(b.finalTotal)}</span>
      </div>

      {/* Included addon note */}
      {includedAddonName && (
        <div className="flex items-center gap-1.5 mb-4">
          <Check className="h-3.5 w-3.5" style={{ color: '#B85C4A' }} />
          <span className="text-[12px]" style={{ color: '#8C7B6B' }}>
            {includedAddonName} {t.included}
          </span>
        </div>
      )}

      {/* Optional extras */}
      {hasExtras && (
        <>
          <div className="mb-2">
            <p className="text-[12px] font-medium mb-2" style={{ color: '#8C7B6B' }}>
              {t.optionalExtras}
            </p>
            {selectedExtras!.map((extra, i) => {
              const name = lang === "he" ? extra.name_he || extra.name : extra.name;
              let multiplier = 1;
              if (extra.pricing_type === "per_guest" && adults) multiplier = adults;
              if (extra.pricing_type === "per_night" && nightsProp) multiplier = nightsProp;
              const lineTotal = extra.price * multiplier;
              return (
                <div key={i} className="flex justify-between text-[13px] mb-1">
                  <span style={{ color: '#2C2520' }}>{name}</span>
                  <span style={{ color: '#2C2520' }}>{fmt(lineTotal)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Service fee */}
      {serviceFee > 0 && (
        <div className="flex justify-between text-[13px] mb-2">
          <span style={{ color: '#8C7B6B' }}>{t.serviceFee}</span>
          <span style={{ color: '#2C2520' }}>₪{serviceFee}</span>
        </div>
      )}

      <Separator className="my-4" />

      {/* Total with VAT tooltip */}
      <div className="flex justify-between items-center">
        <span className="font-bold" style={{ color: '#1A1814', fontFamily: 'Inter, sans-serif', fontSize: '18px' }}>
          {t.total}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: '#1A1814', fontFamily: 'Inter, sans-serif', fontSize: '18px' }}>
            {fmt(totalWithExtras)}
          </span>
          <div className="relative group">
            <span className="text-xs cursor-help" style={{ color: '#8C7B6B' }}>ⓘ</span>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50" style={{ width: '260px' }}>
              <div className="text-xs text-white leading-relaxed whitespace-pre-line" style={{
                background: '#1A1814',
                borderRadius: '4px',
                padding: '10px 12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
              }}>
                {t.vatTooltip}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
