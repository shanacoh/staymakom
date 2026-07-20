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

/** Vérifie que l'appelant est bien un administrateur (actions de debug sensibles). */
async function isAdminRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '');
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.id) return false;
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    return !!adminRole;
  } catch (err) {
    console.error('❌ Admin check failed:', err);
    return false;
  }
}

/** Calcule un HMAC-SHA256 et le renvoie en hexadécimal. */
async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Test de la vérification de signature du webhook Revolut.
 *
 * Envoie DEUX faux webhooks à notre propre endpoint revolut-webhook :
 *   1. signé selon la règle OFFICIELLE Revolut  → "v1.{timestamp}.{body}"
 *   2. signé selon la méthode actuelle du code  → "{body}" seul
 *
 * L'événement envoyé (STAYMAKOM_SIGNATURE_TEST) n'est géré par aucun cas du webhook :
 * aucune réservation n'est lue ni modifiée. Le test est donc sans effet de bord.
 *
 * Lecture du résultat :
 *   - officielle rejetée (401) + contenu-seul acceptée (200) → la vérification est fausse,
 *     c'est la raison pour laquelle les vrais paiements ne valident pas la réservation.
 *   - officielle acceptée (200) → la vérification est correcte.
 */
async function testWebhookSignature() {
  const secret = Deno.env.get('REVOLUT_WEBHOOK_SIGNING_SECRET') || '';
  if (!secret) throw new Error('REVOLUT_WEBHOOK_SIGNING_SECRET non configuré dans les secrets Supabase');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const webhookUrl = `${supabaseUrl}/functions/v1/revolut-webhook`;

  const body = JSON.stringify({
    event: 'STAYMAKOM_SIGNATURE_TEST',
    order_id: `test-${crypto.randomUUID()}`,
  });
  const timestamp = Date.now().toString();

  const send = async (signature: string) => {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Revolut-Signature': signature,
          'Revolut-Request-Timestamp': timestamp,
        },
        body,
      });
      return { status: res.status, response: (await res.text()).slice(0, 200) };
    } catch (err) {
      return { status: 0, response: err instanceof Error ? err.message : 'fetch failed' };
    }
  };

  const officialSignature = await send(`v1=${await hmacHex(secret, `v1.${timestamp}.${body}`)}`);
  const bodyOnlySignature = await send(`v1=${await hmacHex(secret, body)}`);

  const officialAccepted = officialSignature.status !== 401 && officialSignature.status !== 0;
  const bodyOnlyAccepted = bodyOnlySignature.status !== 401 && bodyOnlySignature.status !== 0;

  let verdict: 'broken' | 'ok' | 'ambiguous';
  let diagnosis: string;

  if (!officialAccepted && bodyOnlyAccepted) {
    verdict = 'broken';
    diagnosis = "HYPOTHÈSE CONFIRMÉE — Le webhook REJETTE les messages signés selon la règle officielle Revolut (401), et ACCEPTE une signature calculée sur le contenu seul. C'est exactement pour ça que les vrais paiements n'arrivent jamais à valider la réservation : Revolut signe correctement, notre code attend un mauvais format.";
  } else if (officialAccepted) {
    verdict = 'ok';
    diagnosis = "Le webhook ACCEPTE les messages signés selon la règle officielle Revolut. La vérification de signature est correcte.";
  } else {
    verdict = 'ambiguous';
    diagnosis = "Résultat ambigu — les deux méthodes sont rejetées. Vérifier que le secret REVOLUT_WEBHOOK_SIGNING_SECRET correspond bien au signing secret du webhook configuré côté Revolut.";
  }

  return {
    webhookUrl,
    timestamp,
    officialSignature: { ...officialSignature, label: 'Signature officielle Revolut (v1.horodatage.contenu)' },
    bodyOnlySignature: { ...bodyOnlySignature, label: 'Signature sur le contenu seul (méthode actuelle du code)' },
    verdict,
    diagnosis,
    sideEffectFree: true,
  };
}

/**
 * Interroge Revolut pour connaître les webhooks réellement déclarés sur le compte,
 * et confronte cette réalité à notre configuration locale.
 *
 * Répond à trois questions qu'aucun test local ne peut trancher :
 *   1. Le webhook pointe-t-il vers NOTRE endpoint ?
 *   2. Le signing secret déclaré chez Revolut est-il bien celui stocké dans Supabase ?
 *      (Revolut renvoie le signing_secret : on compare côté serveur SANS jamais
 *       l'exposer au navigateur.)
 *   3. Le webhook est-il abonné aux événements dont notre code a besoin ?
 */
