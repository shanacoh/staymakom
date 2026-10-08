// send-standalone-booking-confirmation — Edge Function
// Envoie l'email de confirmation pour une réservation "Experience Only".
// Reprend le même pattern que send-booking-confirmation mais sans les sections hôtel.
// Ne reçoit qu'un confirmation_token : va chercher les données en base elle-même,
// pour ne jamais dépendre de ce que le navigateur du client a pu envoyer/altérer.
//
// Bloc « Infos pratiques » (point de rendez-vous, accès, contact jour J...) : ajouté dans la langue
// de la réservation, uniquement pour une réservation d'expérience déjà confirmée et non annulée.
// Si la fiche n'a aucune info pratique, l'email est exactement celui d'avant.
//
// Pas d'envoi en double : un envoi automatique ne part que si l'email n'a jamais été envoyé.
// Seul un admin connecté (bouton « Renvoyer » du back-office) peut le renvoyer.
//
// Aperçu d'une fiche (`preview_experience_id`) : envoie l'email tel que le client le recevrait,
// avec une réservation fictive, à l'adresse de l'admin connecté. Rien n'est écrit en base.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hasLocation, normalizeLang, renderPracticalInfoHtml, buildPracticalInfo, type PracticalInfo } from '../_shared/practical-info/content.ts';
import { loadPracticalInfo, SAMPLE_DAY_CONTACT, SAMPLE_PRACTICAL_SOURCE } from '../_shared/practical-info/load.ts';
import { getAdminEmail, isAdminEmail, isInternalCron } from '../_shared/internal-auth.ts';

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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
  regulations?: string;
  bookingRef: string;
  practicalInfo?: PracticalInfo | null;
}): string {
  const {
    guestName, experienceTitle, bookingDate, timeSlot,
    partySize, totalPrice, currency, confirmationToken, regulations, bookingRef,
  } = params;
  const practicalInfoHtml = renderPracticalInfoHtml(params.practicalInfo ?? null);
  // Quand le bloc Infos pratiques dit déjà où aller, la ligne « Meeting Point » de la carte ferait doublon.
  const address = hasLocation(params.practicalInfo ?? null) ? undefined : params.address;

  const confirmationUrl = `https://staymakom.com/standalone-booking/confirmation/${confirmationToken}`;
  const heroImageUrl = 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/NL/email/confirmation-hero-desert-road.jpg';
  const brandRed = '#ad1414';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation — StayMakom</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header : photo bandeau -->
          <tr>
            <td background="${heroImageUrl}" bgcolor="#1a1a1a" style="background-image:url('${heroImageUrl}');background-size:cover;background-position:center;padding:44px 40px;text-align:center;">
              <p style="margin:0 0 10px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,0.5);">Experience Only</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-shadow:0 2px 20px rgba(0,0,0,0.5);">STAYMAKOM</h1>
            </td>
          </tr>

          <!-- Confirmation banner -->
          <tr>
            <td style="background:#FAF9F6;padding:24px 40px;text-align:center;border-bottom:1px solid #eee;">
              <p style="margin:0;font-size:16px;font-weight:700;color:${brandRed};">✓ Booking Confirmed</p>
              <p style="margin:6px 0 0;font-size:14px;color:#666;">We look forward to seeing you soon!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;">
                Dear <strong>${escapeHTML(guestName)}</strong>,
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                Your experience is confirmed. Here are your booking details:
              </p>

              <!-- Booking card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:16px;border-bottom:1px solid #eee;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Experience</p>
                          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1a1a1a;">${escapeHTML(experienceTitle)}</p>
                          <p style="margin:8px 0 0;font-size:12px;color:#999;">Booking Ref: <span style="font-weight:600;color:#1a1a1a;">${escapeHTML(bookingRef)}</span></p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:16px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Date</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a1a1a;">${formatDate(bookingDate)}</p>
                              </td>
                              ${timeSlot ? `
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Time</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a1a1a;">🕐 ${escapeHTML(timeSlot)}</p>
                              </td>
                              ` : ''}
                            </tr>
                            <tr>
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Guests</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a1a1a;">${partySize} person${partySize > 1 ? 's' : ''}</p>
                              </td>
                              <td width="50%" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Total</p>
                                <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:${brandRed};">${formatCurrency(totalPrice, currency)}</p>
                              </td>
                            </tr>
                            ${address ? `
                            <tr>
                              <td colspan="2" style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Meeting Point</p>
                                <p style="margin:4px 0 0;font-size:14px;color:#1a1a1a;">📍 ${escapeHTML(address)}</p>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>${practicalInfoHtml}

              ${regulations ? `
              <!-- Good to know -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Good to Know</p>
                    <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-line;">${escapeHTML(regulations)}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}"
                       style="display:inline-block;background:${brandRed};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
                      View My Booking
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

          <!-- Footer -->
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

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; details?: string }> {
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'StayMakom <hello@staymakom.com>',
      reply_to: 'shana@staymakom.com',
      to: [to],
      subject,
      html,
    }),
  });
  if (emailResponse.ok) return { ok: true };
  const details = await emailResponse.text();
  console.error('Resend error:', details);
  return { ok: false, details };
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

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const body = await req.json();
    const { confirmation_token, preview, preview_experience_id } = body;

    if (!confirmation_token && !preview && !preview_experience_id) {
      return json({ error: 'confirmation_token manquant' }, 400);
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return json({ error: 'Email service not configured' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const adminEmail = await getAdminEmail(req, supabase);

    // ── Aperçu d'une fiche : réservation fictive, envoyée à l'admin qui la demande ──────────────
    if (preview_experience_id) {
      // Destinataire : l'admin connecté. La base peut aussi demander un aperçu (secret du coffre),
      // mais seulement vers l'adresse d'un admin.
      let recipient = adminEmail;
      if (!recipient && typeof body.to === 'string' && await isInternalCron(req, supabase) && await isAdminEmail(supabase, body.to)) {
        recipient = body.to;
      }
      if (!recipient) return json({ error: 'Action réservée aux administrateurs' }, 403);

      const { data: previewExperience, error: previewError } = await supabase
        .from('standalone_experiences')
        .select('id, title, address')
        .eq('id', preview_experience_id)
        .maybeSingle();
      if (previewError || !previewExperience) return json({ error: 'Fiche introuvable' }, 404);

      const lang = normalizeLang(body.lang);
      // `sample_info` : montre le rendu d'une fiche complète avec des infos de démonstration.
      const practicalInfo = body.sample_info === true
        ? buildPracticalInfo(SAMPLE_PRACTICAL_SOURCE, SAMPLE_DAY_CONTACT, lang)
        : await loadPracticalInfo(supabase, previewExperience.id, lang);

      const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const html = buildEmailHtml({
        guestName: 'Client Test',
        experienceTitle: previewExperience.title || '',
        bookingDate: inOneWeek,
        timeSlot: '10:00',
        partySize: 2,
        totalPrice: 480,
        currency: 'ILS',
        confirmationToken: 'apercu',
        address: previewExperience.address || undefined,
        bookingRef: 'SM-APERCU',
        practicalInfo,
      });
      const sent = await sendEmail(recipient, `[Aperçu] ✓ Your experience is confirmed — ${previewExperience.title || ''}`, html);
      if (!sent.ok) return json({ error: 'Email send failed', details: sent.details }, 500);
      return json({ success: true, sent_to: recipient, has_practical_info: !!practicalInfo });
    }

    // En mode aperçu sans token, on prend la réservation la plus récente pour montrer un rendu réel.
    const bookingQuery = supabase
      .from('standalone_bookings')
      .select('id, customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, confirmation_token, custom_experience_title, custom_address, custom_regulations, status, is_cancelled, product_type, preferred_lang, standalone_experience_id, standalone_experiences(title, address, address_he)');
    const { data: booking, error: bookingError } = confirmation_token
      ? await bookingQuery.eq('confirmation_token', confirmation_token).single()
      : await bookingQuery.order('created_at', { ascending: false }).limit(1).single();

    if (bookingError || !booking) {
      return json({ error: 'Réservation introuvable' }, 404);
    }

    const experience = booking.standalone_experiences as unknown as { title: string; address?: string; address_he?: string } | null;
    const experienceTitle = experience?.title || booking.custom_experience_title || '';

    // Infos pratiques : seulement pour une expérience (pas un bateau) confirmée et non annulée.
    // L'aperçu sans token est public : il ne les montre qu'à un admin connecté.
    const eligible = booking.status === 'confirmed' && !booking.is_cancelled && booking.product_type !== 'boat';
    let practicalInfo: PracticalInfo | null = null;
    if (eligible && (confirmation_token || adminEmail)) {
      try {
        practicalInfo = await loadPracticalInfo(supabase, booking.standalone_experience_id, booking.preferred_lang);
      } catch (infoError) {
        // Les infos pratiques ne doivent jamais empêcher la confirmation de partir.
        console.error('Infos pratiques illisibles, email envoyé sans le bloc:', infoError);
      }
    }

    const html = buildEmailHtml({
      guestName: booking.customer_name,
      experienceTitle,
      bookingDate: booking.booking_date,
      timeSlot: booking.time_slot || undefined,
      partySize: booking.party_size,
      totalPrice: booking.sell_price,
      currency: booking.currency || 'USD',
      confirmationToken: booking.confirmation_token,
      address: booking.custom_address || experience?.address,
      regulations: booking.custom_regulations || undefined,
      bookingRef: `SM-${booking.id.slice(0, 8).toUpperCase()}`,
      practicalInfo,
    });

    const subject = `✓ Your experience is confirmed — ${experienceTitle}`;

    if (preview) {
      return json({ html, subject });
    }

    // Pas d'envoi en double : un envoi automatique « prend » d'abord la réservation (date d'envoi
    // posée seulement si elle était vide). S'il n'obtient rien, l'email est déjà parti.
    // Un admin connecté, lui, renvoie volontairement.
    const isAdminResend = !!adminEmail;
    if (!isAdminResend) {
      const { data: claimed, error: claimError } = await supabase
        .from('standalone_bookings')
        .update({ confirmation_email_sent_at: new Date().toISOString() } as any)
        .eq('id', booking.id)
        .is('confirmation_email_sent_at', null)
        .select('id');
      if (claimError) throw claimError;
      if (!claimed || claimed.length === 0) {
        return json({ success: true, already_sent: true });
      }
    }

    const sent = await sendEmail(booking.customer_email, subject, html);

    if (!sent.ok) {
      // L'email n'est pas parti : on libère la réservation pour qu'un nouvel essai soit possible.
      if (!isAdminResend) {
        await supabase
          .from('standalone_bookings')
          .update({ confirmation_email_sent_at: null } as any)
          .eq('id', booking.id);
      }
      return json({ error: 'Email send failed', details: sent.details }, 500);
    }

    if (isAdminResend) {
      await supabase
        .from('standalone_bookings')
        .update({ confirmation_email_sent_at: new Date().toISOString() } as any)
        .eq('id', booking.id);
    }

    return json({ success: true });

  } catch (err: any) {
    console.error('send-standalone-booking-confirmation error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
