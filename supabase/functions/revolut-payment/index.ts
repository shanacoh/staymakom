import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(o =>
    typeof o === 'string' ? o === origin : o.test(origin)
  );
  const corsOrigin = isAllowed ? origin : 'https://staymakom.com';
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function getRevolutBaseUrl(): string {
  const env = (Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return ['production', 'prod', 'live'].includes(env)
    ? 'https://merchant.revolut.com/api'
    : 'https://sandbox-merchant.revolut.com/api';
}

function getSecretKey(): string {
  const env = (Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  const isProd = ['production', 'prod', 'live'].includes(env);
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

async function createOrder(body: Record<string, unknown>) {
  const { amount, currency, description, customerEmail, customerName, bookingRef } = body;
  if (!amount || !currency) throw new Error('amount and currency are required');

  const amountInCents = Math.round(Number(amount) * 100);

  const payload: Record<string, unknown> = {
    amount: amountInCents,
    currency: String(currency).toUpperCase(),
    description: description || 'StayMakom Booking',
    merchant_order_ext_ref: bookingRef || undefined,
    customer: {
      email: customerEmail || undefined,
      full_name: customerName || undefined,
    },
  };

  const url = `${getRevolutBaseUrl()}/orders`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      'Revolut-Api-Version': '2024-09-01',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut create-order failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    orderId: data.id,
    publicId: data.public_id,
    state: data.state,
    checkoutUrl: data.checkout_url,
  };
}

async function getOrder(body: Record<string, unknown>) {
  const { orderId } = body;
  if (!orderId) throw new Error('orderId is required');

  const url = `${getRevolutBaseUrl()}/orders/${orderId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Revolut-Api-Version': '2024-09-01',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut get-order failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    orderId: data.id,
    state: data.state,
    completedAt: data.completed_at,
    payments: data.payments,
  };
}

async function refundOrder(body: Record<string, unknown>) {
  const { orderId, amount, currency, description } = body;
  if (!orderId) throw new Error('orderId is required');

  const payload: Record<string, unknown> = {
    description: description || 'Booking failed - automatic refund',
  };
  if (amount) payload.amount = Math.round(Number(amount) * 100);
  if (currency) payload.currency = String(currency).toUpperCase();

  const url = `${getRevolutBaseUrl()}/orders/${orderId}/refund`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      'Revolut-Api-Version': '2024-09-01',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut refund failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      const text = await req.text();
      if (text.trim()) body = JSON.parse(text);
    }

    const action = body.action as string;
    let result;

    switch (action) {
      case 'create-order':
        result = await createOrder(body);
        break;
      case 'get-order':
        result = await getOrder(body);
        break;
      case 'refund-order':
        result = await refundOrder(body);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Revolut payment error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
