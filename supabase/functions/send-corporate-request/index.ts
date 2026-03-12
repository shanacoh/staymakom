import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = ['https://staymakom.com','https://www.staymakom.com','https://stay-makom-experiences.lovable.app','http://localhost:5173','http://localhost:8080'];
function getCorsHeaders(req: Request) { const o = req.headers.get('Origin')||''; return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o)?o:ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }; }

// HTML escaping function to prevent injection attacks
const escapeHTML = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface CorporateRequest {
  fullName: string;
  companyName?: string;
  email: string;
  phone?: string;
  requestType: string;
  groupSize?: string;
  preferredDates?: string;
  message?: string;
}

const requestTypeLabels: Record<string, string> = {
  corporate_gift_cards: "Corporate Gift Cards",
  team_building: "Team-Building Experience",
  corporate_retreat: "Corporate Retreat / Offsite",
  employee_reward: "Employee Reward (individual gifts)",
  customized_incentive: "Customized Incentive",
  other: "Other",
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: CorporateRequest = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #D72638 0%, #E63946 50%, #F77F00 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: white; padding: 30px; border: 1px solid #E5E5E5; border-top: none; }
            .field { margin-bottom: 20px; }
            .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .value { color: #1A1A1A; font-size: 16px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Corporate Request from Staymakom</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Contact Person</div>
                <div class="value">${escapeHTML(data.fullName)}</div>
              </div>
              
              ${data.companyName ? `
              <div class="field">
                <div class="label">Company Name</div>
                <div class="value">${escapeHTML(data.companyName)}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${escapeHTML(data.email)}">${escapeHTML(data.email)}</a></div>
              </div>
              
              ${data.phone ? `
              <div class="field">
                <div class="label">Phone</div>
                <div class="value">${escapeHTML(data.phone)}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Type of Request</div>
                <div class="value">${escapeHTML(requestTypeLabels[data.requestType] || data.requestType)}</div>
              </div>
              
              ${data.groupSize ? `
              <div class="field">
                <div class="label">Estimated Group Size</div>
                <div class="value">${escapeHTML(data.groupSize)}</div>
              </div>
              ` : ''}
              
              ${data.preferredDates ? `
              <div class="field">
                <div class="label">Preferred Dates</div>
                <div class="value">${escapeHTML(data.preferredDates)}</div>
              </div>
              ` : ''}
              
              ${data.message ? `
              <div class="field">
                <div class="label">Message</div>
                <div class="value">${escapeHTML(data.message).replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>This request was submitted via the Staymakom For Companies page.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staymakom <onboarding@resend.dev>",
        to: ["hello@staymakom.com"],
        reply_to: data.email,
        subject: `New Corporate Request: ${escapeHTML(requestTypeLabels[data.requestType] || data.requestType)}${data.companyName ? ` - ${escapeHTML(data.companyName)}` : ''}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-corporate-request function:", error);
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
