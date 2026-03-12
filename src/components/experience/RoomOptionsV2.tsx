/**
 * Room selection component — vertical stacked radio cards (one per room type)
 * Each card shows: room name, price, meal plan, cancellation info
 * ✅ Sorted by price ascending (cheapest first), then alphabetically
 */

import { useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, BedDouble, Clock } from "lucide-react";
import { getBoardTypeLabel } from "@/services/hyperguest";
import { cn } from "@/lib/utils";
import { analyzeCancellationPolicies } from "@/utils/cancellationPolicy";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RoomRatePlan {
  ratePlanId: number;
  ratePlanName: string;
  board: string;
  remarks?: string[];
  isImmediate?: boolean;
  prices?: {
    sell?: { price?: number; amount?: number; currency?: string; taxes?: any[] };
    net?: { price?: number; amount?: number; currency?: string };
    bar?: { price?: number; amount?: number; currency?: string };
    fees?: any[];
  };
  cancellationPolicies?: any[];
}

interface Room {
  roomId: number;
  roomName: string;
  ratePlans: RoomRatePlan[];
  remarks?: string[];
  settings?: { maxAdultsNumber?: number; maxChildrenNumber?: number };
}

interface Property {
  rooms: Room[];
}

interface SearchResult {
  results?: Property[];
  rooms?: Room[];
}

interface RoomOptionsV2Props {
  searchResult: SearchResult | null;
  isLoading: boolean;
  selectedRoomId: number | null;
  selectedRatePlanId: number | null;
  onSelect: (roomId: number, ratePlanId: number) => void;
  lang?: "en" | "he" | "fr";
  checkInDate?: string;
}

function shouldHideRatePlan(ratePlan: RoomRatePlan): boolean {
  const sellPrice = ratePlan.prices?.sell;
  if (!sellPrice) return true;
  const sellAmount = Number(sellPrice.price ?? sellPrice.amount) || 0;
  if (sellAmount <= 0) return true;
  const barPrice = ratePlan.prices?.bar;
  if (barPrice) {
    const barAmount = Number(barPrice.price ?? barPrice.amount) || 0;
    if (barAmount > 0 && sellAmount < barAmount) return true;
  }
  return false;
}

export function RoomOptionsV2({
  searchResult,
  isLoading,
  selectedRoomId,
  selectedRatePlanId,
  onSelect,
  lang = "en",
  checkInDate,
}: RoomOptionsV2Props) {
  const t = {
    en: {
      title: "Room type",
      noRooms: "No rooms available for these dates",
      onRequest: "Subject to confirmation",
    },
    he: {
      title: "סוג חדר",
      noRooms: "אין חדרים זמינים לתאריכים אלה",
      onRequest: "בכפוף לאישור",
    },
    fr: {
      title: "Type de chambre",
      noRooms: "Aucune chambre disponible pour ces dates",
      onRequest: "Confirmation sous réserve",
    },
  }[lang];

  const rooms: Room[] = useMemo(() => {
    if (!searchResult) return [];
    if (searchResult.results && searchResult.results.length > 0) {
      return searchResult.results[0]?.rooms || [];
    }
    if (searchResult.rooms) return searchResult.rooms;
    return [];
  }, [searchResult]);

  // For each room, pick the cheapest visible rate plan, then sort by price ascending
  const roomCards = useMemo(() => {
    const cards = rooms
      .map((room) => {
        const visiblePlans = room.ratePlans.filter((rp) => !shouldHideRatePlan(rp));
        if (visiblePlans.length === 0) return null;

        let cheapest = visiblePlans[0];
        let cheapestAmount = Number(cheapest.prices!.sell!.price ?? cheapest.prices!.sell!.amount) || 0;
        for (const rp of visiblePlans) {
          const amt = Number(rp.prices!.sell!.price ?? rp.prices!.sell!.amount) || 0;
          if (amt < cheapestAmount) {
            cheapest = rp;
            cheapestAmount = amt;
          }
        }

        return {
          room,
          ratePlan: cheapest,
          price: cheapestAmount,
          currency: cheapest.prices!.sell!.currency ?? "USD",
        };
      })
      .filter(Boolean) as {
      room: Room;
      ratePlan: RoomRatePlan;
      price: number;
      currency: string;
    }[];

    // Sort by price ascending, then by room name alphabetically
    cards.sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price;
      return a.room.roomName.localeCompare(b.room.roomName);
    });

    return cards;
  }, [rooms]);

  const { symbol, convert } = useCurrency();
  const formatPrice = (amount: number, _currency: string) => {
    const converted = convert(amount);
    return `${symbol}${Math.round(converted).toLocaleString("en-US")}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-[72px] w-full" />
        <Skeleton className="h-[72px] w-full" />
      </div>
    );
  }

  if (roomCards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">{t.noRooms}</p>
    );
  }

  const selectedValue =
    selectedRoomId != null && selectedRatePlanId != null
      ? `${selectedRoomId}-${selectedRatePlanId}`
      : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BedDouble className="h-4 w-4" />
        {t.title}
      </div>

      <RadioGroup
        value={selectedValue}
        onValueChange={(value) => {
          if (!value) return;
          const [roomId, ratePlanId] = value.split("-").map(Number);
          onSelect(roomId, ratePlanId);
        }}
        className="space-y-0"
      >
        {roomCards.map(({ room, ratePlan, price, currency }) => {
          const radioValue = `${room.roomId}-${ratePlan.ratePlanId}`;
          const isSelected = selectedValue === radioValue;
          const boardLabel = getBoardTypeLabel(ratePlan.board);
          const isOnRequest = ratePlan.isImmediate === false;

          const cancellation = analyzeCancellationPolicies(
            ratePlan.cancellationPolicies,
            checkInDate,
            lang,
          );

          return (
            <label
              key={room.roomId}
              htmlFor={radioValue}
              className={cn(
                "flex items-start gap-3 w-full cursor-pointer transition-colors",
                "p-3 rounded-lg border",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <RadioGroupItem
                value={radioValue}
                id={radioValue}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold leading-tight">
                    {room.roomName}
                  </span>
                  <span className="text-sm font-semibold shrink-0">
                    {formatPrice(price, currency)}
                  </span>
                </div>

                {boardLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {boardLabel}
                    {isOnRequest && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-blue-600">
                        <Clock className="h-3 w-3 inline" />
                        {t.onRequest}
                      </span>
                    )}
                  </p>
                )}

                {cancellation.badgeText && (
                  <p
                    className={cn(
                      "mt-0.5 leading-tight",
                      cancellation.isFreeCancellation
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                    )}
                    style={{ fontSize: "11px" }}
                  >
                    {cancellation.isFreeCancellation && (
                      <Check className="h-3 w-3 inline mr-0.5 -mt-px" />
                    )}
                    {cancellation.badgeText}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
