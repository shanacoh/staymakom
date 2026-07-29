// create-standalone-manual-booking — Edge Function
// Permet à un admin de saisir une réservation "Experience Only" pour un client
// contacté en direct (téléphone, WhatsApp, email). Crée la ligne
// standalone_bookings (status confirmed / payment_status pending, source
// manual_admin) SANS envoyer l'email : Shana décide plus tard, depuis la fiche
// détail, de marquer le paiement (intégral ou acompte) puis d'envoyer
// l'email de confirmation.

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
  const origin = req.headers.get('Origin') || '';
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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ── Vérifier que l'appelant est admin ────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      experience_id,
      custom_experience_title,
      booking_date,
      time_slot,
      selected_rate_option_id,
      adults: adultsRaw,
      children: childrenRaw,
      customer_name,
      customer_email,
      customer_phone,
      sell_price,
      supplier_cost,
      currency,
      internal_notes,
      custom_regulations,
      custom_address,
    } = body;

    const adults: number = typeof adultsRaw === 'number' ? adultsRaw : 1;
    const children: number = typeof childrenRaw === 'number' ? childrenRaw : 0;
    const totalParty = adults + children;
    const isCustomExperience = !experience_id;

    if ((!experience_id && !custom_experience_title) || !booking_date || !customer_name || !customer_email) {
      return new Response(JSON.stringify({ error: 'Champs requis manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (adults < 1) {
      return new Response(JSON.stringify({ error: 'Au moins 1 adulte est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof sell_price !== 'number' || sell_price < 0) {
      return new Response(JSON.stringify({ error: 'Prix total invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (supplier_cost != null && (typeof supplier_cost !== 'number' || supplier_cost < 0)) {
      return new Response(JSON.stringify({ error: 'Coût prestataire invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Expérience hors catalogue : pas de validations catalogue ─────────────
    if (isCustomExperience) {
      if (!currency) {
        return new Response(JSON.stringify({ error: 'Devise requise' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: booking, error: bookingError } = await supabase
        .from('standalone_bookings')
        .insert([{
          standalone_experience_id: null,
          custom_experience_title,
          customer_name,
          customer_email,
          customer_phone: customer_phone || null,
          booking_date,
          time_slot: time_slot || null,
          party_size: totalParty,
          adults_count: adults,
          children_count: children,
          sell_price,
          supplier_cost: supplier_cost ?? null,
          currency,
          status: 'confirmed',
          payment_status: 'pending',
          source: 'manual_admin',
          internal_notes: internal_notes || null,
          custom_regulations: custom_regulations || null,
          custom_address: custom_address || null,
        }])
        .select('id, confirmation_token')
        .single();

      if (bookingError || !booking) {
        console.error('Erreur création réservation manuelle (hors catalogue):', bookingError);
        return new Response(JSON.stringify({ error: 'Impossible de créer la réservation' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        booking_id: booking.id,
        confirmation_token: booking.confirmation_token,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Récupérer l'expérience du catalogue ───────────────────────────────────
    const { data: experience, error: expError } = await supabase
      .from('standalone_experiences')
      .select('id, currency, min_party, max_party, has_time_slots, time_slots, has_rate_options')
      .eq('id', experience_id)
      .single();

    if (expError || !experience) {
      return new Response(JSON.stringify({ error: 'Expérience introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (totalParty < experience.min_party || totalParty > experience.max_party) {
      return new Response(JSON.stringify({
        error: `Groupe de ${totalParty} personnes non accepté (min ${experience.min_party}, max ${experience.max_party})`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let validatedTimeSlot: string | null = null;
    if (experience.has_time_slots) {
      const availableSlots: string[] = Array.isArray(experience.time_slots) ? experience.time_slots : [];
      if (!time_slot || !availableSlots.includes(time_slot)) {
        return new Response(JSON.stringify({ error: 'Créneau horaire invalide ou non sélectionné' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      validatedTimeSlot = time_slot;
    }

    let selectedRateOption: { id: string; label: string; label_fr: string | null; label_he: string | null; price_adult: number; price_child: number | null } | null = null;
    if (experience.has_rate_options) {
      if (!selected_rate_option_id) {
        return new Response(JSON.stringify({ error: 'Option tarifaire invalide ou non sélectionnée' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: rateOptionRow } = await supabase
        .from('standalone_rate_options')
        .select('id, label, label_fr, label_he, price_adult, price_child')
        .eq('id', selected_rate_option_id)
        .eq('experience_id', experience_id)
        .maybeSingle();
      if (!rateOptionRow) {
        return new Response(JSON.stringify({ error: 'Option tarifaire invalide ou non sélectionnée' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      selectedRateOption = rateOptionRow;
    }

    // ── Créer la réservation, déjà confirmée et payée ─────────────────────────
    const { data: booking, error: bookingError } = await supabase
      .from('standalone_bookings')
      .insert([{
        standalone_experience_id: experience_id,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        booking_date,
        time_slot: validatedTimeSlot,
        party_size: totalParty,
        adults_count: adults,
        children_count: children,
        sell_price,
        supplier_cost: supplier_cost ?? null,
        currency: currency || experience.currency,
        status: 'confirmed',
        payment_status: 'pending',
        source: 'manual_admin',
        rate_option: selectedRateOption,
        internal_notes: internal_notes || null,
        custom_regulations: custom_regulations || null,
        custom_address: custom_address || null,
      }])
      .select('id, confirmation_token')
      .single();

    if (bookingError || !booking) {
      console.error('Erreur création réservation manuelle:', bookingError);
      return new Response(JSON.stringify({ error: 'Impossible de créer la réservation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id: booking.id,
      confirmation_token: booking.confirmation_token,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('create-standalone-manual-booking error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
