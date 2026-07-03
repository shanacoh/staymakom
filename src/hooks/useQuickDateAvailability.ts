/**
 * Hook to find the next 3 available dates from HyperGuest for a given nights count.
 * Searches the next 10 upcoming check-in dates in parallel, returns up to 3 with rooms.
 */

import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { searchHotelsRaw, formatGuests } from '@/services/hyperguest';
import { normalizeBoardPreference, type BoardType } from '@/lib/boardTypePreference';
import { useCustomerNationality } from '@/hooks/useCustomerNationality';

interface AvailableDate {
  id: string;
  checkin: Date;
  checkout: Date;
  nights: number;
  /** Cheapest sell (contracted) price found across all rooms/rate plans */
  cheapestPrice: number | null;
  /** Cheapest BAR (public hotel) price found across all rooms/rate plans */
  cheapestBarPrice: number | null;
  /**
   * Cheapest NET (wholesale) price — le vrai coût pour Staymakom auprès de HyperGuest.
   * Confirmé par Reshma (HG account manager) : NET = la valeur facturée par HG.
   * À ne JAMAIS exposer dans l'UI client (back-office uniquement).
   */
  cheapestNetPrice: number | null;
  /** Cancellation policies of the cheapest rate plan, used to display per-date cancellation badge */
  cheapestCancellationPolicies: any[] | null;
  currency: string;
}

/** Prix d'une date fixe : sell (public), net (coût HG), bar (prix public hôtel). */
export interface SpecificDatePrice {
  sell: number;
  net: number | null;
  bar: number | null;
}

