// Recherche d'un lieu pour le catalogue du back-office : à partir d'un lien (site, TikTok, Instagram)
// ou d'un nom, retrouve nom, adresse, téléphone, Instagram, description et position.
// Réservée aux administrateurs. La logique est dans lookup.ts ; ce fichier ne fait que le lien
// avec l'extérieur (identification, IA, réseau).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import type { AiMessage } from "./ai.ts";
import { lookup, LookupError, type LookupDeps } from "./lookup.ts";

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

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-3-flash-preview";
const AI_TIMEOUT_MS = 20000;

/** Réponse brute de l'IA (le même accès que la traduction), ou null si elle est indisponible. */
async function askAi(messages: AiMessage[]): Promise<string | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    console.warn("catalogue-lookup: LOVABLE_API_KEY absente, la recherche se fait sans IA");
    return null;
  }
  const response = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, messages, temperature: 0.1 }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.warn("catalogue-lookup: l'IA a répondu", response.status, (await response.text()).slice(0, 200));
    return null;
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

/**
 * Adresses IP d'un domaine, pour refuser ceux qui pointent vers un réseau interne. Renvoie null si la
 * vérification n'est pas permise dans cet environnement : elle ne doit jamais bloquer un site légitime.
 */
async function resolveHost(hostname: string): Promise<string[] | null> {
  const ips: string[] = [];
  let permitted = true;
  for (const type of ["A", "AAAA"] as const) {
    try {
      ips.push(...(await Deno.resolveDns(hostname, type)));
    } catch (error) {
      if (error instanceof Error && /permission|not.*(allowed|supported)|unsupported/i.test(`${error.name} ${error.message}`)) {
        permitted = false;
      }
      // Pas d'enregistrement de ce type : normal (beaucoup de domaines n'ont pas d'IPv6)
    }
  }
  return permitted ? ips : null;
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

    const deps: LookupDeps = { fetchFn: fetch, resolveHost, askAi };
    const result = await lookup(query, knownRegions, deps);
    console.log(`catalogue-lookup: ${result.kind}, ${result.candidates.length} candidat(s), sources: ${result.sources.join(", ")}`);
    return json(req, { ok: true, ...result });
  } catch (error) {
    if (error instanceof LookupError) return json(req, { error: error.message }, error.status);
    console.error("catalogue-lookup: erreur inattendue", error);
    return json(req, { error: "La recherche a échoué, réessaie dans un instant." }, 500);
  }
});
