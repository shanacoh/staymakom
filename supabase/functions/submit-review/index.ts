// submit-review — Edge Function
// Reçoit le formulaire déposé sur /avis/:token. Va chercher elle-même la réservation
// liée au token (jamais ce que le navigateur prétend) pour déterminer la fiche à
// rattacher, le prestataire, et si un compte client existe (pour créditer les Traces).
// 50 Traces créditées pour tout avis déposé, quelle que soit la note, uniquement si
// un compte client est identifié (impossible de créditer sans compte).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TRACES_PER_REVIEW = 50;

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
  const origin = req.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => (typeof o === 'string' ? o === origin : o.test(origin)));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://staymakom.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function splitName(fullName: string | null): { first: string; lastInitial: string | null } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'Client', lastInitial: null };
  if (parts.length === 1) return { first: parts[0], lastInitial: null };
  return { first: parts[0], lastInitial: parts[parts.length - 1].charAt(0).toUpperCase() };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { token, rating, comment, consent_to_publish, photo_url } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'token manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (rating == null && !comment) {
      return new Response(JSON.stringify({ error: 'Note ou commentaire requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: request, error: requestError } = await supabase
      .from('review_requests')
      .select('id, status, lang, booking_type, booking_id')
      .eq('token', token)
      .maybeSingle();

    if (requestError || !request) {
      return new Response(JSON.stringify({ error: 'Lien introuvable ou expiré' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (request.status === 'submitted') {
      return new Response(JSON.stringify({ error: 'Un avis a déjà été déposé avec ce lien' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let scope: 'standalone_experience' | 'experience2';
    let standaloneExperienceId: string | null = null;
    let experience2Id: string | null = null;
    let providerId: string | null = null;
    let customerName: string | null = null;
    let customerEmail: string | null = null;
    let customerPhone: string | null = null;
    let customerUserId: string | null = null;

    if (request.booking_type === 'standalone_bookings') {
      const { data: booking } = await supabase
        .from('standalone_bookings')
        .select('customer_name, customer_email, customer_phone, user_id, standalone_experience_id, provider_id')
        .eq('id', request.booking_id)
        .maybeSingle();
      if (!booking) {
        return new Response(JSON.stringify({ error: 'Réservation introuvable' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      scope = 'standalone_experience';
      standaloneExperienceId = booking.standalone_experience_id;
      providerId = booking.provider_id;
      customerName = booking.customer_name;
      customerEmail = booking.customer_email;
      customerPhone = booking.customer_phone;
      customerUserId = booking.user_id;
    } else {
      const { data: booking } = await supabase
        .from('bookings_hg')
        .select('customer_name, customer_email, user_id, experience_id')
        .eq('id', request.booking_id)
        .maybeSingle();
      if (!booking) {
        return new Response(JSON.stringify({ error: 'Réservation introuvable' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      scope = 'experience2';
      experience2Id = booking.experience_id;
      customerName = booking.customer_name;
      customerEmail = booking.customer_email;
      customerUserId = booking.user_id;
    }

    const { first, lastInitial } = splitName(customerName);

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        scope,
        standalone_experience_id: standaloneExperienceId,
        experience2_id: experience2Id,
        provider_id: providerId,
        booking_type: request.booking_type,
        booking_id: request.booking_id,
        customer_first_name: first,
        customer_last_initial: lastInitial,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_user_id: customerUserId,
        rating: rating ?? null,
        comment: comment || null,
        lang: request.lang,
        photo_url: photo_url || null,
        consent_to_publish: !!consent_to_publish,
        moderation_status: 'pending',
        source: 'auto_link',
        review_date: new Date().toISOString().split('T')[0],
      })
      .select('id')
      .single();

    if (insertError || !review) {
      console.error('submit-review insert error:', insertError);
      return new Response(JSON.stringify({ error: "Impossible d'enregistrer l'avis" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase
      .from('review_requests')
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), review_id: review.id })
      .eq('id', request.id);

    // Traces créditées pour tout avis déposé, quelle que soit la note — seulement si un compte existe.
    if (customerUserId) {
      await supabase.from('loyalty_points').insert({
        user_id: customerUserId,
        points: TRACES_PER_REVIEW,
        action: 'avis_laisse',
        description: 'Avis déposé après une expérience',
        reference_id: review.id,
        reference_type: 'review',
      });
      await supabase.from('reviews').update({ traces_awarded: true }).eq('id', review.id);
    }

    return new Response(JSON.stringify({ success: true, tracesAwarded: !!customerUserId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('submit-review error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
