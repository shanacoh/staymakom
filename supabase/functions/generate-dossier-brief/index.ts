// Étape 4 du chantier "Dossier de voyage" : à partir du texte brut reçu (WhatsApp/email transféré,
// ou saisi à la main) sur un dossier, demande à l'IA d'en extraire un brief structuré (dates, nombre
// de voyageurs, budget, régions, contraintes, envies), avec les points incertains et les questions à
// poser au client. Réservée aux administrateurs (même contrôle que catalogue-lookup).
//
// Contrairement à collect-lead (où l'écriture est "best-effort" en plus d'une réponse déjà utile),
// ici l'appel IA EST l'action demandée : si l'IA ne répond pas, on le dit clairement plutôt que de
// continuer silencieusement.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.127.0";

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

const AI_TIMEOUT_MS = 25000;
const DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GATEWAY_MODEL = "google/gemini-2.5-flash";

interface AiMessage {
  role: "system" | "user";
  content: string;
}

async function askClaude(apiKey: string, messages: AiMessage[]): Promise<string | null> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const userMessages = messages.filter((m) => m.role === "user").map((m) => ({ role: "user" as const, content: m.content }));
  const client = new Anthropic({ apiKey, timeout: AI_TIMEOUT_MS, maxRetries: 1 });
  try {
    const response = await client.messages.create({
      model: Deno.env.get("DOSSIER_BRIEF_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
      max_tokens: 1500,
      system,
      messages: userMessages,
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((block) => block.type === "text");
    return text && "text" in text ? text.text : null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.warn("generate-dossier-brief: Claude a répondu", error.status, error.message.slice(0, 200));
    } else {
      console.warn("generate-dossier-brief: Claude injoignable", error instanceof Error ? error.message : error);
    }
    return null;
  }
}

async function askGateway(key: string, messages: AiMessage[]): Promise<string | null> {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GATEWAY_MODEL, messages, temperature: 0.2, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.warn("generate-dossier-brief: la passerelle IA a répondu", response.status, (await response.text()).slice(0, 200));
    return null;
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

async function askAi(messages: AiMessage[]): Promise<string | null> {
  const claudeKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (claudeKey) return askClaude(claudeKey, messages);
  const gatewayKey = Deno.env.get("LOVABLE_API_KEY");
  if (gatewayKey) return askGateway(gatewayKey, messages);
  console.warn("generate-dossier-brief: aucune clé IA configurée (ANTHROPIC_API_KEY ou LOVABLE_API_KEY)");
  return null;
}

interface BriefExtrait {
  dates_arrivee: string | null;
  dates_depart: string | null;
  nb_voyageurs: number | null;
  budget_estime: number | null;
  devise: string | null;
  regions: string[];
  langue: "fr" | "en" | "he" | null;
  contraintes: string | null;
  envies: string | null;
  incertitudes: string[];
  questions_a_poser: string[];
  message_whatsapp: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Extrait le premier objet JSON du texte renvoyé par l'IA, puis nettoie/valide chaque champ (jamais d'exception : un champ douteux devient simplement vide). */
function parseBrief(raw: string): BriefExtrait | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  const str = (v: unknown, max = 2000): string | null => {
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length === 0 ? null : t.slice(0, max);
  };
  const date = (v: unknown): string | null => (typeof v === "string" && DATE_RE.test(v) ? v : null);
  const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
  const strArray = (v: unknown, max = 8): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 300)).slice(0, max)
      : [];
  const langue = (v: unknown): "fr" | "en" | "he" | null => (v === "fr" || v === "en" || v === "he" ? v : null);

  return {
    dates_arrivee: date(o.dates_arrivee),
    dates_depart: date(o.dates_depart),
    nb_voyageurs: num(o.nb_voyageurs),
    budget_estime: num(o.budget_estime),
    devise: str(o.devise, 10),
    regions: strArray(o.regions, 10),
    langue: langue(o.langue),
    contraintes: str(o.contraintes),
    envies: str(o.envies),
    incertitudes: strArray(o.incertitudes, 10),
    questions_a_poser: strArray(o.questions_a_poser, 8),
    message_whatsapp: str(o.message_whatsapp, 1500),
  };
}

