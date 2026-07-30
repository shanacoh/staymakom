// confirm-standalone-payment — Edge Function
// Appelée côté client juste après que le widget Revolut annonce un paiement réussi.
// Ne fait jamais confiance au seul événement navigateur : revérifie l'état de la
// commande directement auprès de Revolut avant de confirmer la réservation.
// Sert de confirmation rapide en complément du webhook revolut-webhook (qui reste
// la source de vérité si cet appel n'arrive jamais, ex. client fermé trop tôt).

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

function getEnvMode(): 'production' | 'dev' {
  const raw = (Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return ['production', 'prod', 'live'].includes(raw) ? 'production' : 'dev';
}

function getRevolutBaseUrl(): string {
  return getEnvMode() === 'production'
    ? 'https://merchant.revolut.com/api'
    : 'https://sandbox-merchant.revolut.com/api';
}

function getSecretKey(): string {
  const isProd = getEnvMode() === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

async function sendNewBookingAdminEmail(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return;
  try {
    const { data: booking } = await supabase
      .from('standalone_bookings')
      .select('customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, standalone_experiences(title)')
      .eq('id', bookingId)
      .single();
    if (!booking) return;

    const exp = booking.standalone_experiences as { title: string } | null;
    const title = exp?.title || '—';
    const dateFormatted = new Date(booking.booking_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const currencySymbol: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };
    const priceDisplay = `${currencySymbol[booking.currency] || booking.currency}${booking.sell_price}`;
    const timeDisplay = booking.time_slot ? ` à ${booking.time_slot}` : '';
    const backofficeUrl = `https://staymakom.com/admin/standalone-bookings`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'StayMakom <reservations@staymakom.com>',
        to: ['shana@staymakom.com'],
        subject: `🎉 Nouvelle réservation — ${title}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eee;">
            <h2 style="color:#1A1814;margin:0 0 16px;">🎉 Nouvelle réservation standalone</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Expérience</td><td style="padding:8px 0;font-weight:600;">${title}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Client</td><td style="padding:8px 0;">${booking.customer_name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;">${booking.customer_email}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Date</td><td style="padding:8px 0;">${dateFormatted}${timeDisplay}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Participants</td><td style="padding:8px 0;">${booking.party_size} personne${booking.party_size > 1 ? 's' : ''}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Montant</td><td style="padding:8px 0;font-weight:700;color:#1A7A74;">${priceDisplay}</td></tr>
            </table>
            <a href="${backofficeUrl}" style="display:inline-block;margin-top:20px;background:#1A1814;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;">Voir dans le back office</a>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error('Admin notification failed (non-blocking):', err);
  }
}

async function getRevolutOrderState(orderId: string): Promise<string> {
  const response = await fetch(`${getRevolutBaseUrl()}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Revolut-Api-Version': '2024-09-01',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut get-order failed: ${response.status} — ${errorText}`);
  }
  const data = await response.json();
  return data.state as string;
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

    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .select('id, payment_status, revolut_order_id')
      .eq('confirmation_token', confirmation_token)
      .maybeSingle();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ success: false, error: 'Réservation introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Déjà confirmée (le webhook Revolut est parfois plus rapide que ce rappel) : rien à faire.
    if (booking.payment_status === 'paid') {
      return new Response(JSON.stringify({ success: true, already_confirmed: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!booking.revolut_order_id) {
      return new Response(JSON.stringify({ success: false, error: 'Aucune commande Revolut associée' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const state = await getRevolutOrderState(booking.revolut_order_id);

    if (state !== 'COMPLETED' && state !== 'AUTHORISED') {
      return new Response(JSON.stringify({ success: false, error: `Paiement non confirmé côté Revolut (état: ${state})` }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Le filtre .eq('payment_status', 'pending') évite d'écraser un état déjà avancé
    // par le webhook entre-temps (ex: déjà 'paid', ou 'refund_pending' après annulation express).
    const { data: updatedRows, error: updateError } = await supabase
      .from('standalone_bookings')
      .update({ status: 'confirmed', payment_status: 'paid' })
      .eq('id', booking.id)
      .eq('payment_status', 'pending')
      .select('id');

    if (updateError) {
      console.error('confirm-standalone-payment update error:', updateError);
      return new Response(JSON.stringify({ success: false, error: 'Mise à jour impossible' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Email admin seulement si cet appel est bien celui qui a confirmé la réservation
    // (évite un doublon si le webhook Revolut l'avait déjà fait entre-temps).
    if (updatedRows && updatedRows.length > 0) {
      await sendNewBookingAdminEmail(supabase, booking.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('confirm-standalone-payment unexpected error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
