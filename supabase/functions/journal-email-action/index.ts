// Liens de l'email du Journal, sans connexion (le jeton de l'email suffit) :
//  - « Rejeter » (/journal-action?t=...) : jeton à usage unique, 24 h ; vérification et rejet
//    dans la même transaction (fonction journal_reject_by_token de la base).
//  - « Aperçu » (/journal-action/apercu?t=..., action "preview") : jeton à part, en lecture
//    seule, réutilisable 7 jours (fonction journal_post_by_preview_token) ; renvoie le brouillon.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

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

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
  if (req.method !== "POST") return reply({ error: "Méthode non autorisée" }, 405);

  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!/^[0-9a-f]{64}$/.test(token)) return reply({ result: "invalid" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (body?.action === "preview") {
    const { data, error } = await db.rpc("journal_post_by_preview_token", { p_token_hash: await sha256Hex(token) });
    if (error) {
      console.error("journal-email-action (aperçu):", error.message);
      return reply({ error: "Erreur temporaire, réessaie dans un instant." }, 500);
    }
    return reply(data ? { result: "ok", post: data } : { result: "invalid" });
  }

  const { data, error } = await db.rpc("journal_reject_by_token", { p_token_hash: await sha256Hex(token) });
  if (error) {
    console.error("journal-email-action:", error.message);
    return reply({ error: "Erreur temporaire, réessaie dans un instant." }, 500);
  }
  return reply({ result: data });
});
