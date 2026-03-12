/**
 * Export de tous les modèles HyperGuest
 */

// Hotel & Room
export { Hotel, Room } from './Hotel';
export type {
  HotelLocation,
  HotelCoordinates,
  HotelContact,
  HotelImage,
  HotelFacility,
  HotelRatePlan,
  HotelSettings,
  HotelCardDisplay,
  RoomBed,
  RoomDisplay,
} from './Hotel';

// Search Results
export { 
  SearchResult, 
  SearchProperty, 
  SearchRoom, 
  SearchRatePlan 
} from './SearchResult';
export type {
  SearchPriceDetails,
  SearchCardDisplay,
  CancellationPolicy,
} from './SearchResult';

// Utilities
export {
  formatPrice,
  getBoardTypeLabel,
  formatGuests,
  calculateCheckout,
  calculateNights,
  BOARD_LABELS,
} from './utils';
