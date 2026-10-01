// send-booking-payment-link-email — Edge Function
// Envoie par email un lien de paiement (acompte ou solde) déjà généré par
// create-booking-payment-link. Ne crée rien côté Revolut — se contente de
// relayer un checkout_url existant au client. Admin uniquement.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

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
  const isAllowed = ALLOWED_ORIGINS.some(o => (typeof o === 'string' ? o === origin : o.test(origin)));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://staymakom.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const escapeHTML = (str: string): string =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };
  return `${symbols[currency] || currency}${amount.toLocaleString()}`;
};

function buildEmailHtml(params: {
  guestName: string;
  experienceTitle: string;
  kindLabel: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
}): string {
  const { guestName, experienceTitle, kindLabel, amount, currency, checkoutUrl } = params;
  const brandRed = '#ad1414';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment link — StayMakom</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#1a1a1a;padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">STAYMAKOM</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;">
                Dear <strong>${escapeHTML(guestName)}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
                Please find below your ${kindLabel.toLowerCase()} payment link for <strong>${escapeHTML(experienceTitle)}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">${escapeHTML(kindLabel)} due</p>
                    <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:${brandRed};">${formatCurrency(amount, currency)}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${checkoutUrl}"
                       style="display:inline-block;background:${brandRed};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
                      Pay now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">
                Questions? Reply to this email or contact us at
                <a href="mailto:shana@staymakom.com" style="color:${brandRed};text-decoration:none;">shana@staymakom.com</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#1a1a1a;">StayMakom</p>
              <p style="margin:6px 0 0;font-size:12px;color:#999;">The Israel most people never find.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Vérifie que l'appelant est admin — action déclenchée depuis un écran protégé du back-office. */
async function isAdminRequest(req: Request, supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.id) return false;
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return !!adminRole;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (!(await isAdminRequest(req, supabase))) {
      return new Response(JSON.stringify({ success: false, error: 'Action réservée aux administrateurs' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ success: false, error: "Service d'email non configuré" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { payment_id } = await req.json();
    if (!payment_id) {
      return new Response(JSON.stringify({ success: false, error: 'payment_id requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: payment, error: paymentError } = await supabase
      .from('standalone_booking_payments')
      .select('id, booking_id, kind, amount, currency, checkout_url, status')
      .eq('id', payment_id)
      .single();
    if (paymentError || !payment) {
      return new Response(JSON.stringify({ success: false, error: 'Lien de paiement introuvable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (payment.status !== 'pending' || !payment.checkout_url) {
      return new Response(JSON.stringify({ success: false, error: 'Ce lien de paiement n\'est plus valide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .select('customer_name, customer_email, standalone_experience_id, custom_experience_title')
      .eq('id', payment.booking_id)
      .single();
    if (bookingError || !booking) {
      return new Response(JSON.stringify({ success: false, error: 'Réservation introuvable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!booking.customer_email) {
      return new Response(JSON.stringify({ success: false, error: 'Le client n\'a pas d\'adresse email enregistrée' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let experienceTitle = booking.custom_experience_title || 'your experience';
    if (booking.standalone_experience_id) {
      const { data: experience } = await supabase
        .from('standalone_experiences')
        .select('title')
        .eq('id', booking.standalone_experience_id)
        .maybeSingle();
      if (experience?.title) experienceTitle = experience.title;
    }

    const kindLabel = payment.kind === 'deposit' ? 'Deposit' : 'Balance';

    const html = buildEmailHtml({
      guestName: booking.customer_name,
      experienceTitle,
      kindLabel,
      amount: payment.amount,
      currency: payment.currency,
      checkoutUrl: payment.checkout_url,
    });

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StayMakom <hello@staymakom.com>',
        reply_to: 'shana@staymakom.com',
        to: [booking.customer_email],
        subject: `${kindLabel} payment link — ${experienceTitle}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend error:', errText);
      return new Response(JSON.stringify({ success: false, error: 'Échec de l\'envoi de l\'email', details: errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('send-booking-payment-link-email error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erreur interne', details: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
