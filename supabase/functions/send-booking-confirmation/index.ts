import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || currency}${amount.toLocaleString()}`;
};

// Langues de l'email : en / fr / he, plus es / ru / de (réservation faite depuis une page traduite).
type MailLang = 'en' | 'fr' | 'he' | 'es' | 'ru' | 'de';
const MAIL_LANGS: MailLang[] = ['en', 'fr', 'he', 'es', 'ru', 'de'];
// Dates : le français garde le format anglais d'origine (inchangé), les autres suivent leur langue.
const DATE_LOCALE: Record<MailLang, string> = { en: 'en-US', fr: 'en-US', he: 'he-IL', es: 'es-ES', ru: 'ru-RU', de: 'de-DE' };

const formatDate = (dateStr: string, lang: MailLang): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(DATE_LOCALE[lang], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-confirmation function called");
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      type, // ✅ #9: 'cancellation' or undefined (confirmation)
      to,
      guestName,
      experienceTitle,
      hotelName,
      roomName,
      boardType,
      checkIn,
      checkOut,
      nights,
      partySize,
      totalPrice,
      currency = "USD",
      bookingRef,
      hgBookingId,
      remarks,
      specialRequests,
      lang,
      cancellationPolicy,
      displayTaxesTotal, // ✅ #2d: Display taxes amount
      cancellationPenalty, // ✅ #9: Penalty for cancellation emails
      confirmationToken, // ✅ Confirmation page token
    } = body;

    const isCancellation = type === 'cancellation';

    console.log(`Processing ${isCancellation ? 'cancellation' : 'booking confirmation'} for:`, to, "ref:", bookingRef);

    if (!to) {
      throw new Error("Recipient email (to) is required");
    }

    const mailLang: MailLang = MAIL_LANGS.includes(lang) ? lang : 'en';
    const pick = (texts: Record<MailLang, string>): string => texts[mailLang];
    const isHebrew = mailLang === 'he';
    const isFrench = mailLang === 'fr';
    const isAuto = mailLang === 'es' || mailLang === 'ru' || mailLang === 'de';
    const langParam = isAuto ? `?lang=${mailLang}` : '';
    const customerName = escapeHTML(guestName || 'Guest');
    const safeTitle = escapeHTML(experienceTitle || 'Experience');
    const safeHotel = escapeHTML(hotelName || 'Hotel');
    const safeRoom = escapeHTML(roomName || '');
    const safeRef = escapeHTML(bookingRef || hgBookingId || '');

    // VAT text — always shown, language-specific
    const VAT_TEXT_EN = "Prices do not include VAT. Israeli residents are subject to 18% VAT payable at the hotel. Tourists with an entry permit (B/2, B/3, or B/4) and a valid foreign passport are not subject to VAT. Please make sure to keep the entry permit received upon arrival, as it may be required to confirm eligibility. If exemption cannot be validated at check-in, VAT will be charged accordingly.";
    const VAT_TEXT_HE = "המחירים אינם כוללים מע״מ. אזרחי ותושבי ישראל חייבים במע״מ בשיעור של 18%, אשר ישולם במלון. תיירים המחזיקים בדרכון זר ובאשרת כניסה (B/2, B/3 או B/4) אינם חייבים במע״מ; יש לשמור את אישור הכניסה שניתן בעת ההגעה, שכן ייתכן ויידרש לצורך אימות הזכאות. במידה ולא ניתן לאשר את הפטור במעמד הצ'ק-אין, יחויב המע״מ בהתאם.";
    const VAT_TEXT_FR = "Les prix n'incluent pas la TVA. Les résidents israéliens sont soumis à 18% de TVA payable à l'hôtel. Les touristes détenteurs d'un passeport étranger valide et d'un permis d'entrée (B/2, B/3 ou B/4) sont exonérés de TVA. Veuillez conserver le permis d'entrée reçu à l'arrivée, car il peut être demandé pour confirmer votre éligibilité. Si l'exonération ne peut être validée au moment du check-in, la TVA sera facturée en conséquence.";
    const VAT_TEXT_ES = "Los precios no incluyen el IVA. Los residentes en Israel deben pagar un IVA del 18 % en el hotel. Los turistas con permiso de entrada (B/2, B/3 o B/4) y pasaporte extranjero válido están exentos del IVA. Conserva el permiso de entrada que recibes a tu llegada, ya que puede ser necesario para confirmar la exención. Si la exención no se puede validar al hacer el check-in, se cobrará el IVA.";
    const VAT_TEXT_RU = "Цены указаны без НДС. Резиденты Израиля оплачивают НДС 18 % в отеле. Туристы с разрешением на въезд (B/2, B/3 или B/4) и действующим иностранным паспортом освобождены от НДС. Сохраните разрешение на въезд, полученное по прибытии: оно может понадобиться для подтверждения освобождения. Если освобождение не удастся подтвердить при заселении, НДС будет начислен.";
    const VAT_TEXT_DE = "Die Preise verstehen sich ohne Mehrwertsteuer. Einwohner Israels zahlen 18 % MwSt. im Hotel. Touristen mit Einreisegenehmigung (B/2, B/3 oder B/4) und gültigem ausländischem Reisepass sind von der MwSt. befreit. Bitte bewahre die bei der Ankunft erhaltene Einreisegenehmigung auf, da sie zum Nachweis benötigt werden kann. Kann die Befreiung beim Check-in nicht bestätigt werden, wird die MwSt. berechnet.";
    const vatTextForEmail = pick({ en: VAT_TEXT_EN, fr: VAT_TEXT_FR, he: VAT_TEXT_HE, es: VAT_TEXT_ES, ru: VAT_TEXT_RU, de: VAT_TEXT_DE });

    // Build other remarks — filter out VAT text (shown separately above)
    const isVatRemark = (r: string) => /taxes are not included|prices do not include vat|17% vat|18% vat|b2 visa|local regulations.*tax|pay.*tax.*check.?in/i.test(r);
    const genericFilter = /general message that should be shown/i;
    const rawRemarks: string[] = Array.isArray(remarks) ? remarks.filter((r: string) => r && !genericFilter.test(r)) : [];
    const otherRemarks = [...new Set(rawRemarks.filter((r: string) => !isVatRemark(r)))];

    const vatHtml = !isCancellation
      ? `<div style="background-color:#f9f9f6;border-left:3px solid #c9a87c;padding:14px 16px;margin-bottom:16px;border-radius:0 6px 6px 0;">
           <p style="color:#555;font-size:13px;line-height:1.7;margin:0;">${escapeHTML(vatTextForEmail)}</p>
         </div>`
      : '';
    const otherRemarksHtml = otherRemarks.length > 0
      ? `<div style="margin-bottom:20px;">
           ${otherRemarks.map((r: string) => `<p style="color:#888;font-size:13px;line-height:1.6;margin:3px 0;">· ${escapeHTML(r)}</p>`).join('')}
         </div>`
      : '';

    // Build cancellation policy HTML — inclut la date butoir explicite si disponible.
    let cancellationHtml = '';
    if (!isCancellation && cancellationPolicy?.summaryText) {
      const bgColor = cancellationPolicy.isNonRefundable ? '#ffebee' : '#e8f5e9';
      const textColor = cancellationPolicy.isNonRefundable ? '#c62828' : '#2e7d32';
      const icon = cancellationPolicy.isNonRefundable ? '⚠️' : '✓';
      const label = pick({ en: "Cancellation Policy", fr: "Politique d'annulation", he: "מדיניות ביטול", es: "Política de cancelación", ru: "Условия отмены", de: "Stornierungsbedingungen" });

      // Date butoir explicite — formatée dans la langue du client.
      let deadlineLine = '';
      if (!cancellationPolicy.isNonRefundable && cancellationPolicy.deadline) {
        const deadlineDate = new Date(cancellationPolicy.deadline);
        if (!isNaN(deadlineDate.getTime())) {
          const locale = isHebrew ? 'he-IL' : pick({ en: "en-US", fr: "fr-FR", he: "en-US", es: "es-ES", ru: "ru-RU", de: "de-DE" });
          const hasTime = deadlineDate.getHours() !== 0 || deadlineDate.getMinutes() !== 0;
          const formatted = hasTime
            ? deadlineDate.toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
            : deadlineDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          const cancelUntilLabel = pick({ en: "Free cancellation until", fr: "Annulation gratuite jusqu'au", he: "ניתן לבטל בחינם עד", es: "Cancelación gratuita hasta el", ru: "Бесплатная отмена до", de: "Kostenlose Stornierung bis" });
          deadlineLine = `
            <p style="color:${textColor};font-size:15px;font-weight:700;margin:10px 0 0;border-top:1px solid ${textColor}33;padding-top:10px;">
              📅 ${cancelUntilLabel} <span style="text-transform:capitalize;">${escapeHTML(formatted)}</span>
            </p>`;
        }
      }

      cancellationHtml = `
        <div style="background-color:${bgColor};border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="color:${textColor};font-size:14px;font-weight:600;margin:0 0 4px;">${icon} ${label}</p>
          <p style="color:${textColor};font-size:13px;margin:0;">${escapeHTML(cancellationPolicy.summaryText)}</p>
          ${deadlineLine}
        </div>`;
    }

    // ✅ #2d: Display taxes HTML
    let displayTaxesHtml = '';
    if (!isCancellation && displayTaxesTotal && Number(displayTaxesTotal) > 0) {
      const taxLabel = pick({ en: "Taxes & fees payable at the hotel", fr: "Taxes et frais à régler à l'hôtel", he: "מסים ועמלות לתשלום במלון", es: "Impuestos y tasas a pagar en el hotel", ru: "Налоги и сборы оплачиваются в отеле", de: "Steuern und Gebühren zahlbar im Hotel" });
      displayTaxesHtml = `
        <div style="background-color:#fff3e0;border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="color:#e65100;font-size:14px;font-weight:600;margin:0;">⚠ ${taxLabel}: ${formatCurrency(Number(displayTaxesTotal), currency)}</p>
          <p style="color:#e65100;font-size:12px;margin:4px 0 0;">${pick({ en: "This amount is not included in the online total", fr: "Ce montant n'est pas inclus dans le total en ligne", he: "סכום זה אינו כלול במחיר המקוון", es: "Este importe no está incluido en el total online", ru: "Эта сумма не входит в стоимость, оплаченную онлайн", de: "Dieser Betrag ist nicht im Online-Gesamtpreis enthalten" })}</p>
        </div>`;
    }

    // ✅ #9: Cancellation penalty HTML
    let penaltyHtml = '';
    if (isCancellation && cancellationPenalty && Number(cancellationPenalty) > 0) {
      const penaltyLabel = pick({ en: "Cancellation fee", fr: "Frais d'annulation", he: "עמלת ביטול", es: "Gastos de cancelación", ru: "Плата за отмену", de: "Stornogebühr" });
      penaltyHtml = `
        <div style="background-color:#ffebee;border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="color:#c62828;font-size:14px;font-weight:600;margin:0;">⚠ ${penaltyLabel}: ${formatCurrency(Number(cancellationPenalty), currency)}</p>
        </div>`;
    }

    // Status badge
    const statusBadge = isCancellation
      ? `<div style="display:inline-block;background-color:#ffebee;color:#c62828;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">
           ✕ ${pick({ en: "Booking Cancelled", fr: "Réservation annulée", he: "הזמנה בוטלה", es: "Reserva cancelada", ru: "Бронирование отменено", de: "Buchung storniert" })}
         </div>`
      : `<div style="display:inline-block;background-color:#e8f5e9;color:#2e7d32;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">
           ✓ ${pick({ en: "Booking Confirmed", fr: "Réservation confirmée", he: "הזמנה אושרה", es: "Reserva confirmada", ru: "Бронирование подтверждено", de: "Buchung bestätigt" })}
         </div>`;

    const greeting = isCancellation
      ? (pick({ en: "Your booking has been cancelled.", fr: "Votre réservation a été annulée.", he: "ההזמנה שלך בוטלה.", es: "Tu reserva ha sido cancelada.", ru: "Ваше бронирование отменено.", de: "Deine Buchung wurde storniert." }))
      : (pick({ en: "Your booking has been confirmed!", fr: "Votre réservation a été confirmée !", he: "ההזמנה שלך אושרה בהצלחה!", es: "¡Tu reserva está confirmada!", ru: "Ваше бронирование подтверждено!", de: "Deine Buchung ist bestätigt!" }));

    const emailHtml = `
