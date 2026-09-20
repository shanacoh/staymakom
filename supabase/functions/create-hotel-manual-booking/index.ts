// create-hotel-manual-booking — Edge Function
// Permet à un admin de saisir une réservation hôtel pour un client contacté
// en direct (téléphone, WhatsApp, email), sur le même modèle que
// create-standalone-manual-booking. Crée une ligne bookings_hg avec
// source = 'manual_admin' et un hg_booking_id synthétique unique
// (jamais un vrai id HyperGuest) — SANS toucher aux champs revolut_*/
// hg_raw_data/hg_status (laissés vides, ce qui distingue visuellement une
// vraie synchro d'une saisie manuelle) et sans envoyer d'email : Shana décide
// plus tard, depuis la fiche détail, de marquer le paiement puis d'envoyer
// l'email de confirmation.

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
  const origin = req.headers.get('Origin') || '';
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
    // ── Vérifier que l'appelant est admin ────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      hotel_id,
      experience_id,
      checkin,
      checkout,
      customer_name,
      customer_email,
      customer_phone,
      party_size: partySizeRaw,
      sell_price,
      net_price,
      currency,
      internal_notes,
    } = body;

    const party_size: number = typeof partySizeRaw === 'number' ? partySizeRaw : 1;

    if (!hotel_id || !checkin || !checkout || !customer_name || !customer_email) {
      return new Response(JSON.stringify({ error: 'Champs requis manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (party_size < 1) {
      return new Response(JSON.stringify({ error: 'Au moins 1 personne est requise' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof sell_price !== 'number' || sell_price < 0) {
      return new Response(JSON.stringify({ error: 'Prix total invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (Number.isNaN(checkinDate.getTime()) || Number.isNaN(checkoutDate.getTime()) || checkoutDate <= checkinDate) {
      return new Response(JSON.stringify({ error: 'Dates de séjour invalides' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const nights = Math.round((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));

    const { data: hotel, error: hotelError } = await supabase
      .from('hotels2')
      .select('id')
      .eq('id', hotel_id)
      .maybeSingle();
    if (hotelError || !hotel) {
      return new Response(JSON.stringify({ error: 'Hôtel introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hgBookingId = `MANUAL-${crypto.randomUUID()}`;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings_hg')
      .insert([{
        hg_booking_id: hgBookingId,
        hotel_id,
        experience_id: experience_id || null,
        checkin,
        checkout,
        nights,
        party_size,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        sell_price,
        net_price: net_price ?? sell_price,
        commission_amount: net_price != null ? sell_price - net_price : 0,
        currency: currency || 'ILS',
        status: 'confirmed',
        payment_status: 'unpaid',
        is_cancelled: false,
        source: 'manual_admin',
        internal_notes: internal_notes || null,
        synced_at: new Date().toISOString(),
      }])
      .select('id, confirmation_token')
      .single();

    if (bookingError || !booking) {
      console.error('Erreur création réservation hôtel manuelle:', bookingError);
      return new Response(JSON.stringify({ error: 'Impossible de créer la réservation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id: booking.id,
      confirmation_token: booking.confirmation_token,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('create-hotel-manual-booking error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
