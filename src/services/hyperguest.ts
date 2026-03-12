/**
 * HyperGuest API Service
 * Complete integration with Search, Booking, and Static APIs
 * Uses HyperGuest models for data transformation
 */

import { 
  Hotel, 
  SearchResult, 
  formatGuests as modelFormatGuests,
  calculateCheckout as modelCalculateCheckout,
  calculateNights as modelCalculateNights,
  getBoardTypeLabel as modelGetBoardTypeLabel,
  BOARD_LABELS,
} from '@/models/hyperguest';
import { supabase } from '@/integrations/supabase/client';

// Re-export utilities from models
export const formatGuests = modelFormatGuests;
export const calculateCheckout = modelCalculateCheckout;
export const calculateNights = modelCalculateNights;
export const getBoardTypeLabel = modelGetBoardTypeLabel;
export const BOARD_TYPES = BOARD_LABELS;

// =====================
// TYPES
// =====================

export interface HyperGuestSearchParams {
  checkIn: string;
  nights: number;
  guests: string;
  hotelIds?: number[];
  customerNationality?: string;
  currency?: string;
}

export interface HyperGuestHotel {
  id?: number;
  hotel_id?: number;
  name: string;
  country?: string;
  countryCode?: string;
  regionName?: string;
  region?: string;
  cityName?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  propertyType?: string;
}

export interface HyperGuestPropertyDetails {
  id: number;
  name: string;
  description?: string;
  address?: string;
  cityName?: string;
  regionName?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  facilities?: Array<{ id: number; name: string; category?: string }>;
  images?: Array<{ uri: string; type?: string; priority?: number }>;
  photos?: Array<{ url: string; caption?: string }>;
  rooms?: Array<{
    roomId: number;
    roomName: string;
    description?: string;
    photos?: string[];
  }>;
  settings?: {
    checkIn?: string;
    checkOut?: string;
    currency?: string;
  };
  descriptions?: Array<{ language: string; type: string; description: string }>;
  [key: string]: any;
}

export interface HyperGuestLeadGuest {
  birthDate: string;
  title: string;
  name: { first: string; last: string };
  contact: {
    address?: string;
    city?: string;
    country: string;
    email: string;
    phone: string;
    state?: string;
    zip?: string;
  };
}

export interface HyperGuestBookingRoom {
  roomId: number;
  ratePlanId: number;
  expectedPrice?: { amount: number; currency: string };
  specialRequests?: string;
  guests: Array<{
    birthDate: string;
    title: string;
    name: { first: string; last: string };
  }>;
}

export interface HyperGuestBookingData {
  dates: { from: string; to: string };
  propertyId: number;
  leadGuest: HyperGuestLeadGuest;
  reference?: { agency: string };
  rooms: HyperGuestBookingRoom[];
  isTest?: boolean;
}

export interface HyperGuestBookingResponse {
  id: string;
  status: string;
  propertyId: number;
  dates: { from: string; to: string };
  totalPrice: { amount: number; currency: string };
  rooms?: Array<{
    roomId?: number;
    roomName?: string;
    ratePlanId?: number;
    board?: string;
    prices?: any;
  }>;
  [key: string]: any;
}

export interface HyperGuestListBookingsParams {
  dates?: { from: string; to: string };
  agencyReference?: string;
  customerEmail?: string;
  limit?: number;
  page?: number;
}

export interface HyperGuestCancelOptions {
  reason?: string;
  simulation?: boolean;
}

// ✅ B1 FIX: Dedicated pre-book types matching HyperGuest API format
export interface HyperGuestPreBookData {
  search: {
    dates: { from: string; to: string };
    propertyId: number;
    nationality?: string;
    pax: Array<{ adults: number; children: number[] }>;
  };
  rooms: Array<{
    roomId: number;
    ratePlanId: number;
    expectedPrice: { amount: number; currency: string };
  }>;
}

export interface HyperGuestPreBookResponse {
  paymentOptions?: Array<{
    type: string;
    paymentAmount: { amount: number; currency: string };
  }>;
  rooms?: Array<{
    prices: any;
    cancellationPolicies: any[];
    remarks?: string[];
    priceChange?: {
      fromAmount: { amount: number; currency: string };
      toAmount: { amount: number; currency: string };
    };
    [key: string]: any;
  }>;
}

// =====================
// API CLIENT
// =====================

const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return { supabaseUrl, supabaseKey };
};

// ✅ S2 FIX: Get user session token for protected actions, fallback to anon key
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

