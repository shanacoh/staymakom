// Branchements propres à l'environnement Supabase (IA, DNS, réponses web) pour les fonctions qui
// utilisent la recherche de lieux. La logique elle-même est dans lookup.ts et ne dépend de rien d'ici.

import Anthropic from "npm:@anthropic-ai/sdk@0.127.0";
import type { AiMessage } from "./ai.ts";
import type { LookupDeps } from "./lookup.ts";

const AI_TIMEOUT_MS = 20000;
// Petit modèle rapide et peu coûteux : la tâche (ranger les infos d'un lieu) est simple.
// Modifiable sans toucher au code avec le secret CATALOGUE_AI_MODEL.
const DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5";

// Ancien accès IA de la passerelle Lovable, gardé en secours s'il est un jour configuré
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GATEWAY_MODEL = "google/gemini-3-flash-preview";

/** Réponse de Claude (clé ANTHROPIC_API_KEY), ou null s'il ne répond pas ou refuse. */
async function askClaude(apiKey: string, messages: AiMessage[]): Promise<string | null> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const userMessages = messages.filter((m) => m.role === "user").map((m) => ({ role: "user" as const, content: m.content }));
  const client = new Anthropic({ apiKey, timeout: AI_TIMEOUT_MS, maxRetries: 1 });
  try {
    const response = await client.messages.create({
      model: Deno.env.get("CATALOGUE_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
      max_tokens: 800,
      system,
      messages: userMessages,
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((block) => block.type === "text");
    return text && "text" in text ? text.text : null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.warn("lookup: Claude a répondu", error.status, error.message.slice(0, 200));
    } else {
      console.warn("lookup: Claude injoignable", error instanceof Error ? error.message : error);
    }
    return null;
  }
}

async function askGateway(key: string, messages: AiMessage[]): Promise<string | null> {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GATEWAY_MODEL, messages, temperature: 0.1 }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.warn("lookup: la passerelle IA a répondu", response.status, (await response.text()).slice(0, 200));
    return null;
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

/** Réponse brute de l'IA, ou null si aucune n'est configurée ou disponible (la recherche marche alors sans IA). */
export async function askAi(messages: AiMessage[]): Promise<string | null> {
  const claudeKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (claudeKey) return askClaude(claudeKey, messages);
  const gatewayKey = Deno.env.get("LOVABLE_API_KEY");
  if (gatewayKey) return askGateway(gatewayKey, messages);
  console.warn("lookup: aucune clé IA configurée (ANTHROPIC_API_KEY), la recherche se fait sans IA");
  return null;
}

/**
 * Adresses IP d'un domaine, pour refuser ceux qui pointent vers un réseau interne. Renvoie null si la
 * vérification n'est pas permise dans cet environnement : elle ne doit jamais bloquer un site légitime.
 */
export async function resolveHost(hostname: string): Promise<string[] | null> {
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

export function createLookupDeps(): LookupDeps {
  return { fetchFn: fetch, resolveHost, askAi };
}
