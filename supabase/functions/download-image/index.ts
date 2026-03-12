import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ['https://staymakom.com','https://www.staymakom.com','https://stay-makom-experiences.lovable.app','http://localhost:5173','http://localhost:8080'];
function getCorsHeaders(req: Request) { const o = req.headers.get('Origin')||''; return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o)?o:ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }; }

// Build fetch headers — add HyperGuest auth when needed
function getFetchHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (url.includes("hyperguest.com") || url.includes("hyperguest.io")) {
    const token = Deno.env.get("HYPERGUEST_BEARER_TOKEN");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // Some CDNs check referer/user-agent for hotlink protection
    headers["Referer"] = "https://hyperguest.com/";
    headers["User-Agent"] = "Mozilla/5.0 (compatible; StaymakomBot/1.0)";
    headers["Accept"] = "image/webp,image/jpeg,image/png,image/*,*/*";
  }
  return headers;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, bucket, path, returnBase64 } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required field: imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fetchHeaders = getFetchHeaders(imageUrl);

    // --- Mode 1: Return base64 for preview (no storage upload) ---
    if (returnBase64) {
      console.log(`[download-image] Proxying for preview: ${imageUrl}`);
      const imageResponse = await fetch(imageUrl, { headers: fetchHeaders });
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const arrayBuf = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      const uint8 = new Uint8Array(arrayBuf);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);
      return new Response(
        JSON.stringify({ base64, contentType }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Mode 2: Download & upload to storage ---
    if (!bucket || !path) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: bucket, path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[download-image] Downloading: ${imageUrl}`);

    const imageResponse = await fetch(imageUrl, { headers: fetchHeaders });
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    console.log(`[download-image] Downloaded ${imageBlob.size} bytes, type: ${contentType}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, imageBlob, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`[download-image] Upload error:`, error);
      throw error;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    console.log(`[download-image] Uploaded to: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        publicUrl: urlData.publicUrl,
        path: data.path 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[download-image] Error:`, message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