async function callHyperGuestGet<T>(action: string, queryParams: Record<string, string> = {}): Promise<T> {
  const { supabaseUrl } = getSupabaseConfig();
  const token = await getAuthToken();
  
  const searchParams = new URLSearchParams({ action, ...queryParams });
  
  const response = await fetch(
    `${supabaseUrl}/functions/v1/hyperguest?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HyperGuest API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }
  
  return result.data as T;
}

async function callHyperGuestPost<T>(action: string, body: Record<string, any> = {}): Promise<T> {
  const { supabaseUrl } = getSupabaseConfig();
  const token = await getAuthToken();
  
  const response = await fetch(
    `${supabaseUrl}/functions/v1/hyperguest?action=${action}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HyperGuest API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }
  
  return result.data as T;
}

// =====================
// SEARCH API (with Models)
// =====================

/**
 * Search for available hotels and return parsed SearchResult
 */
export async function searchHotels(params: HyperGuestSearchParams): Promise<SearchResult> {
  const rawData = await callHyperGuestPost<any>('search', params);
  return new SearchResult(rawData);
}

/**
 * Search for available hotels (raw response)
 */
export async function searchHotelsRaw(params: HyperGuestSearchParams): Promise<{ results: any[] }> {
  return callHyperGuestPost('search', params);
}

/**
 * Get property availability for a specific hotel
 */
export async function getPropertyAvailability(
  propertyId: number, 
  params: Omit<HyperGuestSearchParams, 'hotelIds'>
): Promise<any | null> {
  const results = await searchHotelsRaw({ ...params, hotelIds: [propertyId] });
  return results.results?.[0] || null;
}

// =====================
// BOOKING API
// =====================

// ✅ B1 FIX: Pre-book with proper HyperGuest format
export async function preBook(preBookData: HyperGuestPreBookData): Promise<HyperGuestPreBookResponse> {
  return callHyperGuestPost('pre-book', preBookData);
}

export async function createBooking(bookingData: HyperGuestBookingData): Promise<HyperGuestBookingResponse> {
  return callHyperGuestPost('create-booking', bookingData);
}

export async function getBookingDetails(bookingId: string): Promise<HyperGuestBookingResponse> {
  return callHyperGuestGet('get-booking', { bookingId });
}

export async function listBookings(params: HyperGuestListBookingsParams = {}): Promise<HyperGuestBookingResponse[]> {
  return callHyperGuestPost('list-bookings', params);
}

export async function simulateCancellation(bookingId: string): Promise<any> {
  return callHyperGuestPost('cancel-booking', { bookingId, simulation: true });
}

export async function cancelBooking(bookingId: string, options: HyperGuestCancelOptions = {}): Promise<any> {
  return callHyperGuestPost('cancel-booking', { bookingId, ...options });
}

// =====================
// STATIC API (with Models)
// =====================

/**
 * Get all available hotels (static data)
 */
export async function getAllHotels(countryCode?: string): Promise<HyperGuestHotel[]> {
  return callHyperGuestGet('get-hotels', countryCode ? { countryCode } : {});
}

/**
 * Get detailed property information (raw)
 */
export async function getPropertyDetailsRaw(propertyId: number): Promise<HyperGuestPropertyDetails> {
  if (propertyId === undefined || propertyId === null) {
    throw new Error(`Invalid propertyId: ${propertyId}`);
  }
  
  const result = await callHyperGuestGet<HyperGuestPropertyDetails>('get-property', { propertyId: String(propertyId) });
  return result;
}

/**
 * Get detailed property information as Hotel model
 */
export async function getPropertyDetails(propertyId: number): Promise<Hotel> {
  const rawData = await getPropertyDetailsRaw(propertyId);
  const hotel = new Hotel(rawData);
  return hotel;
}

/**
 * Get list of all available facilities/amenities
 */
export async function getFacilities(): Promise<Array<{ id: number; name: string }>> {
  return callHyperGuestGet('get-facilities');
}

// =====================
// IMAGE UTILITIES
// =====================

/**
 * Extract all image URLs from a Hotel model
 */
export function extractHotelImages(hotel: Hotel): string[] {
  return hotel.images
    .filter(img => img.type === 'photo')
    .map(img => img.uri || img.large)
    .filter(Boolean);
}

/**
 * Get the main/hero image from a Hotel model
 */
export function getHotelMainImage(hotel: Hotel): string | null {
  const mainImage = hotel.getMainImage();
  if (!mainImage) return null;
  return mainImage.uri || mainImage.large || null;
}
