// notify-standalone-experience-request — Edge Function
// Prévient l'équipe StayMakom par email qu'une nouvelle demande de dates
// (expérience "sur demande", non réservable en ligne) vient d'arriver.
// Ne reçoit qu'un request_id : va chercher les données en base elle-même,
// même logique que send-standalone-booking-confirmation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = 'shana@staymakom.com';

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

const formatDate = (dateStr: string): string =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
    const { request_id } = await req.json();

    if (!request_id) {
      return new Response(JSON.stringify({ error: 'request_id manquant' }), {
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

    const { data: request, error: requestError } = await supabase
      .from('standalone_experience_requests')
      .select('id, customer_name, customer_email, customer_phone, requested_date, adults, children, message, created_at, standalone_experiences(title)')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      return new Response(JSON.stringify({ error: 'Demande introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const experience = request.standalone_experiences as unknown as { title: string } | null;
    const experienceTitle = experience?.title || 'Expérience';
    const partySize = (request.adults ?? 0) + (request.children ?? 0);

    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6;">
        <p style="font-size:17px;font-weight:700;">Nouvelle demande de dates — ${escapeHTML(experienceTitle)}</p>
        <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
          <tr><td style="color:#999;padding-right:12px;">Client</td><td><strong>${escapeHTML(request.customer_name)}</strong></td></tr>
          <tr><td style="color:#999;padding-right:12px;">Email</td><td><a href="mailto:${escapeHTML(request.customer_email)}">${escapeHTML(request.customer_email)}</a></td></tr>
          ${request.customer_phone ? `<tr><td style="color:#999;padding-right:12px;">Téléphone</td><td>${escapeHTML(request.customer_phone)}</td></tr>` : ''}
          <tr><td style="color:#999;padding-right:12px;">Date souhaitée</td><td>${request.requested_date ? formatDate(request.requested_date) : 'Non précisée'}</td></tr>
          <tr><td style="color:#999;padding-right:12px;">Participants</td><td>${partySize} (${request.adults} adulte${request.adults > 1 ? 's' : ''}${request.children ? `, ${request.children} enfant${request.children > 1 ? 's' : ''}` : ''})</td></tr>
        </table>
        ${request.message ? `<p style="color:#999;margin-bottom:4px;">Message</p><p style="white-space:pre-line;">${escapeHTML(request.message)}</p>` : ''}
        <p style="margin-top:24px;">
          <a href="https://staymakom.com/admin/standalone-bookings" style="display:inline-block;background:#ad1414;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:700;">
            Voir dans le back office
          </a>
        </p>
      </div>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StayMakom <hello@staymakom.com>',
        reply_to: request.customer_email,
        to: [NOTIFY_EMAIL],
        subject: `Nouvelle demande — ${experienceTitle}`,
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

    await supabase
      .from('standalone_experience_requests')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', request.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('notify-standalone-experience-request error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
