// process-booking — Edge Function
// Gère côté serveur : réservation HyperGuest + écriture en base + email de confirmation
// Avantages vs. appel client-direct :
//   - service_role → pas de RLS, pas de problème de session expirée
//   - idempotency check → pas de double réservation si le client réessaie
//   - logs centralisés → débuggable depuis le dashboard Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

const BOOKING_DOMAIN = 'https://book-api.hyperguest.com/2.0/';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(o =>
    typeof o === 'string' ? o === origin : o.test(origin)
  );
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://staymakom.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function getEnvMode(): 'production' | 'dev' {
  const raw = (Deno.env.get('HYPERGUEST_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return (raw === 'production' || raw === 'prod' || raw === 'live') ? 'production' : 'dev';
}

function getHGAuthHeaders(): Record<string, string> {
  const isProduction = getEnvMode() === 'production';
  const token = isProduction
    ? (Deno.env.get('HYPERGUEST_TOKEN_PROD') || Deno.env.get('HYPERGUEST_TOKEN'))
    : (Deno.env.get('HYPERGUEST_TOKEN_DEV') || Deno.env.get('HYPERGUEST_TOKEN'));
  if (!token) throw new Error('HyperGuest token not configured for env: ' + (isProduction ? 'production' : 'dev'));
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip, deflate' };
}

function ensureDateString(val: unknown): string {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (val && typeof val === 'object') {
    const d = val as Record<string, number>;
    if (d.year && d.month && d.day) return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
  }
  return '1990-01-01';
}

async function createHGBooking(bookingData: any): Promise<any> {
  const isProduction = getEnvMode() === 'production';
  const agencyRef = bookingData.reference?.agency || '';

  const payload = {
    ...bookingData,
    leadGuest: { ...bookingData.leadGuest, birthDate: ensureDateString(bookingData.leadGuest?.birthDate) },
    rooms: (bookingData.rooms || []).map((r: any) => ({
      ...r,
      guests: (r.guests || []).map((g: any) => ({ ...g, birthDate: ensureDateString(g.birthDate) })),
    })),
    isTest: !isProduction,
    paymentDetails: bookingData.paymentDetails || {
      type: 'credit_card',
      details: { number: '4111111111111111', cvv: '123', expiry: { month: '12', year: '2027' }, name: { first: 'Test', last: 'Staymakom' } },
      charge: false,
    },
  };

  console.log('🎫 Creating HG booking, property:', payload.propertyId, 'isTest:', payload.isTest);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const res = await fetch(`${BOOKING_DOMAIN}booking/create`, {
      method: 'POST',
      headers: getHGAuthHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      let hgErrorCode = '';
      let hgErrorMessage = errorText;
      try {
        const parsed = JSON.parse(errorText);
        hgErrorCode = parsed?.error?.code || parsed?.code || '';
        hgErrorMessage = parsed?.error?.message || parsed?.message || errorText;
        if (res.status === 409 && parsed.bookingId) {
          console.log('⚠️ 409 with bookingId — treating as partial success:', parsed.bookingId);
          return { id: String(parsed.bookingId), status: 'PendingReview', partialError: parsed.error };
        }
      } catch (_) { /* not JSON */ }
      throw new Error(`Create booking failed: ${res.status} - ${hgErrorCode ? `[${hgErrorCode}] ` : ''}${hgErrorMessage}`);
    }

    const data = await res.json();
    console.log('✅ HG booking created, id:', data.id || data.content?.id);
    return data.content || data;

  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError' && agencyRef) {
      console.warn('⏱️ HG booking timed out, checking booking list...');
      try {
        const listRes = await fetch(`${BOOKING_DOMAIN}booking/list`, {
          method: 'POST',
          headers: getHGAuthHeaders(),
          body: JSON.stringify({ agencyReference: agencyRef }),
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          const bookings = Array.isArray(listData.content) ? listData.content : listData.content?.bookings || [];
          const found = bookings.find((b: any) => b.reference?.agency === agencyRef || b.agencyReference === agencyRef);
          if (found) {
            console.log('✅ Booking recovered from list after timeout:', found.id || found.bookingId);
            return { id: String(found.id || found.bookingId), status: found.status || 'Confirmed', timeoutRecovered: true };
          }
        }
      } catch (listErr) {
        console.error('❌ Booking list fallback also failed:', listErr);
      }
    }
    throw err;
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const idempotencyKey = body.hyperguestBookingData?.idempotencyKey || null;

    // 1. Idempotency check — si le même idempotencyKey existe déjà, on renvoie le résultat existant
    if (idempotencyKey) {
      const { data: existing } = await adminClient
        .from('bookings_hg')
        .select('hg_booking_id, hg_status, sell_price, currency, confirmation_token')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existing) {
        console.log('✅ Idempotency hit — returning existing booking:', existing.hg_booking_id);
        return new Response(JSON.stringify({
          hgBookingId: existing.hg_booking_id,
          hgStatus: existing.hg_status || 'Confirmed',
          sellPrice: existing.sell_price,
          bookingCurrency: existing.currency,
          confirmationToken: existing.confirmation_token,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // 2. Créer la réservation HyperGuest
    let bookingResult: any;
    try {
      bookingResult = await createHGBooking(body.hyperguestBookingData);
    } catch (hgError: any) {
      console.error('❌ HG booking failed:', hgError.message);
      return new Response(JSON.stringify({
        error: hgError.message,
        errorType: 'hg_booking_failed',
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const hgBookingId = String(bookingResult.id || bookingResult.bookingId || '');
    const hgStatus = bookingResult.status || 'Confirmed';
    const sellPrice = bookingResult.totalPrice?.amount
      ?? body.hyperguestBookingData?.rooms?.[0]?.expectedPrice?.amount
      ?? 0;
    const bookingCurrency = bookingResult.totalPrice?.currency
      ?? body.hyperguestBookingData?.rooms?.[0]?.expectedPrice?.currency
      ?? 'ILS';

    const confirmationToken = crypto.randomUUID();
    const checkIn = body.hyperguestBookingData?.dates?.from;
    const checkOut = body.hyperguestBookingData?.dates?.to;

    // 3. Écriture en base avec service_role (bypass RLS)
    const { error: dbError } = await adminClient.from('bookings_hg').insert({
      hg_booking_id: hgBookingId,
      hotel_id: body.hotelId || null,
      experience_id: body.experienceId || null,
      checkin: checkIn,
      checkout: checkOut,
      nights: body.nights,
      party_size: body.partySize,
      sell_price: sellPrice,
      paid_amount: body.paidAmount ?? 0,
      net_price: 0,
      commission_amount: body.commissionAmount ?? 0,
      currency: bookingCurrency,
      status: hgStatus.toLowerCase(),
      hg_status: hgStatus,
      board_type: body.boardType || 'RO',
      room_code: String(body.hyperguestBookingData?.rooms?.[0]?.roomId || ''),
      room_name: body.roomName || '',
      rate_plan: String(body.hyperguestBookingData?.rooms?.[0]?.ratePlanId || ''),
      customer_name: body.guestName || '',
      customer_email: body.email || '',
      hg_raw_data: bookingResult,
      user_id: body.userId || null,
      confirmation_token: confirmationToken,
      idempotency_key: idempotencyKey,
      revolut_order_id: body.revolutOrderId || null,
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('❌ DB insert failed (HG booking confirmed):', dbError);
      return new Response(JSON.stringify({
        error: `Réservation confirmée par HyperGuest (${hgBookingId}) mais non enregistrée en base : ${dbError.message}`,
        errorType: 'db_insert_failed',
        hgBookingId,
        hgStatus,
        confirmationToken,
        sellPrice,
        bookingCurrency,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('✅ Booking saved to DB:', hgBookingId);

    // 4. Mise à jour de la carte cadeau (non-bloquant)
    if (body.giftCard?.id) {
      try {
        await adminClient.from('gift_cards').update({
          amount_used: body.giftCard.newAmountUsed,
          status: body.giftCard.isFullyRedeemed ? 'redeemed' : 'sent',
          ...(body.giftCard.isFullyRedeemed ? { redeemed_at: new Date().toISOString() } : {}),
        }).eq('id', body.giftCard.id);
      } catch (gcErr) {
        console.error('⚠️ Gift card update failed (non-blocking):', gcErr);
      }
    }

    // 5. Email de confirmation (non-bloquant)
    try {
      await adminClient.functions.invoke('send-booking-confirmation', {
        body: {
          to: body.email,
          guestName: body.guestName,
          experienceTitle: body.experienceTitle || '',
          hotelName: body.hotelName || '',
          roomName: body.roomName || '',
          boardType: body.boardType || 'RO',
          checkIn,
          checkOut,
          nights: body.nights,
          partySize: body.partySize,
          totalPrice: sellPrice,
          currency: bookingCurrency,
          bookingRef: body.staymakomRef,
          hgBookingId,
          remarks: body.remarks || [],
          specialRequests: body.specialRequests || '',
          lang: body.lang || 'en',
          displayTaxesTotal: body.displayTaxesTotal ?? 0,
          confirmationToken,
          cancellationPolicy: body.cancellationPolicy || null,
        },
      });
    } catch (emailErr) {
      console.error('⚠️ Email send failed (non-blocking):', emailErr);
    }

    // 6. Succès
    return new Response(JSON.stringify({
      hgBookingId,
      hgStatus,
      sellPrice,
      bookingCurrency,
      confirmationToken,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('❌ process-booking unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message, errorType: 'unexpected' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
