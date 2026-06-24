// send-standalone-booking-confirmation — Edge Function
// Envoie l'email de confirmation pour une réservation "Experience Only".
// Reprend le même pattern que send-booking-confirmation mais sans les sections hôtel.
// Ne reçoit qu'un confirmation_token : va chercher les données en base elle-même,
// pour ne jamais dépendre de ce que le navigateur du client a pu envoyer/altérer.

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

const escapeHTML = (str: string): string =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };
  return `${symbols[currency] || currency}${amount.toLocaleString()}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

function buildEmailHtml(params: {
  guestName: string;
  experienceTitle: string;
  bookingDate: string;
  timeSlot?: string;
  partySize: number;
  totalPrice: number;
  currency: string;
  confirmationToken: string;
  address?: string;
}): string {
  const {
    guestName, experienceTitle, bookingDate, timeSlot,
    partySize, totalPrice, currency, confirmationToken, address,
  } = params;

  const confirmationUrl = `https://staymakom.com/standalone-booking/confirmation/${confirmationToken}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation — StayMakom</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1A1814;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FAF8F4;font-size:22px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">STAYMAKOM</h1>
              <p style="margin:8px 0 0;color:#A8C5C3;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Experience Only</p>
            </td>
          </tr>

          <!-- Confirmation banner -->
          <tr>
            <td style="background:#E8F5F4;padding:24px 40px;text-align:center;border-bottom:1px solid #D4EAE8;">
              <p style="margin:0;font-size:16px;font-weight:600;color:#1A7A74;">✓ Booking Confirmed</p>
              <p style="margin:6px 0 0;font-size:14px;color:#4A8A87;">We look forward to seeing you soon!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#1A1814;">
                Dear <strong>${escapeHTML(guestName)}</strong>,
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                Your experience is confirmed. Here are your booking details:
              </p>

              <!-- Booking card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;border-radius:8px;border:1px solid #E8E0D4;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:16px;border-bottom:1px solid #E8E0D4;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Experience</p>
                          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1A1814;">${escapeHTML(experienceTitle)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:16px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Date</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1A1814;">${formatDate(bookingDate)}</p>
                              </td>
                              ${timeSlot ? `
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Time</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1A1814;">🕐 ${escapeHTML(timeSlot)}</p>
                              </td>
                              ` : ''}
                            </tr>
                            <tr>
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Guests</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1A1814;">${partySize} person${partySize > 1 ? 's' : ''}</p>
                              </td>
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Total</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#1A7A74;">${formatCurrency(totalPrice, currency)}</p>
                              </td>
                            </tr>
                            ${address ? `
                            <tr>
                              <td colspan="2" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Meeting Point</p>
                                <p style="margin:4px 0 0;font-size:14px;color:#1A1814;">📍 ${escapeHTML(address)}</p>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}"
                       style="display:inline-block;background:#1A1814;color:#FAF8F4;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.05em;">
                      View My Booking
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">
                Questions? Reply to this email or contact us at
                <a href="mailto:hello@staymakom.com" style="color:#1A7A74;text-decoration:none;">hello@staymakom.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1A1814;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888;">© StayMakom · The Israel most people never find.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .select('customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, confirmation_token, standalone_experiences(title, address, address_he)')
      .eq('confirmation_token', confirmation_token)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Réservation introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const experience = booking.standalone_experiences as unknown as { title: string; address?: string; address_he?: string } | null;

    const html = buildEmailHtml({
      guestName: booking.customer_name,
      experienceTitle: experience?.title || '',
      bookingDate: booking.booking_date,
      timeSlot: booking.time_slot || undefined,
      partySize: booking.party_size,
      totalPrice: booking.sell_price,
      currency: booking.currency || 'USD',
      confirmationToken: booking.confirmation_token,
      address: experience?.address,
    });

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StayMakom <hello@staymakom.com>',
        to: [booking.customer_email],
        subject: `✓ Your experience is confirmed — ${experience?.title || ''}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend error:', errText);
      return new Response(JSON.stringify({ error: 'Email send failed', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('send-standalone-booking-confirmation error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
