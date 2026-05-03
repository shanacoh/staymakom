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

function getEnvMode(envOverride?: string): 'production' | 'dev' {
  // Ordre de priorité :
  // 1. override fourni explicitement (ex: toggle admin debug)
  // 2. secret dédié Revolut (REVOLUT_ENVIRONMENT) — permet de découpler de HyperGuest
  // 3. secret global (ENVIRONMENT) — fallback historique
  const raw = (envOverride || Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return ['production', 'prod', 'live'].includes(raw) ? 'production' : 'dev';
}

function getRevolutBaseUrl(envOverride?: string): string {
  return getEnvMode(envOverride) === 'production'
    ? 'https://merchant.revolut.com/api'
    : 'https://sandbox-merchant.revolut.com/api';
}

function getSecretKey(envOverride?: string): string {
  const isProd = getEnvMode(envOverride) === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

/** Merchant Public Key Revolut — utilisée par le widget côté navigateur pour
 *  initialiser l'embedded checkout. C'est une clé "publique par design" : OK qu'elle
 *  transite jusqu'au navigateur via la réponse de create-order. */
function getMerchantPublicKey(envOverride?: string): string {
  const isProd = getEnvMode(envOverride) === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_PUBLIC_KEY_PROD' : 'REVOLUT_PUBLIC_KEY') || '';
}

async function resolveAdminEnvOverride(
  req: Request,
  body: Record<string, unknown>
): Promise<string | undefined> {
  const requested = typeof body.environment === 'string' ? body.environment.toLowerCase() : '';
  if (requested !== 'dev' && requested !== 'prod' && requested !== 'production') {
    return undefined;
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  const token = authHeader.replace('Bearer ', '');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.id) return undefined;

    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!adminRole) {
      console.warn('⚠️ Non-admin user requested env override, ignoring:', user.id);
      return undefined;
    }
    const resolved = requested === 'prod' ? 'production' : requested;
    console.log('🔧 Admin env override accepted:', resolved, 'for user:', user.id);
    return resolved;
  } catch (err) {
    console.error('❌ Admin role check failed:', err);
    return undefined;
  }
}

async function createOrder(body: Record<string, unknown>, envOverride?: string) {
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

  const url = `${getRevolutBaseUrl(envOverride)}/orders`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getSecretKey(envOverride)}`,
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
    publicId: data.token || data.public_id,
    state: data.state,
    checkoutUrl: data.checkout_url,
    // La merchant public key est renvoyée avec chaque ordre pour que le widget puisse
    // initialiser l'embedded checkout. Elle est publique par design (pk_...).
    merchantPublicKey: getMerchantPublicKey(envOverride),
  };
}

async function getOrder(body: Record<string, unknown>, envOverride?: string) {
  const { orderId } = body;
  if (!orderId) throw new Error('orderId is required');

  const url = `${getRevolutBaseUrl(envOverride)}/orders/${orderId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getSecretKey(envOverride)}`,
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

async function refundOrder(body: Record<string, unknown>, envOverride?: string) {
  const { orderId, amount, currency, description } = body;
  if (!orderId) throw new Error('orderId is required');

  const payload: Record<string, unknown> = {
    description: description || 'Booking failed - automatic refund',
  };
  if (amount) payload.amount = Math.round(Number(amount) * 100);
  if (currency) payload.currency = String(currency).toUpperCase();

  const url = `${getRevolutBaseUrl(envOverride)}/orders/${orderId}/refund`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getSecretKey(envOverride)}`,
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

function checkConfig(envOverride?: string) {
  const env = getEnvMode(envOverride);
  const isProd = env === 'production';
  const secretKeyName = isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY';
  const publicKeyName = isProd ? 'REVOLUT_PUBLIC_KEY_PROD' : 'REVOLUT_PUBLIC_KEY';
  const secretKey = Deno.env.get(secretKeyName) || '';
  const publicKey = Deno.env.get(publicKeyName) || '';
  const webhookSecret = Deno.env.get('REVOLUT_WEBHOOK_SIGNING_SECRET') || '';

  return {
    environment: env,
    baseUrl: getRevolutBaseUrl(envOverride),
    apiVersion: '2024-09-01',
    secretKey: {
      name: secretKeyName,
      configured: secretKey.length > 0,
      length: secretKey.length,
      preview: secretKey ? `${secretKey.substring(0, 3)}...${secretKey.substring(secretKey.length - 4)}` : null,
    },
    publicKey: {
      name: publicKeyName,
      configured: publicKey.length > 0,
      length: publicKey.length,
      preview: publicKey ? `${publicKey.substring(0, 3)}...${publicKey.substring(publicKey.length - 4)}` : null,
    },
    webhookSecret: {
      name: 'REVOLUT_WEBHOOK_SIGNING_SECRET',
      configured: webhookSecret.length > 0,
      length: webhookSecret.length,
    },
  };
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

    // Admin-only override: allows the admin debug page to switch between Sandbox and Prod
    // without changing the global ENVIRONMENT secret. Ignored for non-admin callers.
    const envOverride = await resolveAdminEnvOverride(req, body);

    let result;
    switch (action) {
      case 'ping':
        result = { pong: true };
        break;
      case 'check-config':
        result = checkConfig(envOverride);
        break;
      case 'create-order':
        result = await createOrder(body, envOverride);
        break;
      case 'get-order':
        result = await getOrder(body, envOverride);
        break;
      case 'refund-order':
        result = await refundOrder(body, envOverride);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const finalEnv = getEnvMode(envOverride);
    return new Response(JSON.stringify({
      success: true,
      data: result,
      environment: finalEnv,
      isTest: finalEnv !== 'production',
      envOverrideApplied: !!envOverride,
    }), {
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
