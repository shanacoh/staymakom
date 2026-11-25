// Email envoyé à Shana à chaque génération d'article. Email interne, en français, mais avec
// l'habillage de l'email de référence (send-standalone-booking-confirmation) : bandeau photo,
// bannière de contexte, bloc carte gris clair, boutons rouge marque, pied de page.

export interface JournalEmailParams {
  title: string;
  lang: "en" | "he" | "fr";
  status: "scheduled" | "draft" | "blocked";
  publishAtLabel: string | null;
  blockReasons: string[];
  toVerify: string[];
  notes: string[];
  keyword: string;
  wordCount: number;
  costUsd: number | null;
  links: { preview: string; edit: string; publish: string; reject: string };
}

const LANG_LABEL = { en: "Anglais", he: "Hébreu", fr: "Français" } as const;
const BRAND_RED = "#ad1414";
const HERO = "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/NL/email/confirmation-hero-desert-road.jpg";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function statusBanner(p: JournalEmailParams): { banner: string; sub: string } {
  if (p.status === "blocked") return { banner: "⛔ Article bloqué", sub: "Il ne sera pas publié tout seul." };
  if (p.status === "draft") return { banner: "✍️ Brouillon à valider", sub: "Il attend ta validation avant d'être publié." };
  return { banner: "🗓️ Article programmé", sub: `Publication automatique ${p.publishAtLabel || "à 17:00"} (heure d'Israël).` };
}

function list(items: string[]): string {
  return `<ul style="margin:8px 0 0;padding-left:18px;font-size:14px;color:#1a1a1a;line-height:1.6;">${items
    .map((i) => `<li>${esc(i)}</li>`)
    .join("")}</ul>`;
}

function button(href: string, label: string, filled: boolean): string {
  const style = filled
    ? `background:${BRAND_RED};color:#ffffff;border:1px solid ${BRAND_RED};`
    : `background:#ffffff;color:${BRAND_RED};border:1px solid ${BRAND_RED};`;
  return `<a href="${esc(href)}" style="display:inline-block;${style}text-decoration:none;padding:12px 22px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:4px;">${label}</a>`;
}

export function journalEmailSubject(p: JournalEmailParams): string {
  const prefix = p.status === "blocked" ? "Bloqué" : p.status === "draft" ? "À valider" : "Programmé 17:00";
  return `Journal ${p.lang.toUpperCase()} · ${prefix} · ${p.title}`;
}

export function journalEmailHtml(p: JournalEmailParams): string {
  const { banner, sub } = statusBanner(p);
  const dirTitle = p.lang === "he" ? ' dir="rtl"' : "";
  const block = (label: string, content: string) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:24px;">
                <tr><td style="padding:20px 24px;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">${label}</p>
                  ${content}
                </td></tr>
              </table>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Journal STAYMAKOM</title>
  <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td background="${HERO}" bgcolor="#1a1a1a" style="background-image:url('${HERO}');background-size:cover;background-position:center;padding:44px 40px;text-align:center;">
            <p style="margin:0 0 10px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,0.5);">Journal</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-shadow:0 2px 20px rgba(0,0,0,0.5);">STAYMAKOM</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF9F6;padding:24px 40px;text-align:center;border-bottom:1px solid #eee;">
            <p style="margin:0;font-size:16px;font-weight:700;color:${BRAND_RED};">${banner}</p>
            <p style="margin:6px 0 0;font-size:14px;color:#666;">${esc(sub)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${block(
              "Article du jour",
              `<p style="margin:6px 0 0;font-size:17px;font-weight:700;color:#1a1a1a;"${dirTitle}>${esc(p.title)}</p>
               <p style="margin:10px 0 0;font-size:13px;color:#555;">${LANG_LABEL[p.lang]} · mot-clé « ${esc(p.keyword)} » · ${p.wordCount} mots${
                 p.costUsd != null ? ` · coût ${p.costUsd.toFixed(2)} $` : ""
               }</p>`
            )}
            ${p.blockReasons.length ? block("Pourquoi il est bloqué", list(p.blockReasons)) : ""}
            ${block(
              "Points à vérifier",
              p.toVerify.length ? list(p.toVerify) : `<p style="margin:6px 0 0;font-size:14px;color:#555;">Rien de signalé.</p>`
            )}
            ${p.notes.length ? block("À savoir", list(p.notes)) : ""}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                ${button(p.links.preview, "Aperçu", true)}
                ${button(p.links.edit, "Modifier", false)}
                ${p.status === "blocked" ? "" : button(p.links.publish, "Publier maintenant", false)}
                ${button(p.links.reject, "Rejeter", false)}
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
              « Rejeter » fonctionne en un clic depuis cet email pendant 24 h (lien à usage unique).
              « Publier maintenant » ouvre l'article dans le back-office, où tu confirmes.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#1a1a1a;">StayMakom</p>
            <p style="margin:6px 0 0;font-size:12px;color:#999;">The Israel most people never find.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
