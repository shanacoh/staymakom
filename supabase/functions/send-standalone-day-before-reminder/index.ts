// send-standalone-day-before-reminder — Edge Function
// Rappel envoyé la veille d'une expérience seule, vers 10 h heure d'Israël : l'heure du créneau et
// le bloc « Infos pratiques » (point de rendez-vous, accès, contact jour J...).
//
// Qui l'appelle : la tâche planifiée de la base (pg_cron), à 7 h, 8 h et 9 h UTC chaque jour.
// Selon l'heure d'été ou d'hiver, un passage tombe à 10 h en Israël (l'envoi) et le suivant à 11 h
// (rattrapage des envois qui auraient échoué) ; le troisième ne fait rien.
// Jamais appelée depuis le navigateur d'un visiteur (secret du coffre de la base obligatoire).
//
// Qui reçoit le rappel : les réservations d'expérience (pas les bateaux) confirmées, non annulées,
// non remboursées, dont la date est demain, et qui n'ont pas déjà reçu le rappel.
// Une réservation faite la veille ou le jour même n'en reçoit pas : elle vient de recevoir la confirmation.
//
// Pas d'envoi en double : avant d'envoyer, la fonction pose la date d'envoi sur la réservation
// seulement si elle était vide. Si elle n'obtient rien, quelqu'un d'autre s'en occupe déjà.
// Cette fonction ne touche ni au paiement ni au statut des réservations : elle ne fait que lire,
// envoyer, et noter la date d'envoi.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildPracticalInfo, normalizeLang, type PracticalInfo } from '../_shared/practical-info/content.ts';
import { loadPracticalInfo, SAMPLE_DAY_CONTACT, SAMPLE_PRACTICAL_SOURCE } from '../_shared/practical-info/load.ts';
import { getAdminEmail, isAdminEmail, isInternalCron } from '../_shared/internal-auth.ts';
import { buildReminderEmail } from './template.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// 10 h : l'envoi. 11 h : rattrapage de ce qui a échoué à 10 h (les rappels déjà partis sont ignorés).
const SEND_HOURS_ISRAEL = [10, 11];

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

