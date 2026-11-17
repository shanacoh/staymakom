// reconcile-standalone-bookings — Edge Function
// Filet de sécurité, lancé toutes les 10 minutes par la tâche planifiée de la base.
// Deux vérifications :
//
// 1. Réservations "expérience seule" restées 'pending' : couvre le cas où la confirmation
//    immédiate côté client (confirm-standalone-payment) ET le webhook Revolut
//    (revolut-webhook) ont tous les deux échoué à mettre à jour le statut. Pour chacune,
//    revérifie l'état réel de la commande auprès de Revolut :
//      - payé/autorisé côté Revolut  → réservation confirmée
//      - échoué/annulé côté Revolut  → réservation marquée annulée (paiement jamais abouti)
//      - pas encore payé             → laissée telle quelle : le client n'a pas (encore) payé,
//        ce n'est pas une panne. Revolut finit par expirer la commande, qui passe alors en échec.
//
// 2. Paiements du site restés sans réservation (registre revolut_unmatched_payments, rempli
//    par revolut-webhook) : si la réservation n'est toujours pas apparue 10 minutes après le
//    paiement, c'est que le site n'est pas allé au bout → alerte à Shana.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAdminEmail, isInternalCron } from '../_shared/internal-auth.ts';
import { fetchRevolutOrder } from '../_shared/revolut-order.ts';

const RECONCILE_AFTER_MINUTES = 30;
const UNMATCHED_GRACE_MINUTES = 10;
const FAILED_STATES = ['CANCELLED', 'FAILED'];

const currencySymbol: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function formatAmount(amount: number | string | null, currency: string | null): string {
  if (amount === null || amount === undefined) return 'montant inconnu';
  return `${currencySymbol[currency || ''] || `${currency || ''} `}${amount}`;
}

/** Envoie un email à Shana. Renvoie vrai seulement si l'envoi a été accepté. */
async function sendAdminAlertEmail(subject: string, html: string): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'StayMakom <reservations@staymakom.com>',
        to: ['shana@staymakom.com'],
        subject,
        html,
      }),
    });
    if (!response.ok) console.error('Admin alert email rejected:', response.status, await response.text());
    return response.ok;
  } catch (err) {
    console.error('Admin alert email failed to send:', err);
    return false;
  }
}

async function sendNewBookingAdminEmail(booking: Record<string, unknown>): Promise<void> {
  const exp = booking.standalone_experiences as { title: string } | null;
  const title = exp?.title || 'Expérience';
  const dateFormatted = new Date(booking.booking_date as string).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const priceDisplay = formatAmount(booking.sell_price as string, booking.currency as string);
  const timeDisplay = booking.time_slot ? ` à ${booking.time_slot}` : '';
  const backofficeUrl = `https://staymakom.com/admin/standalone-bookings`;

  await sendAdminAlertEmail(
    `🎉 Nouvelle réservation (rattrapée par le filet de sécurité) : ${title}`,
    `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eee;">
        <h2 style="color:#1A1814;margin:0 0 8px;">🎉 Nouvelle réservation standalone</h2>
        <p style="color:#555;margin:0 0 16px;">Le client a bien payé, mais le site n'avait pas enregistré la confirmation. Le filet de sécurité l'a vérifiée auprès de Revolut et confirmée. Rien d'autre à faire.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Expérience</td><td style="padding:8px 0;font-weight:600;">${title}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Client</td><td style="padding:8px 0;">${booking.customer_name}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;">${booking.customer_email}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Date</td><td style="padding:8px 0;">${dateFormatted}${timeDisplay}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Participants</td><td style="padding:8px 0;">${booking.party_size} personne${(booking.party_size as number) > 1 ? 's' : ''}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Montant</td><td style="padding:8px 0;font-weight:700;color:#1A7A74;">${priceDisplay}</td></tr>
        </table>
        <a href="${backofficeUrl}" style="display:inline-block;margin-top:20px;background:#1A1814;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;">Voir dans le back office</a>
      </div>
    `,
  );
}

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

