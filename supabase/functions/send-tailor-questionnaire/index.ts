import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  'https://stay-makom-experiences.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const escapeHTML = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { leadId } = await req.json();

    if (!leadId) {
      return new Response(
        JSON.stringify({ success: false, error: 'leadId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, email, first_name, name, source, metadata')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lead.source !== 'tailored_request') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only tailored_request leads can receive this questionnaire' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = crypto.randomUUID();
    const sentAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        metadata: {
          ...(lead.metadata || {}),
          questionnaire_token: token,
          questionnaire_sent_at: sentAt,
        },
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Failed to update lead metadata:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to prepare questionnaire' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = lead.first_name || (lead.name ? lead.name.split(' ')[0] : null);
    const greeting = firstName ? escapeHTML(firstName) : 'there';
    const questionnaireUrl = `https://staymakom.com/tailor-questionnaire/${token}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">STAYMAKOM</h1>
              <p style="color: #c9a87c; margin: 10px 0 0; font-size: 14px; letter-spacing: 1px;">MORE THAN A STAY, IT'S AN EXPERIENCE</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px 40px;">
              <h2 style="color: #1a1a1a; margin: 0 0 24px; font-size: 22px; font-weight: 500;">
                Hello ${greeting},
              </h2>
              <p style="color: #444444; font-size: 16px; line-height: 1.7; margin: 0 0 16px;">
                Thank you for sharing your dream stay with us — we loved reading about it.
              </p>
              <p style="color: #444444; font-size: 16px; line-height: 1.7; margin: 0 0 32px;">
                To find the perfect match for you, we'd love to know just two more things. It takes less than a minute:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
                <tr>
                  <td align="center">
                    <a href="${escapeHTML(questionnaireUrl)}" style="display: inline-block; background-color: #c9a87c; color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 4px; font-size: 15px; font-weight: 600; letter-spacing: 1.5px;">
                      TELL US MORE
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #aaaaaa; font-size: 13px; line-height: 1.6; margin: 0;">
                If the button doesn't work, copy this link:<br>
                <a href="${escapeHTML(questionnaireUrl)}" style="color: #c9a87c; word-break: break-all;">${escapeHTML(questionnaireUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f6; padding: 24px 40px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                © ${new Date().getFullYear()} Staymakom. All rights reserved.<br>
                <a href="https://staymakom.com" style="color: #c9a87c; text-decoration: none;">staymakom.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Staymakom <noreply@staymakom.com>',
        to: [lead.email],
        reply_to: 'shana@staymakom.com',
        subject: 'One last thing… 🌿',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend error:', errText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Questionnaire email sent to ${lead.email}, lead ${leadId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
