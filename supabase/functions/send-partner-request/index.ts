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

interface PartnerRequest {
  name: string;
  hotel_name: string;
  email: string;
  phone?: string;
  message?: string;
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

const propertyTypeLabels: Record<string, string> = {
  hotel: 'Hotel',
  boutique_hotel: 'Boutique Hotel',
  resort: 'Resort',
  villa: 'Villa',
  guesthouse: 'Guesthouse',
  other: 'Other',
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-partner-request function called");
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      hotel_name, 
      email, 
      phone, 
      message,
      language = 'en'
    }: PartnerRequest = await req.json();
    
    console.log("Processing partner request from:", email);

    const isHebrew = language === 'he';
    const firstName = name?.split(' ')[0] || name || 'Partner';

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
            <td style="background: linear-gradient(135deg, #c9a87c 0%, #b8956a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px;">🏨 NEW PARTNER REQUEST</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="background-color: #f9f9f6; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #1a1a1a; margin: 0 0 20px; font-size: 18px; font-weight: 600;">Property Information</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0;">
                      <p style="color: #999999; font-size: 12px; margin: 0 0 3px; text-transform: uppercase;">Property Name</p>
                      <p style="color: #1a1a1a; font-size: 16px; margin: 0; font-weight: 500;">${escapeHTML(hotel_name)}</p>
                    </td>
                  </tr>
                </table>
              </div>
              <div style="margin-bottom: 30px;">
                <h3 style="color: #1a1a1a; margin: 0 0 20px; font-size: 18px; font-weight: 600;">Contact Information</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 12px; margin: 0 0 3px; text-transform: uppercase;">Name</p>
                      <p style="color: #1a1a1a; font-size: 16px; margin: 0; font-weight: 500;">${escapeHTML(name)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 12px; margin: 0 0 3px; text-transform: uppercase;">Email</p>
                      <p style="color: #1a1a1a; font-size: 16px; margin: 0;">
                        <a href="mailto:${escapeHTML(email)}" style="color: #c9a87c; text-decoration: none;">${escapeHTML(email)}</a>
                      </p>
                    </td>
                  </tr>
                  ${phone ? `
                  <tr>
                    <td style="padding: 10px 0;">
                      <p style="color: #999999; font-size: 12px; margin: 0 0 3px; text-transform: uppercase;">Phone</p>
                      <p style="color: #1a1a1a; font-size: 16px; margin: 0;">
                        <a href="tel:${escapeHTML(phone)}" style="color: #c9a87c; text-decoration: none;">${escapeHTML(phone)}</a>
                      </p>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ${message ? `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #1a1a1a; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Additional Message</h3>
                <div style="background-color: #f9f9f6; border-left: 4px solid #c9a87c; padding: 20px; border-radius: 4px;">
                  <p style="color: #1a1a1a; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHTML(message)}</p>
                </div>
              </div>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${escapeHTML(email)}?subject=Re: Partnership Inquiry - ${escapeHTML(hotel_name)}" style="display: inline-block; background-color: #c9a87c; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                      REPLY TO ${firstName.toUpperCase()}
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
        from: "Staymakom Partners <partners@staymakom.com>",
        to: ["shana@staymakom.com"],
        reply_to: email,
        subject: `🏨 New Partner: ${hotel_name}`,
        html: teamEmailHtml,
      }),
    });

    if (!teamResponse.ok) {
      const error = await teamResponse.text();
      console.error("Error sending team notification:", error);
      throw new Error(`Failed to send team notification: ${error}`);
    }

    console.log("Team notification sent successfully");

    // Confirmation email to partner
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
                ${isHebrew ? `שלום ${escapeHTML(firstName)},` : `Hello ${escapeHTML(firstName)},`}
              </h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                ${isHebrew 
                  ? `תודה על עניינך בשותפות עם Staymakom! קיבלנו את הפרטים על <strong>${escapeHTML(hotel_name)}</strong> ונשמח לבחון את האפשרות לשיתוף פעולה.`
                  : `Thank you for your interest in partnering with Staymakom! We've received the details about <strong>${escapeHTML(hotel_name)}</strong> and we're excited to explore a potential collaboration.`
                }
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                ${isHebrew 
                  ? 'הצוות שלנו יבדוק את הבקשה ויחזור אליך תוך 2-3 ימי עסקים.'
                  : 'Our team will review your request and get back to you within 2-3 business days.'
                }
              </p>
              <div style="background-color: #f9f9f6; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #1a1a1a; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
                  ${isHebrew ? 'הפרטים שהתקבלו:' : 'Details received:'}
                </h3>
                <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.8;">
                  <strong>${isHebrew ? 'נכס:' : 'Property:'}</strong> ${escapeHTML(hotel_name)}
                </p>
              </div>
              <p style="color: #666666; font-size: 16px; margin-top: 30px;">
                ${isHebrew ? 'בברכה,' : 'Warm regards,'}<br>
                <strong style="color: #1a1a1a;">The Staymakom Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f6; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Staymakom. ${isHebrew ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0;">
                <a href="mailto:shana@staymakom.com" style="color: #c9a87c;">shana@staymakom.com</a>
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

    // Send confirmation to partner
    const confirmResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staymakom Partners <partners@staymakom.com>",
        to: [email],
        reply_to: "shana@staymakom.com",
        subject: isHebrew ? "קיבלנו את בקשת השותפות שלך! 🤝" : "We received your partnership request! 🤝",
        html: confirmationEmailHtml,
      }),
    });

    if (!confirmResponse.ok) {
      console.error("Error sending confirmation:", await confirmResponse.text());
    } else {
      console.log("Confirmation email sent to:", email);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Partner request processed successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-partner-request function:", error);
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
