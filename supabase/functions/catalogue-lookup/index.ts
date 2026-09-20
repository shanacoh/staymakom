// Recherche d'un lieu pour le catalogue du back-office : à partir d'un lien (site, TikTok, Instagram)
// ou d'un nom, retrouve nom, adresse, téléphone, Instagram, description et position.
// Réservée aux administrateurs. La logique est dans _shared/lookup ; ce fichier ne fait que le lien
// avec l'extérieur (identification, réponses web).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { lookup, LookupError } from "../_shared/lookup/lookup.ts";
import { createLookupDeps } from "../_shared/lookup/runtime.ts";

const ALLOWED_ORIGINS = [
  "https://staymakom.com",
  "https://www.staymakom.com",
  "https://stay-makom-experiences.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Réservé aux administrateurs (même contrôle que manage-users)
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json(req, { error: "Connexion requise" }, 401);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) return json(req, { error: "Connexion requise" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json(req, { error: "Réservé aux administrateurs" }, 403);

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query : "";
    const knownRegions: string[] = Array.isArray(body?.known_regions)
      ? body.known_regions.filter((r: unknown): r is string => typeof r === "string").slice(0, 40)
      : [];

    const result = await lookup(query, knownRegions, createLookupDeps());
    console.log(`catalogue-lookup: ${result.kind}, ${result.candidates.length} candidat(s), sources: ${result.sources.join(", ")}`);
    return json(req, { ok: true, ...result });
  } catch (error) {
    if (error instanceof LookupError) return json(req, { error: error.message }, error.status);
    console.error("catalogue-lookup: erreur inattendue", error);
    return json(req, { error: "La recherche a échoué, réessaie dans un instant." }, 500);
  }
});
