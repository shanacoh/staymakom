// HyperGuest API Edge Function v6
// B3: isTest driven by ENVIRONMENT secret
// S2: JWT auth for mutative actions
// B1: Proper pre-book format
// ✅ #5a: 300s timeout + booking list fallback
// ✅ #10a: Structured error codes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(o =>
    typeof o === 'string' ? o === origin : o.test(origin)
  );
  const corsOrigin = isAllowed ? origin : 'https://staymakom.com';
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// API Domains
const SEARCH_DOMAIN = 'https://search-api.hyperguest.io/2.0/';
const BOOKING_DOMAIN = 'https://book-api.hyperguest.com/2.0/';
const STATIC_DOMAIN = 'https://hg-static.hyperguest.com/';

const PROTECTED_ACTIONS = ['create-booking', 'pre-book', 'cancel-booking', 'list-bookings', 'get-booking'];

interface SearchParams {
  checkIn: string;
  nights: number;
  guests: string;
  hotelIds?: number[];
  customerNationality?: string;
  currency?: string;
}

interface BookingData {
  dates: { from: string; to: string };
  propertyId: number;
  leadGuest: {
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
  };
  reference?: { agency: string };
  rooms: Array<{
    roomId: number;
    ratePlanId: number;
    expectedPrice?: { amount: number; currency: string };
    specialRequests?: string;
    guests: Array<{
      birthDate: string;
      title: string;
      name: { first: string; last: string };
    }>;
  }>;
  isTest?: boolean;
  paymentDetails?: any;
}

interface PreBookData {
  search: {
    dates: { from: string; to: string };
    propertyId: number;
    nationality?: string;
    pax: Array<{ adults: number; children: number[] }>;
  };
  rooms: Array<{
    roomCode?: string;
    roomId?: number;
    rateCode?: string;
    ratePlanId?: number;
    expectedPrice: { amount: number; currency: string };
  }>;
  isTest?: boolean;
}

async function verifyAuth(req: Request, action: string): Promise<{ authenticated: boolean; userId?: string; error?: string }> {
  if (!PROTECTED_ACTIONS.includes(action)) {
    return { authenticated: true };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { authenticated: false, error: 'Invalid or expired token' };
    }

    return { authenticated: true, userId: user.id };
  } catch (err) {
    console.error('❌ Auth verification failed:', err);
    return { authenticated: false, error: 'Auth verification failed' };
  }
}

function validateSearchParams(params: SearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!params.checkIn || !dateRegex.test(params.checkIn)) errors.push('checkIn must be in YYYY-MM-DD format');
  if (!Number.isInteger(params.nights) || params.nights < 1) errors.push('nights must be a positive integer');
  if (!params.guests || typeof params.guests !== 'string') errors.push('guests must be a string');
  if (params.hotelIds && !Array.isArray(params.hotelIds)) errors.push('hotelIds must be an array');
  if (params.customerNationality && !/^[A-Z]{2}$/.test(params.customerNationality)) errors.push('customerNationality must be a 2-letter ISO country code');
  return { isValid: errors.length === 0, errors };
}

