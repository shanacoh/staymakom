// Test Edge Function: Compare HyperGuest DEV vs PROD tokens
const ALLOWED_ORIGINS = ['https://staymakom.com','https://www.staymakom.com','https://stay-makom-experiences.lovable.app','http://localhost:5173','http://localhost:8080'];
function getCorsHeaders(req: Request) { const o = req.headers.get('Origin')||''; return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o)?o:ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }; }

const SEARCH_DOMAIN = 'https://search-api.hyperguest.io/2.0/';

async function searchWithToken(token: string, label: string, propertyId: number, checkIn: string) {
  const queryParams = new URLSearchParams({
    checkIn,
    nights: '1',
    guests: '2',
    hotelIds: propertyId.toString(),
    customerNationality: 'IL',
    currency: 'ILS',
  });

  // hotelIds needs to be appended properly
  const url = `${SEARCH_DOMAIN}?checkIn=${checkIn}&nights=1&guests=2&hotelIds=${propertyId}&customerNationality=IL&currency=ILS`;

  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    const elapsed = Date.now() - start;
    const body = await response.text();

    let parsed: any = null;
    try { parsed = JSON.parse(body); } catch (_) {}

    const rooms = parsed?.results?.[0]?.rooms || [];
    
    return {
      label,
      status: response.status,
      elapsed_ms: elapsed,
      rooms_count: rooms.length,
      rooms_summary: rooms.map((r: any) => ({
        name: r.name || r.roomName,
        ratePlans: (r.ratePlans || []).length,
        cheapest: (r.ratePlans || []).reduce((min: number | null, rp: any) => {
          const price = rp?.payment?.chargeAmount?.price ?? rp?.prices?.sell?.price ?? null;
          if (price == null) return min;
          return min === null ? price : Math.min(min, price);
        }, null as number | null),
      })),
      raw_snippet: body.substring(0, 500),
      error: null,
    };
  } catch (err) {
    return {
      label,
      status: 0,
      elapsed_ms: Date.now() - start,
      rooms_count: 0,
      rooms_summary: [],
      raw_snippet: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const tokenDev = Deno.env.get('HYPERGUEST_TOKEN_DEV');
  const tokenProd = Deno.env.get('HYPERGUEST_TOKEN_PROD');
  const tokenCurrent = Deno.env.get('HYPERGUEST_TOKEN') || Deno.env.get('HYPERGUEST_BEARER_TOKEN');

  const url = new URL(req.url);
  const propertyId = parseInt(url.searchParams.get('propertyId') || '53633');
  const checkIn = url.searchParams.get('checkIn') || '2026-04-01';

  const results: any[] = [];

  if (tokenDev) {
    results.push(await searchWithToken(tokenDev, 'DEV', propertyId, checkIn));
  } else {
    results.push({ label: 'DEV', error: 'HYPERGUEST_TOKEN_DEV not configured' });
  }

  if (tokenProd) {
    results.push(await searchWithToken(tokenProd, 'PROD', propertyId, checkIn));
  } else {
    results.push({ label: 'PROD', error: 'HYPERGUEST_TOKEN_PROD not configured' });
  }

  if (tokenCurrent) {
    results.push(await searchWithToken(tokenCurrent, 'CURRENT (HYPERGUEST_BEARER_TOKEN)', propertyId, checkIn));
  }

  return new Response(JSON.stringify({ propertyId, checkIn, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
