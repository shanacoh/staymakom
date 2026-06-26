// process-standalone-payment — Edge Function
// Crée l'ordre de paiement Revolut puis la réservation "Experience Only" en base,
// dans cet ordre (paiement d'abord), pour que standalone_bookings référence toujours
// exactement l'ordre Revolut réellement créé. Ne touche pas à process-standalone-booking.

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
  return getEnvMode() === 'production'
    ? 'https://merchant.revolut.com/api'
    : 'https://sandbox-merchant.revolut.com/api';
}

function getSecretKey(): string {
  const isProd = getEnvMode() === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

function getMerchantPublicKey(): string {
  const isProd = getEnvMode() === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_PUBLIC_KEY_PROD' : 'REVOLUT_PUBLIC_KEY') || '';
}

async function createRevolutOrder(params: {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  bookingRef: string;
}): Promise<{ orderId: string; publicId: string }> {
  const amountInCents = Math.round(params.amount * 100);

  const payload = {
    amount: amountInCents,
    currency: params.currency.toUpperCase(),
    description: params.description,
    merchant_order_ext_ref: params.bookingRef,
    customer: {
      email: params.customerEmail,
      full_name: params.customerName,
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
  return {
    orderId: data.id,
    publicId: data.token || data.public_id,
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const {
      experience_id,
      booking_date,
      time_slot,
      // Nouveau : adultes et enfants distincts. Rétrocompatibilité : si absent, party_size est utilisé.
      adults: adultsRaw,
      children: childrenRaw,
      party_size: legacyPartySize,
      customer_name,
      customer_email,
      customer_phone,
      promo_code: promoCodePayload,
      gift_card: giftCardPayload,
    } = body;

    const adults: number = typeof adultsRaw === 'number' ? adultsRaw : (legacyPartySize ?? 1);
    const children: number = typeof childrenRaw === 'number' ? childrenRaw : 0;
    const totalParty = adults + children;

    // ── Validation des champs requis ──────────────────────────────────────────
    if (!experience_id || !booking_date || !customer_name || !customer_email) {
      return new Response(JSON.stringify({ success: false, error: 'Champs requis manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (adults < 1) {
      return new Response(JSON.stringify({ success: false, error: 'Au moins 1 adulte est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Récupérer l'expérience ────────────────────────────────────────────────
    const { data: experience, error: expError } = await supabase
      .from('standalone_experiences')
      .select('id, title, base_price, base_price_child, has_child_price, base_price_type, currency, min_party, max_party, has_time_slots, time_slots, status')
      .eq('id', experience_id)
      .single();

    if (expError || !experience) {
      return new Response(JSON.stringify({ success: false, error: 'Expérience introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (experience.status !== 'published') {
      return new Response(JSON.stringify({ success: false, error: 'Expérience non disponible' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Valider la taille du groupe ───────────────────────────────────────────
    if (totalParty < experience.min_party || totalParty > experience.max_party) {
      return new Response(JSON.stringify({
        success: false,
        error: `Groupe de ${totalParty} personnes non accepté (min ${experience.min_party}, max ${experience.max_party})`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Valider le créneau si applicable ─────────────────────────────────────
    let validatedTimeSlot: string | null = null;
    if (experience.has_time_slots) {
      const availableSlots: string[] = Array.isArray(experience.time_slots) ? experience.time_slots : [];
      if (!time_slot || !availableSlots.includes(time_slot)) {
        return new Response(JSON.stringify({ success: false, error: 'Créneau horaire invalide ou non sélectionné' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      validatedTimeSlot = time_slot;
    }

    // ── Calculer le prix total côté serveur (jamais confiance au client) ─────
    // Formule : adultes × prix_adulte + enfants × prix_enfant (si tarif enfant activé)
    let basePrice: number;
    if (experience.base_price_type === 'fixed') {
      basePrice = experience.base_price;
    } else if (experience.has_child_price && experience.base_price_child && children > 0) {
      basePrice = experience.base_price * adults + experience.base_price_child * children;
    } else {
      basePrice = experience.base_price * totalParty;
    }

    // ── Appliquer le code promo (re-validé côté serveur) ─────────────────────
    let promoDiscount = 0;
    let validatedPromo: { id: string; code: string; discount_pct: number } | null = null;

    if (promoCodePayload?.id && promoCodePayload?.code && customer_email) {
      const { data: promoRow } = await supabase
        .from('promo_codes')
        .select('id, code, discount_pct, valid_from, valid_until, max_uses, used_count, is_active')
        .eq('id', promoCodePayload.id)
        .single();

      if (promoRow && promoRow.is_active && new Date(promoRow.valid_from) <= new Date() && new Date(promoRow.valid_until) >= new Date()) {
        if (promoRow.max_uses === null || promoRow.used_count < promoRow.max_uses) {
          promoDiscount = Math.round((basePrice * promoRow.discount_pct) / 100);
          validatedPromo = { id: promoRow.id, code: promoRow.code, discount_pct: promoRow.discount_pct };
        }
      }
    }

    const priceAfterPromo = Math.max(0, basePrice - promoDiscount);

    // ── Appliquer la carte cadeau ─────────────────────────────────────────────
    let giftCardApplied = 0;
    if (giftCardPayload?.id && giftCardPayload?.amount_to_apply > 0) {
      const { data: gcRow } = await supabase
        .from('gift_cards')
        .select('id, amount, amount_used, status, expires_at')
        .eq('id', giftCardPayload.id)
        .maybeSingle();
      if (gcRow && gcRow.status !== 'redeemed' && new Date(gcRow.expires_at) >= new Date()) {
        const availableBalance = gcRow.amount - (gcRow.amount_used ?? 0);
        giftCardApplied = Math.min(availableBalance, priceAfterPromo, giftCardPayload.amount_to_apply);
      }
    }

    const sellPrice = Math.max(0, priceAfterPromo - giftCardApplied);

    // ── Cas carte cadeau couvre 100% : pas d'ordre Revolut nécessaire ─────────
    if (sellPrice === 0) {
      const bookingId = crypto.randomUUID();
      const { data: booking, error: bookingError } = await supabase
        .from('standalone_bookings')
        .insert([{
          id: bookingId,
          standalone_experience_id: experience_id,
          customer_name, customer_email,
          customer_phone: customer_phone || null,
          booking_date, time_slot: validatedTimeSlot,
          party_size: totalParty, adults_count: adults, children_count: children,
          sell_price: 0,
          currency: experience.currency,
          status: 'confirmed', payment_status: 'paid',
        }])
        .select('id, confirmation_token')
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ success: false, error: 'Impossible de créer la réservation' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mettre à jour le solde de la carte cadeau (non-bloquant)
      if (giftCardPayload?.id && giftCardApplied > 0) {
        try {
          await supabase.from('gift_cards').update({
            amount_used: giftCardPayload.new_amount_used,
            status: giftCardPayload.is_fully_redeemed ? 'redeemed' : 'sent',
            ...(giftCardPayload.is_fully_redeemed ? { redeemed_at: new Date().toISOString() } : {}),
          }).eq('id', giftCardPayload.id);
        } catch (gcErr) {
          console.error('⚠️ Gift card update failed (non-blocking):', gcErr);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        no_payment_required: true,
        booking_id: booking.id,
        confirmation_token: booking.confirmation_token,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Créer l'ordre Revolut AVANT la réservation ────────────────────────────
    const bookingId = crypto.randomUUID();
    const childSuffix = experience.has_child_price && children > 0
      ? ` (${adults} adultes + ${children} enfants)`
      : ` (${totalParty} pers.)`;
    const description = `StayMakom — ${experience.title}${childSuffix}`;
    let revolut: { orderId: string; publicId: string };

    try {
      revolut = await createRevolutOrder({
        amount: sellPrice,
        currency: experience.currency,
        description,
        customerEmail: customer_email,
        customerName: customer_name,
        bookingRef: bookingId,
      });
    } catch (err: any) {
      console.error('Revolut order creation error (standalone):', err);
      return new Response(JSON.stringify({ success: false, error: 'Impossible de créer le paiement', details: err.message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Créer la réservation avec le paiement déjà connu (pas de fenêtre de désync) ──
    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .insert([{
        id: bookingId,
        standalone_experience_id: experience_id,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        booking_date,
        time_slot: validatedTimeSlot,
        party_size: totalParty,
        adults_count: adults,
        children_count: children,
        sell_price: sellPrice,
        currency: experience.currency,
        status: 'pending',
        payment_status: 'pending',
        revolut_order_id: revolut.orderId,
        revolut_public_id: revolut.publicId,
      }])
      .select('id, confirmation_token')
      .single();

    if (bookingError || !booking) {
      console.error('🚨 BOOKING_INSERT_FAILED_AFTER_ORDER_CREATED 🚨', JSON.stringify({
        bookingId,
        experience_id,
        customer_email,
        customer_name,
        revolutOrderId: revolut.orderId,
        revolutPublicId: revolut.publicId,
        error: bookingError,
        message: 'Un ordre Revolut a été créé mais la réservation standalone n\'a pas pu être enregistrée. Réconciliation manuelle requise si le client revient avec un paiement effectué.',
      }, null, 2));
      return new Response(JSON.stringify({ success: false, error: 'Impossible de créer la réservation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Mettre à jour le solde carte cadeau (utilisation partielle, non-bloquant) ──
    if (giftCardPayload?.id && giftCardApplied > 0) {
      try {
        await supabase.from('gift_cards').update({
          amount_used: giftCardPayload.new_amount_used,
          status: giftCardPayload.is_fully_redeemed ? 'redeemed' : 'sent',
          ...(giftCardPayload.is_fully_redeemed ? { redeemed_at: new Date().toISOString() } : {}),
        }).eq('id', giftCardPayload.id);
      } catch (gcErr) {
        console.error('⚠️ Gift card update failed (non-blocking):', gcErr);
      }
    }

    // ── Enregistrer l'utilisation du code promo (non-bloquant) ───────────────
    if (validatedPromo && customer_email) {
      try {
        await supabase.from('promo_code_redemptions').insert({
          promo_code_id: validatedPromo.id,
          email: String(customer_email).toLowerCase().trim(),
          booking_id: booking.id,
          amount_discounted: promoDiscount,
        });
        // Incrémenter le compteur d'utilisations
        const { data: existing } = await supabase
          .from('promo_codes')
          .select('used_count')
          .eq('id', validatedPromo.id)
          .maybeSingle();
        if (existing) {
          await supabase
            .from('promo_codes')
            .update({ used_count: (existing.used_count ?? 0) + 1 })
            .eq('id', validatedPromo.id);
        }
      } catch (promoErr) {
        console.error('⚠️ Promo redemption insert failed (non-blocking):', promoErr);
      }
    }

    // ── Réponse au frontend ───────────────────────────────────────────────────
    return new Response(JSON.stringify({
      success: true,
      booking_id: booking.id,
      confirmation_token: booking.confirmation_token,
      revolut_order_id: revolut.orderId,
      revolut_public_id: revolut.publicId,
      merchant_public_key: getMerchantPublicKey(),
      environment: getEnvMode(),
      amount: sellPrice,
      currency: experience.currency,
      description,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('process-standalone-payment unexpected error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
