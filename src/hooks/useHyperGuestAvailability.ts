/**
 * Hook pour récupérer les disponibilités HyperGuest pour un hôtel
 * Utilise TanStack Query avec le service HyperGuest
 */

import { useQuery } from '@tanstack/react-query';
import { 
  getPropertyAvailability, 
  type HyperGuestSearchParams 
} from '@/services/hyperguest';
import { trackSearchPerformed, trackSearchNoResults } from '@/lib/analytics';

export const hyperguestAvailabilityKeys = {
  all: ['hyperguest-availability'] as const,
  byProperty: (propertyId: number, params: HyperGuestSearchParams) => 
    [...hyperguestAvailabilityKeys.all, 'property', propertyId, params] as const,
};

/**
 * Récupère les disponibilités HyperGuest pour une propriété
 */
async function fetchHyperGuestAvailability(
  propertyId: number,
  params: HyperGuestSearchParams
): Promise<any | null> {
  trackSearchPerformed({
    checkIn: params.checkIn,
    nights: params.nights,
    guests: parseInt(params.guests) || undefined,
  });

  try {
    const result = await getPropertyAvailability(propertyId, params);
    if (!result) {
      trackSearchNoResults({
        checkIn: params.checkIn,
        nights: params.nights,
        guests: parseInt(params.guests) || undefined,
      });
      return null;
    }

    // Check if results have zero rooms
    const rooms = result?.results?.[0]?.rooms;
    if (!rooms || rooms.length === 0) {
      trackSearchNoResults({
        checkIn: params.checkIn,
        nights: params.nights,
        guests: parseInt(params.guests) || undefined,
      });
    }

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Hook pour récupérer les disponibilités HyperGuest
 */
export function useHyperGuestAvailability(
  propertyId: number | null,
  params: HyperGuestSearchParams | null
) {
  return useQuery({
    queryKey: hyperguestAvailabilityKeys.byProperty(
      propertyId || 0,
      params || { checkIn: '', nights: 0, guests: '2' }
    ),
    queryFn: () => fetchHyperGuestAvailability(propertyId!, params!),
    enabled: !!propertyId && !!params && !!params.checkIn && params.nights > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes (les prix peuvent changer rapidement)
    retry: 1,
  });
}
