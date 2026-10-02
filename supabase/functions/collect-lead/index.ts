import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const ALLOWED_ORIGINS = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  'https://stay-makom-experiences.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

// Calcule le prochain moment où la réponse automatique peut partir : décalé de quelques minutes,
// jamais la nuit (22h-7h heure d'Israël), jamais pendant Shabbat (approximation prudente :
// vendredi dès 15h jusqu'à samedi minuit — plus large que l'horaire réel pour ne jamais tomber juste).
function estMomentConvenable(date: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem', weekday: 'short', hour: 'numeric', hour12: false,
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const heure = Number(parts.find((p) => p.type === 'hour')?.value ?? '12');
  const estShabbat = (weekday === 'Fri' && heure >= 15) || weekday === 'Sat';
  const estNuit = heure >= 22 || heure < 7;
  return !estShabbat && !estNuit;
}

function prochainMomentConvenable(depuis: Date): Date {
  let candidat = new Date(depuis.getTime() + 5 * 60 * 1000); // décalé de 5 minutes
  for (let garde = 0; garde < 48; garde++) {
    if (estMomentConvenable(candidat)) return candidat;
    candidat = new Date(candidat.getTime() + 60 * 60 * 1000);
  }
  return candidat;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Validation constants
const VALID_B2C_INTERESTS = [
  'Romantic gateway',
  'Family trip',
  'Wellness & Spa',
  'Sport activities',
  'Foodie experiences',
  'Cultural heritage',
  'Active Senior',
  'Artistic journey',
  'Business & Leisure',
  'Fun remote working trip'
];

const VALID_B2B_PROPERTY_TYPES = [
  'Guesthouse',
  'Boutique hotel',
  'Vacation rental',
  'Farm stay',
  'Spa resort',
  'Other'
];

const VALID_COUNTRIES = [
  'France', 'Israel', 'United States', 'United Kingdom', 'Germany', 
  'Spain', 'Italy', 'Belgium', 'Switzerland', 'Netherlands',
  'Canada', 'Australia', 'Japan', 'Other'
];

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateB2CLead(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('firstName is required');
  } else if (data.firstName.length > 100) {
    errors.push('firstName must be less than 100 characters');
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('lastName is required');
  } else if (data.lastName.length > 100) {
    errors.push('lastName must be less than 100 characters');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  } else if (data.email.length > 255) {
    errors.push('Email must be less than 255 characters');
  }

  if (!data.country || !VALID_COUNTRIES.includes(data.country)) {
    errors.push('Valid country is required');
  }

  if (!Array.isArray(data.interests) || data.interests.length === 0) {
    errors.push('At least one interest is required');
  } else {
    const invalidInterests = data.interests.filter(
      (interest: string) => !VALID_B2C_INTERESTS.includes(interest) && interest !== 'Other'
    );
    if (invalidInterests.length > 0) {
      errors.push(`Invalid interests: ${invalidInterests.join(', ')}`);
    }
  }

  if (data.otherInterest && data.otherInterest.length > 200) {
    errors.push('otherInterest must be less than 200 characters');
  }

  if (typeof data.optIn !== 'boolean') {
    errors.push('optIn must be a boolean');
  }

  return { valid: errors.length === 0, errors };
}

