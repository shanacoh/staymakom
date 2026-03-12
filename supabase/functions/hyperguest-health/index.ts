// HyperGuest Health Check Edge Function
// Runs hourly via cron to monitor integration health
// Saves results to health_checks table and creates alerts if unhealthy

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // CHECK 1 — Edge Function hyperguest accessible + search works
  try {
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setMonth(checkIn.getMonth() + 5);
    const checkInStr = checkIn.toISOString().split('T')[0];

    const start = Date.now();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/hyperguest?action=search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({
        checkIn: checkInStr,
        nights: 1,
        guests: '2',
        hotelIds: [23860],
      }),
    });
    const duration = Date.now() - start;
    const data = await response.json();
    const rooms = data?.rooms || data?.data?.rooms || data?.result?.data?.rooms || [];

    results.checks.edgeFunction = {
      pass: response.ok,
      duration,
      status: response.status,
    };

    results.checks.searchWorks = {
      pass: rooms.length > 0,
      roomCount: rooms.length,
    };

    const errorStr = JSON.stringify(data?.error || '');
    results.checks.tokenValid = {
      pass: !errorStr.includes('401') && !errorStr.includes('403') && !errorStr.includes('Unauthorized'),
    };

    results.checks.isProduction = {
      pass: data?.isTest === false || !data?.isTest,
      isTest: data?.isTest,
    };
  } catch (e: any) {
    results.checks.edgeFunction = { pass: false, error: e.message };
    results.checks.searchWorks = { pass: false, error: 'Edge function failed' };
    results.checks.tokenValid = { pass: false, error: 'Could not verify' };
    results.checks.isProduction = { pass: false, error: 'Could not verify' };
  }

  // CHECK 2 — Verify ENVIRONMENT secret is production
  const envMode = (Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  results.checks.envVariable = {
    pass: ['production', 'prod', 'live'].includes(envMode),
    value: envMode || 'NOT SET',
  };

  // CHECK 3 — Verify HYPERGUEST_TOKEN_PROD exists
  const tokenProd = Deno.env.get('HYPERGUEST_TOKEN_PROD') || '';
  results.checks.tokenExists = {
    pass: tokenProd.length > 10,
    lastChars: tokenProd.slice(-8),
  };

  // Calculate global status
  const allChecks = Object.values(results.checks) as any[];
  const allPass = allChecks.every((c: any) => c.pass);
  const failures = allChecks.filter((c: any) => !c.pass);
  results.status = allPass ? 'healthy' : 'unhealthy';
  results.failCount = failures.length;

  // Save to health_checks table
  const { error: insertError } = await supabase.from('health_checks').insert({
    status: results.status,
    results: results,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('Failed to save health check:', insertError);
  }

  // If unhealthy, create an alert
  if (!allPass) {
    const failedCheckNames = Object.entries(results.checks)
      .filter(([_, v]: [string, any]) => !v.pass)
      .map(([k, _]) => k)
      .join(', ');

    await supabase.from('alerts').insert({
      type: 'hyperguest_health',
      severity: 'critical',
      message: `HyperGuest health check FAILED: ${failures.length} check(s) en erreur (${failedCheckNames})`,
      details: results,
      resolved: false,
      created_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
