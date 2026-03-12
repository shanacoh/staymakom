import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = ['https://staymakom.com','https://www.staymakom.com','https://stay-makom-experiences.lovable.app','http://localhost:5173','http://localhost:8080'];
function getCorsHeaders(req: Request) { const o = req.headers.get('Origin')||''; return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o)?o:ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }; }

interface GeocodeRequest {
  address: string;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = (await req.json()) as GeocodeRequest;

    if (!address || address.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Address is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Geocoding address: ${address}`);

    // Call Nominatim (OpenStreetMap) geocoding API
    const encodedAddress = encodeURIComponent(address);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "StayMakom/1.0 (contact@staymakom.com)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: "Geocoding service unavailable" }),
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      console.log(`No results found for address: ${address}`);
      return new Response(
        JSON.stringify({ error: "No location found for this address" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const result = results[0];
    const geocodeResult: GeocodeResult = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
    };

    console.log(`Geocoding successful: ${geocodeResult.latitude}, ${geocodeResult.longitude}`);

    return new Response(
      JSON.stringify(geocodeResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to geocode address" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
