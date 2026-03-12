/**
 * Admin : Aperçu prix / disponibilités pour une expérience
 * Mini calendrier + bouton "Vérifier prix" → recherche chambres HyperGuest
 * Affiche les chambres et le détail prix (HyperGuest + add-ons) comme le verra l'utilisateur.
 *
 * V2 : Ajoute un input "Nombre de voyageurs" pour le calcul des addons par personne.
 * Utilise le nouveau hook useExperience2Price avec 6 couches.
 */
import { useState, useMemo, useEffect } from "react";
import { Calendar, Search, Users, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateRangePicker from "./DateRangePicker";
import { RoomOptionsV2 } from "./RoomOptionsV2";
import { PriceBreakdownV2 } from "./PriceBreakdownV2";
import { useHyperGuestAvailability } from "@/hooks/useHyperGuestAvailability";
import { useExperience2Price } from "@/hooks/useExperience2Price";
import { formatGuests, calculateNights } from "@/services/hyperguest";

export interface ExperienceAvailabilityPreviewProps {
  /** ID propriété HyperGuest de l'hôtel sélectionné (obligatoire pour la recherche) */
  hyperguestPropertyId: string | null;
  /** Nom de l'hôtel (affichage) */
  hotelName?: string;
  /** ID expérience pour appliquer les add-ons (optionnel) */
  experienceId: string | null;
  currency?: string;
  lang?: "en" | "he" | "fr";
  /** Nombre de nuits pré-configuré pour cet hôtel du parcours (affichage uniquement). */
  nights?: number;
  /** Nombre min de voyageurs (depuis l'expérience) */
  minParty?: number;
  /** Nombre max de voyageurs (depuis l'expérience) */
  maxParty?: number;
  /** Callback quand le prix total calculé change (pour le total parcours).
   *  Reçoit le finalTotal du PriceBreakdownV2, ou null. */
  onPriceChange?: (price: number | null) => void;
  /** Masquer le PriceBreakdownV2 individuel (quand on affiche un total combiné) */
  hidePriceBreakdown?: boolean;
}

/** Normalise la réponse API pour RoomOptionsV2 (results[0].rooms ou .rooms) */
function toSearchResult(data: unknown): { results?: { rooms: unknown[] }[]; rooms?: unknown[] } | null {
  if (data == null) return null;
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.results) && d.results.length > 0) {
    const first = d.results[0] as Record<string, unknown>;
    return { results: [{ rooms: Array.isArray(first.rooms) ? first.rooms : [] }] };
  }
  if (Array.isArray(d.rooms)) return { rooms: d.rooms };
  return null;
}

/** Tente d'extraire le prix total chambre depuis les données de prix HyperGuest */
function extractRoomTotal(prices: unknown): number | null {
  if (prices == null) return null;
  if (typeof prices === "number") return prices;
  const p = prices as Record<string, unknown>;
  if (typeof p.total === "number") return p.total;
  if (p.total && typeof (p.total as any).amount === "number") return (p.total as any).amount;
  if (typeof p.totalPrice === "number") return p.totalPrice;
  if (Array.isArray(prices)) {
    return (prices as any[]).reduce((s: number, item: any) => {
      if (typeof item === "number") return s + item;
      return s + (Number(item?.price ?? item?.amount ?? item?.rate ?? 0));
    }, 0) as number;
  }
  const arr = (p.perNight ?? p.dailyPrices) as unknown[];
  if (Array.isArray(arr)) {
    return arr.reduce<number>((s, item: any) => {
      if (typeof item === "number") return s + item;
      return s + (Number(item?.price ?? item?.amount ?? item?.rate ?? 0));
    }, 0);
  }
  return null;
}

