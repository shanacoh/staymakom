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

interface GiftCardEmailRequest {
  code: string;
  amount: number;
  currency: string;
  sender_name: string;
  recipient_name: string;
  recipient_email: string;
  message?: string;
  valid_until: string;
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

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || currency}${amount}`;
};

// Validation constants
const VALID_CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AMOUNT = 50000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_NAME_LENGTH = 100;
const MAX_CODE_LENGTH = 50;

const handler = async (req: Request): Promise<Response> => {
  console.log("send-gift-card function called");
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      code,
      amount,
      currency,
      sender_name,
      recipient_name,
      recipient_email,
      message,
      valid_until,
      language = 'en'
    }: GiftCardEmailRequest = await req.json();
    
    // Server-side input validation
    const validationErrors: string[] = [];
    
    // Validate required fields exist
    if (!code || typeof code !== 'string') {
      validationErrors.push('Gift card code is required');
    } else if (code.length > MAX_CODE_LENGTH) {
      validationErrors.push(`Code must be less than ${MAX_CODE_LENGTH} characters`);
    }
    
    // Validate amount
    if (amount === undefined || amount === null || typeof amount !== 'number') {
      validationErrors.push('Amount is required');
    } else if (amount <= 0 || amount > MAX_AMOUNT) {
      validationErrors.push(`Amount must be between 1 and ${MAX_AMOUNT}`);
    }
    
    // Validate currency
    if (!currency || typeof currency !== 'string') {
      validationErrors.push('Currency is required');
    } else if (!VALID_CURRENCIES.includes(currency)) {
      validationErrors.push(`Currency must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }
    
    // Validate sender_name
    if (!sender_name || typeof sender_name !== 'string') {
      validationErrors.push('Sender name is required');
    } else if (sender_name.trim().length === 0 || sender_name.length > MAX_NAME_LENGTH) {
      validationErrors.push(`Sender name must be 1-${MAX_NAME_LENGTH} characters`);
    }
    
    // Validate recipient_email
    if (!recipient_email || typeof recipient_email !== 'string') {
      validationErrors.push('Recipient email is required');
    } else if (!EMAIL_REGEX.test(recipient_email)) {
      validationErrors.push('Invalid recipient email format');
    }
    
    // Validate recipient_name if provided
    if (recipient_name && typeof recipient_name === 'string' && recipient_name.length > MAX_NAME_LENGTH) {
      validationErrors.push(`Recipient name must be less than ${MAX_NAME_LENGTH} characters`);
    }
    
    // Validate message if provided
    if (message && typeof message === 'string' && message.length > MAX_MESSAGE_LENGTH) {
      validationErrors.push(`Message must be less than ${MAX_MESSAGE_LENGTH} characters`);
    }
    
    // Validate valid_until
    if (!valid_until || typeof valid_until !== 'string') {
      validationErrors.push('Valid until date is required');
    } else {
      const validUntilDate = new Date(valid_until);
      if (isNaN(validUntilDate.getTime())) {
        validationErrors.push('Invalid valid_until date format');
      }
    }
    
    // Validate language if provided
    if (language && !['en', 'he'].includes(language)) {
      validationErrors.push('Language must be "en" or "he"');
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      console.error("Validation errors:", validationErrors);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log("Processing gift card:", code, "for:", recipient_email);

    const isHebrew = language === 'he';
    const expiresAt = new Date(valid_until);
    
    // Email to recipient
    const recipientEmailHtml = `
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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">STAYMAKOM</h1>
              <p style="color: #c9a87c; margin: 10px 0 0; font-size: 14px; letter-spacing: 1px;">
                ${isHebrew ? 'יותר משהייה, זו חוויה' : 'MORE THAN A STAY, IT\'S AN EXPERIENCE'}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px; font-weight: 500; text-align: center;">
                ${isHebrew ? '🎁 קיבלת מתנה!' : '🎁 You\'ve Received a Gift!'}
              </h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                ${isHebrew 
                  ? `<strong>${escapeHTML(sender_name)}</strong> שלח/ה לך כרטיס מתנה של Staymakom!`
                  : `<strong>${escapeHTML(sender_name)}</strong> has sent you a Staymakom gift card!`
                }
              </p>

              ${message ? `
              <div style="background-color: #f9f9f6; border-${isHebrew ? 'right' : 'left'}: 4px solid #c9a87c; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                  ${isHebrew ? 'ההודעה שלהם:' : 'Their message:'}
                </p>
                <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0; font-style: italic;">
                  "${escapeHTML(message)}"
                </p>
              </div>
              ` : ''}

              <!-- Gift Card Code -->
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <p style="color: #c9a87c; font-size: 12px; margin: 0 0 10px; letter-spacing: 2px;">
                  ${isHebrew ? 'קוד הכרטיס שלך' : 'YOUR GIFT CARD CODE'}
                </p>
                <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 15px; letter-spacing: 4px; font-family: monospace;">
                  ${code}
                </p>
                <p style="color: #ffffff; font-size: 28px; font-weight: 300; margin: 0;">
                  ${formatCurrency(amount, currency || 'ILS')}
                </p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                ${isHebrew 
                  ? 'השתמש/י בקוד זה בעת ביצוע ההזמנה באתר שלנו כדי לממש את המתנה שלך.'
                  : 'Use this code during checkout on our website to redeem your gift.'
                }
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://staymakom.com" style="display: inline-block; background-color: #c9a87c; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                      ${isHebrew ? 'גלה חוויות' : 'DISCOVER EXPERIENCES'}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 30px;">
                ${isHebrew 
                  ? `כרטיס זה תקף עד ${expiresAt.toLocaleDateString('he-IL')}`
                  : `This gift card is valid until ${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f6; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Staymakom. ${isHebrew ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0;">
                ${isHebrew ? 'שאלות? צור/י קשר' : 'Questions? Contact us at'} 
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

    // Send email to recipient via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staymakom Gifts <gifts@staymakom.com>",
        to: [recipient_email],
        reply_to: "shana@staymakom.com",
        subject: isHebrew 
          ? `🎁 ${sender_name} שלח/ה לך מתנה מ-Staymakom!`
          : `🎁 ${sender_name} sent you a Staymakom gift!`,
        html: recipientEmailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log("Email sent successfully to:", recipient_email);

    return new Response(
      JSON.stringify({ success: true, message: "Gift card email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-gift-card function:", error);
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
