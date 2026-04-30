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
      const updateData: Record<string, unknown> = { payment_status: paymentStatus };
      if (paidAt) updateData.paid_at = paidAt;

      const paymentId = event.data?.payments?.[0]?.id;
      if (paymentId) updateData.revolut_payment_id = paymentId;

      const paymentMethod = event.data?.payments?.[0]?.payment_method?.type;
      if (paymentMethod) updateData.payment_method = paymentMethod;

      // Update + récupérer les lignes affectées pour détecter les paiements orphelins
      // (paid event reçu pour un revolut_order_id qui n'a pas de booking en base).
      const { data: updatedRows, error } = await supabase
        .from('bookings_hg')
        .update(updateData)
        .eq('revolut_order_id', orderId)
        .select('id, hg_booking_id');

      if (error) {
        console.error('Failed to update booking payment status:', error);
      } else if (!updatedRows || updatedRows.length === 0) {
        // ⚠️ ORPHAN PAYMENT : un paiement a réussi côté Revolut mais aucune réservation
        // associée en base. Ça veut dire que le frontend a planté entre la création de
        // l'ordre Revolut et l'insert dans bookings_hg. Le client a été débité mais n'a
        // pas sa résa.
        // Ce log doit être très visible dans Supabase → Logs → Edge Functions pour
        // qu'un admin puisse intervenir manuellement (vérifier chez HyperGuest, rembourser
        // si besoin, contacter le client).
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
          message: 'A Revolut payment succeeded but no matching bookings_hg row exists. Frontend likely crashed before creating the booking. Manual reconciliation required: check HyperGuest for booking, refund customer if no booking found.',
        }, null, 2));
      } else {
        console.log(`Updated booking payment_status=${paymentStatus} for order ${orderId}`);
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
