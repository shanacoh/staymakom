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

    // Handle simple email collection from AI assistant or coming soon page
    if (['ai_assistant_save', 'coming_soon', 'category_waitlist', 'tailored_request'].includes(requestData.source)) {
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
