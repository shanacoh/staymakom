/**
 * Hook to find the next 3 available dates from HyperGuest for a given nights count.
 * Searches the next 10 upcoming check-in dates in parallel, returns up to 3 with rooms.
 */

import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { searchHotelsRaw, formatGuests } from '@/services/hyperguest';

interface AvailableDate {
  id: string;
  checkin: Date;
  checkout: Date;
  nights: number;
  /** Cheapest sell price found across all rooms/rate plans */
  cheapestPrice: number | null;
  currency: string;
}

interface UseQuickDateAvailabilityOptions {
  propertyId: number | null;
  nights: number;
  adults: number;
  currency?: string;
  enabled?: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scanAvailability(
  propertyId: number,
  nights: number,
  adults: number,
  currency: string,
): Promise<AvailableDate[]> {
  const today = new Date();
  const startOffset = 3;
  const datesToScan = 30;
  const maxResults = 5;
  const batchSize = 5; // Send 5 requests at a time to avoid rate-limiting

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
          customerNationality: 'IL',
          currency,
        })
          .then((res) => {
            const property = res?.results?.[0];
            const rooms = property?.rooms || [];
            if (rooms.length === 0) return null;

            let cheapest: number | null = null;
            let cur = currency;

            for (const room of rooms) {
              for (const rp of room.ratePlans || []) {
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

                if (sellPrice == null) continue;
                if (barPrice != null && sellPrice < barPrice) continue;

                const sellCur =
                  typeof sellSearchPrice === 'number'
                    ? currency
                    : rp.prices?.sell?.currency ?? currency;

                if (cheapest === null || sellPrice < cheapest) {
                  cheapest = sellPrice;
                  cur = sellCur;
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
}: UseQuickDateAvailabilityOptions) {
  return useQuery({
    queryKey: ['quick-date-availability', propertyId, nights, adults, currency],
    queryFn: () => scanAvailability(propertyId!, nights, adults, currency),
    enabled: enabled && !!propertyId && nights > 0,
    staleTime: 1000 * 60 * 5, // 5 min cache
    retry: 1,
  });
}
