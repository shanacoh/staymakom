// Étape 5 du chantier "Dossier de voyage" (Composer) : propose ou régénère le programme jour par
// jour d'une version, en piochant UNIQUEMENT dans les fiches du Catalogue (jamais d'invention de
// lieu). Les lignes imposées par Shana ou demandées par le client (origine impose_shana/demande_client,
// ou verrouillee_regeneration = true) sont toujours conservées telles quelles ; seules les lignes
// générées par l'IA lors d'un appel précédent sont remplacées. Réservée aux administrateurs.

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

const AI_TIMEOUT_MS = 30000;
const DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GATEWAY_MODEL = "google/gemini-2.5-flash";
const MAX_CANDIDATS = 80;
const MAX_JOURS = 14;
const MAX_LIGNES_PAR_JOUR = 5;

interface AiMessage {
  role: "system" | "user";
  content: string;
}

async function askClaude(apiKey: string, messages: AiMessage[]): Promise<string | null> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const userMessages = messages.filter((m) => m.role === "user").map((m) => ({ role: "user" as const, content: m.content }));
  const workspaceId = Deno.env.get("ANTHROPIC_WORKSPACE_ID");
  const client = new Anthropic({
    apiKey,
    timeout: AI_TIMEOUT_MS,
    maxRetries: 1,
    defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
  });
  try {
    const response = await client.messages.create({
      model: Deno.env.get("DOSSIER_BRIEF_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
      max_tokens: 3000,
      system,
      messages: userMessages,
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((block) => block.type === "text");
    return text && "text" in text ? text.text : null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.warn("generate-dossier-composer: Claude a répondu", error.status, error.message.slice(0, 200));
    } else {
      console.warn("generate-dossier-composer: Claude injoignable", error instanceof Error ? error.message : error);
    }
    return null;
  }
}

async function askGateway(key: string, messages: AiMessage[]): Promise<string | null> {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GATEWAY_MODEL, messages, temperature: 0.3, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.warn("generate-dossier-composer: la passerelle IA a répondu", response.status, (await response.text()).slice(0, 200));
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
  console.warn("generate-dossier-composer: aucune clé IA configurée (ANTHROPIC_API_KEY ou LOVABLE_API_KEY)");
  return null;
}

function joursEntre(a: string | null, b: string | null): number {
  if (!a || !b) return 3;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 3;
  const n = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(n, 1), MAX_JOURS);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json(req, { error: "Connexion requise" }, 401);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) return json(req, { error: "Connexion requise" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json(req, { error: "Réservé aux administrateurs" }, 403);

    const body = await req.json().catch(() => ({}));
    const dossierId = typeof body?.dossierId === "string" ? body.dossierId : null;
    const versionId = typeof body?.versionId === "string" ? body.versionId : null;
    const consigne = typeof body?.consigne === "string" ? body.consigne.slice(0, 1000) : "";
    if (!dossierId || !versionId) return json(req, { error: "dossierId et versionId requis" }, 400);

    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers_voyage")
      .select("id, nom_destinataire, email, dates_arrivee, dates_depart, nb_voyageurs, regions, langue, brief_data, lieux_imposes")
      .eq("id", dossierId)
      .single();
    if (dossierError || !dossier) return json(req, { error: "Dossier introuvable" }, 404);

    const { data: version, error: versionError } = await supabase
      .from("dossiers_voyage_versions")
      .select("id, dossier_id")
      .eq("id", versionId)
      .eq("dossier_id", dossierId)
      .single();
    if (versionError || !version) return json(req, { error: "Version introuvable pour ce dossier" }, 404);

    const { data: lignesExistantes, error: lignesError } = await supabase
      .from("dossiers_voyage_lignes")
      .select("id, jour, nature, origine, verrouillee_regeneration, catalogue_item_id, texte_libre")
      .eq("version_id", versionId);
    if (lignesError) return json(req, { error: "Impossible de lire le programme existant" }, 500);

    const nbJours = joursEntre(dossier.dates_arrivee, dossier.dates_depart);
    const brief = (dossier.brief_data as Record<string, unknown>) || {};

    // Les lieux imposés dès le Brief (avant même que le Composer existe) sont systématiquement
    // insérés comme lignes verrouillées s'ils n'y sont pas déjà — pas besoin que Shana les rajoute
    // à la main dans le Composer.
    type LieuImpose = { catalogue_item_id?: string; nom?: string; origine?: string };
    const lieuxImposes: LieuImpose[] = Array.isArray(dossier.lieux_imposes) ? dossier.lieux_imposes : [];
    const idsDejaEnLigne = new Set((lignesExistantes ?? []).map((l) => l.catalogue_item_id).filter(Boolean));
    const lieuxAInsurer = lieuxImposes.filter(
      (l) => l.catalogue_item_id && !idsDejaEnLigne.has(l.catalogue_item_id)
    );
    if (lieuxAInsurer.length > 0) {
      const { data: fichesImposees } = await supabase
        .from("catalogue_items")
        .select("id, place_type, commercial_status, prix_achat, prix_client")
        .in("id", lieuxAInsurer.map((l) => l.catalogue_item_id!));
      const fichesParId = new Map((fichesImposees ?? []).map((f) => [f.id, f]));
      const natureDepuisPlaceTypeInit = (placeType: string): string => {
        if (placeType === "hebergement") return "hebergement";
        if (placeType === "restaurant") return "restaurant";
        if (placeType === "activite" || placeType === "bateau") return "activite";
        if (placeType === "lieu_a_visiter") return "lieu_a_visiter";
        return "autre";
      };
      const nouvellesLignesImposees = lieuxAInsurer
        .map((l) => {
          const fiche = fichesParId.get(l.catalogue_item_id!);
          if (!fiche) return null;
          return {
            version_id: versionId,
            jour: 1,
            ordre: 0,
            nature: natureDepuisPlaceTypeInit(fiche.place_type),
            origine: l.origine === "demande_client" ? "demande_client" : "impose_shana",
            catalogue_item_id: fiche.id,
            fiche_jamais_formalisee: fiche.commercial_status !== "partenaire",
            alerte_a_contacter: fiche.commercial_status !== "partenaire",
            cout_achat_estime: fiche.prix_achat,
            prix_vente_estime: fiche.prix_client,
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);
      if (nouvellesLignesImposees.length > 0) {
        await supabase.from("dossiers_voyage_lignes").insert(nouvellesLignesImposees);
      }
    }

    // Relit le programme (inclut les lieux imposés qu'on vient d'insérer).
    const { data: lignesApresImposes } = await supabase
      .from("dossiers_voyage_lignes")
      .select("id, jour, nature, origine, verrouillee_regeneration, catalogue_item_id, texte_libre")
      .eq("version_id", versionId);

    const lignesVerrouillees = (lignesApresImposes ?? []).filter(
      (l) => l.origine === "impose_shana" || l.origine === "demande_client" || l.verrouillee_regeneration
    );
    const lignesIaARemplacer = (lignesApresImposes ?? []).filter(
      (l) => l.origine === "ia" && !l.verrouillee_regeneration
    );

    // Lieux à écarter : déjà présents dans un autre dossier du même client, ou explicitement
    // exclus par le client dans sa demande (comparaison simple sur le nom/ville).
    const idsDejaUtilises = new Set<string>();
    if (dossier.email) {
      const { data: autresDossiers } = await supabase
        .from("dossiers_voyage")
        .select("id")
        .eq("email", dossier.email)
        .neq("id", dossierId);
      if (autresDossiers && autresDossiers.length > 0) {
        const { data: autresVersions } = await supabase
          .from("dossiers_voyage_versions")
          .select("id")
          .in("dossier_id", autresDossiers.map((d) => d.id));
        if (autresVersions && autresVersions.length > 0) {
          const { data: autresLignes } = await supabase
            .from("dossiers_voyage_lignes")
            .select("catalogue_item_id")
            .in("version_id", autresVersions.map((v) => v.id))
            .not("catalogue_item_id", "is", null);
          for (const l of autresLignes ?? []) {
            if (l.catalogue_item_id) idsDejaUtilises.add(l.catalogue_item_id);
          }
        }
      }
    }
    const exclusionsTexte: string[] = Array.isArray(brief.exclusions_mentionnees)
      ? (brief.exclusions_mentionnees as unknown[]).filter((x): x is string => typeof x === "string")
      : [];

    // Fiches candidates : priorité aux régions du dossier si connues, sinon un large échantillon.
    let candidatsQuery = supabase
      .from("catalogue_items")
      .select("id, name, nature, place_type, city, region, notes, tags, commercial_status, prix_achat, prix_client")
      .neq("commercial_status", "refuse")
      .order("commercial_status", { ascending: false }) // "partenaire" avant le reste alphabétiquement en pratique suffisant
      .limit(MAX_CANDIDATS);
    if (dossier.regions && dossier.regions.length > 0) {
      candidatsQuery = candidatsQuery.or(
        dossier.regions.map((r: string) => `region.ilike.%${r}%,city.ilike.%${r}%`).join(",")
      );
    }
    const { data: candidatsBruts, error: candidatsError } = await candidatsQuery;
    if (candidatsError) return json(req, { error: "Impossible de lire le catalogue" }, 500);

    const candidats = (candidatsBruts ?? []).filter((c) => {
      if (idsDejaUtilises.has(c.id)) return false;
      const texte = `${c.name} ${c.city ?? ""} ${c.region ?? ""}`.toLowerCase();
      return !exclusionsTexte.some((ex) => ex.trim() && texte.includes(ex.trim().toLowerCase()));
    });
    if (candidats.length === 0) {
      return json(req, { error: "Aucune fiche Catalogue disponible pour générer un programme (après exclusions)" }, 400);
    }

    const system = `Tu es l'assistant de Shana, qui prépare des voyages sur mesure en Israël pour l'agence Staymakom.
Construis un programme jour par jour pour ce voyage, en piochant UNIQUEMENT parmi les fiches du Catalogue fournies ci-dessous.
Ne propose JAMAIS un lieu qui n'est pas dans cette liste, et ne modifie jamais son identifiant.

Contraintes à respecter :
- ${nbJours} jour(s) de voyage (jour 1 à jour ${nbJours}).
- Certaines lignes du programme sont déjà fixées et ne doivent PAS être dupliquées ni contredites (voir "lignes déjà fixées" ci-dessous) — complète autour d'elles.
- Maximum ${MAX_LIGNES_PAR_JOUR} lignes par jour.
- Varie les lieux proposés (pas deux fois la même fiche).

Réponds UNIQUEMENT avec un objet JSON de cette forme (rien avant, rien après) :
{
  "lignes": [
    { "jour": 1, "catalogue_item_id": "uuid-exact-de-la-liste" },
    ...
  ]
}`;

    const userParts = [
      `Voyageurs : ${dossier.nb_voyageurs ?? "inconnu"}. Régions souhaitées : ${(dossier.regions ?? []).join(", ") || "non précisées"}.`,
      brief.envies ? `Envies du client : ${brief.envies}` : null,
      brief.contraintes ? `Contraintes : ${brief.contraintes}` : null,
      consigne ? `Consigne spécifique de Shana pour cette génération : ${consigne}` : null,
      lignesVerrouillees.length > 0
        ? `Lignes déjà fixées (à ne pas dupliquer) :\n${lignesVerrouillees.map((l) => `- jour ${l.jour} : ${l.texte_libre || l.catalogue_item_id || l.nature}`).join("\n")}`
        : "Aucune ligne déjà fixée.",
      `Fiches du Catalogue disponibles (id, nom, type, ville/région) :\n${candidats
        .map((c) => `- ${c.id} | ${c.name} | ${c.place_type} | ${[c.city, c.region].filter(Boolean).join(", ") || "lieu non précisé"}${c.tags?.length ? ` | tags: ${c.tags.join(", ")}` : ""}`)
        .join("\n")}`,
    ].filter(Boolean);

    const raw = await askAi([
      { role: "system", content: system },
      { role: "user", content: userParts.join("\n\n") },
    ]);
    if (!raw) return json(req, { error: "L'IA n'a pas pu générer de programme, réessaie dans un instant." }, 503);

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      console.error("generate-dossier-composer: réponse IA non exploitable:", raw.slice(0, 500));
      return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
    }
    const lignesIa = Array.isArray((parsed as Record<string, unknown>)?.lignes) ? (parsed as { lignes: unknown[] }).lignes : [];

    const candidatsParId = new Map(candidats.map((c) => [c.id, c]));
    const casherRegex = /casher|kosher/i;

    type NouvelleLigne = {
      jour: number;
      ordre: number;
      nature: string;
      origine: "ia";
      catalogue_item_id: string;
      casher: boolean | null;
      fiche_jamais_formalisee: boolean;
      alerte_a_contacter: boolean;
      cout_achat_estime: number | null;
      prix_vente_estime: number | null;
      consigne_regeneration: string | null;
    };
    const natureDepuisPlaceType = (placeType: string): string => {
      if (placeType === "hebergement") return "hebergement";
      if (placeType === "restaurant") return "restaurant";
      if (placeType === "activite" || placeType === "bateau") return "activite";
      if (placeType === "lieu_a_visiter") return "lieu_a_visiter";
      return "autre";
    };

    const parDejaVus = new Set<string>();
    const compteParJour = new Map<number, number>();
    const nouvellesLignes: NouvelleLigne[] = [];
    for (const ligneBrute of lignesIa) {
      if (!ligneBrute || typeof ligneBrute !== "object") continue;
      const r = ligneBrute as Record<string, unknown>;
      const jour = Number(r.jour);
      const catalogueItemId = typeof r.catalogue_item_id === "string" ? r.catalogue_item_id : null;
      if (!Number.isInteger(jour) || jour < 1 || jour > nbJours) continue;
      if (!catalogueItemId || !candidatsParId.has(catalogueItemId)) continue; // jamais un id halluciné
      if (parDejaVus.has(catalogueItemId)) continue;
      const dejaCeJour = compteParJour.get(jour) ?? 0;
      if (dejaCeJour >= MAX_LIGNES_PAR_JOUR) continue;

      const fiche = candidatsParId.get(catalogueItemId)!;
      parDejaVus.add(catalogueItemId);
      compteParJour.set(jour, dejaCeJour + 1);
      nouvellesLignes.push({
        jour,
        ordre: dejaCeJour,
        nature: natureDepuisPlaceType(fiche.place_type),
        origine: "ia",
        catalogue_item_id: catalogueItemId,
        casher: casherRegex.test((fiche.tags ?? []).join(" ")) || casherRegex.test(fiche.notes ?? "") ? true : null,
        fiche_jamais_formalisee: fiche.commercial_status !== "partenaire",
        alerte_a_contacter: fiche.commercial_status !== "partenaire",
        cout_achat_estime: fiche.prix_achat,
        prix_vente_estime: fiche.prix_client,
        consigne_regeneration: consigne || null,
      });
    }

    if (nouvellesLignes.length === 0) {
      return json(req, { error: "L'IA n'a proposé aucune ligne valide, réessaie avec une consigne plus précise." }, 502);
    }

    if (lignesIaARemplacer.length > 0) {
      const { error: deleteError } = await supabase
        .from("dossiers_voyage_lignes")
        .delete()
        .in("id", lignesIaARemplacer.map((l) => l.id));
      if (deleteError) return json(req, { error: "Impossible de retirer les anciennes lignes IA" }, 500);
    }

    const { error: insertError } = await supabase.from("dossiers_voyage_lignes").insert(
      nouvellesLignes.map((l) => ({ ...l, version_id: versionId }))
    );
    if (insertError) {
      console.error("generate-dossier-composer: échec de l'enregistrement", insertError);
      return json(req, { error: "Le programme a été généré mais n'a pas pu être enregistré." }, 500);
    }

    // Recalcule le prix total de la version (lignes verrouillées + nouvelles lignes IA).
    const { data: toutesLesLignes } = await supabase
      .from("dossiers_voyage_lignes")
      .select("cout_achat_estime, prix_vente_estime")
      .eq("version_id", versionId);
    const prixTotalAchat = (toutesLesLignes ?? []).reduce((sum, l) => sum + (l.cout_achat_estime ?? 0), 0);
    const prixTotalVente = (toutesLesLignes ?? []).reduce((sum, l) => sum + (l.prix_vente_estime ?? 0), 0);
    await supabase
      .from("dossiers_voyage_versions")
      .update({ prix_total_achat: prixTotalAchat, prix_total_vente: prixTotalVente })
      .eq("id", versionId);

    return json(req, { ok: true, nbLignesCreees: nouvellesLignes.length });
  } catch (error) {
    console.error("generate-dossier-composer: erreur inattendue", error);
    return json(req, { error: "Une erreur inattendue est survenue." }, 500);
  }
});
