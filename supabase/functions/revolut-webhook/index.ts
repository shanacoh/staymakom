import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === signature.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const WEBHOOK_SECRET = Deno.env.get('REVOLUT_WEBHOOK_SIGNING_SECRET') || '';

  const rawBody = await req.text();

  if (WEBHOOK_SECRET) {
    const signature = req.headers.get('revolut-signature') || req.headers.get('x-revolut-signature') || '';
    if (signature) {
      const valid = await verifySignature(rawBody, signature, WEBHOOK_SECRET);
      if (!valid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }
  }

  try {
    const event = JSON.parse(rawBody);
    const eventType = event.event || event.type;
    const orderId = event.order_id || event.data?.id;

    console.log(`Revolut webhook: ${eventType} for order ${orderId}`);

    if (!orderId) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let paymentStatus: string | null = null;
    let paidAt: string | null = null;

    switch (eventType) {
      case 'ORDER_COMPLETED':
      case 'ORDER_AUTHORISED':
        paymentStatus = 'paid';
        paidAt = new Date().toISOString();
        break;
      case 'ORDER_PAYMENT_FAILED':
      case 'ORDER_FAILED':
      case 'ORDER_PAYMENT_DECLINED':
        paymentStatus = 'failed';
        break;
      case 'ORDER_CANCELLED':
        paymentStatus = 'refunded';
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    if (paymentStatus) {
      // Tente la mise à jour sur une table par revolut_order_id, renvoie les lignes affectées.
      async function updateBookingTable(table: string, updateData: Record<string, unknown>, selectCols: string) {
        return await supabase
          .from(table)
          .update(updateData)
          .eq('revolut_order_id', orderId)
          .select(selectCols);
      }

      const hgUpdateData: Record<string, unknown> = { payment_status: paymentStatus };
      if (paidAt) hgUpdateData.paid_at = paidAt;

      const paymentId = event.data?.payments?.[0]?.id;
      if (paymentId) hgUpdateData.revolut_payment_id = paymentId;

      const paymentMethod = event.data?.payments?.[0]?.payment_method?.type;
      if (paymentMethod) hgUpdateData.payment_method = paymentMethod;

      // Update + récupérer les lignes affectées pour détecter les paiements orphelins
      // (paid event reçu pour un revolut_order_id qui n'a pas de booking en base).
      const { data: hgRows, error: hgError } = await updateBookingTable('bookings_hg', hgUpdateData, 'id, hg_booking_id');

      if (hgError) {
        console.error('Failed to update bookings_hg payment status:', hgError);
      } else if (hgRows && hgRows.length > 0) {
        console.log(`Updated bookings_hg payment_status=${paymentStatus} for order ${orderId}`);
      } else {
        // Pas trouvé côté hôtel : on tente standalone_bookings (table distincte, mêmes
        // revolut_order_id ne peuvent matcher qu'une seule des deux tables).
        // standalone_bookings n'a pas de colonnes paid_at/revolut_payment_id/payment_method,
        // on ne met à jour que ce qui existe réellement sur cette table.
        const standaloneUpdateData: Record<string, unknown> = { payment_status: paymentStatus };
        if (paymentStatus === 'paid') {
          standaloneUpdateData.status = 'confirmed';
        } else if (paymentStatus === 'refunded') {
          standaloneUpdateData.status = 'cancelled';
          standaloneUpdateData.is_cancelled = true;
          standaloneUpdateData.cancelled_at = new Date().toISOString();
        }

        const { data: standaloneRows, error: standaloneError } = await updateBookingTable(
          'standalone_bookings',
          standaloneUpdateData,
          'id, confirmation_token',
        );

        if (standaloneError) {
          console.error('Failed to update standalone_bookings payment status:', standaloneError);
        } else if (standaloneRows && standaloneRows.length > 0) {
          console.log(`Updated standalone_bookings payment_status=${paymentStatus} (status=${standaloneUpdateData.status ?? 'unchanged'}) for order ${orderId}`);

          // Notification admin quand une réservation standalone est payée
          if (paymentStatus === 'paid') {
            try {
              const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
              if (RESEND_API_KEY) {
                const bookingId = standaloneRows[0].id;
                const confirmationToken = standaloneRows[0].confirmation_token;

                const { data: booking } = await supabase
                  .from('standalone_bookings')
                  .select('customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, standalone_experiences(title)')
                  .eq('id', bookingId)
                  .single();

                if (booking) {
                  const exp = booking.standalone_experiences as { title: string } | null;
                  const title = exp?.title || '—';
                  const dateFormatted = new Date(booking.booking_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  const currencySymbol: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };
                  const priceDisplay = `${currencySymbol[booking.currency] || booking.currency}${booking.sell_price}`;
                  const timeDisplay = booking.time_slot ? ` à ${booking.time_slot}` : '';
                  const backofficeUrl = `https://staymakom.com/admin/standalone-bookings`;

                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      from: 'StayMakom <reservations@staymakom.com>',
                      to: ['shana@staymakom.com'],
                      subject: `🎉 Nouvelle réservation — ${title}`,
                      html: `
                        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eee;">
                          <h2 style="color:#1A1814;margin:0 0 16px;">🎉 Nouvelle réservation standalone</h2>
                          <table style="width:100%;border-collapse:collapse;">
                            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Expérience</td><td style="padding:8px 0;font-weight:600;">${title}</td></tr>
                            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Client</td><td style="padding:8px 0;">${booking.customer_name}</td></tr>
                            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;">${booking.customer_email}</td></tr>
                            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Date</td><td style="padding:8px 0;">${dateFormatted}${timeDisplay}</td></tr>
                            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Participants</td><td style="padding:8px 0;">${booking.party_size} personne${booking.party_size > 1 ? 's' : ''}</td></tr>
                            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Montant</td><td style="padding:8px 0;font-weight:700;color:#1A7A74;">${priceDisplay}</td></tr>
                          </table>
                          <a href="${backofficeUrl}" style="display:inline-block;margin-top:20px;background:#1A1814;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;">Voir dans le back office</a>
                        </div>
                      `,
                    }),
                  });
                  console.log(`Admin notification sent for standalone booking ${bookingId}`);
                }
              }
            } catch (notifErr) {
              console.error('Admin notification failed (non-blocking):', notifErr);
            }
          }
        } else {
          // ⚠️ ORPHAN PAYMENT : un paiement a réussi côté Revolut mais aucune réservation
          // (hôtel ou standalone) associée en base. Le frontend a probablement planté entre
          // la création de l'ordre Revolut et l'insert de la réservation. Le client a été
          // débité mais n'a pas sa résa.
          // Ce log doit être très visible dans Supabase → Logs → Edge Functions pour
          // qu'un admin puisse intervenir manuellement (rembourser si besoin, contacter le client).
          console.error('🚨 ORPHAN_PAYMENT_DETECTED 🚨', JSON.stringify({
            orderId,
            eventType,
            paymentStatus,
            revolutPaymentId: event.data?.payments?.[0]?.id,
            paymentMethod: event.data?.payments?.[0]?.payment_method?.type,
            customerEmail: event.data?.customer?.email,
            customerName: event.data?.customer?.full_name,
            totalAmount: event.data?.total_amount,
            currency: event.data?.currency,
            merchantOrderRef: event.data?.merchant_order_ext_ref,
            completedAt: event.data?.completed_at || event.completed_at,
            fullEvent: event,
            message: 'A Revolut payment succeeded but no matching bookings_hg or standalone_bookings row exists. Frontend likely crashed before creating the booking. Manual reconciliation required.',
          }, null, 2));
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
