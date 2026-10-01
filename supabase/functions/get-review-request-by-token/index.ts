// get-review-request-by-token - Edge Function
// Utilisée par la page publique /avis/:token : charge uniquement ce qui est nécessaire
// pour afficher le formulaire (titre de l'expérience, langue, si déjà déposé), jamais
// les coordonnées complètes ni les données internes de la réservation.

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
  const isAllowed = ALLOWED_ORIGINS.some(o => (typeof o === 'string' ? o === origin : o.test(origin)));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://staymakom.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'token manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: request, error } = await supabase
      .from('review_requests')
      .select('id, status, lang, booking_type, booking_id')
      .eq('token', token)
      .maybeSingle();

    if (error || !request) {
      return new Response(JSON.stringify({ error: 'Lien introuvable ou expiré' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let experienceTitle = '';
    let customerFirstName = '';

    if (request.booking_type === 'standalone_bookings') {
      const { data: booking } = await supabase
        .from('standalone_bookings')
        .select('customer_name, standalone_experiences(title, title_fr, title_he)')
        .eq('id', request.booking_id)
        .maybeSingle();
      if (booking) {
        customerFirstName = (booking.customer_name || '').split(' ')[0];
        const exp = booking.standalone_experiences as any;
        experienceTitle = (request.lang === 'fr' ? exp?.title_fr : request.lang === 'he' ? exp?.title_he : exp?.title) || exp?.title || '';
      }
    } else {
      const { data: booking } = await supabase
        .from('bookings_hg')
        .select('customer_name')
        .eq('id', request.booking_id)
        .maybeSingle();
      if (booking) customerFirstName = (booking.customer_name || '').split(' ')[0];
    }

    return new Response(JSON.stringify({
      status: request.status,
      lang: request.lang,
      experienceTitle,
      customerFirstName,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('get-review-request-by-token error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
