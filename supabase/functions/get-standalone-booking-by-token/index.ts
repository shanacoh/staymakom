// get-standalone-booking-by-token — Edge Function
// Utilisée par la page de confirmation client (/standalone-booking/confirmation/:token).
// Ne renvoie que les champs strictement nécessaires à l'affichage client : jamais
// le téléphone, les notes internes, le coût prestataire, les champs Revolut ou la
// source. Remplace un accès direct à la table standalone_bookings, qui exposait
// auparavant TOUTES ses colonnes publiquement (policy RLS trop permissive).

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

  try {
    const body = await req.json();
    const { confirmation_token } = body;

    if (!confirmation_token) {
      return new Response(JSON.stringify({ error: 'confirmation_token manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .select('id, is_cancelled, status, payment_status, booking_date, time_slot, party_size, currency, sell_price, customer_email, custom_experience_title, custom_address, custom_regulations, standalone_experiences(title, title_he, title_fr, address)')
      .eq('confirmation_token', confirmation_token)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Réservation introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ booking }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('get-standalone-booking-by-token error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
