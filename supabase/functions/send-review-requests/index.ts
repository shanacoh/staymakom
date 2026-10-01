// send-review-requests — Edge Function (à appeler une fois par jour via un cron Supabase)
// Demande d'avis automatique, identique pour toute expérience (hôtel, standalone, bateau) :
// - J+1 après la date de l'expérience : email avec le lien /avis/:token.
// - J+5 sans avis déposé : email de relance.
// Le lien WhatsApp 1-clic du back-office réutilise le même token (créé directement par
// l'admin dans review_requests), pas un deuxième système.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

const SUBJECT: Record<string, string> = {
  fr: "Votre avis compte pour nous",
  en: "We'd love your feedback",
  he: "נשמח לשמוע את דעתך",
};

const REMINDER_SUBJECT: Record<string, string> = {
  fr: "Un petit mot sur votre expérience ?",
  en: "Got a minute for a quick review?",
  he: "דקה אחת לחוות דעה?",
};

function buildEmailHtml(params: { guestName: string; experienceTitle: string; link: string; lang: string; isReminder: boolean }): string {
  const { guestName, experienceTitle, link, lang, isReminder } = params;
  const texts: Record<string, { intro: string; cta: string }> = {
    fr: {
      intro: isReminder
        ? `On espère que vous avez passé un bon moment avec "${experienceTitle}". On n'a pas encore reçu votre avis : ça prend une minute et ça nous aide beaucoup.`
        : `Merci d'avoir réservé "${experienceTitle}" avec STAYMAKOM. On espère que vous avez passé un excellent moment. Pourriez-vous nous laisser un avis ?`,
      cta: "Laisser mon avis",
    },
    en: {
      intro: isReminder
        ? `We hope you enjoyed "${experienceTitle}". We haven't received your review yet — it only takes a minute and really helps us.`
        : `Thank you for booking "${experienceTitle}" with STAYMAKOM. We hope you had a great time. Could you share your feedback with us?`,
      cta: "Leave my review",
    },
    he: {
      intro: isReminder
        ? `אנחנו מקווים שנהניתם מ-"${experienceTitle}". עדיין לא קיבלנו את הביקורת שלכם, זה לוקח דקה ועוזר לנו מאוד.`
        : `תודה שהזמנתם את "${experienceTitle}" עם STAYMAKOM. אנחנו מקווים שנהניתם. נשמח לשמוע מה דעתכם.`,
      cta: "השאירו ביקורת",
    },
  };
  const t = texts[lang] || texts.en;
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return `<!DOCTYPE html>
<html dir="${dir}">
<body style="margin:0;padding:0;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 40px 16px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">${guestName ? `${guestName},` : ''}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#1a1a1a;line-height:1.6;">${t.intro}</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="display:inline-block;background:#ad1414;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:14px;">${t.cta}</a>
          </div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#1a1a1a;">STAYMAKOM</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'STAYMAKOM <hello@staymakom.com>', reply_to: 'shana@staymakom.com', to: [to], subject, html }),
  });
  if (!res.ok) console.error('Resend error:', await res.text());
  return res.ok;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const yesterday = toDateStr(daysAgo(1));
  let sentCount = 0;
  let remindedCount = 0;

  try {
    // ── J+1 : nouvelles demandes, toutes expériences confondues ─────────────
    const { data: standaloneBookings } = await supabase
      .from('standalone_bookings')
      .select('id, customer_name, customer_email, preferred_lang, booking_date, is_cancelled, status, standalone_experiences(title, title_fr, title_he)')
      .eq('booking_date', yesterday)
      .eq('is_cancelled', false)
      .neq('status', 'cancelled');

    const { data: hotelBookings } = await supabase
      .from('bookings_hg')
      .select('id, customer_name, customer_email, preferred_lang, checkout, is_cancelled, status, experience_id')
      .eq('checkout', yesterday)
      .eq('is_cancelled', false)
      .neq('status', 'cancelled');

    const candidates: Array<{ bookingType: 'standalone_bookings' | 'bookings_hg'; bookingId: string; email: string | null; name: string; lang: string; title: string }> = [];

    for (const b of standaloneBookings || []) {
      const exp = b.standalone_experiences as any;
      const title = (b.preferred_lang === 'fr' ? exp?.title_fr : b.preferred_lang === 'he' ? exp?.title_he : exp?.title) || exp?.title || '';
      candidates.push({ bookingType: 'standalone_bookings', bookingId: b.id, email: b.customer_email, name: b.customer_name, lang: b.preferred_lang || 'en', title });
    }
    for (const b of hotelBookings || []) {
      candidates.push({ bookingType: 'bookings_hg', bookingId: b.id, email: b.customer_email, name: b.customer_name || '', lang: b.preferred_lang || 'en', title: '' });
    }

    for (const c of candidates) {
      if (!c.email) continue;
      const { data: existing } = await supabase
        .from('review_requests')
        .select('id')
        .eq('booking_type', c.bookingType)
        .eq('booking_id', c.bookingId)
        .maybeSingle();
      if (existing) continue;

      const { data: created, error: createError } = await supabase
        .from('review_requests')
        .insert({ booking_type: c.bookingType, booking_id: c.bookingId, channel: 'email', lang: c.lang, status: 'sent_j1' })
        .select('token')
        .single();
      if (createError || !created) continue;

      const link = `https://staymakom.com/avis/${created.token}`;
      const html = buildEmailHtml({ guestName: c.name, experienceTitle: c.title, link, lang: c.lang, isReminder: false });
      const ok = await sendEmail(c.email, SUBJECT[c.lang] || SUBJECT.en, html);
      if (ok) sentCount += 1;
    }

    // ── J+5 : relance si pas encore déposé ──────────────────────────────────
    const fiveDaysAgo = daysAgo(5).toISOString();
    const { data: toRemind } = await supabase
      .from('review_requests')
      .select('id, token, booking_type, booking_id, lang, channel')
      .eq('status', 'sent_j1')
      .eq('channel', 'email')
      .lte('sent_at', fiveDaysAgo);

    for (const r of toRemind || []) {
      let email: string | null = null;
      let name = '';
      let title = '';
      if (r.booking_type === 'standalone_bookings') {
        const { data: b } = await supabase
          .from('standalone_bookings')
          .select('customer_name, customer_email, standalone_experiences(title, title_fr, title_he)')
          .eq('id', r.booking_id)
          .maybeSingle();
        if (b) {
          email = b.customer_email;
          name = b.customer_name;
          const exp = b.standalone_experiences as any;
          title = (r.lang === 'fr' ? exp?.title_fr : r.lang === 'he' ? exp?.title_he : exp?.title) || exp?.title || '';
        }
      } else {
        const { data: b } = await supabase
          .from('bookings_hg')
          .select('customer_name, customer_email')
          .eq('id', r.booking_id)
          .maybeSingle();
        if (b) { email = b.customer_email; name = b.customer_name || ''; }
      }
      if (!email) continue;

      const link = `https://staymakom.com/avis/${r.token}`;
      const html = buildEmailHtml({ guestName: name, experienceTitle: title, link, lang: r.lang || 'en', isReminder: true });
      const ok = await sendEmail(email, REMINDER_SUBJECT[r.lang || 'en'] || REMINDER_SUBJECT.en, html);
      if (ok) {
        await supabase.from('review_requests').update({ status: 'reminded_j5', reminded_at: new Date().toISOString() }).eq('id', r.id);
        remindedCount += 1;
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, reminded: remindedCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-review-requests error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
