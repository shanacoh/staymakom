/**
 * BookingPanel V2 – Step 1 only: Dates/Room selection
 * Then navigates to /checkout for guest info + confirmation
 * Fetches real-time prices/rooms from HyperGuest
 * Max 30 nights (API limit SN.400)
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertCircle, CalendarDays, Sparkles, Loader2, Clock, Baby, Minus, Plus, ChevronRight, ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import { SaveForLaterButton } from "./SaveForLaterButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { DualPrice } from "@/components/ui/DualPrice";
import { RoomOptionsV2 } from "./RoomOptionsV2";
import { PriceBreakdownV2 } from "./PriceBreakdownV2";
import { useHyperGuestAvailability } from "@/hooks/useHyperGuestAvailability";
import { useQuickDateAvailability } from "@/hooks/useQuickDateAvailability";
import { useExperience2Price, useExperienceAddons, useExperiencePricingConfig, calculateFromPrice } from "@/hooks/useExperience2Price";
import type { PricingConfig } from "@/types/experience2_addons";
import { formatGuests, calculateNights } from "@/services/hyperguest";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CheckoutState } from "@/pages/Checkout";
import { trackDurationTabClicked, trackDateSelected, trackViewDatesClicked, trackGuestsSelected, trackRoomTypeSelected, trackBookThisStayClicked } from "@/lib/analytics";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DateRange } from "react-day-picker";

interface DateOption {
  id: string;
  checkin: string;
  checkout: string;
  label: string | null;
  label_he: string | null;
  price_override: number | null;
  original_price: number | null;
  discount_percent: number | null;
  featured: boolean;
}

interface SelectedExtra {
  id: string;
  name: string;
  name_he: string | null;
  price: number;
  currency: string;
  pricing_type: string;
}

interface BookingPanel2Props {
  experienceId: string;
  experienceTitle?: string;
  experienceSlug?: string;
  hotelId: string;
  hotelName?: string;
  hyperguestPropertyId: string | null;
  currency?: string;
  minParty?: number;
  maxParty?: number;
  lang?: "en" | "he" | "fr";
  selectedExtras?: SelectedExtra[];
  onToggleExtra?: (extra: SelectedExtra) => void;
}

export function BookingPanel2({
  experienceId,
  experienceTitle = "",
  experienceSlug = "",
  hotelId,
  hotelName = "",
  hyperguestPropertyId,
  currency = "ILS",
  minParty = 2,
  maxParty = 4,
  lang = "en",
  selectedExtras = [],
  onToggleExtra,
}: BookingPanel2Props) {
  const navigate = useNavigate();
  const { symbol: currencySymbol, convert } = useCurrency();

  const t = {
    en: {
      title: "Book this experience",
      dates: "Dates",
      guests: "Number of guests",
      adults: "Adults",
      children: "Children (2-12)",
      infants: "Infants (0-1)",
      childAge: "Age",
      selectDates: "Select dates",
      noHyperguest: "This experience is not available for online booking yet.",
      error: "Error loading availability. Please try again.",
      next: "Book this stay",
      onRequestWarning: "This booking is subject to hotel confirmation. You will be notified of the status.",
      showMore: "Show more dates ↓",
      bestRate: "● Best rate",
      enhanceTitle: "ENHANCE YOUR STAY",
    },
    he: {
      title: "הזמן חוויה זו",
      dates: "תאריכים",
      guests: "מספר אורחים",
      adults: "מבוגרים",
      children: "ילדים (2-12)",
      infants: "תינוקות (0-1)",
      childAge: "גיל",
      selectDates: "בחר תאריכים",
      noHyperguest: "חוויה זו אינה זמינה עדיין להזמנה מקוונת.",
      error: "שגיאה בטעינת הזמינות. אנא נסה שוב.",
      next: "הזמן שהייה זו",
      onRequestWarning: "הזמנה זו כפופה לאישור המלון. תקבל/י עדכון על הסטטוס.",
      showMore: "הצג עוד תאריכים ↓",
      bestRate: "● הכי משתלם",
      enhanceTitle: "שדרגו את השהייה",
    },
    fr: {
      title: "Réserver cette expérience",
      dates: "Dates",
      guests: "Nombre de voyageurs",
      adults: "Adultes",
      children: "Enfants (2-12 ans)",
      infants: "Bébés (0-1 an)",
      childAge: "Âge",
      selectDates: "Sélectionnez des dates",
      noHyperguest: "Cette expérience n'est pas encore disponible pour la réservation en ligne.",
      error: "Erreur lors de la récupération des disponibilités. Veuillez réessayer.",
      next: "Réserver ce séjour",
      onRequestWarning: "Cette réservation est soumise à confirmation par l'hôtel. Vous serez notifié du statut.",
      showMore: "Voir plus de dates ↓",
      bestRate: "● Meilleur tarif",
      enhanceTitle: "AMÉLIOREZ VOTRE SÉJOUR",
    },
  }[lang];

  // ── State ──
  const { data: dateOptions } = useQuery({
    queryKey: ["experience2-date-options-public", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience2_date_options" as any)
        .select("*")
        .eq("experience_id", experienceId)
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DateOption[];
    },
  });

  type NightsTab = 1 | 2 | 3 | "pick";
  const [selectedTab, setSelectedTab] = useState<NightsTab>(1);
  const [selectedDateOptionId, setSelectedDateOptionId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [adults, setAdults] = useState(minParty);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedRatePlanId, setSelectedRatePlanId] = useState<number | null>(null);
  const [dateSlotOffset, setDateSlotOffset] = useState(0);
  const [guestsExpanded, setGuestsExpanded] = useState(false);

  // Fetch real availability for 1/2/3 nights tabs
  const propId = hyperguestPropertyId ? parseInt(hyperguestPropertyId) : null;
  const { data: quickDates, isLoading: isLoadingQuickDates } = useQuickDateAvailability({
    propertyId: propId,
    nights: typeof selectedTab === "number" ? selectedTab : 1,
    adults,
    currency,
    enabled: selectedTab !== "pick",
  });

  // Fetch addons & pricing config for "from" price on date cards
  const { data: _addons } = useExperienceAddons(experienceId);
  const { data: _pricingConfig } = useExperiencePricingConfig(experienceId);

  // Fetch available extras for the panel checklist
  const { data: panelExtras } = useQuery({
    queryKey: ["experience2-panel-extras", experienceId],
    queryFn: async () => {
      const { data: links, error: linksError } = await (supabase as any)
        .from("experience2_extras")
        .select("extra_id")
        .eq("experience_id", experienceId);
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];
      const extraIds = links.map((l: any) => l.extra_id);
      const { data, error } = await supabase
        .from("hotel2_extras")
        .select("*")
        .in("id", extraIds)
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  /** Apply fixed addons + commissions to a raw HyperGuest room price */
  const applyFromPrice = (rawPrice: number | null): number | null => {
    if (rawPrice == null || rawPrice <= 0) return rawPrice;
    const config: PricingConfig = _pricingConfig ?? {
      commission_room_pct: 0, commission_addons_pct: 0, tax_pct: 0,
      promo_type: null, promo_value: null, promo_is_percentage: true,
    };
    return calculateFromPrice(rawPrice, _addons ?? [], config);
  };

  // Find the best rate (cheapest) — now supports MULTIPLE slots
  const bestRatePrice = useMemo(() => {
    if (!quickDates || quickDates.length === 0) return null;
    let bestPrice = Infinity;
    for (const opt of quickDates) {
      const price = applyFromPrice(opt.cheapestPrice) ?? opt.cheapestPrice;
      if (price != null && price < bestPrice) {
        bestPrice = price;
      }
    }
    return bestPrice === Infinity ? null : bestPrice;
  }, [quickDates, _addons, _pricingConfig]);

  const isBestRateSlot = useCallback((opt: any) => {
    if (bestRatePrice == null) return false;
    const price = applyFromPrice(opt.cheapestPrice) ?? opt.cheapestPrice;
    return price != null && Math.abs(price - bestRatePrice) < 0.01;
  }, [bestRatePrice, _addons, _pricingConfig]);

  // Auto-select the cheapest available date when quickDates load
  useEffect(() => {
    if (selectedTab !== "pick" && quickDates && quickDates.length > 0 && !selectedDateOptionId) {
      const cheapest = quickDates.reduce((best, curr) => {
        if (curr.cheapestPrice == null) return best;
        if (!best || best.cheapestPrice == null || curr.cheapestPrice < best.cheapestPrice) return curr;
        return best;
      }, null as typeof quickDates[0] | null);
      if (cheapest) {
        setSelectedDateOptionId(cheapest.id);
      }
    }
  }, [quickDates, selectedTab, selectedDateOptionId]);

  useEffect(() => {
    if (selectedDateOptionId && selectedTab !== "pick" && quickDates) {
      const opt = quickDates.find((d) => d.id === selectedDateOptionId);
      if (opt) {
        setDateRange({ from: opt.checkin, to: opt.checkout });
        const checkIn = typeof opt.checkin === 'string' ? opt.checkin : (opt.checkin as Date).toISOString().split('T')[0];
        trackDateSelected(experienceSlug, checkIn, opt.nights || (typeof selectedTab === 'number' ? selectedTab : 1));
      }
    }
  }, [selectedDateOptionId, quickDates, selectedTab]);

  useEffect(() => {
    setSelectedDateOptionId(null);
    setDateRange({});
    setSelectedRoomId(null);
    setSelectedRatePlanId(null);
    setDateSlotOffset(0);
  }, [selectedTab]);

  const MAX_NIGHTS = 30;

  const searchParams = useMemo(() => {
    if (!dateRange.from || !dateRange.to || !hyperguestPropertyId) return null;
    const checkIn = dateRange.from.toISOString().split("T")[0];
    const rawNights = calculateNights(checkIn, dateRange.to.toISOString().split("T")[0]);
    const nights = Math.min(rawNights, MAX_NIGHTS);
    const guests = formatGuests([{ adults, children: childrenAges }]);
    return { checkIn, nights, guests, hotelIds: [parseInt(hyperguestPropertyId)], customerNationality: "IL", currency };
  }, [dateRange, adults, childrenAges, hyperguestPropertyId, currency]);

  const {
    data: searchResult,
    isLoading: isLoadingAvailability,
    error: availabilityError,
  } = useHyperGuestAvailability(hyperguestPropertyId ? parseInt(hyperguestPropertyId) : null, searchParams);

  const selectedRatePlan = useMemo(() => {
    if (!searchResult || !selectedRoomId || !selectedRatePlanId) return null;
    let rooms: any[] = [];
    if (searchResult.results && searchResult.results.length > 0) {
      rooms = searchResult.results[0]?.rooms || [];
    } else if (searchResult.rooms) {
      rooms = searchResult.rooms;
    }
    const room = rooms.find((r: any) => r.roomId === selectedRoomId);
    return room?.ratePlans?.find((rp: any) => rp.ratePlanId === selectedRatePlanId) || null;
  }, [searchResult, selectedRoomId, selectedRatePlanId]);

  const selectedRoomName = useMemo(() => {
    if (!searchResult || !selectedRoomId) return "";
    let rooms: any[] = [];
    if (searchResult.results && searchResult.results.length > 0) {
      rooms = searchResult.results[0]?.rooms || [];
    } else if (searchResult.rooms) {
      rooms = searchResult.rooms;
    }
    return rooms.find((r: any) => r.roomId === selectedRoomId)?.roomName || "";
  }, [searchResult, selectedRoomId]);

  const propertyRemarks = useMemo(() => {
    let raw: string[] = [];
    if (!searchResult) return raw;
    if (searchResult.results && searchResult.results.length > 0) {
      raw = searchResult.results[0]?.remarks || [];
    } else if ((searchResult as any).remarks) {
      raw = (searchResult as any).remarks;
    }
    return raw.filter((r: string) => !/general message that should be shown/i.test(r));
  }, [searchResult]);

  const nights = searchParams?.nights || 0;
  const ratePlanPrices = selectedRatePlan?.prices || null;
  const priceBreakdown = useExperience2Price(experienceId, null, currency, nights, adults, ratePlanPrices);

  useEffect(() => {
    if (searchResult && !selectedRoomId) {
      let rooms: any[] = [];
      if (searchResult.results && searchResult.results.length > 0) {
        rooms = searchResult.results[0]?.rooms || [];
      } else if (searchResult.rooms) {
        rooms = searchResult.rooms;
      }
      if (rooms.length > 0) {
        const firstRoom = rooms[0];
        if (firstRoom.ratePlans?.length > 0) {
          setSelectedRoomId(firstRoom.roomId);
          setSelectedRatePlanId(firstRoom.ratePlans[0].ratePlanId);
        }
      }
    }
  }, [searchResult, selectedRoomId]);

  useEffect(() => {
    setSelectedRoomId(null);
    setSelectedRatePlanId(null);
  }, [dateRange.from, dateRange.to]);

  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce((sum, extra) => {
      let multiplier = 1;
      if (extra.pricing_type === "per_guest") multiplier = adults;
      if (extra.pricing_type === "per_night") multiplier = nights;
      return sum + extra.price * multiplier;
    }, 0);
  }, [selectedExtras, adults, nights]);

  const isStep1Complete = !!(dateRange.from && dateRange.to && selectedRoomId && selectedRatePlanId);
  const displayTotal = (priceBreakdown?.finalTotal ?? 0) + extrasTotal;
  const totalIsNaN = Number.isNaN(displayTotal);
  const isOnRequest = selectedRatePlan?.isImmediate === false;

  const handleContinue = () => {
    if (!dateRange.from || !dateRange.to || !selectedRoomId || !selectedRatePlanId || !selectedRatePlan) return;
    trackBookThisStayClicked(experienceSlug, displayTotal);

    const checkoutState: CheckoutState = {
      experienceId,
      experienceTitle,
      hotelId,
      hotelName,
      hyperguestPropertyId: hyperguestPropertyId!,
      currency,
      lang,
      adults,
      childrenAges,
      dateRange: {
        from: dateRange.from.toISOString().split("T")[0],
        to: dateRange.to.toISOString().split("T")[0],
      },
      nights,
      selectedRoomId,
      selectedRatePlanId,
      selectedRoomName,
      selectedRatePlan,
      propertyRemarks,
      selectedExtras,
      searchParams,
      experienceSlug,
    };

    try {
      localStorage.setItem("staymakom_cart", JSON.stringify({
        ...checkoutState,
        savedAt: new Date().toISOString(),
      }));
    } catch {}

    navigate("/checkout", { state: checkoutState });
  };

  // Handle extra toggle from panel checklist
  const handlePanelExtraToggle = useCallback((extra: any) => {
    if (!onToggleExtra) return;
    const extraData: SelectedExtra = {
      id: extra.id,
      name: extra.name,
      name_he: extra.name_he,
      price: extra.price,
      currency: currency,
      pricing_type: extra.pricing_type,
    };
    onToggleExtra(extraData);
  }, [onToggleExtra, currency]);

  if (!hyperguestPropertyId) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Button
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium uppercase tracking-wide py-6 text-base"
            onClick={() => {
              window.location.href = `/contact?subject=Stay Request: ${experienceTitle}&experience=${experienceSlug}`;
            }}
          >
            {lang === 'he' ? 'בקשו שהייה זו' : lang === 'fr' ? 'Demander ce séjour' : 'Request this stay'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {lang === 'he' ? 'נאשר זמינות תוך 24 שעות' : lang === 'fr' ? 'Nous confirmerons la disponibilité sous 24h' : "We'll confirm availability within 24h"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Date slots with ← → navigation (show 3 at a time)
  const SLOTS_PER_PAGE = 3;
  const visibleQuickDates = quickDates?.slice(dateSlotOffset, dateSlotOffset + SLOTS_PER_PAGE) ?? [];
  const canGoBack = dateSlotOffset > 0;
  const canGoForward = quickDates ? dateSlotOffset + SLOTS_PER_PAGE < quickDates.length : false;

  // Guests label for collapsed view
  const guestsLabel = (() => {
    const parts: string[] = [];
    parts.push(`${adults} ${adults === 1 ? (lang === 'he' ? 'מבוגר' : lang === 'fr' ? 'adulte' : 'adult') : (lang === 'he' ? 'מבוגרים' : lang === 'fr' ? 'adultes' : 'adults')}`);
    if (childrenAges.length > 0) {
      parts.push(`${childrenAges.length} ${lang === 'he' ? 'ילדים' : lang === 'fr' ? 'enfants' : 'children'}`);
    }
    return parts.join(', ');
  })();

  return (
    <Card className="overflow-hidden will-change-transform">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-hidden overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {/* Guests — compact collapsible */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setGuestsExpanded(!guestsExpanded)}
            className="flex items-center justify-between w-full text-sm cursor-pointer group"
          >
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4" />
              <span>{guestsLabel}</span>
            </div>
            {guestsExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {guestsExpanded && (
            <div className="space-y-3 pt-1">
              {/* Adults */}
              <div className="flex items-center justify-between" dir="ltr">
                <span className="text-sm" dir={lang === "he" ? "rtl" : "ltr"}>{t.adults}</span>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => { const v = Math.max(minParty, adults - 1); setAdults(v); trackGuestsSelected(experienceSlug, v, childrenAges.length); }} disabled={adults <= minParty}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-lg font-medium w-8 text-center">{adults}</span>
                  <Button variant="outline" size="sm" onClick={() => { const v = Math.min(maxParty, adults + 1); setAdults(v); trackGuestsSelected(experienceSlug, v, childrenAges.length); }} disabled={adults >= maxParty}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between" dir="ltr">
                <span className="text-sm" dir={lang === "he" ? "rtl" : "ltr"}>{t.children}</span>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => setChildrenAges(prev => prev.slice(0, -1))} disabled={childrenAges.length === 0}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-lg font-medium w-8 text-center">{childrenAges.filter(a => a >= 2).length}</span>
                  <Button variant="outline" size="sm" onClick={() => setChildrenAges(prev => [...prev, 5])} disabled={childrenAges.length >= 4}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Age selectors */}
              {childrenAges.length > 0 && (
                <div className="pl-4 space-y-2">
                  {childrenAges.map((age, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Baby className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground w-16">
                        {age < 2 ? (lang === "he" ? "תינוק" : lang === "fr" ? "Bébé" : "Infant") : (lang === "he" ? `ילד ${idx + 1}` : lang === "fr" ? `Enfant ${idx + 1}` : `Child ${idx + 1}`)}
                      </span>
                      <Select
                        value={String(age)}
                        onValueChange={(v) => {
                          const newAges = [...childrenAges];
                          newAges[idx] = parseInt(v);
                          setChildrenAges(newAges);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 13 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i} {lang === "he" ? "שנים" : lang === "fr" ? "ans" : i === 1 ? "yr" : "yrs"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Date Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4" />
            {t.dates}
          </div>

          <div className="flex gap-1.5" dir="ltr">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { trackDurationTabClicked(experienceSlug, n); setSelectedTab(n); }}
                className={cn(
                  "flex-1 px-1 py-1.5 rounded-lg border-2 transition-all text-xs whitespace-nowrap",
                  "hover:border-primary/50",
                  selectedTab === n ? "border-primary bg-primary/5 font-medium" : "border-border"
                )}
              >
                {n} {n === 1
                  ? (lang === "he" ? "לילה" : lang === "fr" ? "nuit" : "night")
                  : (lang === "he" ? "לילות" : lang === "fr" ? "nuits" : "nights")
                }
              </button>
            ))}
            <button
              type="button"
              onClick={() => { trackViewDatesClicked(experienceSlug); setSelectedTab("pick"); }}
              className={cn(
                "flex-1 px-1 py-1.5 rounded-lg border-2 transition-all text-xs whitespace-nowrap",
                "hover:border-primary/50",
                selectedTab === "pick" ? "border-primary bg-primary/5 font-medium" : "border-border"
              )}
            >
              {lang === "he" ? "בחר תאריכים" : lang === "fr" ? "Choisir" : "Pick dates"}
            </button>
          </div>

          {/* Quick date options with ← → navigation */}
          {selectedTab !== "pick" && (
            <>
              {isLoadingQuickDates && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {lang === "he" ? "בודק זמינות..." : lang === "fr" ? "Vérification des disponibilités..." : "Checking availability..."}
                </div>
              )}
              {!isLoadingQuickDates && quickDates && quickDates.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {lang === "he" ? "אין תאריכים זמינים כרגע" : lang === "fr" ? "Aucune date disponible pour le moment" : "No available dates at the moment"}
                </p>
              )}
              {!isLoadingQuickDates && quickDates && quickDates.length > 0 && (
                <>
                  {/* Navigation arrows */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDateSlotOffset(Math.max(0, dateSlotOffset - SLOTS_PER_PAGE))}
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center transition-colors",
                        canGoBack ? "hover:bg-muted cursor-pointer" : "opacity-0 pointer-events-none"
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] text-muted-foreground">
                      {dateSlotOffset + 1}–{Math.min(dateSlotOffset + SLOTS_PER_PAGE, quickDates.length)} / {quickDates.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDateSlotOffset(dateSlotOffset + SLOTS_PER_PAGE)}
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center transition-colors",
                        canGoForward ? "hover:bg-muted cursor-pointer" : "opacity-0 pointer-events-none"
                      )}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <RadioGroup
                    value={selectedDateOptionId ?? ""}
                    onValueChange={(val) => setSelectedDateOptionId(val)}
                    className="space-y-1.5"
                  >
                    {visibleQuickDates.map((opt) => {
                      const isBest = isBestRateSlot(opt);
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedDateOptionId === opt.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={opt.id} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {format(opt.checkin, "EEE dd MMM")} → {format(opt.checkout, "EEE dd MMM")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {opt.nights} {opt.nights === 1
                                ? (lang === "he" ? "לילה" : lang === "fr" ? "nuit" : "night")
                                : (lang === "he" ? "לילות" : lang === "fr" ? "nuits" : "nights")
                              }
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {isBest && (
                              <p className="text-[11px] font-medium" style={{ color: '#B85C4A' }}>
                                {t.bestRate}
                              </p>
                            )}
                            {opt.cheapestPrice != null && (
                              <>
                                <p className="text-[10px] text-muted-foreground">
                                  {lang === "he" ? "מ-" : lang === "fr" ? "à partir de" : "from"}
                                </p>
                                <DualPrice amount={applyFromPrice(opt.cheapestPrice) ?? opt.cheapestPrice} currency={opt.currency} inline className="text-sm font-semibold text-primary" />
                              </>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </>
              )}
            </>
          )}

          {/* Pick dates — inline calendar (single month) */}
          {selectedTab === "pick" && (
            <div
              className="rounded border p-2"
              style={{
                backgroundColor: '#FAF8F4',
                borderColor: '#E8E0D4',
              }}
            >
              <Calendar
                mode="range"
                defaultMonth={dateRange.from || new Date()}
                selected={dateRange as DateRange}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={1}
                disabled={(date) => date < new Date()}
                className="pointer-events-auto p-1"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-3",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-bold",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-[#F0EBE3] rounded-full flex items-center justify-center transition-colors",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "flex-1 text-center font-normal text-[11px] uppercase tracking-[0.08em]",
                  row: "flex w-full mt-1",
                  cell: cn(
                    "flex-1 h-9 text-center text-sm p-0 relative",
                    "[&:has([aria-selected].day-range-end)]:rounded-r-full",
                    "[&:has([aria-selected])]:bg-[#F5F0E8]",
                    "first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
                    "focus-within:relative focus-within:z-20"
                  ),
                  day: "h-9 w-9 mx-auto p-0 font-normal text-sm rounded-full hover:bg-[#F0EBE3] transition-colors aria-selected:opacity-100",
                  day_range_end: "day-range-end",
                  day_selected: "bg-[#1A1814] text-white hover:bg-[#1A1814] hover:text-white focus:bg-[#1A1814] focus:text-white rounded-full",
                  day_today: "bg-[#F0EBE3] rounded-full",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-[#F5F0E8]/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-[0.35]",
                  day_range_middle: "aria-selected:bg-[#F5F0E8] aria-selected:text-foreground rounded-none",
                  day_hidden: "invisible",
                }}
                styles={{
                  head_cell: { color: '#8C7B6B' },
                  caption_label: { color: '#1A1814', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
                  day: { color: '#2C2520', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
                  nav_button: { color: '#1A1814' },
                }}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Room options */}
        {searchParams && (
          <RoomOptionsV2
            searchResult={searchResult}
            isLoading={isLoadingAvailability}
            selectedRoomId={selectedRoomId}
            selectedRatePlanId={selectedRatePlanId}
            onSelect={(roomId, ratePlanId) => {
              setSelectedRoomId(roomId);
              setSelectedRatePlanId(ratePlanId);
              let rooms: any[] = [];
              if (searchResult?.results?.[0]?.rooms) rooms = searchResult.results[0].rooms;
              else if (searchResult?.rooms) rooms = searchResult.rooms;
              const rm = rooms.find((r: any) => r.roomId === roomId);
              if (rm) trackRoomTypeSelected(experienceSlug, rm.roomName || '', rm.ratePlans?.find((rp: any) => rp.ratePlanId === ratePlanId)?.prices?.sell?.price ?? 0);
            }}
            lang={lang}
            checkInDate={searchParams?.checkIn}
          />
        )}

        {/* ENHANCE YOUR STAY — extras checklist */}
        {panelExtras && panelExtras.length > 0 && onToggleExtra && (
          <div className="space-y-0">
            <div className="py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] font-medium" style={{ color: '#8C7B6B' }}>
                {t.enhanceTitle}
              </p>
            </div>
            <div className="border-t" style={{ borderColor: '#E8E0D4' }}>
              {panelExtras.map((extra) => {
                const isChecked = selectedExtras.some((se) => se.id === extra.id);
                const name = lang === "he" ? extra.name_he || extra.name : extra.name;
                const displayPrice = `+${currencySymbol}${Math.round(convert(extra.price))}`;
                return (
                  <div
                    key={extra.id}
                    onClick={() => handlePanelExtraToggle(extra)}
                    className="flex items-center gap-3 cursor-pointer transition-colors px-1"
                    style={{ minHeight: '44px', borderBottom: '1px solid #F0EBE3' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF8F4')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handlePanelExtraToggle(extra)}
                      className={cn(
                        "h-4 w-4 rounded-sm border-[1.5px] shrink-0",
                        isChecked
                          ? "bg-[#1A1814] border-[#1A1814] text-white data-[state=checked]:bg-[#1A1814] data-[state=checked]:text-white data-[state=checked]:border-[#1A1814]"
                          : "border-[#C8C0B4]"
                      )}
                    />
                    <span className="flex-1 text-[13px] truncate" style={{ color: '#2C2520' }}>{name}</span>
                    <span className="text-[13px] shrink-0" style={{ color: '#8C7B6B' }}>{displayPrice}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* On-request warning */}
        {isOnRequest && selectedRatePlan && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              {t.onRequestWarning}
            </AlertDescription>
          </Alert>
        )}

        {/* Selected extras summary */}
        {selectedExtras.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              {lang === "he" ? "תוספות נבחרות" : lang === "fr" ? "Extras sélectionnés" : "Selected extras"}
            </div>
            {selectedExtras.map((extra) => {
              const name = lang === "he" ? extra.name_he || extra.name : extra.name;
              let multiplier = 1;
              if (extra.pricing_type === "per_guest") multiplier = adults;
              if (extra.pricing_type === "per_night") multiplier = nights;
              const lineTotal = extra.price * multiplier;
              return (
                <div key={extra.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{name}</span>
                  <DualPrice amount={lineTotal} currency={extra.currency} inline className="text-sm" />
                </div>
              );
            })}
            <div className="flex justify-between text-sm font-medium pt-1 border-t border-border">
              <span>{lang === "he" ? "סה\"כ תוספות" : lang === "fr" ? "Total extras" : "Extras total"}</span>
              <DualPrice amount={extrasTotal} currency={currency} inline className="text-sm" />
            </div>
          </div>
        )}

        {/* Price summary with VAT tooltip */}
        {priceBreakdown && !totalIsNaN && (
          <div className="space-y-2">
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold" style={{ color: '#1A1814' }}>
                {lang === "he" ? 'סה"כ' : "Total"}
              </span>
              <div className="flex items-center gap-1.5">
                <DualPrice amount={displayTotal} currency={priceBreakdown.currency} inline className="text-lg font-bold" />
                <div className="relative group">
                  <span className="text-xs cursor-help" style={{ color: '#8C7B6B' }}>ⓘ</span>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50" style={{ width: '260px' }}>
                    <div className="text-xs text-white leading-relaxed" style={{
                      background: '#1A1814',
                      borderRadius: '4px',
                      padding: '10px 12px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                    }}>
                      {lang === "he"
                        ? "מבקרים זרים עם אשרת B/2 פטורים ממע\"מ.\nתושבי ישראל משלמים 18% מע\"מ ישירות במלון בעת הצ'ק-אין.\nסכום זה אינו נגבה על ידי STAYMAKOM."
                        : "Foreign visitors with a B/2 visa are exempt from VAT.\nIsraeli residents pay 18% VAT directly at the hotel upon check-in.\nThis amount is not collected by STAYMAKOM."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {availabilityError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t.error}</AlertDescription>
          </Alert>
        )}

        {/* Continue to checkout */}
        <Button
          className="w-full"
          size="lg"
          disabled={!isStep1Complete}
          onClick={handleContinue}
        >
          {isStep1Complete ? t.next : t.selectDates}
        </Button>

        <p className="text-[11px] text-muted-foreground text-center leading-snug">
          {lang === "he"
            ? "כל התשלומים מתבצעים בשקלים (₪). המחירים המוצגים במטבע אחר הם להמחשה בלבד לפי שער החליפין הנוכחי. הסכום הסופי בשקלים הוא המחייב."
            : lang === "fr"
            ? "Tous les paiements sont effectués en shekels (₪). Les prix affichés dans une autre devise sont indicatifs, basés sur le taux de change actuel. Le montant final en shekels fait foi."
            : "All payments are processed in Israeli Shekels (₪). Prices shown in other currencies are approximate, based on the current exchange rate. The final amount in ILS is binding."}
        </p>

        {/* Save for later */}
        <SaveForLaterButton
          experienceId={experienceId}
          checkin={dateRange.from ? dateRange.from.toISOString().split("T")[0] : undefined}
          checkout={dateRange.to ? dateRange.to.toISOString().split("T")[0] : undefined}
          partySize={adults}
          roomCode={selectedRoomId?.toString()}
          roomName={selectedRoomName}
          lang={lang}
          variant="full"
        />
      </CardContent>
    </Card>
  );
}