export function ExperienceAvailabilityPreview({
  hyperguestPropertyId,
  hotelName,
  experienceId,
  currency = "USD",
  lang = "en",
  nights: propNights,
  minParty = 1,
  maxParty = 20,
  onPriceChange,
  hidePriceBreakdown = false,
}: ExperienceAvailabilityPreviewProps) {
  const t = {
    en: {
      title: "Price / availability preview",
      subtitle: "Check what guests will see for a sample stay",
      selectDates: "Select dates",
      checkPrice: "Check price",
      noHotel: "Select a hotel with HyperGuest to preview prices.",
      noDates: 'Select check-in and check-out, then click "Check price".',
      maxNights: "Max 30 nights for HyperGuest search; this range was capped.",
      nightsLabel: "nights",
      travelers: "Travelers",
    },
    he: {
      title: "תצוגת מחיר / זמינות",
      subtitle: "בדוק מה יראו האורחים לדוגמה",
      selectDates: "בחר תאריכים",
      checkPrice: "בדוק מחיר",
      noHotel: "בחר מלון עם HyperGuest לתצוגת מחירים.",
      noDates: 'בחר תאריכי כניסה ויציאה ולחץ "בדוק מחיר".',
      maxNights: "מקסימום 30 לילות לחיפוש HyperGuest; הטווח הוגבל.",
      nightsLabel: "לילות",
      travelers: "מטיילים",
    },
    fr: {
      title: "Aperçu prix / disponibilités",
      subtitle: "Vérifiez ce que verront les voyageurs pour un séjour exemple",
      selectDates: "Sélectionnez les dates",
      checkPrice: "Vérifier le prix",
      noHotel: "Sélectionnez un hôtel avec HyperGuest pour prévisualiser les prix.",
      noDates: 'Sélectionnez arrivée et départ, puis cliquez sur "Vérifier le prix".',
      maxNights: "Maximum 30 nuits pour la recherche HyperGuest ; la plage a été plafonnée.",
      nightsLabel: "nuits",
      travelers: "Voyageurs",
    },
  }[lang];

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [numberOfGuests, setNumberOfGuests] = useState(Math.max(minParty, 2));
  const [submittedRange, setSubmittedRange] = useState<{ from: Date; to: Date } | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedRatePlanId, setSelectedRatePlanId] = useState<number | null>(null);

  // -----------------------------------------------------------------------
  // Search params
  // -----------------------------------------------------------------------

  const MAX_NIGHTS = 30;

  const searchParams = useMemo(() => {
    if (!submittedRange?.from || !submittedRange?.to || !hyperguestPropertyId) return null;
    const checkIn = submittedRange.from.toISOString().split("T")[0];
    const checkOut = submittedRange.to.toISOString().split("T")[0];
    const rawNights = calculateNights(checkIn, checkOut);
    if (rawNights < 1) return null;
    const nights = Math.min(rawNights, MAX_NIGHTS);
    return {
      checkIn,
      nights,
      guests: formatGuests([{ adults: numberOfGuests, children: [] }]),
      hotelIds: [parseInt(hyperguestPropertyId, 10)],
      customerNationality: "IL",
      currency,
    };
  }, [submittedRange, hyperguestPropertyId, numberOfGuests, currency]);

  const {
    data: rawResult,
    isLoading: isLoadingAvailability,
    error: availabilityError,
  } = useHyperGuestAvailability(hyperguestPropertyId ? parseInt(hyperguestPropertyId, 10) : null, searchParams);

  const searchResult = useMemo(() => toSearchResult(rawResult), [rawResult]);
  const effectiveNights = searchParams?.nights ?? 0;

  const exceededMaxNights =
    submittedRange?.from &&
    submittedRange?.to &&
    calculateNights(submittedRange.from.toISOString().split("T")[0], submittedRange.to.toISOString().split("T")[0]) >
      MAX_NIGHTS;

  // -----------------------------------------------------------------------
  // Price breakdown V2
  // -----------------------------------------------------------------------

  const selectedRatePlan = useMemo(() => {
    if (!rawResult || !selectedRoomId || !selectedRatePlanId) return null;
    const d = rawResult as Record<string, unknown>;
    let rooms: unknown[] = [];
    if (Array.isArray(d.results) && d.results.length > 0) {
      const first = d.results[0] as Record<string, unknown>;
      rooms = Array.isArray(first.rooms) ? first.rooms : [];
    } else if (Array.isArray(d.rooms)) {
      rooms = d.rooms;
    }
    const room = rooms.find((r: unknown) => (r as { roomId?: number }).roomId === selectedRoomId) as
      | { ratePlans?: { ratePlanId: number; prices?: unknown }[] }
      | undefined;
    const plan = room?.ratePlans?.find((rp) => rp.ratePlanId === selectedRatePlanId);
    return plan ?? null;
  }, [rawResult, selectedRoomId, selectedRatePlanId]);

  const ratePlanPrices = selectedRatePlan?.prices ?? null;

  // V2 hook with numberOfGuests
  const priceBreakdown = useExperience2Price(
    experienceId,
    null,
    currency,
    effectiveNights,
    numberOfGuests,
    ratePlanPrices,
  );

  // Notify parent of total price change
  const computedTotal = priceBreakdown?.finalTotal ?? null;

  useEffect(() => {
    onPriceChange?.(computedTotal);
  }, [computedTotal, onPriceChange]);

  const roomsList = searchResult?.results?.[0]?.rooms ?? searchResult?.rooms ?? [];

  // Auto-select first room when results arrive
  useEffect(() => {
    if (!searchResult || selectedRoomId !== null) return;
    if (roomsList.length === 0) return;
    const first = roomsList[0] as { roomId: number; ratePlans?: { ratePlanId: number }[] };
    if (first?.ratePlans?.length) {
      setSelectedRoomId(first.roomId);
      setSelectedRatePlanId(first.ratePlans[0].ratePlanId);
    }
  }, [searchResult, roomsList.length, selectedRoomId]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleCheckPrice = () => {
    if (!dateRange.from || !dateRange.to) return;
    if (dateRange.from >= dateRange.to) return;
    setSubmittedRange({ from: dateRange.from, to: dateRange.to });
    setSelectedRoomId(null);
    setSelectedRatePlanId(null);
  };

  const canCheckPrice = !!hyperguestPropertyId && !!dateRange.from && !!dateRange.to && dateRange.from < dateRange.to;

  const incrementGuests = () => setNumberOfGuests((n) => Math.min(n + 1, maxParty));
  const decrementGuests = () => setNumberOfGuests((n) => Math.max(n - 1, minParty));

  // -----------------------------------------------------------------------
  // Render: no HyperGuest ID
  // -----------------------------------------------------------------------

  if (!hyperguestPropertyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{t.noHotel}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // -----------------------------------------------------------------------
  // Render: main
  // -----------------------------------------------------------------------

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t.title}
          {propNights && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({propNights} {t.nightsLabel})
            </span>
          )}
        </CardTitle>
        {hotelName && <p className="text-sm text-muted-foreground">{hotelName}</p>}
        <p className="text-xs text-muted-foreground">{t.subtitle}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date picker + Guests input + Check price */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">{t.selectDates}</Label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {t.travelers}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={decrementGuests}
                  disabled={numberOfGuests <= minParty}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={minParty}
                  max={maxParty}
                  value={numberOfGuests}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setNumberOfGuests(Math.max(minParty, Math.min(maxParty, val)));
                    }
                  }}
                  className="w-16 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={incrementGuests}
                  disabled={numberOfGuests >= maxParty}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              onClick={handleCheckPrice}
              disabled={!canCheckPrice || isLoadingAvailability}
            >
              <Search className="h-4 w-4 mr-2" />
              {t.checkPrice}
            </Button>
            {!submittedRange && dateRange.from && dateRange.to && (
              <span className="text-xs text-muted-foreground">{t.noDates}</span>
            )}
          </div>
        </div>

        {!submittedRange && <p className="text-sm text-muted-foreground italic">{t.noDates}</p>}

        {exceededMaxNights && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <AlertDescription>{t.maxNights}</AlertDescription>
          </Alert>
        )}

        {searchParams && (
          <>
            <RoomOptionsV2
              searchResult={searchResult as any}
              isLoading={isLoadingAvailability}
              selectedRoomId={selectedRoomId}
              selectedRatePlanId={selectedRatePlanId}
              onSelect={(roomId, ratePlanId) => {
                setSelectedRoomId(roomId);
                setSelectedRatePlanId(ratePlanId);
              }}
              lang={lang}
            />
            {!hidePriceBreakdown && (
              <PriceBreakdownV2 breakdown={priceBreakdown} isLoading={isLoadingAvailability} lang={lang} />
            )}
            {availabilityError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {lang === "fr"
                    ? "Erreur lors de la récupération des disponibilités."
                    : lang === "he"
                      ? "שגיאה בטעינת הזמינות."
                      : "Error loading availability."}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
