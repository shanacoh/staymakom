import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface BookingStatusUpdateRequest {
  bookingId: string;
  newStatus: string;
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
  return `${symbols[currency] || currency}${amount.toLocaleString()}`;
};

const formatDate = (dateStr: string, isHebrew: boolean): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(isHebrew ? 'he-IL' : 'en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const getStatusConfig = (status: string) => {
  const configs: Record<string, { 
    title: { en: string; he: string }; 
    message: { en: string; he: string }; 
    color: string; 
    bgColor: string;
    emoji: string;
  }> = {
    confirmed: {
      title: { en: 'Booking Confirmed!', he: 'ההזמנה אושרה!' },
      message: { 
        en: 'Great news! The hotel has confirmed your booking. Your experience awaits!',
        he: 'חדשות מעולות! המלון אישר את ההזמנה שלך. החוויה מחכה לך!'
      },
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      emoji: '🎉'
    },
    accepted: {
      title: { en: 'Booking Accepted!', he: 'ההזמנה אושרה!' },
      message: { 
        en: 'Great news! The hotel has accepted your booking request.',
        he: 'חדשות מעולות! המלון קיבל את בקשת ההזמנה שלך.'
      },
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      emoji: '✅'
    },
    cancelled: {
      title: { en: 'Booking Cancelled', he: 'ההזמנה בוטלה' },
      message: { 
        en: 'Your booking has been cancelled. If you have any questions, please contact us.',
        he: 'ההזמנה שלך בוטלה. אם יש לך שאלות, אנא צור/י קשר.'
      },
      color: '#c62828',
      bgColor: '#ffebee',
      emoji: '❌'
    },
    failed: {
      title: { en: 'Booking Could Not Be Processed', he: 'לא ניתן לעבד את ההזמנה' },
      message: { 
        en: 'Unfortunately, we couldn\'t process your booking. Please try again or contact us for assistance.',
        he: 'לצערנו, לא יכולנו לעבד את ההזמנה שלך. נסה/י שוב או צור/י קשר לעזרה.'
      },
      color: '#c62828',
      bgColor: '#ffebee',
      emoji: '⚠️'
    },
    paid: {
      title: { en: 'Payment Received', he: 'התשלום התקבל' },
      message: { 
        en: 'We\'ve received your payment. Your booking is being finalized.',
        he: 'קיבלנו את התשלום שלך. ההזמנה שלך בתהליך סיום.'
      },
      color: '#1565c0',
      bgColor: '#e3f2fd',
      emoji: '💳'
    },
    hold: {
      title: { en: 'Booking On Hold', he: 'ההזמנה בהמתנה' },
      message: { 
        en: 'Your booking is currently on hold. We\'ll update you soon.',
        he: 'ההזמנה שלך כרגע בהמתנה. נעדכן אותך בקרוב.'
      },
      color: '#f57c00',
      bgColor: '#fff8e1',
      emoji: '⏸️'
    },
    pending: {
      title: { en: 'Booking Pending Review', he: 'ההזמנה ממתינה לבדיקה' },
      message: { 
        en: 'Your booking is pending review by the hotel.',
        he: 'ההזמנה שלך ממתינה לבדיקה על ידי המלון.'
      },
      color: '#f57c00',
      bgColor: '#fff8e1',
      emoji: '⏳'
    }
  };

  return configs[status] || configs.pending;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-status-update function called");
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, newStatus }: BookingStatusUpdateRequest = await req.json();
    console.log("Processing status update for booking:", bookingId, "new status:", newStatus);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        experience:experiences(title, title_he, slug, hero_image),
        hotel:hotels(name, name_he, city, city_he, hero_image),
        customer:customers(first_name, last_name, user_id)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      throw new Error("Booking not found");
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      booking.customer?.user_id
    );

    if (userError || !userData?.user?.email) {
      console.error("User email not found:", userError);
      throw new Error("Customer email not found");
    }

    const customerEmail = userData.user.email;
    const customerName = `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() || 'Guest';
    
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("locale")
      .eq("user_id", booking.customer?.user_id)
      .single();
    
    const isHebrew = profile?.locale === 'he';

    const experienceTitle = isHebrew && booking.experience?.title_he 
      ? booking.experience.title_he 
      : booking.experience?.title || 'Experience';
    
    const hotelName = isHebrew && booking.hotel?.name_he 
      ? booking.hotel.name_he 
      : booking.hotel?.name || 'Hotel';

    const hotelCity = isHebrew && booking.hotel?.city_he
      ? booking.hotel.city_he
      : booking.hotel?.city || '';

    const heroImage = booking.experience?.hero_image || booking.hotel?.hero_image || '';
    const statusConfig = getStatusConfig(newStatus);

    console.log("Sending status update to:", customerEmail);

    const emailHtml = `
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
          ${heroImage ? `
          <tr>
            <td>
              <img src="${heroImage}" alt="${escapeHTML(experienceTitle)}" style="width: 100%; height: 200px; object-fit: cover;">
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background-color: ${statusConfig.bgColor}; color: ${statusConfig.color}; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 600;">
                  ${statusConfig.emoji} ${isHebrew ? statusConfig.title.he : statusConfig.title.en}
                </div>
              </div>
              <h2 style="color: #1a1a1a; margin: 0 0 10px; font-size: 22px; font-weight: 500; text-align: center;">
                ${isHebrew ? `שלום ${escapeHTML(customerName)},` : `Hello ${escapeHTML(customerName)},`}
              </h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                ${isHebrew ? statusConfig.message.he : statusConfig.message.en}
              </p>
              <div style="background-color: #f9f9f6; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #1a1a1a; margin: 0 0 20px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #c9a87c; padding-bottom: 10px;">
                  ${isHebrew ? 'פרטי ההזמנה' : 'Booking Details'}
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 11px; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 1px;">
                        ${isHebrew ? 'חוויה' : 'Experience'}
                      </p>
                      <p style="color: #1a1a1a; font-size: 15px; margin: 0; font-weight: 600;">${escapeHTML(experienceTitle)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 11px; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 1px;">
                        ${isHebrew ? 'מלון' : 'Hotel'}
                      </p>
                      <p style="color: #1a1a1a; font-size: 15px; margin: 0;">${escapeHTML(hotelName)}${hotelCity ? ` · ${escapeHTML(hotelCity)}` : ''}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 11px; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 1px;">
                        ${isHebrew ? 'תאריכים' : 'Dates'}
                      </p>
                      <p style="color: #1a1a1a; font-size: 15px; margin: 0;">
                        ${formatDate(booking.checkin, isHebrew)} → ${formatDate(booking.checkout, isHebrew)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <p style="color: #999999; font-size: 11px; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 1px;">
                        ${isHebrew ? 'סה"כ' : 'Total'}
                      </p>
                      <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 700;">
                        ${formatCurrency(booking.total_price, booking.currency || 'ILS')}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              ${newStatus === 'confirmed' || newStatus === 'accepted' ? `
              <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <p style="color: #2e7d32; font-size: 14px; margin: 0; line-height: 1.6;">
                  ${isHebrew 
                    ? '🌟 מחכים לראות אותך! אל תשכח/י להביא את אישור ההזמנה הזה.'
                    : '🌟 We can\'t wait to see you! Don\'t forget to bring this booking confirmation.'
                  }
                </p>
              </div>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://staymakom.com/account?tab=bookings" style="display: inline-block; background-color: #c9a87c; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                      ${isHebrew ? 'צפה בהזמנות שלי' : 'VIEW MY BOOKINGS'}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 30px;">
                ${isHebrew 
                  ? 'יש לך שאלות? אנחנו תמיד כאן בשבילך.'
                  : 'Have questions? We\'re always here to help.'
                }
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f6; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Staymakom. ${isHebrew ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0;">
                ${isHebrew ? 'צור/י קשר' : 'Contact us at'} 
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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staymakom Reservations <reservations@staymakom.com>",
        to: [customerEmail],
        reply_to: "shana@staymakom.com",
        subject: `${statusConfig.emoji} ${isHebrew ? statusConfig.title.he : statusConfig.title.en} - ${experienceTitle}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log("Booking status update sent successfully to:", customerEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Booking status update sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-status-update function:", error);
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