function validateB2BLead(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('firstName is required');
  } else if (data.firstName.length > 100) {
    errors.push('firstName must be less than 100 characters');
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('lastName is required');
  } else if (data.lastName.length > 100) {
    errors.push('lastName must be less than 100 characters');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  } else if (data.email.length > 255) {
    errors.push('Email must be less than 255 characters');
  }

  if (!data.country || !VALID_COUNTRIES.includes(data.country)) {
    errors.push('Valid country is required');
  }

  if (!data.propertyName || data.propertyName.trim().length === 0) {
    errors.push('propertyName is required');
  } else if (data.propertyName.length > 200) {
    errors.push('propertyName must be less than 200 characters');
  }

  if (!data.type || !VALID_B2B_PROPERTY_TYPES.includes(data.type)) {
    errors.push('Valid property type is required');
  }

  if (typeof data.optIn !== 'boolean') {
    errors.push('optIn must be a boolean');
  }

  if (data.phone && data.phone.length > 50) {
    errors.push('phone must be less than 50 characters');
  }

  if (data.city && data.city.length > 100) {
    errors.push('city must be less than 100 characters');
  }

  if (data.message && data.message.length > 1000) {
    errors.push('message must be less than 1000 characters');
  }

  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData = await req.json();
    console.log('Received lead data:', { ...requestData, email: '***' });

    // Handle step 2 enrichment: update existing tailored_request lead with extra preferences
    if (requestData.source === 'tailored_request' && requestData.leadId) {
      const { data: existing, error: fetchError } = await supabase
        .from('leads')
        .select('id, metadata')
        .eq('id', requestData.leadId)
        .single();

      if (fetchError || !existing) {
        console.error('Lead not found for step 2 update:', requestData.leadId);
        return new Response(
          JSON.stringify({ success: false, error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const mergedMetadata = { ...(existing.metadata || {}), ...(requestData.metadata || {}) };

      const { error: updateError } = await supabase
        .from('leads')
        .update({ metadata: mergedMetadata })
        .eq('id', requestData.leadId);

      if (updateError) {
        console.error('Failed to update lead metadata:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update lead' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Enrichit aussi la ligne de suivi dans l'onglet Itinéraires du back-office
      // (étape 2 du formulaire : ambiance, période, budget, souhaits). Ne bloque
      // jamais la réponse au client si cette écriture secondaire échoue.
      const itineraryUpdates: Record<string, unknown> = {};
      if (requestData.metadata?.moods !== undefined) itineraryUpdates.moods = requestData.metadata.moods;
      if (requestData.metadata?.timing) itineraryUpdates.timing = requestData.metadata.timing;
      if (requestData.metadata?.budget) itineraryUpdates.budget_hint = requestData.metadata.budget;
      if (requestData.metadata?.description) itineraryUpdates.description = requestData.metadata.description;
      if (Object.keys(itineraryUpdates).length > 0) {
        const { error: itineraryError } = await supabase
          .from('itinerary_requests')
          .update(itineraryUpdates)
          .eq('lead_id', requestData.leadId);
        if (itineraryError) console.error('Failed to enrich itinerary_requests (non-blocking):', itineraryError);
      }

      // Enrichit aussi le dossier de voyage correspondant (chantier Dossier de voyage).
      // Même principe : best-effort, ne bloque jamais la réponse au client.
      const briefUpdates: Record<string, unknown> = {};
      if (requestData.metadata?.moods !== undefined) briefUpdates.moods = requestData.metadata.moods;
      if (requestData.metadata?.timing) briefUpdates.timing = requestData.metadata.timing;
      if (requestData.metadata?.budget) briefUpdates.budget = requestData.metadata.budget;
      if (requestData.metadata?.description) briefUpdates.description = requestData.metadata.description;
      if (Object.keys(briefUpdates).length > 0) {
        const { data: dossierRows, error: dossierFindError } = await supabase
          .from('dossiers_voyage')
          .select('id, brief_data')
          .eq('lead_id', requestData.leadId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (dossierFindError) {
          console.error('Failed to find dossiers_voyage row to enrich (non-blocking):', dossierFindError);
        } else if (dossierRows && dossierRows.length > 0) {
          const dossierRow = dossierRows[0];
          const mergedBriefData = { ...((dossierRow.brief_data as Record<string, unknown>) || {}), ...briefUpdates };
          const { error: dossierUpdateError } = await supabase
            .from('dossiers_voyage')
            .update({ brief_data: mergedBriefData })
            .eq('id', dossierRow.id);
          if (dossierUpdateError) {
            console.error('Failed to enrich dossiers_voyage (non-blocking):', dossierUpdateError);
          }
        }
      }

      console.log('tailored_request lead enriched (step 2):', requestData.leadId);
      return new Response(
        JSON.stringify({ success: true, leadId: requestData.leadId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle simple email collection from AI assistant or coming soon page
    if (['ai_assistant_save', 'coming_soon', 'category_waitlist', 'tailored_request', 'newsletter_popup', 'experience_only'].includes(requestData.source)) {
      if (!requestData.email || !validateEmail(requestData.email)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valid email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const leadRecord: any = {
        source: requestData.source,
        email: requestData.email.toLowerCase().trim(),
        cta_id: requestData.cta_id || null,
        metadata: requestData.metadata || {},
        marketing_opt_in: true,
        is_b2b: false,
      };

      // For tailored_request, also store name and phone
      if (requestData.source === 'tailored_request') {
        if (requestData.firstName) leadRecord.first_name = requestData.firstName.trim();
        if (requestData.lastName) leadRecord.last_name = requestData.lastName.trim();
        if (requestData.firstName && requestData.lastName) {
          leadRecord.name = `${requestData.firstName.trim()} ${requestData.lastName.trim()}`;
        }
        if (requestData.phone) leadRecord.phone = requestData.phone.trim();
      }

      // For experience_only (ex: demandes bateaux), le nom arrive déjà complet
      // (pas de split prénom/nom côté formulaire de demande).
      if (requestData.source === 'experience_only') {
        if (requestData.name) leadRecord.name = requestData.name.trim();
        if (requestData.phone) leadRecord.phone = requestData.phone.trim();
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([leadRecord])
        .select('id')
        .single();

      if (error) {
        console.error('Database insertion error:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to save email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`${requestData.source} lead saved:`, data.id);

      // Crée la ligne de suivi correspondante dans l'onglet Itinéraires du
      // back-office. Best-effort : ne bloque jamais la réponse au client.
      if (requestData.source === 'tailored_request') {
        const { error: itineraryError } = await supabase.from('itinerary_requests').insert([{
          lead_id: data.id,
          customer_name: leadRecord.name || leadRecord.email,
          customer_email: leadRecord.email,
          customer_phone: leadRecord.phone || null,
          occasion: requestData.metadata?.occasion || null,
          party_size: requestData.metadata?.people || null,
        }]);
        if (itineraryError) console.error('Failed to create itinerary_requests row (non-blocking):', itineraryError);

        // Crée aussi le dossier de voyage correspondant (chantier Dossier de voyage,
        // destiné à remplacer à terme l'onglet Itinéraires ci-dessus). Même principe :
        // best-effort, ne bloque jamais la réponse au client.
        const { error: dossierError } = await supabase.from('dossiers_voyage').insert([{
          nom_destinataire: leadRecord.name || leadRecord.email,
          email: leadRecord.email,
          telephone: leadRecord.phone || null,
          lead_id: data.id,
          destinataire_type: 'client',
          objectif: 'vente',
          point_depart: 'proposition',
          canal_origine: 'formulaire_site',
          statut: 'nouvelle_demande',
          brief_data: {
            occasion: requestData.metadata?.occasion || null,
            nb_personnes: requestData.metadata?.people || null,
          },
          autoreply_envoyer_apres: prochainMomentConvenable(new Date()).toISOString(),
        }]);
        if (dossierError) console.error('Failed to create dossiers_voyage row (non-blocking):', dossierError);
      }

      return new Response(
        JSON.stringify({ success: true, leadId: data.id }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isB2B = !!requestData.propertyName;
    const validation = isB2B 
      ? validateB2BLead(requestData) 
      : validateB2CLead(requestData);

    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Validation failed', 
          details: validation.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const leadData: any = {
      source: 'landing_page',
      first_name: requestData.firstName.trim(),
      last_name: requestData.lastName.trim(),
      name: `${requestData.firstName.trim()} ${requestData.lastName.trim()}`,
      email: requestData.email.toLowerCase().trim(),
      country: requestData.country,
      marketing_opt_in: requestData.optIn,
      is_b2b: isB2B,
      cta_id: requestData.cta_id || null,
    };

    if (isB2B) {
      leadData.property_name = requestData.propertyName.trim();
      leadData.property_type = requestData.type;
      leadData.phone = requestData.phone?.trim() || null;
      leadData.city = requestData.city?.trim() || null;
      leadData.message = requestData.message?.trim() || null;
      leadData.metadata = {};
    } else {
      leadData.interests = requestData.interests;
      leadData.metadata = requestData.otherInterest 
        ? { otherInterest: requestData.otherInterest.trim() } 
        : {};
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select('id')
      .single();

    if (error) {
      console.error('Database insertion error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create lead',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Lead created successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: data.id,
        message: 'Lead created successfully'
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