function getEnvMode(): 'production' | 'dev' {
  const raw = (Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return (raw === 'production' || raw === 'prod' || raw === 'live') ? 'production' : 'dev';
}

function getAuthHeaders(): Record<string, string> {
  const envMode = getEnvMode();
  const isProduction = envMode === 'production';
  const token = isProduction
    ? (Deno.env.get('HYPERGUEST_TOKEN_PROD') || Deno.env.get('HYPERGUEST_TOKEN') || Deno.env.get('HYPERGUEST_BEARER_TOKEN'))
    : (Deno.env.get('HYPERGUEST_TOKEN_DEV') || Deno.env.get('HYPERGUEST_TOKEN') || Deno.env.get('HYPERGUEST_BEARER_TOKEN'));

  if (!token) throw new Error('HyperGuest token not configured for env: ' + envMode);

  console.log('🔑 Using HyperGuest token for env:', isProduction ? 'PRODUCTION' : 'DEV', 'token length:', token.length);
  return {
    'Authorization': `Bearer ${token}`,
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };
}

async function searchHotels(params: SearchParams) {
  console.log('🔍 Searching hotels with params:', JSON.stringify(params));
  const validation = validateSearchParams(params);
  if (!validation.isValid) throw new Error(`Validation failed: ${validation.errors.join(', ')}`);

  const queryParams = new URLSearchParams();
  queryParams.append('checkIn', params.checkIn);
  queryParams.append('nights', params.nights.toString());
  queryParams.append('guests', params.guests);
  if (params.hotelIds) params.hotelIds.forEach(id => queryParams.append('hotelIds', id.toString()));
  if (params.customerNationality) queryParams.append('customerNationality', params.customerNationality);
  if (params.currency) queryParams.append('currency', params.currency);

  const url = `${SEARCH_DOMAIN}?${queryParams.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Search failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Search successful, results count:', data.results?.length || 0);
  return data;
}

async function preBook(preBookData: PreBookData) {
  const isProduction = getEnvMode() === 'production';
  const payload: PreBookData = {
    ...preBookData,
    isTest: !isProduction,
  };

  console.log('📋 Pre-booking for property:', preBookData.search.propertyId, 'isTest:', payload.isTest);
  const url = `${BOOKING_DOMAIN}booking/pre-book`;
  const response = await fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pre-book failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Pre-book successful');
  return data.content || data;
}

function ensureDateString(dateVal: unknown): string {
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
  if (dateVal && typeof dateVal === 'object') {
    const d = dateVal as Record<string, number>;
    if (d.year && d.month && d.day) return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
  }
  console.warn('⚠️ Invalid birthDate, using fallback:', dateVal);
  return '1990-01-01';
}

// ✅ #5a: Create booking with 300s timeout + booking list fallback
async function createBooking(bookingData: BookingData) {
  const isProduction = getEnvMode() === 'production';

  const safeLeadGuest = { ...bookingData.leadGuest, birthDate: ensureDateString(bookingData.leadGuest.birthDate) };
  const safeRooms = bookingData.rooms.map(room => ({
    ...room,
    guests: room.guests.map(guest => ({ ...guest, birthDate: ensureDateString(guest.birthDate) })),
  }));

  const safeBookingData = {
    ...bookingData,
    leadGuest: safeLeadGuest,
    rooms: safeRooms,
    isTest: !isProduction,
    paymentDetails: bookingData.paymentDetails || {
      type: "credit_card",
      details: {
        number: "4111111111111111", cvv: "123",
        expiry: { month: "12", year: "2027" },
        name: { first: "Test", last: "Staymakom" },
      },
      charge: false,
    },
  };

  const agencyRef = bookingData.reference?.agency || '';

  console.log('🎫 Creating booking for property:', safeBookingData.propertyId,
    'isTest:', safeBookingData.isTest, 'env:', isProduction ? 'PROD' : 'DEV/STAGING');

  const url = `${BOOKING_DOMAIN}booking/create`;

  // ✅ #5a: 300s timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(safeBookingData),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Create booking failed:', response.status, errorText);

      // ✅ #10a: Parse HG error code and return structured response
      let hgErrorCode = '';
      let hgErrorMessage = errorText;
      try {
        const parsed = JSON.parse(errorText);
        hgErrorCode = parsed?.error?.code || parsed?.code || '';
        hgErrorMessage = parsed?.error?.message || parsed?.message || errorText;

        // 409 may contain a bookingId
        if (response.status === 409 && parsed.bookingId) {
          console.log('⚠️ 409 with bookingId:', parsed.bookingId, '— treating as partial success');
          return { id: String(parsed.bookingId), status: 'PendingReview', partialError: parsed.error };
        }
      } catch (_) { /* not JSON */ }

      throw new Error(`Create booking failed: ${response.status} - ${hgErrorCode ? `[${hgErrorCode}] ` : ''}${hgErrorMessage}`);
    }

    const data = await response.json();
    console.log('✅ Booking created successfully, id:', data.id || data.content?.id);
    return data.content || data;

  } catch (error: any) {
    clearTimeout(timeoutId);

    // ✅ #5a: On timeout, check booking list for the reference
    if (error.name === 'AbortError') {
      console.warn('⏱️ Booking request timed out after 300s, checking booking list...');

      if (agencyRef) {
        try {
          const listUrl = `${BOOKING_DOMAIN}booking/list`;
          const listResponse = await fetch(listUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ agencyReference: agencyRef }),
          });

          if (listResponse.ok) {
            const listData = await listResponse.json();
            const content = listData.content || listData;
            const bookings = Array.isArray(content) ? content : content?.bookings || [];

            const found = bookings.find((b: any) =>
              b.reference?.agency === agencyRef || b.agencyReference === agencyRef
            );

            if (found) {
              console.log('✅ Booking found via list after timeout:', found.id || found.bookingId);
              return { id: String(found.id || found.bookingId), status: found.status || 'Confirmed', timeoutRecovered: true };
            }
          }
        } catch (listErr) {
          console.error('❌ Booking list fallback also failed:', listErr);
        }
      }

      throw new Error('Create booking failed: Timeout after 300 seconds. The booking may have been created — please check your bookings.');
    }

    throw error;
  }
}

async function getBookingDetails(bookingId: string) {
  const url = `${BOOKING_DOMAIN}booking/get/${bookingId}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Get booking failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return data.content || data;
}

async function listBookings(params: { dates?: { from: string; to: string }; agencyReference?: string; customerEmail?: string; limit?: number; page?: number }) {
  const url = `${BOOKING_DOMAIN}booking/list`;
  const body: Record<string, unknown> = {};
  if (params.dates) body.dates = params.dates;
  if (params.agencyReference) body.agencyReference = params.agencyReference;
  if (params.customerEmail) body.customerEmail = params.customerEmail;
  if (params.limit) body.limit = params.limit;
  if (params.page) body.page = params.page;

  const response = await fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`List bookings failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return data.content || data;
}

async function cancelBooking(bookingId: string, options: { reason?: string; simulation?: boolean; cancelSimulation?: boolean } = {}) {
  // Support both `simulation` and `cancelSimulation` field names from frontend
  const isSimulation = options.simulation === true || options.cancelSimulation === true;
  console.log(isSimulation ? '🔍 Simulating cancellation:' : '🚫 Cancelling booking:', bookingId);

  const url = `${BOOKING_DOMAIN}booking/cancel`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookingId, simulation: isSimulation, ...(options.reason && { reason: options.reason }) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (errorText.includes('booking cannot be found') || errorText.includes('BN.500')) {
      console.warn('⚠️ Booking not found on HyperGuest — treating as already cancelled');
      return { cancelled: true, notFoundOnHG: true, bookingId };
    }
    throw new Error(`Cancel booking failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅', isSimulation ? 'Cancellation simulated' : 'Booking cancelled');
  return data.content || data;
}

async function getAllHotels(countryCode?: string) {
  const url = `${STATIC_DOMAIN}hotels.json`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`Get hotels failed: ${response.status} - ${responseText.substring(0, 200)}`);
  if (!responseText || responseText.trim() === '') throw new Error('Empty response from HyperGuest API');

  let data;
  try { data = JSON.parse(responseText); } catch (_) { throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`); }

  if (countryCode && Array.isArray(data)) {
    const upper = countryCode.toUpperCase();
    data = data.filter((h: any) =>
      h.country === countryCode || h.country === upper || h.countryCode === countryCode || h.countryCode === upper ||
      h.country_code === countryCode || (h.country && String(h.country).toUpperCase() === upper)
    );
  }

  if (!countryCode && Array.isArray(data)) data = data.slice(0, 2000);
  return data;
}

async function getPropertyDetails(propertyId: number) {
  const url = `${STATIC_DOMAIN}${propertyId}/property-static.json`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Get property failed: ${response.status} - ${errorText}`);
  }
  return await response.json();
}

