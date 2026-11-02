// Alerte interne « Billet manquant pour demain » : envoyée à Shana (pas au client) la veille à 10 h,
// pour chaque réservation de demain dont la fiche demande un billet d'entrée du prestataire et qui
// n'a encore aucun billet (ni fichier déposé, ni email « Vos billets » envoyé).
// Email interne : présentation volontairement simple, hors gabarit client.
// Une seule alerte par réservation : la date d'alerte est posée seulement si elle était vide.

// deno-lint-ignore no-explicit-any
type ServiceClient = any;
type SendEmail = (to: string, subject: string, html: string) => Promise<{ ok: boolean; details?: string }>;

const ALERT_RECIPIENT = 'shana@staymakom.com';

const escapeHTML = (str: string): string =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function alertMissingTickets(
  supabase: ServiceClient,
  tomorrow: string,
  sendEmail: SendEmail,
  dryRun: boolean,
): Promise<{ alerted: number; would_alert: string[]; failed: number }> {
  const results = { alerted: 0, would_alert: [] as string[], failed: 0 };

  const { data: bookings, error } = await supabase
    .from('standalone_bookings')
    .select('id, customer_name, booking_date, time_slot, party_size, custom_experience_title, tickets_sent_at, standalone_experiences!inner(title, requires_entry_ticket), booking_tickets(id)')
    .eq('booking_date', tomorrow)
    .eq('status', 'confirmed')
    .eq('is_cancelled', false)
    .eq('standalone_experiences.requires_entry_ticket', true)
    .not('payment_status', 'in', '(refunded,refund_pending)')
    .is('tickets_sent_at', null)
    .is('ticket_missing_alert_sent_at', null);
  if (error) throw error;

  for (const booking of bookings ?? []) {
    if ((booking.booking_tickets ?? []).length > 0) continue;
    if (dryRun) {
      results.would_alert.push(booking.id);
      continue;
    }

    const alertedAt = new Date().toISOString();
    const { data: claimed } = await supabase
      .from('standalone_bookings')
      .update({ ticket_missing_alert_sent_at: alertedAt })
      .eq('id', booking.id)
      .is('ticket_missing_alert_sent_at', null)
      .select('id');
    if (!claimed || claimed.length === 0) continue;

    const title = booking.standalone_experiences?.title || booking.custom_experience_title || 'Expérience';
    const reference = `SM-${booking.id.slice(0, 8).toUpperCase()}`;
    const adminUrl = `https://staymakom.com/admin/standalone-bookings/${booking.id}`;
    const subject = `Billet manquant pour demain : ${reference} · ${title}`;
    const html = `
<div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
  <p style="margin:0 0 12px;font-weight:700;color:#ad1414;">Billet manquant pour demain</p>
  <p style="margin:0 0 12px;">La fiche demande un billet d'entrée du prestataire, et aucun billet n'a été déposé ni envoyé au client.</p>
  <p style="margin:0;">Réservation : <strong>${escapeHTML(reference)}</strong></p>
  <p style="margin:0;">Expérience : ${escapeHTML(title)}</p>
  <p style="margin:0;">Client : ${escapeHTML(booking.customer_name || '')}</p>
  <p style="margin:0;">Date : ${escapeHTML(booking.booking_date)}${booking.time_slot ? ` · ${escapeHTML(booking.time_slot)}` : ''} · ${booking.party_size} pers.</p>
  <p style="margin:16px 0 0;"><a href="${adminUrl}" style="color:#ad1414;font-weight:600;">Ouvrir la réservation dans le back-office</a></p>
</div>`;

    const sent = await sendEmail(ALERT_RECIPIENT, subject, html);
    if (sent.ok) {
      results.alerted++;
    } else {
      await supabase.from('standalone_bookings').update({ ticket_missing_alert_sent_at: null }).eq('id', booking.id).eq('ticket_missing_alert_sent_at', alertedAt);
      results.failed++;
    }
  }
  return results;
}
