/**
 * Hook to fetch HyperGuest availability for a fixed list of specific check-in dates.
 * Used when an experience has specific_dates availability rules (e.g. a one-off concert date).
 * Returns AvailableDate[] in the same format as useQuickDateAvailability.
 */

import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { searchHotelsRaw, formatGuests } from '@/services/hyperguest';

interface AvailableDate {
  id: string;
  checkin: Date;
  checkout: Date;
  nights: number;
  cheapestPrice: number | null;
  currency: string;
}

interface UseSpecificDateAvailabilityOptions {
  specificDates: string[];
  nights: number;
  propertyId: number | null;
  adults: number;
  currency?: string;
  enabled?: boolean;
}

async function fetchSpecificDates(
  specificDates: string[],
  nights: number,
  propertyId: number,
  adults: number,
  currency: string,
): Promise<AvailableDate[]> {
  const guests = formatGuests([{ adults, children: [] }]);

  const promises = specificDates.map((dateStr) =>
    searchHotelsRaw({
      checkIn: dateStr,
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
            const sellSearchPrice = rp.prices?.sell?.searchCurrency;
            const sellNativePrice = rp.prices?.sell?.price;
            const sellPrice =
              typeof sellSearchPrice === 'number'
                ? sellSearchPrice
                : typeof sellNativePrice === 'number'
                  ? sellNativePrice
                  : null;

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

        const checkin = new Date(dateStr);
        const checkout = addDays(checkin, nights);
        return {
          id: `spec-${nights}-${dateStr}`,
          checkin,
          checkout,
          nights,
          cheapestPrice: cheapest,
          currency: cur,
        } satisfies AvailableDate;
      })
      .catch(() => null)
  );

  const results = await Promise.all(promises);
  return results.filter((r): r is AvailableDate => r !== null);
}

export function useSpecificDateAvailability({
  specificDates,
  nights,
  propertyId,
  adults,
  currency = 'ILS',
  enabled = true,
}: UseSpecificDateAvailabilityOptions) {
  return useQuery({
    queryKey: ['specific-date-availability', specificDates, nights, propertyId, adults, currency],
    queryFn: () => fetchSpecificDates(specificDates, nights, propertyId!, adults, currency),
    enabled: enabled && !!propertyId && nights > 0 && specificDates.length > 0,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