interface UseQuickDateAvailabilityOptions {
  propertyId: number | null;
  nights: number;
  adults: number;
  currency?: string;
  enabled?: boolean;
  /**
   * Pension préférée pour cet hôtel (lue depuis hotels2.preferred_board_type).
   * Si défini, on ne retient QUE les rate plans dont le board correspond.
   * Si aucun rate plan ne matche pour des dates → cheapestPrice = null
   * → la date apparaît comme "indisponible" dans l'UI (option B Shana).
   */
  preferredBoardType?: BoardType | string | null;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scanAvailability(
  propertyId: number,
  nights: number,
  adults: number,
  currency: string,
  preferredBoardType: BoardType | null,
  customerNationality: string,
): Promise<AvailableDate[]> {
  const today = new Date();
  const startOffset = 1;
  const datesToScan = 90;
  const maxResults = 30;
  const batchSize = 10; // Send 10 requests at a time to avoid rate-limiting

  const guests = formatGuests([{ adults, children: [] }]);
  const results: (AvailableDate | null)[] = [];

  // Process in batches of 5 with 200ms delay between batches
  for (let batchStart = 0; batchStart < datesToScan; batchStart += batchSize) {
    // Check if we already have enough results
    const foundSoFar = results.filter((r): r is AvailableDate => r !== null).length;
    if (foundSoFar >= maxResults) break;

    if (batchStart > 0) await delay(200);

    const batchPromises = Array.from(
      { length: Math.min(batchSize, datesToScan - batchStart) },
      (_, i) => {
        const checkin = addDays(today, startOffset + batchStart + i);
        const checkInStr = format(checkin, 'yyyy-MM-dd');

        return searchHotelsRaw({
          checkIn: checkInStr,
          nights,
          guests,
          hotelIds: [propertyId],
          customerNationality,
          currency,
        })
          .then((res) => {
            const property = res?.results?.[0];
            const rooms = property?.rooms || [];
            if (rooms.length === 0) return null;

            let cheapest: number | null = null;
            let cheapestBar: number | null = null;
            let cheapestNet: number | null = null;
            let cheapestPolicies: any[] | null = null;
            let cur = currency;

            for (const room of rooms) {
              for (const rp of room.ratePlans || []) {
                // Filtre option B Shana : si une pension préférée est définie sur l'hôtel,
                // on ignore les rate plans qui ne correspondent pas. Si AUCUN ne matche
                // sur cette date, cheapestPrice restera null → "indisponible".
                if (preferredBoardType) {
                  const board = typeof rp.board === 'string' ? rp.board.toUpperCase() : null;
                  if (board !== preferredBoardType) continue;
                }

                // Never use net/agent prices in public UI. Prefer sell.searchCurrency, then sell.price.
                const sellSearchPrice = rp.prices?.sell?.searchCurrency;
                const sellNativePrice = rp.prices?.sell?.price;
                const sellPrice =
                  typeof sellSearchPrice === 'number'
                    ? sellSearchPrice
                    : typeof sellNativePrice === 'number'
                      ? sellNativePrice
                      : null;

                // Contractual rule: do not display rates if sell is lower than BAR.
                const barSearchPrice = rp.prices?.bar?.searchCurrency;
                const barNativePrice = rp.prices?.bar?.price;
                const barPrice =
                  typeof barSearchPrice === 'number'
                    ? barSearchPrice
                    : typeof barNativePrice === 'number'
                      ? barNativePrice
                      : null;

                // NET (wholesale) — le vrai coût HG pour Staymakom. Back-office uniquement.
                // Confirmé par Reshma (HG account manager) le 2026-05-04.
                const netSearchPrice = rp.prices?.net?.searchCurrency;
                const netNativePrice = rp.prices?.net?.price;
                const netPrice =
                  typeof netSearchPrice === 'number'
                    ? netSearchPrice
                    : typeof netNativePrice === 'number'
                      ? netNativePrice
                      : null;

                if (sellPrice == null) continue;
                if (barPrice != null && sellPrice < barPrice) continue;

                const sellCur =
                  typeof sellSearchPrice === 'number'
                    ? currency
                    : rp.prices?.sell?.currency ?? currency;

                if (cheapest === null || sellPrice < cheapest) {
                  cheapest = sellPrice;
                  cur = sellCur;
                  cheapestPolicies = rp.cancellationPolicies ?? null;
                }

                // Track cheapest BAR price for back-office display (not for public UI)
                if (barPrice != null && (cheapestBar === null || barPrice < cheapestBar)) {
                  cheapestBar = barPrice;
                }

                // Track cheapest NET price for back-office display (NEVER for public UI).
                if (netPrice != null && (cheapestNet === null || netPrice < cheapestNet)) {
                  cheapestNet = netPrice;
                }
              }
            }

            const checkout = addDays(checkin, nights);
            return {
              id: `avail-${nights}-${checkInStr}`,
              checkin,
              checkout,
              nights,
              cheapestPrice: cheapest,
              cheapestBarPrice: cheapestBar,
              cheapestNetPrice: cheapestNet,
              cheapestCancellationPolicies: cheapestPolicies,
              currency: cur,
            } satisfies AvailableDate;
          })
          .catch(() => null);
      }
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results.filter((r): r is AvailableDate => r !== null).slice(0, maxResults);
}

export function useQuickDateAvailability({
  propertyId,
  nights,
  adults,
  currency = 'ILS',
  enabled = true,
  preferredBoardType = null,
}: UseQuickDateAvailabilityOptions) {
  const board = normalizeBoardPreference(preferredBoardType);
  const customerNationality = useCustomerNationality();
  return useQuery({
    queryKey: ['quick-date-availability', propertyId, nights, adults, currency, board, customerNationality],
    queryFn: () => scanAvailability(propertyId!, nights, adults, currency, board, customerNationality),
    enabled: enabled && !!propertyId && nights > 0,
    staleTime: 1000 * 60 * 5, // 5 min cache
    retry: 1,
  });
}

/**
 * Fetches HyperGuest prices for a fixed list of specific check-in dates.
 * Returns a map { dateStr: cheapestSellPrice | null }.
 */
export function useSpecificDatePrices({
  propertyId,
  dates,
  nights,
  adults,
  currency = 'ILS',
  enabled = true,
  preferredBoardType = null,
}: {
  propertyId: number | null;
  dates: string[];
  nights: number;
  adults: number;
  currency?: string;
  enabled?: boolean;
  preferredBoardType?: BoardType | string | null;
}) {
  const board = normalizeBoardPreference(preferredBoardType);
  const customerNationality = useCustomerNationality();
  return useQuery({
    queryKey: ['specific-date-prices', propertyId, dates, nights, adults, currency, board, customerNationality],
    queryFn: async (): Promise<Record<string, SpecificDatePrice | null>> => {
      if (!propertyId || dates.length === 0) return {};
      const guests = formatGuests([{ adults, children: [] }]);
      const results: Record<string, SpecificDatePrice | null> = {};

      await Promise.all(dates.map(async (dateStr) => {
        try {
          const res = await searchHotelsRaw({
            checkIn: dateStr,
            nights,
            guests,
            hotelIds: [propertyId],
            customerNationality,
            currency,
          });
          const rooms = res?.results?.[0]?.rooms || [];
          let cheapest: number | null = null;
          let cheapestNet: number | null = null;
          let cheapestBar: number | null = null;

          for (const room of rooms) {
            for (const rp of room.ratePlans || []) {
              if (board) {
                const rpBoard = typeof rp.board === 'string' ? rp.board.toUpperCase() : null;
                if (rpBoard !== board) continue;
              }
              const sellSearchPrice = rp.prices?.sell?.searchCurrency;
              const sellNativePrice = rp.prices?.sell?.price;
              const sellPrice =
                typeof sellSearchPrice === 'number' ? sellSearchPrice
                  : typeof sellNativePrice === 'number' ? sellNativePrice
                    : null;
              const barSearchPrice = rp.prices?.bar?.searchCurrency;
              const barNativePrice = rp.prices?.bar?.price;
              const barPrice =
                typeof barSearchPrice === 'number' ? barSearchPrice
                  : typeof barNativePrice === 'number' ? barNativePrice
                    : null;
              // NET (wholesale) — vrai coût HG, back-office / calcul de marge uniquement.
              const netSearchPrice = rp.prices?.net?.searchCurrency;
              const netNativePrice = rp.prices?.net?.price;
              const netPrice =
                typeof netSearchPrice === 'number' ? netSearchPrice
                  : typeof netNativePrice === 'number' ? netNativePrice
                    : null;

              if (typeof sellPrice !== 'number') continue;
              if (barPrice != null && sellPrice < barPrice) continue;
              if (cheapest === null || sellPrice < cheapest) cheapest = sellPrice;
              if (barPrice != null && (cheapestBar === null || barPrice < cheapestBar)) cheapestBar = barPrice;
              if (netPrice != null && (cheapestNet === null || netPrice < cheapestNet)) cheapestNet = netPrice;
            }
          }
          results[dateStr] = cheapest != null ? { sell: cheapest, net: cheapestNet, bar: cheapestBar } : null;
        } catch {
          results[dateStr] = null;
        }
      }));

      return results;
    },
    enabled: enabled && !!propertyId && dates.length > 0 && nights > 0,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
