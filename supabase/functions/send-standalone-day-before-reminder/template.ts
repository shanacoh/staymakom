// Email de rappel envoyé la veille d'une expérience. Même habillage que l'email de confirmation
// (send-standalone-booking-confirmation) : bandeau photo, bannière, carte, bouton rouge, pied de page.
// Écrit en entier dans la langue du client.

import { formatBookingDate, hasLocation, renderPracticalInfoHtml, type PracticalInfo, type PracticalLang } from '../_shared/practical-info/content.ts';

const escapeHTML = (str: string): string =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TEXTS: Record<PracticalLang, {
  subject: (title: string) => string;
  eyebrow: string;
  banner: string;
  bannerSub: string;
  dear: (name: string) => string;
  intro: string;
  experience: string;
  date: string;
  time: string;
  guests: (count: number) => string;
  guestsLabel: string;
  address: string;
  cta: string;
  contact: string;
}> = {
  en: {
    subject: (title) => `Reminder: your experience is tomorrow, ${title}`,
    eyebrow: 'Experience Only',
    banner: '⏰ See you tomorrow',
    bannerSub: 'Here is everything you need for the day.',
    dear: (name) => `Dear <strong>${name}</strong>,`,
    intro: 'Your experience is tomorrow. Here is a quick reminder:',
    experience: 'Experience',
    date: 'Date',
    time: 'Time',
    guests: (count) => `${count} person${count > 1 ? 's' : ''}`,
    guestsLabel: 'Guests',
    address: 'Meeting Point',
    cta: 'View My Booking',
    contact: 'Questions? Reply to this email or contact us at',
  },
  fr: {
    subject: (title) => `Rappel : votre expérience est demain, ${title}`,
    eyebrow: 'Expérience',
    banner: '⏰ À demain',
    bannerSub: 'Voici tout ce qu\'il faut savoir pour le jour J.',
    dear: (name) => `Bonjour <strong>${name}</strong>,`,
    intro: 'Votre expérience a lieu demain. Voici un petit rappel :',
    experience: 'Expérience',
    date: 'Date',
    time: 'Heure',
    guests: (count) => `${count} personne${count > 1 ? 's' : ''}`,
    guestsLabel: 'Participants',
    address: 'Point de rendez-vous',
    cta: 'Voir ma réservation',
    contact: 'Une question ? Répondez à cet email ou écrivez-nous à',
  },
  he: {
    subject: (title) => `תזכורת: החוויה שלך מחר, ${title}`,
    eyebrow: 'חוויה',
    banner: '⏰ נתראה מחר',
    bannerSub: 'כל מה שצריך לדעת לקראת היום.',
    dear: (name) => `שלום <strong>${name}</strong>,`,
    intro: 'החוויה שלך מתקיימת מחר. הנה תזכורת קצרה:',
    experience: 'חוויה',
    date: 'תאריך',
    time: 'שעה',
    guests: (count) => `${count} משתתפים`,
    guestsLabel: 'משתתפים',
    address: 'נקודת מפגש',
    cta: 'לצפייה בהזמנה',
    contact: 'יש שאלה? אפשר להשיב למייל הזה או לכתוב לנו אל',
  },
};

export interface ReminderEmailParams {
  lang: PracticalLang;
  guestName: string;
  experienceTitle: string;
  bookingDate: string;
  timeSlot?: string;
  partySize: number;
  confirmationToken: string;
  /** Adresse montrée dans la carte quand le bloc Infos pratiques ne dit pas déjà où aller. */
  address?: string;
  practicalInfo: PracticalInfo | null;
}

export function buildReminderEmail(params: ReminderEmailParams): { subject: string; html: string } {
  const { lang, guestName, experienceTitle, bookingDate, timeSlot, partySize, confirmationToken, practicalInfo } = params;
  const t = TEXTS[lang];
  const rtl = lang === 'he';
  const align = rtl ? 'right' : 'left';
  const address = hasLocation(practicalInfo) ? undefined : params.address;

  const confirmationUrl = `https://staymakom.com/standalone-booking/confirmation/${confirmationToken}`;
  const heroImageUrl = 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/NL/email/confirmation-hero-desert-road.jpg';
  const brandRed = '#ad1414';
  const label = `margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;text-align:${align};`;

  const html = `
<!DOCTYPE html>
<html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(t.subject(experienceTitle))}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header : photo bandeau -->
          <tr>
            <td background="${heroImageUrl}" bgcolor="#1a1a1a" style="background-image:url('${heroImageUrl}');background-size:cover;background-position:center;padding:44px 40px;text-align:center;">
              <p style="margin:0 0 10px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,0.5);">${t.eyebrow}</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-shadow:0 2px 20px rgba(0,0,0,0.5);">STAYMAKOM</h1>
            </td>
          </tr>

          <!-- Bannière -->
          <tr>
            <td style="background:#FAF9F6;padding:24px 40px;text-align:center;border-bottom:1px solid #eee;">
              <p style="margin:0;font-size:16px;font-weight:700;color:${brandRed};">${t.banner}</p>
              <p style="margin:6px 0 0;font-size:14px;color:#666;">${t.bannerSub}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;" dir="${rtl ? 'rtl' : 'ltr'}">
              <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;text-align:${align};">
                ${t.dear(escapeHTML(guestName))}
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;text-align:${align};">
                ${t.intro}
              </p>

              <!-- Carte -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td colspan="2" style="padding-bottom:16px;border-bottom:1px solid #eee;">
                          <p style="${label}">${t.experience}</p>
                          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1a1a1a;text-align:${align};">${escapeHTML(experienceTitle)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding:16px 0 12px;vertical-align:top;">
                          <p style="${label}">${t.date}</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a1a1a;text-align:${align};">${escapeHTML(formatBookingDate(bookingDate, lang))}</p>
                        </td>
                        ${timeSlot ? `
                        <td width="50%" style="padding:16px 0 12px;vertical-align:top;">
                          <p style="${label}">${t.time}</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:${brandRed};text-align:${align};">🕐 ${escapeHTML(timeSlot)}</p>
                        </td>
                        ` : ''}
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-bottom:12px;">
                          <p style="${label}">${t.guestsLabel}</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a1a1a;text-align:${align};">${t.guests(partySize)}</p>
                        </td>
                      </tr>
                      ${address ? `
                      <tr>
                        <td colspan="2" style="padding-bottom:12px;">
                          <p style="${label}">${t.address}</p>
                          <p style="margin:4px 0 0;font-size:14px;color:#1a1a1a;text-align:${align};">📍 ${escapeHTML(address)}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>${renderPracticalInfoHtml(practicalInfo)}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}"
                       style="display:inline-block;background:${brandRed};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888;line-height:1.6;text-align:${align};">
                ${t.contact}
                <a href="mailto:shana@staymakom.com" style="color:${brandRed};text-decoration:none;">shana@staymakom.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
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

  return { subject: t.subject(experienceTitle), html };
}
