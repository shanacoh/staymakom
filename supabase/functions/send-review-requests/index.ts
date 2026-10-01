// send-review-requests - Edge Function (à appeler une fois par jour via un cron Supabase)
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

const escapeHTML = (str: string): string =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Sujet personnalisé avec le nom de l'expérience plutôt qu'une phrase générique type
// "On aimerait votre avis" : un sujet qui ressemble à un suivi personnel plutôt qu'à
// une campagne aide à éviter le classement automatique en "Promotions" par Gmail.
function buildSubject(experienceTitle: string, lang: string, isReminder: boolean): string {
  const title = experienceTitle || (lang === 'fr' ? 'votre expérience' : lang === 'he' ? 'החוויה שלכם' : 'your experience');
  if (lang === 'fr') return isReminder ? `Votre avis sur « ${title} »` : `Comment s'est passé « ${title} » ?`;
  if (lang === 'he') return isReminder ? `מה דעתכם על ${title}?` : `איך הייתה החוויה ${title}?`;
  return isReminder ? `Your thoughts on "${title}"?` : `How was "${title}"?`;
}

// Structure de lettre classique (en-tête discret, paragraphes, lien en ligne, signature
// sur deux lignes) plutôt qu'un gabarit "campagne" (bandeau image, gros bouton coloré) :
// se rapproche d'un vrai email que Shana aurait écrit elle-même, ce qui aide Gmail à le
// classer dans "Principale" plutôt que "Promotions". Texte à la première personne.
function buildEmailHtml(params: { guestName: string; experienceTitle: string; link: string; lang: string; isReminder: boolean }): string {
  const { guestName, experienceTitle, link, lang, isReminder } = params;
  const isHebrew = lang === 'he';
  const isFrench = lang === 'fr';
  const dir = isHebrew ? 'rtl' : 'ltr';
  const arrow = isHebrew ? '←' : '→';

  const withExp = (fr: string, en: string, he: string) => (isHebrew ? he : isFrench ? fr : en);

  const greeting = guestName
    ? withExp(`Bonjour ${escapeHTML(guestName)},`, `Hi ${escapeHTML(guestName)},`, `שלום ${escapeHTML(guestName)},`)
    : withExp('Bonjour,', 'Hi,', 'שלום,');

  const expName = experienceTitle ? escapeHTML(experienceTitle) : '';

  const body1 = isReminder
    ? withExp(
        expName
          ? `Je me permets de revenir vers vous une nouvelle fois au sujet de votre expérience « ${expName} ».`
          : "Je me permets de revenir vers vous une nouvelle fois au sujet de votre expérience avec nous.",
        expName
          ? `I wanted to reach out again about your experience with "${expName}".`
          : "I wanted to reach out again about your recent experience with us.",
        expName
          ? `אני פונה אליכם שוב בעניין החוויה "${expName}".`
          : 'אני פונה אליכם שוב בעניין החוויה שלכם איתנו.'
      )
    : withExp(
        expName
          ? `Je voulais simplement revenir vers vous après votre expérience « ${expName} ».`
          : "Je voulais simplement revenir vers vous après votre expérience avec nous.",
        expName
          ? `I wanted to follow up after your experience with "${expName}".`
          : "I wanted to follow up after your recent experience with us.",
        expName
          ? `רציתי פשוט לחזור אליכם לאחר החוויה "${expName}".`
          : 'רציתי פשוט לחזור אליכם לאחר החוויה שלכם איתנו.'
      );

  const body2 = withExp(
    "Chez STAYMAKOM, nous construisons notre sélection autour d'expériences que nous avons réellement envie de partager, et vos retours nous permettent de continuer à les faire évoluer.",
    "At STAYMAKOM, we build our selection around experiences we genuinely want to share, and your feedback helps us keep improving it.",
    "ב-STAYMAKOM אנחנו בונים את המבחר שלנו סביב חוויות שאנחנו באמת רוצים לשתף, והמשוב שלכם עוזר לנו להמשיך ולפתח אותו."
  );

  const body3 = isReminder
    ? withExp(
        "Je n'ai pas encore eu de retour de votre part, et j'aimerais beaucoup savoir comment vous l'avez vécue : ce qui vous a plu, ou ce qui pourrait être amélioré pour les prochains voyageurs.",
        "I haven't heard back from you yet, and I'd really like to know how it went for you: what you enjoyed, or what could be improved for future travelers.",
        "עדיין לא קיבלתי מכם תגובה, ואשמח מאוד לדעת איך זה היה עבורכם: מה אהבתם, או מה אפשר לשפר עבור הנוסעים הבאים."
      )
    : withExp(
        "J'aimerais beaucoup savoir comment vous avez vécu cette expérience : ce que vous avez aimé, ce qui vous a marqué, ou encore ce qui pourrait être amélioré.",
        "I would love to know how you experienced it: what you enjoyed, what stood out to you, or what could be improved.",
        "אשמח מאוד לדעת איך חוויתם את זה: מה אהבתם, מה נשאר אצלכם, או מה אפשר לשפר."
      );

  const body4 = withExp(
    "Si vous avez deux minutes, vous pouvez nous laisser votre retour ici :",
    "If you have a couple of minutes, you can share your thoughts here:",
    "אם יש לכם שתי דקות, תוכלו לשתף אותנו כאן:"
  );

  const linkText = withExp(`Je vous écoute ici ${arrow}`, `I'm listening, right here ${arrow}`, `אני כאן, מקשיבה ${arrow}`);

  const closing = isReminder
    ? withExp("Merci encore pour votre confiance,", "Thank you again for your trust,", "תודה רבה על האמון,")
    : withExp(
        "Merci encore pour votre confiance, et au plaisir de vous retrouver bientôt sur STAYMAKOM.",
        "Thank you again for your trust, and I hope to welcome you back to STAYMAKOM soon.",
        "תודה רבה על האמון, ונשמח לארח אתכם שוב ב-STAYMAKOM בקרוב."
      );

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>STAYMAKOM</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:36px 20px;">
        <table width="520" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:20px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#999999;">STAYMAKOM</p>
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;color:#222222;line-height:1.7;">
              <p style="margin:0 0 18px;">${greeting}</p>
              <p style="margin:0 0 18px;">${body1}</p>
              <p style="margin:0 0 18px;">${body2}</p>
              <p style="margin:0 0 18px;">${body3}</p>
              <p style="margin:0 0 10px;">${body4}</p>
              <p style="margin:0 0 24px;"><a href="${link}" style="color:#ad1414;font-weight:600;">${linkText}</a></p>
              <p style="margin:0 0 20px;">${closing}</p>
              <p style="margin:0;">Shana<br/>STAYMAKOM</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
    body: JSON.stringify({ from: 'Shana (STAYMAKOM) <hello@staymakom.com>', reply_to: 'shana@staymakom.com', to: [to], subject, html }),
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
      const ok = await sendEmail(c.email, buildSubject(c.title, c.lang, false), html);
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
      const ok = await sendEmail(email, buildSubject(title, r.lang || 'en', true), html);
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
