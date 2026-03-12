import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = [
  'https://staymakom.com', 'https://www.staymakom.com',
  'https://stay-makom-experiences.lovable.app',
  'http://localhost:5173', 'http://localhost:8080',
];
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
}

interface ContactRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
  language?: string;
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

const handler = async (req: Request): Promise<Response> => {
  console.log("send-contact-request function called");
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, language = 'en' }: ContactRequest = await req.json();
    console.log("Processing contact request from:", email);

    const isHebrew = language === 'he';

    // Email to Staymakom team
    const teamEmailHtml = `
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
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px;">NEW CONTACT REQUEST</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">From</p>
                    <p style="color: #1a1a1a; font-size: 16px; margin: 0; font-weight: 500;">${escapeHTML(name)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                    <p style="color: #1a1a1a; font-size: 16px; margin: 0;">
                      <a href="mailto:${escapeHTML(email)}" style="color: #c9a87c; text-decoration: none;">${escapeHTML(email)}</a>
                    </p>
                  </td>
                </tr>
                ${subject ? `
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Subject</p>
                    <p style="color: #1a1a1a; font-size: 16px; margin: 0;">${escapeHTML(subject)}</p>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 15px 0;">
                    <p style="color: #999999; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
                    <p style="color: #1a1a1a; font-size: 16px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${escapeHTML(message)}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${escapeHTML(email)}?subject=Re: ${escapeHTML(subject || 'Your message to Staymakom')}" style="display: inline-block; background-color: #c9a87c; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                      REPLY TO ${escapeHTML(name.toUpperCase())}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f6; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Received at ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send notification to Staymakom team
    const teamResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staymakom Contact <noreply@staymakom.com>",
        to: ["shana@staymakom.com"],
        reply_to: email,
        subject: `📬 New Contact: ${subject || 'Message from ' + name}`,
        html: teamEmailHtml,
      }),
    });

    if (!teamResponse.ok) {
      const error = await teamResponse.text();
      console.error("Error sending team notification:", error);
      throw new Error(`Failed to send team notification: ${error}`);
    }

    console.log("Team notification sent successfully");

    // Confirmation email to visitor
    const confirmationEmailHtml = `
<!DOCTYPE html>
<html dir="${isHebrew ? 'rtl' : 'ltr'}">
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
              <p style="color: #c9a87c; margin: 10px 0 0; font-size: 14px; letter-spacing: 1px;">
                ${isHebrew ? 'יותר משהייה, זו חוויה' : 'MORE THAN A STAY, IT\'S AN EXPERIENCE'}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px; font-weight: 500;">
                ${isHebrew ? `שלום ${escapeHTML(name)},` : `Hello ${escapeHTML(name)},`}
              </h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                ${isHebrew 
                  ? 'תודה שפנית אלינו! קיבלנו את ההודעה שלך ונחזור אליך בהקדם האפשרי.'
                  : 'Thank you for reaching out! We\'ve received your message and will get back to you as soon as possible.'
                }
              </p>
              <div style="background-color: #f9f9f6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="color: #999999; font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">
                  ${isHebrew ? 'ההודעה שלך:' : 'Your message:'}
                </p>
                <p style="color: #1a1a1a; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHTML(message)}</p>
              </div>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${isHebrew 
                  ? 'בינתיים, אתם מוזמנים לגלות את החוויות שלנו.'
                  : 'In the meantime, feel free to explore our experiences.'
                }
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://staymakom.com" style="display: inline-block; background-color: #c9a87c; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                      ${isHebrew ? 'גלה חוויות' : 'DISCOVER EXPERIENCES'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f6; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Staymakom. ${isHebrew ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send confirmation to visitor
    const confirmResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staymakom <noreply@staymakom.com>",
        to: [email],
        reply_to: "shana@staymakom.com",
        subject: isHebrew ? "קיבלנו את ההודעה שלך! 💫" : "We received your message! 💫",
        html: confirmationEmailHtml,
      }),
    });

    if (!confirmResponse.ok) {
      console.error("Error sending confirmation:", await confirmResponse.text());
    } else {
      console.log("Confirmation email sent to:", email);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contact request processed successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
