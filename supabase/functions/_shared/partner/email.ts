// Habillage commun des emails de l'espace partenaire. Il reprend celui de l'email de confirmation de
// réservation (send-standalone-booking-confirmation) : bandeau photo, bannière de contexte, carte
// d'infos sur fond clair, bouton rouge arrondi, texte de contact, pied de page.
// Fichier sans dépendance : il ne fait que fabriquer du HTML et l'envoyer.

export type PartnerLang = "en" | "fr" | "he";

export const PARTNER_SITE_URL = "https://staymakom.com";
export const PARTNER_SPACE_URL = `${PARTNER_SITE_URL}/partner`;

const HERO_IMAGE_URL =
  "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/NL/email/confirmation-hero-desert-road.jpg";
const BRAND_RED = "#ad1414";

export function partnerLang(value: unknown): PartnerLang {
  return value === "fr" || value === "he" ? value : "en";
}

export const escapeHTML = (value: unknown): string =>
  String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface PartnerEmailRow {
  label: string;
  value: string;
}

export interface PartnerEmailContent {
  lang: PartnerLang;
  eyebrow: string;
  banner: string;
  bannerSub?: string;
  greeting?: string;
  intro: string;
  /** Carte d'infos. Une ligne sans valeur n'apparaît pas. */
  rows?: PartnerEmailRow[];
  cta?: { label: string; url: string };
  /** Petite phrase sous le bouton (durée de validité d'un lien, par exemple). */
  footnote?: string;
  contact: string;
}

/** Le HTML complet d'un email. Tous les textes reçus sont échappés ici. */
export function renderPartnerEmail(content: PartnerEmailContent): string {
  const dir = content.lang === "he" ? ' dir="rtl"' : "";
  const rows = (content.rows ?? []).filter((row) => row.value.trim() !== "");

  const card = rows.length === 0 ? "" : `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${rows.map((row, index) => `
                      <tr>
                        <td style="padding-bottom:${index === rows.length - 1 ? 0 : 14}px;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">${escapeHTML(row.label)}</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a1a1a;line-height:1.5;white-space:pre-line;">${escapeHTML(row.value)}</p>
                        </td>
                      </tr>`).join("")}
                    </table>
                  </td>
                </tr>
              </table>`;

  const cta = !content.cta ? "" : `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${content.footnote ? 16 : 32}px;">
                <tr>
                  <td align="center">
                    <a href="${escapeHTML(content.cta.url)}"
                       style="display:inline-block;background:${BRAND_RED};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
                      ${escapeHTML(content.cta.label)}
                    </a>
                  </td>
                </tr>
              </table>`;

  const footnote = !content.footnote ? "" : `
              <p style="margin:0 0 32px;font-size:12px;color:#999;line-height:1.6;text-align:center;">${escapeHTML(content.footnote)}</p>`;

  return `
<!DOCTYPE html>
<html lang="${content.lang}"${dir}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(content.banner)}</title>
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
            <td background="${HERO_IMAGE_URL}" bgcolor="#1a1a1a" style="background-image:url('${HERO_IMAGE_URL}');background-size:cover;background-position:center;padding:44px 40px;text-align:center;">
              <p style="margin:0 0 10px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,0.5);">${escapeHTML(content.eyebrow)}</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-shadow:0 2px 20px rgba(0,0,0,0.5);">STAYMAKOM</h1>
            </td>
          </tr>

          <tr>
            <td style="background:#FAF9F6;padding:24px 40px;text-align:center;border-bottom:1px solid #eee;">
              <p style="margin:0;font-size:16px;font-weight:700;color:${BRAND_RED};">${escapeHTML(content.banner)}</p>
              ${content.bannerSub ? `<p style="margin:6px 0 0;font-size:14px;color:#666;">${escapeHTML(content.bannerSub)}</p>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:40px;"${dir}>
              ${content.greeting ? `<p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;">${escapeHTML(content.greeting)}</p>` : ""}
              <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;white-space:pre-line;">${escapeHTML(content.intro)}</p>
${card}${cta}${footnote}
              <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">${escapeHTML(content.contact)}</p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#1a1a1a;">Staymakom</p>
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

export async function sendPartnerEmail(to: string[], subject: string, html: string): Promise<{ ok: boolean; details?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, details: "RESEND_API_KEY manquante" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "STAYMAKOM <hello@staymakom.com>",
      reply_to: "shana@staymakom.com",
      to,
      subject,
      html,
    }),
  });
  if (response.ok) return { ok: true };
  const details = await response.text();
  console.error("Resend error:", details);
  return { ok: false, details };
}

// Mêmes origines autorisées que les autres fonctions appelées depuis le site.
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "https://staymakom.com",
  "https://www.staymakom.com",
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  /\.vercel\.app$/,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

export function partnerCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.some((o) => (typeof o === "string" ? o === origin : o.test(origin)));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://staymakom.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
