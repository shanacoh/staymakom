// create-booking-payment-link — Edge Function
// Génère un vrai lien de paiement Revolut (acompte ou solde) pour une
// réservation existante, déclenché à la main depuis le back-office — pas
// depuis le panier client. Réutilise exactement le même mécanisme Revolut
// que le paiement en ligne (même API, même clé), juste une autre porte
// d'entrée. Chaque lien créé est enregistré dans standalone_booking_payments ;
// le webhook Revolut (revolut-webhook) le marquera payé automatiquement.
// Admin uniquement : appelé depuis un écran protégé du back-office.

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
  const isAllowed = ALLOWED_ORIGINS.some(o => (typeof o === 'string' ? o === origin : o.test(origin)));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://staymakom.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function getEnvMode(): 'production' | 'dev' {
  const raw = (Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return ['production', 'prod', 'live'].includes(raw) ? 'production' : 'dev';
}
function getRevolutBaseUrl(): string {
  return getEnvMode() === 'production' ? 'https://merchant.revolut.com/api' : 'https://sandbox-merchant.revolut.com/api';
}
function getSecretKey(): string {
  const isProd = getEnvMode() === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

async function createRevolutOrder(params: {
  amount: number; currency: string; description: string;
  customerEmail: string; customerName: string; customerPhone?: string | null; bookingRef: string;
}): Promise<{ orderId: string; checkoutUrl: string }> {
  const payload = {
    amount: Math.round(params.amount * 100),
    currency: params.currency.toUpperCase(),
    description: params.description,
    merchant_order_ext_ref: params.bookingRef,
    customer: {
      email: params.customerEmail,
      full_name: params.customerName,
      phone: params.customerPhone || undefined,
    },
  };
  const response = await fetch(`${getRevolutBaseUrl()}/orders`, {
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
    throw new Error(`Revolut create-order failed: ${response.status} — ${errorText}`);
  }
  const data = await response.json();
  return { orderId: data.id, checkoutUrl: data.checkout_url };
}

/** Vérifie que l'appelant est admin — action sensible (crée un vrai lien de paiement). */
async function isAdminRequest(req: Request, supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.id) return false;
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return !!adminRole;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (!(await isAdminRequest(req, supabase))) {
      return new Response(JSON.stringify({ success: false, error: 'Action réservée aux administrateurs' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { booking_id, kind } = await req.json();
    if (!booking_id || !['deposit', 'balance'].includes(kind)) {
      return new Response(JSON.stringify({ success: false, error: 'booking_id et kind (deposit|balance) requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .select('id, sell_price, currency, customer_name, customer_email, customer_phone, standalone_experience_id, custom_experience_title')
      .eq('id', booking_id)
      .single();
    if (bookingError || !booking) {
      return new Response(JSON.stringify({ success: false, error: 'Réservation introuvable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let experienceTitle = booking.custom_experience_title || 'Expérience';
    let depositType = 'none';
    let depositAmount: number | null = null;
    if (booking.standalone_experience_id) {
      const { data: experience } = await supabase
        .from('standalone_experiences')
        .select('title, deposit_type, deposit_amount')
        .eq('id', booking.standalone_experience_id)
        .maybeSingle();
      if (experience) {
        experienceTitle = experience.title;
        depositType = experience.deposit_type;
        depositAmount = experience.deposit_amount;
      }
    }

    const { data: existingPayments } = await supabase
      .from('standalone_booking_payments')
      .select('amount, status')
      .eq('booking_id', booking_id);
    const alreadyPaid = (existingPayments ?? [])
      .filter((p: { status: string }) => p.status === 'paid')
      .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);

    let amount: number;
    let description: string;

    if (kind === 'deposit') {
      if (depositType === 'fixed' && depositAmount) {
        amount = depositAmount;
      } else if (depositType === 'percentage' && depositAmount) {
        amount = Math.round((booking.sell_price * depositAmount) / 100 * 100) / 100;
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Aucune règle d\'acompte configurée pour cette expérience' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      description = `Acompte — ${experienceTitle}`;
    } else {
      amount = Math.round((booking.sell_price - alreadyPaid) * 100) / 100;
      if (amount <= 0) {
        return new Response(JSON.stringify({ success: false, error: 'Cette réservation est déjà soldée' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      description = `Solde — ${experienceTitle}`;
    }

    const revolut = await createRevolutOrder({
      amount,
      currency: booking.currency,
      description,
      customerEmail: booking.customer_email,
      customerName: booking.customer_name,
      customerPhone: booking.customer_phone,
      bookingRef: `${booking_id}:${kind}`,
    });

    const { data: payment, error: paymentError } = await supabase
      .from('standalone_booking_payments')
      .insert({
        booking_id,
        kind,
        amount,
        currency: booking.currency,
        revolut_order_id: revolut.orderId,
        checkout_url: revolut.checkoutUrl,
        status: 'pending',
      })
      .select('id')
      .single();
    if (paymentError || !payment) {
      console.error('🚨 PAYMENT_LINK_ORPHAN — Revolut order created but DB insert failed', { booking_id, orderId: revolut.orderId, paymentError });
      return new Response(JSON.stringify({ success: false, error: 'Lien créé côté Revolut mais échec d\'enregistrement — vérifier manuellement' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      checkout_url: revolut.checkoutUrl,
      amount,
      currency: booking.currency,
      kind,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('create-booking-payment-link error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erreur interne', details: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
