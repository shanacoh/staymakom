// Capture depuis le téléphone : le raccourci "Partager" de l'iPhone envoie un lien (TikTok, Instagram,
// site, Google Maps...), il arrive dans le catalogue au statut "À trier", déjà préparé par la recherche.
// Protégée par une clé secrète (CATALOGUE_CAPTURE_TOKEN), car le raccourci n'a pas de compte connecté.
// La réponse est un court texte affiché tel quel dans la notification de l'iPhone.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { buildCaptureItem, captureMessage, extractFirstUrl, timingSafeEqual } from "../_shared/lookup/capture.ts";
import { lookup, type LookupResult } from "../_shared/lookup/lookup.ts";
import { createLookupDeps } from "../_shared/lookup/runtime.ts";
import { parsePublicHttpUrl } from "../_shared/lookup/safe-url.ts";

const LOOKUP_DEADLINE_MS = 20000; // au-delà, on garde le lien seul plutôt que de faire attendre
const MAX_CAPTURES_PER_10_MIN = 40;

const reply = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

/** Le raccourci peut envoyer du JSON, un formulaire ou du texte brut : on accepte les trois. */
async function readInput(req: Request): Promise<{ token: string; text: string }> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = await req.json();
      return { token: String(body?.token ?? ""), text: String(body?.url ?? body?.text ?? "") };
    }
    if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      return { token: String(form.get("token") ?? ""), text: String(form.get("url") ?? form.get("text") ?? "") };
    }
    return { token: "", text: await req.text() };
  } catch {
    return { token: "", text: "" };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply("Méthode non autorisée", 405);

  const expected = Deno.env.get("CATALOGUE_CAPTURE_TOKEN");
  if (!expected) return reply("Erreur : la capture n'est pas configurée", 503);

  const input = await readInput(req);
  const token = req.headers.get("x-capture-token") ?? input.token;
  if (!timingSafeEqual(token, expected)) return reply("Accès refusé", 401);

  const rawUrl = extractFirstUrl(input.text);
  if (!rawUrl) return reply("Aucun lien trouvé dans ce partage", 400);
  const url = parsePublicHttpUrl(rawUrl);
  if (!url) return reply("Ce lien n'est pas une adresse web valide", 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Déjà dans le catalogue ? On répond tout de suite, sans dépenser une recherche
    const { data: key } = await supabase.rpc("catalogue_normalize_url", { p_url: url.toString() });
    if (key) {
      const { data: existing } = await supabase
        .from("catalogue_links")
        .select("catalogue_items(name)")
        .eq("url_key", key)
        .limit(1);
      const name = existing?.[0]?.catalogue_items?.name;
      if (name) return reply(`Déjà dans le catalogue : ${name}`);
    }

    // Garde-fou contre un emballement (clé perdue, raccourci qui boucle)
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase.from("catalogue_links").select("id", { count: "exact", head: true }).gte("created_at", since);
    if ((count ?? 0) >= MAX_CAPTURES_PER_10_MIN) return reply("Trop d'ajouts d'un coup, réessaie dans quelques minutes", 429);

    // Régions déjà utilisées dans le catalogue : la recherche reprend la même écriture
    const { data: regionRows } = await supabase.from("catalogue_overview").select("display_region").not("display_region", "is", null).limit(1000);
    const counts = new Map<string, number>();
    for (const row of regionRows ?? []) counts.set(row.display_region, (counts.get(row.display_region) ?? 0) + 1);
    const knownRegions = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([region]) => region);

    // La recherche est un bonus : si elle échoue ou tarde trop, le lien est gardé seul (rien n'est perdu)
    let result: LookupResult | null = null;
    try {
      result = await Promise.race([
        lookup(url.toString(), knownRegions, createLookupDeps()),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), LOOKUP_DEADLINE_MS)),
      ]);
    } catch (error) {
      console.warn("capture-catalogue-link: recherche impossible, lien gardé seul", error instanceof Error ? error.message : error);
    }

    const record = buildCaptureItem(result, url.toString());
    const { error } = await supabase.rpc("catalogue_create_item", { p_item: record.item, p_link: record.link });
    if (error) {
      // Même lien ajouté entre-temps (ou lien court déjà connu sous son adresse finale)
      if (error.code === "23505") {
        const name = error.message.match(/fiche : (.+)\)$/)?.[1];
        return reply(name ? `Déjà dans le catalogue : ${name}` : "Déjà dans le catalogue");
      }
      console.error("capture-catalogue-link: enregistrement impossible", error.message);
      return reply("Erreur : l'ajout a échoué, réessaie dans un instant", 500);
    }

    console.log(`capture-catalogue-link: ajouté (${record.platformLabel}, ${record.identifiedName ? "identifié" : "à identifier"})`);
    return reply(captureMessage(record, (record.item.city as string | null) ?? null));
  } catch (error) {
    console.error("capture-catalogue-link: erreur inattendue", error);
    return reply("Erreur : l'ajout a échoué, réessaie dans un instant", 500);
  }
});
