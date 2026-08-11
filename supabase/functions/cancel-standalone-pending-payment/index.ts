// cancel-standalone-pending-payment — Edge Function
// Appelée côté client quand le client ferme la pop-up de paiement Revolut sans avoir
// payé (ex: formulaire carte bloqué, abandon volontaire). Marque la réservation
// "pending" correspondante comme annulée, pour que le back office ne s'encombre pas
// de doublons créés à chaque nouvelle tentative de paiement (voir process-standalone-payment,
// qui crée une nouvelle réservation "pending" à chaque clic sur "Payer").
// Ne touche jamais une réservation déjà payée ou déjà annulée (garde-fou via .eq()).

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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { confirmation_token } = await req.json();

    if (!confirmation_token) {
      return new Response(JSON.stringify({ success: false, error: 'confirmation_token manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: booking, error: lookupError } = await supabase
      .from('standalone_bookings')
      .select('id')
      .eq('confirmation_token', confirmation_token)
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .eq('is_cancelled', false)
      .maybeSingle();

    if (lookupError || !booking) {
      // Rien à annuler (déjà payée, déjà annulée, ou introuvable) : ce n'est pas une erreur,
      // le client peut avoir fermé la pop-up après que le webhook a déjà confirmé le paiement.
      return new Response(JSON.stringify({ success: true, cancelled: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await supabase
      .from('standalone_bookings')
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
        internal_notes: 'Abandonné par le client avant paiement (pop-up de paiement fermée sans payer)',
      })
      .eq('id', booking.id)
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .eq('is_cancelled', false);

    if (updateError) {
      console.error('cancel-standalone-pending-payment update error:', updateError);
      return new Response(JSON.stringify({ success: false, error: 'Mise à jour impossible' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, cancelled: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('cancel-standalone-pending-payment unexpected error:', err);
    const details = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: 'Erreur interne', details }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