/** Date (yyyy-MM-dd) et heure d'un instant, vues depuis Israël. */
function inIsrael(instant: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; details?: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Staymakom <hello@staymakom.com>',
      reply_to: 'shana@staymakom.com',
      to: [to],
      subject,
      html,
    }),
  });
  if (response.ok) return { ok: true };
  const details = await response.text();
  console.error('Resend error:', details);
  return { ok: false, details };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    if (!RESEND_API_KEY) return json({ error: 'Email service not configured' }, 500);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const fromCron = await isInternalCron(req, supabase);

    // ── Aperçu : un rappel fictif, envoyé à un admin. Rien n'est lu ni écrit sur une réservation. ──
    if (body.preview === true) {
      let recipient = await getAdminEmail(req, supabase);
      if (!recipient && fromCron && typeof body.to === 'string' && await isAdminEmail(supabase, body.to)) recipient = body.to;
      if (!recipient) return json({ error: 'Action réservée aux administrateurs' }, 403);
      const lang = normalizeLang(body.lang);
      const email = buildReminderEmail({
        lang,
        guestName: 'Client Test',
        experienceTitle: 'Expérience test',
        bookingDate: nextDay(inIsrael(new Date()).date),
        timeSlot: '10:00',
        partySize: 2,
        confirmationToken: 'apercu',
        practicalInfo: buildPracticalInfo(SAMPLE_PRACTICAL_SOURCE, SAMPLE_DAY_CONTACT, lang),
      });
      const sent = await sendEmail(recipient, `[Aperçu] ${email.subject}`, email.html);
      return sent.ok ? json({ success: true, sent_to: recipient }) : json({ error: 'Email send failed', details: sent.details }, 500);
    }

    if (!fromCron) return json({ error: 'Non autorisé' }, 401);

    const now = inIsrael(new Date());
    // `dry_run` : liste qui recevrait le rappel, sans rien envoyer ni noter (vérification).
    const dryRun = body.dry_run === true;
    if (!SEND_HOURS_ISRAEL.includes(now.hour) && !dryRun) {
      return json({ success: true, skipped: `Il est ${now.hour} h en Israël, le rappel part à ${SEND_HOURS_ISRAEL[0]} h.` });
    }

    const tomorrow = nextDay(now.date);
    const { data: bookings, error } = await supabase
      .from('standalone_bookings')
      .select('id, customer_name, customer_email, booking_date, time_slot, party_size, confirmation_token, custom_experience_title, custom_address, preferred_lang, created_at, standalone_experience_id, standalone_experiences(title, title_fr, title_he, address)')
      .eq('booking_date', tomorrow)
      .eq('status', 'confirmed')
      .eq('is_cancelled', false)
      .or('product_type.is.null,product_type.neq.boat')
      .not('payment_status', 'in', '(refunded,refund_pending)')
      .is('reminder_email_sent_at', null);
    if (error) throw error;

    const results = { date: tomorrow, sent: 0, too_recent: 0, already_taken: 0, failed: 0, would_send: [] as string[] };

    for (const booking of bookings ?? []) {
      // Réservée la veille ou le jour même : la confirmation vient de partir, pas de rappel.
      if (inIsrael(new Date(booking.created_at)).date >= now.date) {
        results.too_recent++;
        continue;
      }
      if (!booking.customer_email) continue;
      if (dryRun) {
        results.would_send.push(booking.id);
        continue;
      }

      // On « prend » la réservation : la date d'envoi n'est posée que si elle était vide.
      const { data: claimed, error: claimError } = await supabase
        .from('standalone_bookings')
        .update({ reminder_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id)
        .is('reminder_email_sent_at', null)
        .select('id');
      if (claimError || !claimed || claimed.length === 0) {
        results.already_taken++;
        continue;
      }

      let sent = { ok: false } as { ok: boolean; details?: string };
      try {
        const lang = normalizeLang(booking.preferred_lang);
        const experience = booking.standalone_experiences as unknown as { title?: string; title_fr?: string; title_he?: string; address?: string } | null;
        const localizedTitle = lang === 'fr' ? experience?.title_fr : lang === 'he' ? experience?.title_he : experience?.title;
        let practicalInfo: PracticalInfo | null = null;
        try {
          practicalInfo = await loadPracticalInfo(supabase, booking.standalone_experience_id, lang);
        } catch (infoError) {
          console.error(`Infos pratiques illisibles pour ${booking.id}, rappel envoyé sans le bloc:`, infoError);
        }
        const email = buildReminderEmail({
          lang,
          guestName: booking.customer_name || '',
          experienceTitle: localizedTitle || experience?.title || booking.custom_experience_title || '',
          bookingDate: booking.booking_date,
          timeSlot: booking.time_slot || undefined,
          partySize: booking.party_size,
          confirmationToken: booking.confirmation_token,
          address: booking.custom_address || experience?.address || undefined,
          practicalInfo,
        });
        sent = await sendEmail(booking.customer_email, email.subject, email.html);
      } catch (sendError) {
        console.error(`Rappel en échec pour ${booking.id}:`, sendError);
      }

      if (sent.ok) {
        results.sent++;
      } else {
        // L'email n'est pas parti : on libère la réservation, le passage suivant réessaiera.
        await supabase.from('standalone_bookings').update({ reminder_email_sent_at: null }).eq('id', booking.id);
        results.failed++;
      }
    }

    console.log('Rappels de la veille:', JSON.stringify(results));
    return json({ success: true, ...results });
  } catch (err) {
    console.error('send-standalone-day-before-reminder error:', err);
    return json({ error: 'Erreur interne', details: (err as Error).message }, 500);
  }
});
