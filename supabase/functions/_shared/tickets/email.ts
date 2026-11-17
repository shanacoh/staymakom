// Email « Vos billets » : minimaliste, façon billet, à la demande de Shana (02/11/2026).
// Il s'écarte volontairement du gabarit de la confirmation : pas de photo bandeau, pas de bannière,
// pas d'emoji. Il en garde la police (Inter), le rouge de marque #ad1414 comme seul accent, le
// bouton arrondi, le bloc Infos pratiques et le pied de page.
//
// Les billets image sont affichés dans le corps de l'email en image « intégrée » (cid:) : l'image
// voyage dans l'email lui-même, elle s'affiche dans Gmail et Apple Mail, n'expire jamais et reste
// visible sans réseau à l'entrée. Les PDF et .pkpass sont seulement joints.

import { renderPracticalInfoHtml, STAYMAKOM_WHATSAPP_URL, type PracticalInfo } from "../practical-info/content.ts";
import { formatShortDate, TICKET_TEXTS, ticketPageUrl, ticketSummaryLine } from "./content.ts";
import type { TicketBooking } from "./load.ts";

const escapeHTML = (str: string): string =>
  (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BRAND_RED = "#ad1414";
const INK = "#1a1a1a";

/** Identifiant « cid » d'un billet image dans l'email. */
export function ticketContentId(ticketId: string): string {
  return `ticket-${ticketId}`;
}

export function buildTicketsEmail(booking: TicketBooking, practicalInfo: PracticalInfo | null): { subject: string; html: string } {
  const { lang } = booking;
  const t = TICKET_TEXTS[lang];
  const rtl = lang === "he";
  const dir = rtl ? "rtl" : "ltr";
  const subject = t.subject(booking.experienceTitle, formatShortDate(booking.bookingDate, lang));
  const summary = ticketSummaryLine({ date: booking.dateLabel, time: booking.timeLabel, partySize: booking.partySize }, lang);
  const images = booking.tickets.filter((ticket) => ticket.fileType === "image");
  const hasAttachmentsOnly = booking.tickets.some((ticket) => ticket.fileType !== "image");
  const showLabels = booking.tickets.length > 1;

  const imagesHtml = images.map((ticket) => `
              <tr>
                <td align="center" style="padding:0 0 32px;">
                  ${showLabels && ticket.label ? `<p style="margin:0 0 12px;font-size:${rtl ? "13px" : "11px"};font-weight:600;letter-spacing:${rtl ? "0" : "0.2em"};text-transform:uppercase;color:#999;">${escapeHTML(ticket.label)}</p>` : ""}
                  <img src="cid:${ticketContentId(ticket.id)}" alt="${escapeHTML(ticket.label || ticket.originalName)}" width="440" style="display:block;width:100%;max-width:440px;height:auto;border:0;margin:0 auto;" />
                </td>
              </tr>`).join("");

  const html = `
<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(subject)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Helvetica,Arial,sans-serif;color:${INK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" dir="${dir}" style="width:100%;max-width:560px;">

          <tr>
            <td align="center" style="padding:0 0 40px;">
              <p style="margin:0;font-size:15px;font-weight:700;letter-spacing:-0.04em;text-transform:uppercase;color:${INK};">STAYMAKOM</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 0 12px;">
              <p style="margin:0;font-size:${rtl ? "13px" : "11px"};font-weight:600;letter-spacing:${rtl ? "0" : "0.3em"};text-transform:uppercase;color:${BRAND_RED};">${t.eyebrow}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 12px;">
              <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${INK};">${escapeHTML(booking.experienceTitle)}</h1>
            </td>
          </tr>
          ${summary ? `
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <p style="margin:0;font-size:14px;color:#555;">${escapeHTML(summary)}</p>
            </td>
          </tr>` : ""}

          <tr>
            <td style="padding:0 0 40px;"><div style="height:1px;line-height:1px;font-size:0;background:#e5e5e5;">&nbsp;</div></td>
          </tr>
${imagesHtml}
          ${booking.token ? `
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <a href="${ticketPageUrl(booking.token)}" style="display:inline-block;background:${BRAND_RED};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">${t.openTickets}</a>
            </td>
          </tr>` : ""}
          ${booking.tickets.length > 0 ? `
          <tr>
            <td align="center" style="padding:0 0 ${hasAttachmentsOnly ? "6" : "32"}px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#999;">${t.showCode}</p>
            </td>
          </tr>` : ""}
          ${hasAttachmentsOnly ? `
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#999;">${t.attached}</p>
            </td>
          </tr>` : ""}
          ${booking.ticketNote ? `
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:${INK};white-space:pre-line;">${escapeHTML(booking.ticketNote)}</p>
            </td>
          </tr>` : ""}

          ${practicalInfo ? `<tr><td>${renderPracticalInfoHtml(practicalInfo)}</td></tr>` : `
          <tr>
            <td align="center" style="padding:8px 0 32px;">
              <p style="margin:0;font-size:13px;color:#555;">${t.question} &nbsp;·&nbsp; <a href="${STAYMAKOM_WHATSAPP_URL}" style="color:${BRAND_RED};text-decoration:none;font-weight:600;">${t.questionLink}</a></p>
            </td>
          </tr>`}

          <tr>
            <td align="center" style="padding:24px 0 0;border-top:1px solid #eee;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${INK};">Staymakom</p>
              <p style="margin:6px 0 0;font-size:12px;color:#999;">The Israel most people never find.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
