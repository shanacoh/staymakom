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

      const { error } = await supabase
        .from('bookings_hg')
        .update(updateData)
        .eq('revolut_order_id', orderId);

      if (error) {
        console.error('Failed to update booking payment status:', error);
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