<!DOCTYPE html>
<html dir="${isHebrew ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#333 100%);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:300;letter-spacing:2px;">STAYMAKOM</h1>
          <p style="color:#c9a87c;margin:10px 0 0;font-size:14px;letter-spacing:1px;">${pick({ en: "MORE THAN A STAY, IT'S AN EXPERIENCE", fr: "PLUS QU'UN SÉJOUR, C'EST UNE EXPÉRIENCE", he: "יותר משהייה, זו חוויה", es: "MÁS QUE UNA ESTANCIA, UNA EXPERIENCIA", ru: "БОЛЬШЕ, ЧЕМ ПРОСТО ОТДЫХ: НАСТОЯЩЕЕ ВПЕЧАТЛЕНИЕ", de: "MEHR ALS EIN AUFENTHALT, EIN ERLEBNIS" })}</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:30px;">
            ${statusBadge}
          </div>
          <h2 style="color:#1a1a1a;margin:0 0 10px;font-size:24px;font-weight:500;text-align:center;">
            ${pick({ en: `Hello ${customerName},`, fr: `Bonjour ${customerName},`, he: `שלום ${customerName},`, es: `Hola, ${customerName}:`, ru: `Здравствуйте, ${customerName}!`, de: `Hallo ${customerName},` })}
          </h2>
          <p style="color:#666;font-size:16px;line-height:1.6;text-align:center;margin-bottom:30px;">
            ${greeting}
          </p>
          ${penaltyHtml}
          <div style="background-color:#f9f9f6;border-radius:8px;padding:25px;margin-bottom:30px;">
            <h3 style="color:#1a1a1a;margin:0 0 20px;font-size:18px;font-weight:600;border-bottom:2px solid #c9a87c;padding-bottom:10px;">
              ${pick({ en: "Booking Details", fr: "Détails de la réservation", he: "פרטי ההזמנה", es: "Detalles de la reserva", ru: "Детали бронирования", de: "Buchungsdetails" })}
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${escapeHTML(hgBookingId || '') ? `<tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${pick({ en: "Confirmation #", fr: "N° de confirmation", he: "מספר אישור", es: "N.º de confirmación", ru: "Номер подтверждения", de: "Bestätigungsnummer" })}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;font-weight:600;">${escapeHTML(hgBookingId || '')}</p>
              </td></tr>` : ''}
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${pick({ en: "Experience", fr: "Expérience", he: "חוויה", es: "Experiencia", ru: "Впечатление", de: "Erlebnis" })}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;font-weight:600;">${safeTitle}</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${pick({ en: "Hotel", fr: "Hôtel", he: "מלון", es: "Hotel", ru: "Отель", de: "Hotel" })}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${safeHotel}</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${pick({ en: "Check-in", fr: "Arrivée", he: "צ'ק-אין", es: "Llegada", ru: "Заезд", de: "Anreise" })}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${formatDate(checkIn, mailLang)}</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${pick({ en: "Check-out", fr: "Départ", he: "צ'ק-אאוט", es: "Salida", ru: "Выезд", de: "Abreise" })}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${formatDate(checkOut, mailLang)} (${nights} ${pick({ en: nights === 1 ? 'night' : 'nights', fr: 'nuits', he: 'לילות', es: nights === 1 ? 'noche' : 'noches', ru: nights % 10 === 1 && nights % 100 !== 11 ? 'ночь' : [2, 3, 4].includes(nights % 10) && ![12, 13, 14].includes(nights % 100) ? 'ночи' : 'ночей', de: nights === 1 ? 'Nacht' : 'Nächte' })})</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${pick({ en: "Guests", fr: "Voyageurs", he: "אורחים", es: "Viajeros", ru: "Гости", de: "Gäste" })}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${partySize} ${pick({ en: partySize === 1 ? 'guest' : 'guests', fr: 'voyageurs', he: 'אורחים', es: partySize === 1 ? 'viajero' : 'viajeros', ru: partySize % 10 === 1 && partySize % 100 !== 11 ? 'гость' : [2, 3, 4].includes(partySize % 10) && ![12, 13, 14].includes(partySize % 100) ? 'гостя' : 'гостей', de: partySize === 1 ? 'Gast' : 'Gäste' })}</p>
              </td></tr>
              ${safeRoom ? `<tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${pick({ en: "Room", fr: "Chambre", he: "חדר", es: "Habitación", ru: "Номер", de: "Zimmer" })}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${safeRoom}</p>
              </td></tr>` : ''}
            </table>
            ${!isCancellation ? `<div style="margin-top:20px;padding-top:20px;border-top:2px solid #1a1a1a;">
              <table width="100%"><tr>
                <td><p style="color:#1a1a1a;font-size:18px;margin:0;font-weight:600;">${pick({ en: "Total", fr: "Total", he: "סה\"כ", es: "Total", ru: "Итого", de: "Gesamt" })}</p></td>
                <td style="text-align:${isHebrew ? 'left' : 'right'};"><p style="color:#1a1a1a;font-size:24px;margin:0;font-weight:700;">${formatCurrency(totalPrice || 0, currency)}</p></td>
              </tr></table>
            </div>` : ''}
          </div>
          ${displayTaxesHtml}
          ${cancellationHtml}
          ${vatHtml}
          ${otherRemarksHtml}
          ${specialRequests && !isCancellation ? `<div style="background-color:#f0f4ff;border-radius:8px;padding:15px;margin-bottom:20px;">
            <p style="color:#666;font-size:13px;margin:0;"><strong>${pick({ en: "Special requests:", fr: "Demandes spéciales :", he: "בקשות מיוחדות:", es: "Peticiones especiales:", ru: "Особые пожелания:", de: "Besondere Wünsche:" })}</strong> ${escapeHTML(specialRequests)}</p>
          </div>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://staymakom.com/booking/confirmation/${confirmationToken || ''}${langParam}" style="display:inline-block;background-color:#c9a87c;color:#fff;text-decoration:none;padding:16px 40px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:1px;margin-bottom:12px;">
              ${pick({ en: "VIEW MY CONFIRMATION", fr: "VOIR MA CONFIRMATION", he: "צפה באישור שלי", es: "VER MI CONFIRMACIÓN", ru: "ОТКРЫТЬ ПОДТВЕРЖДЕНИЕ", de: "MEINE BESTÄTIGUNG ANSEHEN" })}
            </a>
          </td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr><td align="center">
            <a href="https://staymakom.com/account?tab=bookings${isAuto ? `&lang=${mailLang}` : ''}" style="display:inline-block;background-color:transparent;color:#c9a87c;text-decoration:none;padding:12px 40px;border-radius:4px;font-size:13px;font-weight:500;letter-spacing:1px;border:1px solid #c9a87c;">
              ${pick({ en: "VIEW MY BOOKINGS", fr: "VOIR MES RÉSERVATIONS", he: "צפה בהזמנות שלי", es: "VER MIS RESERVAS", ru: "МОИ БРОНИРОВАНИЯ", de: "MEINE BUCHUNGEN ANSEHEN" })}
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="background-color:#f9f9f6;padding:30px;text-align:center;border-top:1px solid #eee;">
          <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Staymakom. ${pick({ en: "All rights reserved.", fr: "Tous droits réservés.", he: "כל הזכויות שמורות.", es: "Todos los derechos reservados.", ru: "Все права защищены.", de: "Alle Rechte vorbehalten." })}</p>
          <p style="color:#999;font-size:12px;margin:10px 0 0;">${pick({ en: "Questions? Contact us at", fr: "Questions ? Contactez-nous à", he: "שאלות? צור/י קשר", es: "¿Tienes preguntas? Escríbenos a", ru: "Есть вопросы? Напишите нам:", de: "Fragen? Schreib uns an" })} <a href="mailto:shana@staymakom.com" style="color:#c9a87c;">shana@staymakom.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const subject = isCancellation
      ? pick({ en: `✕ Booking cancelled - ${experienceTitle || 'Experience'}`, fr: `✕ Réservation annulée - ${experienceTitle || 'Experience'}`, he: `✕ הזמנתך בוטלה - ${experienceTitle || 'Experience'}`, es: `✕ Reserva cancelada: ${experienceTitle || 'Experiencia'}`, ru: `✕ Бронирование отменено: ${experienceTitle || 'Впечатление'}`, de: `✕ Buchung storniert: ${experienceTitle || 'Erlebnis'}` })
      : pick({ en: `✓ Booking confirmed - ${experienceTitle || 'Experience'}`, fr: `✓ Réservation confirmée - ${experienceTitle || 'Experience'}`, he: `✓ הזמנתך אושרה - ${experienceTitle || 'Experience'}`, es: `✓ Reserva confirmada: ${experienceTitle || 'Experiencia'}`, ru: `✓ Бронирование подтверждено: ${experienceTitle || 'Впечатление'}`, de: `✓ Buchung bestätigt: ${experienceTitle || 'Erlebnis'}` });

    if (body.preview) {
      return new Response(
        JSON.stringify({ html: emailHtml, subject }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staymakom Reservations <reservations@staymakom.com>",
        to: [to],
        reply_to: "shana@staymakom.com",
        subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log(`${isCancellation ? 'Cancellation' : 'Booking confirmation'} sent successfully to:`, to);

    return new Response(
      JSON.stringify({ success: true, message: `${isCancellation ? 'Cancellation' : 'Booking confirmation'} sent successfully` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