async function getFacilities() {
  const url = `${STATIC_DOMAIN}facilities.json`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Get facilities failed: ${response.status} - ${errorText}`);
  }
  return await response.json();
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    console.log('🚀 HyperGuest API request:', action, 'method:', req.method);

    let authResult: { authenticated: boolean; userId?: string; error?: string } = { authenticated: true };
    if (action) {
      authResult = await verifyAuth(req, action);
      if (!authResult.authenticated) {
        return new Response(JSON.stringify({ success: false, error: `Authentication required: ${authResult.error}` }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (authResult.userId) console.log('🔓 Authenticated user:', authResult.userId, 'for action:', action);
    }

    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      const contentLength = req.headers.get('content-length');
      if (contentType.includes('application/json') && contentLength && parseInt(contentLength) > 0) {
        try {
          const text = await req.text();
          if (text && text.trim()) body = JSON.parse(text);
        } catch (_) { console.log('⚠️ No JSON body or parse error, using empty object'); }
      }
    }

    let result;
    switch (action) {
      case 'search': result = await searchHotels(body as unknown as SearchParams); break;
      case 'pre-book': result = await preBook(body as unknown as PreBookData); break;
      case 'create-booking': {
        // Idempotency check - prevent double bookings
        const idempotencyKey = (body as { idempotencyKey?: string }).idempotencyKey;
        if (idempotencyKey) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
          
          const { data: existing } = await supabaseAdmin
            .from('bookings_hg')
            .select('id, hg_booking_id, status')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();
          
          if (existing) {
            console.log('⚠️ Duplicate booking detected, returning existing:', existing.hg_booking_id);
            result = { 
              id: existing.hg_booking_id, 
              status: existing.status || 'Confirmed', 
              duplicate: true,
              message: 'Booking already exists with this idempotency key'
            };
            break;
          }
        }
        result = await createBooking(body as unknown as BookingData);
        break;
      }
      case 'get-booking': {
        const bookingId = url.searchParams.get('bookingId');
        if (!bookingId) throw new Error('bookingId is required');
        result = await getBookingDetails(bookingId);
        break;
      }
      case 'list-bookings': result = await listBookings(body as any); break;
      case 'cancel-booking': {
        const cancelBookingId = (body as { bookingId?: string }).bookingId;
        if (!cancelBookingId) throw new Error('bookingId is required');

        // Ownership check: verify the booking belongs to the authenticated user
        if (authResult.userId) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const ownerCheckClient = createClient(supabaseUrl, supabaseServiceKey);
          const { data: bookingRecord } = await ownerCheckClient
            .from('bookings_hg')
            .select('user_id')
            .eq('hg_booking_id', cancelBookingId)
            .maybeSingle();
          
          if (bookingRecord && bookingRecord.user_id && bookingRecord.user_id !== authResult.userId) {
            // Check if user is admin
            const { data: adminRole } = await ownerCheckClient
              .from('user_roles')
              .select('role')
              .eq('user_id', authResult.userId)
              .eq('role', 'admin')
              .maybeSingle();
            
            if (!adminRole) {
              return new Response(JSON.stringify({
                success: false,
                error: 'You are not authorized to cancel this booking'
              }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          }
        }
        result = await cancelBooking(cancelBookingId, body as any);
        break;
      }
      case 'get-hotels': {
        const countryCode = url.searchParams.get('countryCode') || undefined;
        result = await getAllHotels(countryCode);
        break;
      }
      case 'get-property': {
        const propertyId = url.searchParams.get('propertyId');
        if (!propertyId) throw new Error('propertyId is required');
        result = await getPropertyDetails(parseInt(propertyId));
        break;
      }
      case 'get-facilities': result = await getFacilities(); break;
      default: throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ HyperGuest API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