/** 1. Réservations "expérience seule" restées en attente. */
async function reconcilePendingBookings(supabase: ServiceClient) {
  const cutoff = new Date(Date.now() - RECONCILE_AFTER_MINUTES * 60_000).toISOString();

  const { data: pendingBookings, error } = await supabase
    .from('standalone_bookings')
    .select('id, customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, revolut_order_id, created_at, standalone_experiences(title)')
    .eq('status', 'pending')
    .not('revolut_order_id', 'is', null)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;

  let confirmed = 0;
  let cancelled = 0;

  for (const booking of pendingBookings || []) {
    try {
      const { state } = await fetchRevolutOrder(booking.revolut_order_id as string);

      if (state === 'COMPLETED' || state === 'AUTHORISED') {
        const { data: updatedRows, error: updErr } = await supabase
          .from('standalone_bookings')
          .update({ status: 'confirmed', payment_status: 'paid' })
          .eq('id', booking.id)
          .eq('status', 'pending')
          .select('id');
        if (updErr) {
          console.error(`reconcile: échec confirmation réservation ${booking.id}:`, updErr);
        } else if (updatedRows && updatedRows.length > 0) {
          // Email admin seulement si c'est bien ce passage qui a confirmé la réservation
          // (évite un doublon si le webhook ou la confirmation immédiate l'avait déjà fait).
          confirmed++;
          await sendNewBookingAdminEmail(booking as Record<string, unknown>);
        }
      } else if (FAILED_STATES.includes(state)) {
        const { error: updErr } = await supabase
          .from('standalone_bookings')
          .update({
            status: 'cancelled',
            payment_status: 'failed',
            is_cancelled: true,
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', booking.id)
          .eq('status', 'pending');
        if (updErr) {
          console.error(`reconcile: échec annulation réservation ${booking.id}:`, updErr);
        } else {
          cancelled++;
        }
      }
      // Autres états (PENDING, PROCESSING) : le client n'a pas fini de payer, on repassera.
    } catch (err) {
      console.error(`reconcile: échec vérification Revolut pour la commande ${booking.revolut_order_id}:`, err);
    }
  }

  return { checked: (pendingBookings || []).length, confirmed, cancelled };
}

/** Vrai si une réservation (hôtel, expérience seule ou paiement acompte/solde) porte cette commande. */
async function bookingExistsForOrder(supabase: ServiceClient, orderId: string): Promise<boolean> {
  for (const table of ['bookings_hg', 'standalone_bookings', 'standalone_booking_payments']) {
    const { data, error } = await supabase.from(table).select('id').eq('revolut_order_id', orderId).limit(1);
    if (error) throw error;
    if (data && data.length > 0) return true;
  }
  return false;
}

/** 2. Paiements du site toujours sans réservation après le délai de grâce. */
async function checkUnmatchedSitePayments(supabase: ServiceClient) {
  const cutoff = new Date(Date.now() - UNMATCHED_GRACE_MINUTES * 60_000).toISOString();

  const { data: rows, error } = await supabase
    .from('revolut_unmatched_payments')
    .select('order_id, amount, currency, description, customer_name, customer_email, received_at')
    .eq('status', 'a_verifier')
    .eq('origin', 'site')
    .lt('received_at', cutoff)
    .limit(50);

  if (error) throw error;

  let attached = 0;
  let alerted = 0;

  for (const row of rows || []) {
    try {
      const now = new Date().toISOString();

      if (await bookingExistsForOrder(supabase, row.order_id)) {
        await supabase
          .from('revolut_unmatched_payments')
          .update({ status: 'rattache', checked_at: now })
          .eq('order_id', row.order_id)
          .eq('status', 'a_verifier');
        attached++;
        continue;
      }

      const paidAt = new Date(row.received_at).toLocaleString('fr-FR', { timeZone: 'Asia/Jerusalem', dateStyle: 'full', timeStyle: 'short' });
      const sent = await sendAdminAlertEmail(
        `🚨 Réservation pas allée au bout : client débité de ${formatAmount(row.amount, row.currency)}`,
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eee;">
          <h2 style="color:#ad1414;margin:0 0 8px;">🚨 Le site n'est pas allé au bout d'une réservation</h2>
          <p style="color:#555;margin:0 0 16px;">Un client a payé sur le site, mais aucune réservation n'a été enregistrée, même 10 minutes après. Le client attend sans doute une confirmation.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Montant</td><td style="padding:8px 0;font-weight:700;">${formatAmount(row.amount, row.currency)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Achat</td><td style="padding:8px 0;">${escapeHtml(row.description || 'non indiqué')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Client</td><td style="padding:8px 0;">${escapeHtml(row.customer_name || 'non indiqué')} (${escapeHtml(row.customer_email || 'email non indiqué')})</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Payé le</td><td style="padding:8px 0;">${paidAt} (heure d'Israël)</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Commande Revolut</td><td style="padding:8px 0;font-size:12px;">${row.order_id}</td></tr>
          </table>
          <p style="color:#555;margin:16px 0 0;"><b>À faire :</b> regarder dans Revolut Business si un remboursement automatique apparaît (le site rembourse tout seul quand l'hôtel refuse au dernier moment). Sinon, contacter le client et saisir la réservation à la main, ou le rembourser.</p>
        </div>`,
      );

      // On ne marque la ligne qu'une fois l'email réellement parti : sinon on retentera au prochain passage.
      if (sent) {
        await supabase
          .from('revolut_unmatched_payments')
          .update({ status: 'alerte_envoyee', checked_at: now })
          .eq('order_id', row.order_id)
          .eq('status', 'a_verifier');
        alerted++;
      }
    } catch (err) {
      console.error(`reconcile: échec vérification du paiement sans réservation ${row.order_id}:`, err);
    }
  }

  return { checked: (rows || []).length, attached, alerted };
}

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Seule la tâche planifiée de la base (ou un admin connecté) peut lancer le filet.
  if (!(await isInternalCron(req, supabase)) && !(await getAdminEmail(req, supabase))) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const pending = await reconcilePendingBookings(supabase);
    const unmatched = await checkUnmatchedSitePayments(supabase);

    return new Response(JSON.stringify({ success: true, pending, unmatched }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('reconcile-standalone-bookings unexpected error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
