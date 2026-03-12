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

const formatDate = (dateStr: string, isHebrew: boolean): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(isHebrew ? 'he-IL' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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

    const isHebrew = lang === 'he';
    const isFrench = lang === 'fr';
    const customerName = escapeHTML(guestName || 'Guest');
    const safeTitle = escapeHTML(experienceTitle || 'Experience');
    const safeHotel = escapeHTML(hotelName || 'Hotel');
    const safeRoom = escapeHTML(roomName || '');
    const safeRef = escapeHTML(bookingRef || hgBookingId || '');

    // Build remarks HTML
    const genericFilter = /general message that should be shown/i;
    const filteredRemarks = Array.isArray(remarks)
      ? remarks.filter((r: string) => r && !genericFilter.test(r))
      : [];
    const remarksHtml = filteredRemarks.length > 0
      ? `<div style="background-color:#fff8e1;border-radius:8px;padding:20px;margin-bottom:20px;">
           ${filteredRemarks.map((r: string) => `<p style="color:#666;font-size:14px;line-height:1.6;margin:4px 0;">• ${escapeHTML(r)}</p>`).join('')}
         </div>`
      : '';

    // Build cancellation policy HTML
    let cancellationHtml = '';
    if (!isCancellation && cancellationPolicy?.summaryText) {
      const bgColor = cancellationPolicy.isNonRefundable ? '#ffebee' : '#e8f5e9';
      const textColor = cancellationPolicy.isNonRefundable ? '#c62828' : '#2e7d32';
      const icon = cancellationPolicy.isNonRefundable ? '⚠️' : '✓';
      const label = isHebrew ? 'מדיניות ביטול' : isFrench ? "Politique d'annulation" : 'Cancellation Policy';
      cancellationHtml = `
        <div style="background-color:${bgColor};border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="color:${textColor};font-size:14px;font-weight:600;margin:0 0 4px;">${icon} ${label}</p>
          <p style="color:${textColor};font-size:13px;margin:0;">${escapeHTML(cancellationPolicy.summaryText)}</p>
        </div>`;
    }

    // ✅ #2d: Display taxes HTML
    let displayTaxesHtml = '';
    if (!isCancellation && displayTaxesTotal && Number(displayTaxesTotal) > 0) {
      const taxLabel = isHebrew ? 'מסים ועמלות לתשלום במלון' : isFrench ? "Taxes et frais à régler à l'hôtel" : 'Taxes & fees payable at the hotel';
      displayTaxesHtml = `
        <div style="background-color:#fff3e0;border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="color:#e65100;font-size:14px;font-weight:600;margin:0;">⚠ ${taxLabel}: ${formatCurrency(Number(displayTaxesTotal), currency)}</p>
          <p style="color:#e65100;font-size:12px;margin:4px 0 0;">${isHebrew ? 'סכום זה אינו כלול במחיר המקוון' : isFrench ? 'Ce montant n\'est pas inclus dans le total en ligne' : 'This amount is not included in the online total'}</p>
        </div>`;
    }

    // ✅ #9: Cancellation penalty HTML
    let penaltyHtml = '';
    if (isCancellation && cancellationPenalty && Number(cancellationPenalty) > 0) {
      const penaltyLabel = isHebrew ? 'עמלת ביטול' : isFrench ? "Frais d'annulation" : 'Cancellation fee';
      penaltyHtml = `
        <div style="background-color:#ffebee;border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="color:#c62828;font-size:14px;font-weight:600;margin:0;">⚠ ${penaltyLabel}: ${formatCurrency(Number(cancellationPenalty), currency)}</p>
        </div>`;
    }

    // Status badge
    const statusBadge = isCancellation
      ? `<div style="display:inline-block;background-color:#ffebee;color:#c62828;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">
           ✕ ${isHebrew ? 'הזמנה בוטלה' : isFrench ? 'Réservation annulée' : 'Booking Cancelled'}
         </div>`
      : `<div style="display:inline-block;background-color:#e8f5e9;color:#2e7d32;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">
           ✓ ${isHebrew ? 'הזמנה אושרה' : isFrench ? 'Réservation confirmée' : 'Booking Confirmed'}
         </div>`;

    const greeting = isCancellation
      ? (isHebrew ? 'ההזמנה שלך בוטלה.' : isFrench ? 'Votre réservation a été annulée.' : 'Your booking has been cancelled.')
      : (isHebrew ? 'ההזמנה שלך אושרה בהצלחה!' : isFrench ? 'Votre réservation a été confirmée !' : 'Your booking has been confirmed!');

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
          <p style="color:#c9a87c;margin:10px 0 0;font-size:14px;letter-spacing:1px;">${isHebrew ? 'יותר משהייה, זו חוויה' : isFrench ? "PLUS QU'UN SÉJOUR, C'EST UNE EXPÉRIENCE" : "MORE THAN A STAY, IT'S AN EXPERIENCE"}</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:30px;">
            ${statusBadge}
          </div>
          <h2 style="color:#1a1a1a;margin:0 0 10px;font-size:24px;font-weight:500;text-align:center;">
            ${isHebrew ? `שלום ${customerName},` : isFrench ? `Bonjour ${customerName},` : `Hello ${customerName},`}
          </h2>
          <p style="color:#666;font-size:16px;line-height:1.6;text-align:center;margin-bottom:30px;">
            ${greeting}
          </p>
          ${penaltyHtml}
          <div style="background-color:#f9f9f6;border-radius:8px;padding:25px;margin-bottom:30px;">
            <h3 style="color:#1a1a1a;margin:0 0 20px;font-size:18px;font-weight:600;border-bottom:2px solid #c9a87c;padding-bottom:10px;">
              ${isHebrew ? 'פרטי ההזמנה' : isFrench ? 'Détails de la réservation' : 'Booking Details'}
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${isHebrew ? 'מספר הזמנה' : isFrench ? 'Référence' : 'Reference'}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;font-weight:600;">${safeRef}</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${isHebrew ? 'חוויה' : isFrench ? 'Expérience' : 'Experience'}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;font-weight:600;">${safeTitle}</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${isHebrew ? 'מלון' : isFrench ? 'Hôtel' : 'Hotel'}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${safeHotel}</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${isHebrew ? "צ'ק-אין" : isFrench ? 'Arrivée' : 'Check-in'}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${formatDate(checkIn, isHebrew)}</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${isHebrew ? "צ'ק-אאוט" : isFrench ? 'Départ' : 'Check-out'}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${formatDate(checkOut, isHebrew)} (${nights} ${isHebrew ? 'לילות' : isFrench ? 'nuits' : nights === 1 ? 'night' : 'nights'})</p>
              </td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${isHebrew ? 'אורחים' : isFrench ? 'Voyageurs' : 'Guests'}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${partySize} ${isHebrew ? 'אורחים' : isFrench ? 'voyageurs' : partySize === 1 ? 'guest' : 'guests'}</p>
              </td></tr>
              ${safeRoom ? `<tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;">${isHebrew ? 'חדר' : isFrench ? 'Chambre' : 'Room'}</p>
                <p style="color:#1a1a1a;font-size:16px;margin:0;">${safeRoom}</p>
              </td></tr>` : ''}
            </table>
            ${!isCancellation ? `<div style="margin-top:20px;padding-top:20px;border-top:2px solid #1a1a1a;">
              <table width="100%"><tr>
                <td><p style="color:#1a1a1a;font-size:18px;margin:0;font-weight:600;">${isHebrew ? 'סה"כ' : 'Total'}</p></td>
                <td style="text-align:${isHebrew ? 'left' : 'right'};"><p style="color:#1a1a1a;font-size:24px;margin:0;font-weight:700;">${formatCurrency(totalPrice || 0, currency)}</p></td>
              </tr></table>
            </div>` : ''}
          </div>
          ${displayTaxesHtml}
          ${cancellationHtml}
          ${remarksHtml}
          ${specialRequests && !isCancellation ? `<div style="background-color:#f0f4ff;border-radius:8px;padding:15px;margin-bottom:20px;">
            <p style="color:#666;font-size:13px;margin:0;"><strong>${isHebrew ? 'בקשות מיוחדות:' : isFrench ? 'Demandes spéciales :' : 'Special requests:'}</strong> ${escapeHTML(specialRequests)}</p>
          </div>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://staymakom.com/booking/confirmation/${confirmationToken || ''}" style="display:inline-block;background-color:#c9a87c;color:#fff;text-decoration:none;padding:16px 40px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:1px;margin-bottom:12px;">
              ${isHebrew ? 'צפה באישור שלי' : isFrench ? 'VOIR MA CONFIRMATION' : 'VIEW MY CONFIRMATION'}
            </a>
          </td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr><td align="center">
            <a href="https://staymakom.com/account?tab=bookings" style="display:inline-block;background-color:transparent;color:#c9a87c;text-decoration:none;padding:12px 40px;border-radius:4px;font-size:13px;font-weight:500;letter-spacing:1px;border:1px solid #c9a87c;">
              ${isHebrew ? 'צפה בהזמנות שלי' : isFrench ? 'VOIR MES RÉSERVATIONS' : 'VIEW MY BOOKINGS'}
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="background-color:#f9f9f6;padding:30px;text-align:center;border-top:1px solid #eee;">
          <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Staymakom. ${isHebrew ? 'כל הזכויות שמורות.' : isFrench ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
          <p style="color:#999;font-size:12px;margin:10px 0 0;">${isHebrew ? 'שאלות? צור/י קשר' : isFrench ? 'Questions ? Contactez-nous à' : 'Questions? Contact us at'} <a href="mailto:shana@staymakom.com" style="color:#c9a87c;">shana@staymakom.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const subject = isCancellation
      ? (isHebrew ? `✕ הזמנתך בוטלה - ${experienceTitle || 'Experience'}` : isFrench ? `✕ Réservation annulée - ${experienceTitle || 'Experience'}` : `✕ Booking cancelled - ${experienceTitle || 'Experience'}`)
      : (isHebrew ? `✓ הזמנתך אושרה - ${experienceTitle || 'Experience'}` : isFrench ? `✓ Réservation confirmée - ${experienceTitle || 'Experience'}` : `✓ Booking confirmed - ${experienceTitle || 'Experience'}`);

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
