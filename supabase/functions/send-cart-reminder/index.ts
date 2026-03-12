import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Find carts where reminder should be sent
    // reminder_sent_at IS NULL and created_at + reminder_hours has passed
    const { data: carts, error } = await supabase
      .from("saved_carts")
      .select(`
        *,
        experiences2 (title, slug, hero_image, thumbnail_image),
        user_profiles!saved_carts_user_id_fkey (display_name)
      `)
      .is("reminder_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching carts:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const sentIds: string[] = [];

    for (const cart of carts || []) {
      const createdAt = new Date(cart.created_at);
      const reminderMs = (cart.reminder_hours || 24) * 60 * 60 * 1000;
      const shouldSend = now.getTime() - createdAt.getTime() >= reminderMs;

      if (!shouldSend) continue;

      // Get user email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(cart.user_id);
      if (!authUser?.user?.email) continue;

      const email = authUser.user.email;
      const displayName = cart.user_profiles?.display_name || email.split("@")[0];
      const expTitle = cart.experiences2?.title || "Experience";
      const expSlug = cart.experiences2?.slug || "";
      const heroImg = cart.experiences2?.thumbnail_image || cart.experiences2?.hero_image || "";

      const dateInfo = cart.checkin && cart.checkout
        ? `${cart.checkin} → ${cart.checkout}`
        : "Dates not yet selected";

      // Send email via Resend
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "STAYMAKOM <noreply@staymakom.com>",
          reply_to: "shana@staymakom.com",
          to: [email],
          subject: `Your saved stay is waiting — ${expTitle}`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <tr><td style="text-align:center;padding-bottom:32px;">
      <span style="font-size:20px;font-weight:700;letter-spacing:-0.04em;text-transform:uppercase;color:#1A1A1A;">STAYMAKOM</span>
    </td></tr>
    <tr><td>
      <h1 style="font-size:22px;font-weight:600;color:#1A1A1A;margin:0 0 8px;">Hi ${displayName},</h1>
      <p style="font-size:15px;color:#666;margin:0 0 24px;line-height:1.6;">
        You saved <strong>${expTitle}</strong> — it's still available! Don't let this one slip away.
      </p>
    </td></tr>
    ${heroImg ? `<tr><td style="padding-bottom:20px;"><img src="${heroImg}" alt="${expTitle}" style="width:100%;border-radius:12px;object-fit:cover;max-height:240px;" /></td></tr>` : ""}
    <tr><td style="padding:16px;background:#fff;border-radius:12px;border:1px solid #eee;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1A1A1A;">${expTitle}</p>
      <p style="margin:0;font-size:13px;color:#888;">${dateInfo} · ${cart.party_size || 2} guests</p>
    </td></tr>
    <tr><td style="padding-top:24px;text-align:center;">
      <a href="https://staymakom.com/experience/${expSlug}" 
         style="display:inline-block;padding:14px 32px;background:#1A1A1A;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
        Continue booking
      </a>
    </td></tr>
    <tr><td style="padding-top:32px;text-align:center;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        Prices may change based on availability. This is not a reservation.
      </p>
    </td></tr>
  </table>
</body>
</html>`,
        }),
      });

      if (emailRes.ok) {
        sentIds.push(cart.id);
        // Mark as sent
        await supabase
          .from("saved_carts")
          .update({ reminder_sent_at: now.toISOString() })
          .eq("id", cart.id);
      } else {
        console.error("Resend error:", await emailRes.text());
      }
    }

    return new Response(
      JSON.stringify({ sent: sentIds.length, ids: sentIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
