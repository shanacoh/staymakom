// create-hotel-manual-booking — Edge Function
// Permet à un admin de saisir une réservation hôtel pour un client contacté
// en direct (téléphone, WhatsApp, email), sur le même modèle que
// create-standalone-manual-booking. Crée une ligne bookings_hg avec
// source = 'manual_admin' et un hg_booking_id synthétique unique. L'hôtel est
// choisi dans le catalogue (hotel_id) ou écrit en clair (hotel_name). L'email
// du client est facultatif (réservation WhatsApp), le coût de l'hôtel aussi
// (vide = « à saisir »). Paiement client et paiement de l'hôtel sont saisis
// dès la création
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
      hotel_name,
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
      channel,
      channel_detail,
      client_payment,
      deposit_amount,
      supplier_paid,
    } = body;

    const party_size: number = typeof partySizeRaw === 'number' ? partySizeRaw : 1;

    const hotelName = typeof hotel_name === 'string' ? hotel_name.trim() : '';
    if ((!hotel_id && !hotelName) || !checkin || !checkout || !customer_name) {
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

    if (net_price != null && (typeof net_price !== 'number' || net_price < 0)) {
      return new Response(JSON.stringify({ error: 'Coût de l\'hôtel invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Paiement client : non payé, acompte reçu (montant), ou payé en totalité.
    const clientPayment = client_payment ?? 'unpaid';
    if (!['unpaid', 'deposit_paid', 'paid'].includes(clientPayment)) {
      return new Response(JSON.stringify({ error: 'Paiement client invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (clientPayment === 'deposit_paid' && (typeof deposit_amount !== 'number' || deposit_amount <= 0 || deposit_amount >= sell_price)) {
      return new Response(JSON.stringify({ error: 'L\'acompte doit être supérieur à 0 et inférieur au prix total' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const paidAmount = clientPayment === 'paid' ? sell_price : clientPayment === 'deposit_paid' ? deposit_amount : null;
    if (supplier_paid === true && net_price == null) {
      return new Response(JSON.stringify({ error: 'Saisis le coût de l\'hôtel avant de le noter payé' }), {
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

    if (hotel_id) {
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
    }

    const hgBookingId = `MANUAL-${crypto.randomUUID()}`;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings_hg')
      .insert([{
        hg_booking_id: hgBookingId,
        hotel_id: hotel_id || null,
        hotel_name: hotel_id ? null : hotelName,
        experience_id: experience_id || null,
        checkin,
        checkout,
        nights,
        party_size,
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        sell_price,
        net_price: net_price ?? null,
        commission_amount: net_price != null ? sell_price - net_price : 0,
        currency: currency || 'ILS',
        status: 'confirmed',
        payment_status: clientPayment,
        paid_amount: paidAmount,
        paid_at: clientPayment === 'unpaid' ? null : new Date().toISOString(),
        supplier_payment_status: supplier_paid === true ? 'paid' : 'pending',
        supplier_paid_at: supplier_paid === true ? new Date().toISOString().slice(0, 10) : null,
        is_cancelled: false,
        source: 'manual_admin',
        internal_notes: internal_notes || null,
        synced_at: new Date().toISOString(),
        channel: channel || null,
        channel_detail: channel_detail || null,
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
