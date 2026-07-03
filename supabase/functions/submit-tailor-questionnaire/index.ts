import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const ALLOWED_ORIGINS = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  'https://stay-makom-experiences.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { token, action, dates, region, otherRegion } = body;

    if (!token || !UUID_REGEX.test(token)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, first_name, name, metadata, status')
      .eq('metadata->>questionnaire_token', token);

    if (fetchError) {
      console.error('DB error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lead = leads[0];
    const firstName = lead.first_name || (lead.name ? lead.name.split(' ')[0] : null);
    const alreadyFilled = !!lead.metadata?.questionnaire_filled_at;

    // Lookup mode: personalize the form and check if already filled
    if (action === 'lookup') {
      return new Response(
        JSON.stringify({ valid: true, firstName, alreadyFilled }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Submit mode
    if (!dates || !region) {
      return new Response(
        JSON.stringify({ success: false, error: 'dates and region are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filledAt = new Date().toISOString();
    const updatedMetadata = {
      ...(lead.metadata || {}),
      questionnaire_filled_at: filledAt,
      questionnaire_data: {
        dates: (dates as string).trim(),
        region,
        ...(region === 'Other' && otherRegion ? { otherRegion: (otherRegion as string).trim() } : {}),
      },
    };

    const updates: Record<string, unknown> = { metadata: updatedMetadata };
    if (lead.status === 'new' || !lead.status) {
      updates.status = 'contacted';
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', lead.id);

    if (updateError) {
      console.error('Failed to update lead:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save your answers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Questionnaire submitted for lead ${lead.id}`);

    return new Response(
      JSON.stringify({ success: true, firstName }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