function buildPrompt(texte: string, nomDestinataire: string, historique: string): AiMessage[] {
  const system = `Tu es l'assistant de Shana, qui prépare des voyages sur mesure en Israël pour l'agence Staymakom.
Tu reçois un message brut (WhatsApp transféré, email transféré, ou texte saisi à la main) envoyé par un client ou un prospect.
Ta tâche : en extraire un brief structuré pour préparer son voyage.

Réponds UNIQUEMENT avec un objet JSON (rien avant, rien après), avec exactement ces champs :
{
  "dates_arrivee": "YYYY-MM-DD" ou null si pas de date précise,
  "dates_depart": "YYYY-MM-DD" ou null,
  "nb_voyageurs": nombre entier ou null,
  "budget_estime": nombre (sans symbole monétaire) ou null,
  "devise": "ILS" | "USD" | "EUR" ou null,
  "regions": [liste courte de régions ou villes d'Israël mentionnées ou clairement sous-entendues],
  "langue": "fr" | "en" | "he" (langue du message reçu),
  "contraintes": texte court résumant les contraintes (casher, mobilité réduite, allergies, Shabbat...) ou null si aucune,
  "envies": texte court résumant ce que recherche le client (ambiance, type de voyage, occasion) ou null,
  "incertitudes": [liste courte de ce qui n'est pas clair ou pourrait être mal compris, en français, à l'intention de Shana],
  "questions_a_poser": [liste de 2 à 5 questions concrètes et naturelles à poser au client pour combler ce qui manque, dans la langue du message],
  "message_whatsapp": "un seul message, prêt à copier-coller, chaleureux et naturel, dans la langue du message reçu, signé Shana, qui pose les questions de la liste précédente"
}

Le texte reçu peut être dans n'importe quelle langue (français, anglais, hébreu...). Ne jamais inventer d'information absente du texte : laisse le champ vide/null plutôt que de deviner.`;

  const userParts = [
    `Destinataire : ${nomDestinataire}`,
    historique ? `Historique connu de ce client avec Staymakom :\n${historique}` : null,
    `Message reçu à analyser :\n"""\n${texte}\n"""`,
  ].filter(Boolean);

  return [
    { role: "system", content: system },
    { role: "user", content: userParts.join("\n\n") },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Réservé aux administrateurs (même contrôle que catalogue-lookup)
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json(req, { error: "Connexion requise" }, 401);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) return json(req, { error: "Connexion requise" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json(req, { error: "Réservé aux administrateurs" }, 403);

    const body = await req.json().catch(() => ({}));
    const dossierId = typeof body?.dossierId === "string" ? body.dossierId : null;
    if (!dossierId) return json(req, { error: "dossierId manquant" }, 400);

    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers_voyage")
      .select("id, nom_destinataire, email, contenu_brut_recu")
      .eq("id", dossierId)
      .single();
    if (dossierError || !dossier) return json(req, { error: "Dossier introuvable" }, 404);
    if (!dossier.contenu_brut_recu || !dossier.contenu_brut_recu.trim()) {
      return json(req, { error: "Ce dossier n'a pas de message à analyser" }, 400);
    }

    // Historique : les autres dossiers déjà connus pour le même email, pour donner du contexte à l'IA.
    let historique = "";
    if (dossier.email) {
      const { data: passes } = await supabase
        .from("dossiers_voyage")
        .select("nom_destinataire, created_at, statut, dates_arrivee, dates_depart")
        .eq("email", dossier.email)
        .neq("id", dossierId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (passes && passes.length > 0) {
        historique = passes
          .map((p) => `- ${p.nom_destinataire}, ${p.created_at.slice(0, 10)}, statut ${p.statut}${p.dates_arrivee ? `, séjour prévu ${p.dates_arrivee} → ${p.dates_depart ?? "?"}` : ""}`)
          .join("\n");
      }
    }

    const messages = buildPrompt(dossier.contenu_brut_recu, dossier.nom_destinataire, historique);
    const raw = await askAi(messages);
    if (!raw) {
      return json(req, { error: "L'IA n'a pas pu générer de brief, réessaie dans un instant." }, 503);
    }
    const brief = parseBrief(raw);
    if (!brief) {
      console.error("generate-dossier-brief: réponse IA non exploitable:", raw.slice(0, 500));
      return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
    }

    const { error: updateError } = await supabase
      .from("dossiers_voyage")
      .update({
        dates_arrivee: brief.dates_arrivee,
        dates_depart: brief.dates_depart,
        nb_voyageurs: brief.nb_voyageurs,
        budget_estime: brief.budget_estime,
        devise: brief.devise || "ILS",
        regions: brief.regions,
        langue: brief.langue,
        brief_data: {
          contraintes: brief.contraintes,
          envies: brief.envies,
          incertitudes: brief.incertitudes,
          questions_a_poser: brief.questions_a_poser,
          message_whatsapp: brief.message_whatsapp,
        },
        brief_valide_par_shana: false,
        statut: "brief",
      })
      .eq("id", dossierId)
      .in("statut", ["nouvelle_demande", "brief"]); // ne rétrograde jamais un dossier déjà avancé

    if (updateError) {
      console.error("generate-dossier-brief: échec de l'enregistrement", updateError);
      return json(req, { error: "Le brief a été généré mais n'a pas pu être enregistré." }, 500);
    }

    return json(req, { ok: true, brief });
  } catch (error) {
    console.error("generate-dossier-brief: erreur inattendue", error);
    return json(req, { error: "Une erreur inattendue est survenue." }, 500);
  }
});