async function checkWebhookConfig(envOverride?: string) {
  const localSecret = Deno.env.get('REVOLUT_WEBHOOK_SIGNING_SECRET') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const expectedUrl = `${supabaseUrl}/functions/v1/revolut-webhook`;

  const response = await fetch(`${getRevolutBaseUrl(envOverride)}/webhooks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getSecretKey(envOverride)}`,
      'Revolut-Api-Version': '2024-09-01',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut list-webhooks failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const webhooks: Array<Record<string, unknown>> = Array.isArray(data) ? data : (data.webhooks ?? []);

  // Événements indispensables au fonctionnement de notre webhook.
  const CRITICAL_EVENTS = ['ORDER_COMPLETED'];
  const RECOMMENDED_EVENTS = ['ORDER_AUTHORISED', 'ORDER_PAYMENT_FAILED', 'ORDER_CANCELLED'];

  const mask = (s: string) => (s ? `${s.substring(0, 3)}…${s.substring(s.length - 4)} (${s.length} car.)` : 'absent');

  const inspected = webhooks.map((w) => {
    const url = String(w.url ?? '');
    const events: string[] = Array.isArray(w.events) ? (w.events as string[]) : [];
    // Revolut ne renvoie le signing secret QU'À la création du webhook et lors d'une
    // rotation : les endpoints de lecture ne l'exposent pas. On distingue donc
    // explicitement "non vérifiable" de "différent", pour ne pas accuser à tort
    // une configuration qui est peut-être parfaitement correcte.
    const signingSecret = String(w.signing_secret ?? '');
    const secretStatus: 'match' | 'mismatch' | 'unverifiable' =
      !signingSecret ? 'unverifiable'
        : (!!localSecret && signingSecret === localSecret) ? 'match'
          : 'mismatch';
    return {
      id: String(w.id ?? ''),
      url,
      events,
      pointsToOurEndpoint: url === expectedUrl,
      secretStatus,
      revolutSecretPreview: signingSecret ? mask(signingSecret) : 'non communiqué par Revolut (normal)',
      missingCriticalEvents: CRITICAL_EVENTS.filter(e => !events.includes(e)),
      missingRecommendedEvents: RECOMMENDED_EVENTS.filter(e => !events.includes(e)),
    };
  });

  const ourWebhook = inspected.find(w => w.pointsToOurEndpoint);

  let verdict: 'ok' | 'ok_secret_unverified' | 'no_webhook' | 'wrong_secret' | 'missing_events';
  let diagnosis: string;

  if (!ourWebhook) {
    verdict = 'no_webhook';
    diagnosis = webhooks.length === 0
      ? `AUCUN webhook n'est déclaré sur ce compte Revolut. Les paiements ne peuvent donc jamais valider les réservations. Il faut créer un webhook pointant vers ${expectedUrl}.`
      : `Aucun des ${webhooks.length} webhook(s) déclarés ne pointe vers notre endpoint (${expectedUrl}). Vérifier l'URL déclarée côté Revolut, ou le compte utilisé (production vs sandbox).`;
  } else if (ourWebhook.secretStatus === 'mismatch') {
    verdict = 'wrong_secret';
    diagnosis = "Le webhook pointe bien vers notre endpoint, MAIS le signing secret déclaré chez Revolut ne correspond pas à celui stocké dans Supabase (REVOLUT_WEBHOOK_SIGNING_SECRET). Toutes les notifications seront rejetées. Il faut recopier le signing secret de Revolut dans les secrets Supabase.";
  } else if (ourWebhook.missingCriticalEvents.length > 0) {
    verdict = 'missing_events';
    diagnosis = `Le webhook est bien déclaré, mais il n'est pas abonné à : ${ourWebhook.missingCriticalEvents.join(', ')}. Sans cet événement, les paiements réussis ne remonteront jamais.`;
  } else if (ourWebhook.secretStatus === 'unverifiable') {
    verdict = 'ok_secret_unverified';
    diagnosis = `Tout ce qui est vérifiable est correct : le webhook pointe vers notre endpoint, en ${getEnvMode(envOverride)}, et écoute bien ORDER_COMPLETED. En revanche le signing secret NE PEUT PAS être vérifié : Revolut ne le communique qu'à la création du webhook et lors d'une rotation, jamais en lecture. Ce n'est donc ni une erreur ni une preuve. Pour lever ce dernier doute : faire un vrai paiement test et vérifier que la réservation passe en confirmée, ou faire une rotation du signing secret et recopier la nouvelle valeur dans Supabase.`;
  } else {
    verdict = 'ok';
    diagnosis = ourWebhook.missingRecommendedEvents.length > 0
      ? `Configuration correcte : bonne URL, signing secret identique, et ORDER_COMPLETED bien écouté. Événements optionnels non abonnés : ${ourWebhook.missingRecommendedEvents.join(', ')}.`
      : "Configuration parfaite : bonne URL, signing secret identique, et tous les événements utiles sont écoutés.";
  }

  return {
    environment: getEnvMode(envOverride),
    expectedUrl,
    localSecretPreview: mask(localSecret),
    webhookCount: webhooks.length,
    webhooks: inspected,
    verdict,
    diagnosis,
  };
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
      case 'test-webhook':
        // Action de debug réservée aux admins : envoie de faux webhooks signés
        // pour vérifier la validation de signature, sans toucher aux réservations.
        if (!(await isAdminRequest(req))) {
          throw new Error('Action réservée aux administrateurs');
        }
        result = await testWebhookSignature();
        break;
      case 'check-webhook-config':
        // Compare la configuration réelle du webhook chez Revolut (URL, signing secret,
        // événements) avec la nôtre. Admin uniquement : la réponse touche aux secrets.
        if (!(await isAdminRequest(req))) {
          throw new Error('Action réservée aux administrateurs');
        }
        result = await checkWebhookConfig(envOverride);
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
