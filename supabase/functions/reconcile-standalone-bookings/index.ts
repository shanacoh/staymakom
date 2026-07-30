// reconcile-standalone-bookings — Edge Function
// Filet de sécurité final pour les réservations "expérience seule" restées en
// statut 'pending' : couvre le cas où la confirmation immédiate côté client
// (confirm-standalone-payment) ET le webhook Revolut (revolut-webhook) ont
// tous les deux échoué à mettre à jour le statut.
//
// Destinée à être appelée périodiquement (Cron Supabase), pas depuis le navigateur.
// Pour chaque réservation 'pending' assez ancienne, revérifie l'état réel de la
// commande directement auprès de Revolut et corrige le statut en base :
//   - payé/autorisé côté Revolut  → réservation confirmée
//   - échoué/annulé côté Revolut  → réservation marquée annulée (paiement jamais abouti)
//   - état encore incertain       → laissée telle quelle, réessayée au prochain passage
//     (une alerte est envoyée si elle reste bloquée plus de STALE_ALERT_AFTER_MINUTES)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RECONCILE_AFTER_MINUTES = 30;
const STALE_ALERT_AFTER_MINUTES = 120;
const FAILED_STATES = ['CANCELLED', 'FAILED'];

function getEnvMode(): 'production' | 'dev' {
  const raw = (Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return ['production', 'prod', 'live'].includes(raw) ? 'production' : 'dev';
}

function getRevolutBaseUrl(): string {
  return getEnvMode() === 'production'
    ? 'https://merchant.revolut.com/api'
    : 'https://sandbox-merchant.revolut.com/api';
}

function getSecretKey(): string {
  const isProd = getEnvMode() === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

async function getRevolutOrderState(orderId: string): Promise<string> {
  const response = await fetch(`${getRevolutBaseUrl()}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Revolut-Api-Version': '2024-09-01',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut get-order failed: ${response.status} — ${errorText}`);
  }
  const data = await response.json();
  return data.state as string;
}

async function sendNewBookingAdminEmail(booking: Record<string, unknown>): Promise<void> {
  const exp = booking.standalone_experiences as { title: string } | null;
  const title = exp?.title || '—';
  const dateFormatted = new Date(booking.booking_date as string).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const currencySymbol: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };
  const priceDisplay = `${currencySymbol[booking.currency as string] || booking.currency}${booking.sell_price}`;
  const timeDisplay = booking.time_slot ? ` à ${booking.time_slot}` : '';
  const backofficeUrl = `https://staymakom.com/admin/standalone-bookings`;

  await sendAdminAlertEmail(
    `🎉 Nouvelle réservation — ${title}`,
    `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eee;">
        <h2 style="color:#1A1814;margin:0 0 16px;">🎉 Nouvelle réservation standalone</h2>
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

async function sendAdminAlertEmail(subject: string, html: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'StayMakom <reservations@staymakom.com>',
        to: ['shana@staymakom.com'],
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error('Admin alert email failed to send:', err);
  }
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const cutoff = new Date(Date.now() - RECONCILE_AFTER_MINUTES * 60_000).toISOString();

    const { data: pendingBookings, error } = await supabase
      .from('standalone_bookings')
      .select('id, customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, revolut_order_id, created_at, standalone_experiences(title)')
      .eq('status', 'pending')
      .not('revolut_order_id', 'is', null)
      .lt('created_at', cutoff)
      .limit(100);

    if (error) throw error;

    let confirmedCount = 0;
    let cancelledCount = 0;
    const stillStuck: Array<Record<string, unknown>> = [];

    for (const booking of pendingBookings || []) {
      try {
        const state = await getRevolutOrderState(booking.revolut_order_id as string);

        if (state === 'COMPLETED' || state === 'AUTHORISED') {
          const { data: updatedRows, error: updErr } = await supabase
            .from('standalone_bookings')
            .update({ status: 'confirmed', payment_status: 'paid' })
            .eq('id', booking.id)
            .eq('status', 'pending')
            .select('id');
          if (updErr) {
            console.error(`reconcile: échec confirmation réservation ${booking.id}:`, updErr);
          } else {
            confirmedCount++;
            // Email admin seulement si c'est bien ce passage qui a confirmé la réservation
            // (évite un doublon si le webhook ou la confirmation immédiate l'avait déjà fait).
            if (updatedRows && updatedRows.length > 0) {
              await sendNewBookingAdminEmail(booking as Record<string, unknown>);
            }
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
            cancelledCount++;
          }
        } else {
          // État encore incertain côté Revolut (ex: PENDING/PROCESSING) : on réessaiera
          // au prochain passage. On alerte seulement si ça traîne vraiment trop longtemps.
          const ageMinutes = (Date.now() - new Date(booking.created_at as string).getTime()) / 60_000;
          if (ageMinutes > STALE_ALERT_AFTER_MINUTES) {
            stillStuck.push({ ...booking, revolutState: state });
          }
        }
      } catch (err) {
        console.error(`reconcile: échec vérification Revolut pour la commande ${booking.revolut_order_id}:`, err);
      }
    }

    if (stillStuck.length > 0) {
      await sendAdminAlertEmail(
        `⏳ ${stillStuck.length} réservation(s) bloquée(s) depuis plus de 2h`,
        `<div style="font-family:Arial,sans-serif;padding:16px;">
          <p>Ces réservations "expérience seule" restent en attente depuis plus de 2h, sans confirmation ni échec côté Revolut :</p>
          <ul>
            ${stillStuck.map((b) => `<li>${b.customer_name || '—'} (${b.customer_email || '—'}) — ${(b.standalone_experiences as { title?: string } | null)?.title || '—'} — commande Revolut ${b.revolut_order_id} (état actuel : ${b.revolutState})</li>`).join('')}
          </ul>
          <p>À vérifier manuellement dans le tableau de bord Revolut.</p>
        </div>`,
      );
    }

    return new Response(JSON.stringify({
      success: true,
      checked: (pendingBookings || []).length,
      confirmed: confirmedCount,
      cancelled: cancelledCount,
      still_stuck: stillStuck.length,
    }), {
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
