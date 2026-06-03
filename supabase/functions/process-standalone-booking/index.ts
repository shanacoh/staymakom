// process-standalone-booking — Edge Function
// Crée une réservation "Experience Only" en base et génère un ordre Revolut.
// Ne touche pas à HyperGuest ni aux tables existantes (bookings_hg, experiences2).

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

function getRevolutBaseUrl(): string {
  const env = (Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').toLowerCase();
  const isProd = ['production', 'prod', 'live'].includes(env);
  return isProd
    ? 'https://merchant.revolut.com/api'
    : 'https://sandbox-merchant.revolut.com/api';
}

function getRevolutSecretKey(): string {
  const env = (Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').toLowerCase();
  const isProd = ['production', 'prod', 'live'].includes(env);
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

function getRevolutPublicKey(): string {
  const env = (Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').toLowerCase();
  const isProd = ['production', 'prod', 'live'].includes(env);
  return Deno.env.get(isProd ? 'REVOLUT_PUBLIC_KEY_PROD' : 'REVOLUT_PUBLIC_KEY') || '';
}

async function createRevolutOrder(params: {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  bookingId: string;
}): Promise<{ orderId: string; publicId: string; checkoutUrl?: string }> {
  const amountInCents = Math.round(params.amount * 100);
  const baseUrl = getRevolutBaseUrl();
  const secretKey = getRevolutSecretKey();

  const body = {
    amount: amountInCents,
    currency: params.currency,
    description: params.description,
    customer_email: params.customerEmail,
    metadata: {
      booking_type: 'standalone_experience',
      booking_id: params.bookingId,
      customer_name: params.customerName,
    },
  };

  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      'Revolut-Api-Version': '2024-09-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut order creation failed: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return {
    orderId: data.id,
    publicId: data.public_id,
    checkoutUrl: data.checkout_url,
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const {
      experience_id,
      booking_date,
      time_slot,
      party_size,
      customer_name,
      customer_email,
      customer_phone,
    } = body;

    // ── Validation des champs requis ──────────────────────────────────────────
    if (!experience_id || !booking_date || !party_size || !customer_name || !customer_email) {
      return new Response(JSON.stringify({ error: 'Champs requis manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Récupérer l'expérience ────────────────────────────────────────────────
    const { data: experience, error: expError } = await supabase
      .from('standalone_experiences')
      .select('id, title, base_price, base_price_type, currency, min_party, max_party, has_time_slots, time_slots, lead_time_days, status')
      .eq('id', experience_id)
      .single();

    if (expError || !experience) {
      return new Response(JSON.stringify({ error: 'Expérience introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (experience.status !== 'published') {
      return new Response(JSON.stringify({ error: 'Expérience non disponible' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Valider la taille du groupe ───────────────────────────────────────────
    if (party_size < experience.min_party || party_size > experience.max_party) {
      return new Response(JSON.stringify({
        error: `Groupe de ${party_size} personnes non accepté (min ${experience.min_party}, max ${experience.max_party})`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Valider le créneau si applicable ─────────────────────────────────────
    if (experience.has_time_slots) {
      const availableSlots: string[] = Array.isArray(experience.time_slots) ? experience.time_slots : [];
      if (!time_slot || !availableSlots.includes(time_slot)) {
        return new Response(JSON.stringify({ error: 'Créneau horaire invalide ou non sélectionné' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Calculer le prix total ────────────────────────────────────────────────
    let sellPrice = experience.base_price;
    if (experience.base_price_type === 'per_person') {
      sellPrice = experience.base_price * party_size;
    } else if (experience.base_price_type === 'per_person_per_night') {
      sellPrice = experience.base_price * party_size;
    }
    // 'fixed' → sellPrice = base_price tel quel

    // ── Créer la réservation en base (status=pending) ─────────────────────────
    const bookingPayload: Record<string, any> = {
      standalone_experience_id: experience_id,
      customer_name,
      customer_email,
      booking_date,
      party_size,
      sell_price: sellPrice,
      currency: experience.currency,
      status: 'pending',
      payment_status: 'pending',
    };
    if (time_slot) bookingPayload.time_slot = time_slot;
    if (customer_phone) bookingPayload.customer_phone = customer_phone;

    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .insert([bookingPayload])
      .select('id, confirmation_token')
      .single();

    if (bookingError || !booking) {
      console.error('Booking insert error:', bookingError);
      return new Response(JSON.stringify({ error: 'Impossible de créer la réservation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Créer l'ordre Revolut ─────────────────────────────────────────────────
    const description = `StayMakom — ${experience.title} · ${party_size} pers.`;
    let revolut: { orderId: string; publicId: string; checkoutUrl?: string };

    try {
      revolut = await createRevolutOrder({
        amount: sellPrice,
        currency: experience.currency,
        description,
        customerEmail: customer_email,
        customerName: customer_name,
        bookingId: booking.id,
      });
    } catch (err: any) {
      // Supprimer la réservation si Revolut échoue
      await supabase.from('standalone_bookings').delete().eq('id', booking.id);
      console.error('Revolut error:', err);
      return new Response(JSON.stringify({ error: 'Impossible de créer le paiement', details: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Mettre à jour la réservation avec les références Revolut ─────────────
    await supabase
      .from('standalone_bookings')
      .update({
        revolut_order_id: revolut.orderId,
        revolut_public_id: revolut.publicId,
      } as any)
      .eq('id', booking.id);

    // ── Réponse au frontend ───────────────────────────────────────────────────
    return new Response(JSON.stringify({
      booking_id: booking.id,
      confirmation_token: booking.confirmation_token,
      revolut_order_id: revolut.orderId,
      revolut_public_id: revolut.publicId,
      merchant_public_key: getRevolutPublicKey(),
      amount: sellPrice,
      currency: experience.currency,
      description,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('process-standalone-booking unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
