// Sprint 5A : rédige un brouillon d'expérience (standalone ou hôtel) à partir de notes, d'un lien
// et/ou d'un PDF, avec la voix STAYMAKOM (consignes copiées dans _shared/prompts/). Réservée aux
// administrateurs (même contrôle que generate-dossier-brief). Ne remplit jamais prix, disponibilités,
// prestataire ou statut : ce sont des champs métier que seule Shana décide. N'écrit rien en base,
// le brouillon est renvoyé au formulaire qui l'affiche à l'écran.
//
// Quatre actions (champ "mode") : "draft" (brouillon complet, par défaut), "translate" (FR vers EN/HE),
// "seo" (titre et méta-description) et "mood" (réécrit titre, accroche et description pour un mood,
// à partir du contenu déjà dans la fiche).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.127.0";
import { fetchPage } from "../_shared/lookup/lookup.ts";
import { htmlToText } from "../_shared/lookup/parse.ts";
import { parsePublicHttpUrl } from "../_shared/lookup/safe-url.ts";
import { STANDALONE_EXPERIENCE_PROMPT } from "../_shared/prompts/standalone-experience.ts";
import { HOTEL_EXPERIENCE_PROMPT } from "../_shared/prompts/hotel-experience.ts";
import { MOOD_WRITING_PROMPT } from "../_shared/prompts/mood-writing.ts";
import { SHANA_PREFERENCES_PROMPT } from "../_shared/prompts/shana-preferences.ts";
import {
  parseDraft,
  parseMoodPresentations,
  str,
  strArray,
  type BadgeRef,
  type ExperienceDraft,
} from "../_shared/experience-draft/parse.ts";

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

const AI_TIMEOUT_MS = 120_000;
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5";
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_TOKENS = 8000;
const MAX_DRAFT_TOKENS = 10_000;
// Photos de la fiche montrées à l'IA pour proposer une couverture.
const MAX_PHOTOS = 8;
// « On the Water » est un mood comme un autre, sauf en mood principal : la fiche devient alors une
// fiche bateau sur tout le site. L'IA peut donc le proposer, jamais en premier.
const BOATS_CATEGORY_SLUG = "bateaux";

type ExperienceType = "standalone" | "hotel";

// ---------------------------------------------------------------------------
// Schéma de l'outil forcé : correspond aux champs du formulaire expérience
// standalone (src/components/forms/StandaloneExperienceForm.tsx) et, pour le
// type "hotel", du formulaire hôtel + expérience
// (src/components/forms/UnifiedExperience2Form.tsx), qui ajoute seulement les
// nuits min/max. L'expérience seule reçoit en plus le rangement (région, badges),
// l'après-réservation et la photo de couverture. L'IA ne peut PAS produire d'autre
// champ que ceux-ci : hôtel, prix, BAR rate, net rate, coûts, commissions, taxes,
// promo, disponibilités, prestataire, canal de réservation et contact jour J ne
// sont volontairement pas dans ce schéma.
// ---------------------------------------------------------------------------

const LANG_STRING = { type: "string" as const };

const TOOL_NAME = "fill_experience_form";

interface DraftLists {
  categorySlugs: string[];
  regionSlugs: string[];
  badgeSlugs: string[];
  photoCount: number;
}

function buildToolSchema({ categorySlugs, regionSlugs, badgeSlugs, photoCount }: DraftLists, type: ExperienceType) {
  // Nuits min/max : uniquement pour une expérience hôtel (séjour).
  const nightsProperties = type === "hotel"
    ? {
      min_nights: { type: "integer", minimum: 1, maximum: 8, description: "Uniquement si les sources précisent une durée de séjour minimale." },
      max_nights: { type: "integer", minimum: 1, maximum: 8, description: "Uniquement si les sources précisent une durée de séjour maximale." },
    }
    : {};
  // Rangement, après-réservation et couverture : uniquement pour une expérience seule.
  const standaloneProperties = type === "standalone"
    ? {
      ...(regionSlugs.length
        ? {
          region_slug: {
            type: ["string", "null"],
            enum: [...regionSlugs, null],
            description: "La région de la liste fournie, d'après la ville et l'adresse. null au moindre doute.",
          },
        }
        : {}),
      ...(badgeSlugs.length
        ? {
          badge_slugs: {
            type: "array",
            description: "0 à 3 badges, uniquement parmi ceux fournis et seulement s'ils sont vrais pour cette expérience.",
            maxItems: 3,
            items: { type: "string", enum: badgeSlugs },
          },
        }
        : {}),
      ...(photoCount > 0
        ? {
          cover_photo_number: {
            type: ["integer", "null"],
            minimum: 1,
            maximum: photoCount,
            description: "Numéro de la photo jointe la plus adaptée comme couverture, ou null.",
          },
        }
        : {}),
      meeting_point: LANG_STRING,
      meeting_point_fr: LANG_STRING,
      meeting_point_he: LANG_STRING,
      arrive_minutes_before: {
        type: ["integer", "null"],
        minimum: 0,
        maximum: 600,
        description: "Uniquement si les sources disent combien de minutes avant il faut arriver.",
      },
      know_before_you_go: LANG_STRING,
      know_before_you_go_fr: LANG_STRING,
      know_before_you_go_he: LANG_STRING,
      contingency_note: LANG_STRING,
      contingency_note_fr: LANG_STRING,
      contingency_note_he: LANG_STRING,
    }
    : {};
  const maxCategories = type === "standalone" ? 3 : 2;
  return {
    name: TOOL_NAME,
    description: "Remplit les champs éditoriaux du formulaire d'expérience STAYMAKOM. Ne jamais inclure de prix, de disponibilité ou d'information prestataire.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: LANG_STRING,
        title_fr: LANG_STRING,
        title_he: LANG_STRING,
        subtitle: LANG_STRING,
        subtitle_fr: LANG_STRING,
        subtitle_he: LANG_STRING,
        long_copy: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
        long_copy_fr: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
        long_copy_he: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
        category_slugs: {
          type: "array",
          description: `1 à ${maxCategories} moods, parmi ceux fournis. Le premier est le mood principal, le plus évident.`,
          minItems: 1,
          maxItems: maxCategories,
          items: categorySlugs.length ? { type: "string", enum: categorySlugs } : { type: "string" },
        },
        includes: {
          type: "array",
          description: "Exactement 4 éléments.",
          minItems: 4,
          maxItems: 4,
          items: {
            type: "object",
            properties: { title: LANG_STRING, title_fr: LANG_STRING, title_he: LANG_STRING },
            required: ["title", "title_fr", "title_he"],
          },
        },
        extras: {
          type: "array",
          description: "Options payantes genuinement trouvées dans les sources, sans prix. Liste vide si aucune.",
          items: {
            type: "object",
            properties: {
              title: LANG_STRING,
              title_fr: LANG_STRING,
              title_he: LANG_STRING,
              description: LANG_STRING,
            },
            required: ["title", "title_fr", "title_he", "description"],
          },
        },
        duration: LANG_STRING,
        duration_fr: LANG_STRING,
        duration_he: LANG_STRING,
        min_party: { type: "integer", minimum: 1, maximum: 100 },
        max_party: { type: "integer", minimum: 1, maximum: 100 },
        ...nightsProperties,
        ...standaloneProperties,
        city: LANG_STRING,
        city_fr: LANG_STRING,
        city_he: LANG_STRING,
        region: LANG_STRING,
        region_fr: LANG_STRING,
        region_he: LANG_STRING,
        address: LANG_STRING,
        address_fr: LANG_STRING,
        address_he: LANG_STRING,
        google_maps_link: LANG_STRING,
        practical_info: {
          type: "object",
          description: "Uniquement ce qui est explicitement établi par les sources, sinon laisser null.",
          properties: {
            kids: {
              type: "object",
              properties: {
                status: { type: ["string", "null"], enum: ["yes", "no", null] },
                from_age: { type: ["number", "null"] },
              },
              required: ["status", "from_age"],
            },
            kosher: { type: ["string", "null"], enum: ["yes", "no", "not_relevant", null] },
            parking: {
              type: "object",
              properties: { status: { type: ["string", "null"], enum: ["yes", "no", null] } },
              required: ["status"],
            },
          },
          required: ["kids", "kosher", "parking"],
        },
        accessibility_info: LANG_STRING,
        accessibility_info_fr: LANG_STRING,
        accessibility_info_he: LANG_STRING,
        cancellation_policy: LANG_STRING,
        cancellation_policy_fr: LANG_STRING,
        cancellation_policy_he: LANG_STRING,
        seo_title_en: LANG_STRING,
        seo_title_fr: LANG_STRING,
        seo_title_he: LANG_STRING,
        meta_description_en: LANG_STRING,
        meta_description_fr: LANG_STRING,
        meta_description_he: LANG_STRING,
        og_title_en: LANG_STRING,
        og_title_fr: LANG_STRING,
        og_title_he: LANG_STRING,
        og_description_en: LANG_STRING,
        og_description_fr: LANG_STRING,
        og_description_he: LANG_STRING,
        to_verify: {
          type: "array",
          description: "Phrases courtes en français, ex. « Prix fournisseur trouvé : 310 ₪/pers. », « Langue de l'atelier non précisée ».",
          items: { type: "string" },
        },
      },
      required: ["title", "long_copy", "includes", "to_verify"],
    },
  };
}

// ---------------------------------------------------------------------------
// Appel IA
// ---------------------------------------------------------------------------

// Expérience seule : consignes de marque, puis le carnet de préférences de Shana.
const STANDALONE_BRAND_PROMPT = STANDALONE_EXPERIENCE_PROMPT + SHANA_PREFERENCES_PROMPT;

function loadSystemPrompt(type: ExperienceType): string {
  return type === "hotel" ? HOTEL_EXPERIENCE_PROMPT : STANDALONE_BRAND_PROMPT;
}

interface GenerateInput {
  type: ExperienceType;
  notes: string | null;
  url: string | null;
  pdfBase64: string | null;
  pdfName: string | null;
}

interface NamedRef {
  slug: string;
  name: string;
}

interface DraftChoices {
  categories: NamedRef[];
  regions: NamedRef[];
  badges: NamedRef[];
}

// Les photos de la fiche, numérotées, jointes à la demande pour que l'IA en propose une en couverture.
// deno-lint-ignore no-explicit-any
function photoBlocks(photoUrls: string[]): any[] {
  return photoUrls.flatMap((url, index) => [
    { type: "text", text: `Photo ${index + 1} :` },
    { type: "image", source: { type: "url", url } },
  ]);
}

// Seules les photos rangées dans le stockage du projet sont montrées à l'IA.
function cleanPhotoUrls(raw: unknown): string[] {
  const storagePrefix = `${Deno.env.get("SUPABASE_URL") ?? ""}/storage/v1/object/public/`;
  const urls = strArray(raw, 30).filter((url) => url.startsWith(storagePrefix) && /\.(jpe?g|png|webp|gif)$/i.test(url.split("?")[0]));
  return Array.from(new Set(urls)).slice(0, MAX_PHOTOS);
}

// deno-lint-ignore no-explicit-any
async function buildUserContent(
  input: GenerateInput,
  { categories, regions, badges }: DraftChoices,
  photoUrls: string[],
  warnings: string[]
): Promise<any[]> {
  const parts: string[] = [];
  if (input.notes) parts.push(`Notes de Shana :\n"""\n${input.notes}\n"""`);

  if (input.url) {
    const url = parsePublicHttpUrl(input.url);
    if (!url) {
      warnings.push("Le lien fourni n'est pas une adresse web valide : ignoré.");
    } else {
      try {
        const page = await fetchPage(url, { fetchFn: fetch });
        parts.push(`Texte lu sur ${input.url} :\n"""\n${htmlToText(page.html, 6000)}\n"""`);
      } catch (error) {
        warnings.push("Le lien fourni n'a pas pu être lu : la génération continue sans lui.");
        console.warn("generate-experience-draft: lecture URL échouée", error instanceof Error ? error.message : error);
      }
    }
  }

  if (categories.length) {
    const howMany = input.type === "standalone" ? "1 à 3, le plus évident en premier" : "1, exceptionnellement 2";
    parts.push(`Moods disponibles (choisis-en ${howMany}, par leur slug) :\n${categories.map((c) => `- ${c.slug} : ${c.name}`).join("\n")}`);
  }
  if (regions.length) {
    parts.push(`Régions disponibles (une seule, par son slug, d'après la ville et l'adresse ; null si tu hésites) :\n${regions.map((r) => `- ${r.slug} : ${r.name}`).join("\n")}`);
  }
  if (badges.length) {
    parts.push(`Badges existants (0 à 3, par leur slug, jamais d'autre) :\n${badges.map((b) => `- ${b.slug} : ${b.name}`).join("\n")}`);
  }
  if (photoUrls.length) {
    parts.push(`${photoUrls.length} photo(s) de la galerie sont jointes, numérotées : indique dans cover_photo_number celle qui ferait la meilleure couverture.`);
  }

  if (parts.length === 0 && !input.pdfBase64) {
    parts.push("Aucune note ni lien fourni : appuie-toi uniquement sur le PDF joint.");
  }

  const content: any[] = [];
  if (input.pdfBase64) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 },
    });
  }
  content.push(...photoBlocks(photoUrls));
  content.push({ type: "text", text: parts.join("\n\n") });
  return content;
}

// Appel à l'IA avec un outil imposé. Si des photos sont jointes et que l'IA ne peut pas les lire
// (photo trop lourde, adresse inaccessible), la demande repart une fois sans les photos : la
// rédaction ne doit jamais échouer à cause d'une image.
// deno-lint-ignore no-explicit-any
async function callTool(client: Anthropic, params: any, hasPhotos: boolean, warnings: string[]): Promise<any> {
  try {
    return await client.messages.create(params);
  } catch (error) {
    if (!hasPhotos || !(error instanceof Anthropic.APIError) || error.status !== 400) throw error;
    console.warn("generate-experience-draft: photos illisibles, nouvelle tentative sans elles", error.message.slice(0, 200));
    warnings.push("Les photos n'ont pas pu être lues par l'IA : aucune couverture proposée.");
    const messages = params.messages.map((m: any) => ({
      ...m,
      content: Array.isArray(m.content) ? m.content.filter((b: any) => b.type !== "image" && !/^Photo \d+ :$/.test(b.text ?? "")) : m.content,
    }));
    return await client.messages.create({ ...params, messages });
  }
}

const TECHNICAL_INSTRUCTIONS = `
---
Consignes techniques impératives, au-dessus de tout le reste :
- Tu ne fais pas de recherche web, tu t'appuies uniquement sur les sources fournies (notes, texte du lien, PDF).
- N'invente aucun fait : si une information manque, laisse le champ vide (chaîne vide ou null selon le champ) et ajoute une ligne dans to_verify plutôt que de deviner.
- Chaque fait concret (boisson, plat, lieu, nombre, horaire, équipement, langue) doit venir explicitement des sources fournies. Tu peux écrire avec du style et de l'émotion, mais jamais ajouter un élément concret absent des sources. En cas de doute, ne l'écris pas.
- Ne produis jamais de prix, de marge, de disponibilité, de créneau horaire, d'information sur le prestataire, de canal ou de lien de réservation, de contact pour le jour J, de statut ni de mise en avant : même si la source en contient, ils ne vont dans aucun champ du formulaire (ni dans les textes, ni dans « à savoir »), seulement, si utile, mentionnés dans to_verify.
- Ne produis pas les prompts photos.
- Réponds uniquement via l'outil fourni (fill_experience_form).`;

// Consignes propres à l'expérience seule : rangement et après-réservation.
const STANDALONE_DRAFT_INSTRUCTIONS = `
- Moods (category_slugs) : 1 à 3 parmi la liste fournie, le plus évident en premier (c'est le mood principal). N'ajoute un deuxième ou un troisième mood que si l'expérience s'y prête vraiment. Le mood « bateaux » (On the Water) peut être proposé si l'expérience se passe sur l'eau, mais jamais en premier.
- Région (region_slug) : une seule, dans la liste fournie, d'après la ville et l'adresse. Si tu hésites entre deux régions ou si le lieu n'est pas clair, mets null et écris ton hésitation dans to_verify.
- Badges (badge_slugs) : un badge n'est coché que si ce qu'il nomme fait littéralement partie de l'expérience d'après les sources. Jamais par approximation, par ambiance ou parce que le mot ressemble : une balade au coucher du soleil sans boisson n'est pas « Sunset Drinks », une activité accessible aux enfants n'est pas « Kids Activities » si elle n'est pas conçue pour eux, une sortie accompagnée n'est pas « Guided Tour » si aucun guide n'est mentionné. Au moindre doute, ne coche pas. Zéro badge est une bonne réponse. Tu n'en crées jamais. Cette règle remplace celle des consignes de marque (« jamais 0, en créer un ») : s'il manque un badge évident, propose-le dans to_verify (« Badge à créer : ... »).
- Décor et déroulé : ce sont des faits. N'écris aucun élément de paysage, de végétation, de sol, de bâtiment, d'animal, d'allure (pas, trot, galop), de parcours ni de personne (guide, moniteur, hôte) qui ne figure pas dans les sources. Avec peu de sources, écris court et juste plutôt que long et inventé : l'émotion vient du moment (l'heure, la lumière, la durée, avec qui), pas de détails ajoutés.
- Participants (min_party, max_party) : uniquement si les sources donnent une taille de groupe. Sinon ne les renseigne pas, sans valeur par défaut.
- S'adresser au lecteur : suis les « Préférences de Shana » (tu pour une personne, vous seulement pour un vrai pluriel, jamais les deux dans un même texte).
- to_verify : court, en français courant, sans nom technique de champ. N'y mets que ce qui aide Shana à finir la fiche : un fait trouvé dans les sources que tu n'as pas le droit de remplir (prix, horaires, contact), une hésitation réelle (région, mood, badge), ou une information utile au client qui manque. N'y liste pas ce que tu ne remplis jamais de toute façon (prix non fourni, lien de réservation, type de tarification, coordonnées GPS).
- Titre, accroche et description : écris-les pour le mood principal, avec son angle.
- Après la réservation, seulement si les sources le donnent, sinon champ vide :
  - meeting_point : le point de rendez-vous précis (pas l'adresse générale).
  - arrive_minutes_before : combien de minutes avant il faut arriver.
  - know_before_you_go : ce qu'il faut savoir ou apporter (tenue, chaussures, eau, âge minimum, tenue respectueuse...), en phrases courtes.
  - contingency_note : ce qui se passe en cas de météo défavorable ou d'imprévu.
- Tout en anglais, français et hébreu, comme le reste.`;

// ---------------------------------------------------------------------------
// Mode "translate" : traduit un lot de textes FR déjà saisis par Shana vers
// EN et HE, dans la voix STAYMAKOM. Pas de recherche, pas d'invention : une
// vraie traduction du texte fourni, jamais mot à mot, HTML conservé tel quel.
// ---------------------------------------------------------------------------

const TRANSLATE_TOOL_NAME = "translate_texts";

const translateToolSchema = {
  name: TRANSLATE_TOOL_NAME,
  description: "Renvoie la traduction anglaise et hébraïque de chaque texte français fourni.",
  input_schema: {
    type: "object" as const,
    properties: {
      translations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string" },
            en: { type: "string" },
            he: { type: "string" },
          },
          required: ["key", "en", "he"],
        },
      },
    },
    required: ["translations"],
  },
};

const TRANSLATE_INSTRUCTIONS = `
---
Tâche : traduction, pas de rédaction depuis zéro.
- Pour chaque texte français fourni, produis une traduction anglaise et une traduction hébraïque naturelles, dans la voix STAYMAKOM décrite ci-dessus : jamais mot à mot, jamais mécanique.
- Si le texte contient du HTML simple (<p>, <strong>, <em>), conserve exactement la même structure HTML dans les deux traductions.
- Ne recherche rien, n'invente rien, ne complète pas ce qui manque : tu traduis uniquement ce qui est fourni.
- Renvoie une entrée par clé reçue, dans le même ordre, via l'outil fourni (translate_texts).`;

const MAX_TRANSLATE_ENTRIES = 60;

function parseTranslations(raw: unknown): Record<string, { en: string; he: string }> {
  const out: Record<string, { en: string; he: string }> = {};
  if (!Array.isArray(raw)) return out;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const key = str(o.key, 100);
    const en = str(o.en, 8000);
    const he = str(o.he, 8000);
    if (key && (en || he)) out[key] = { en: en ?? "", he: he ?? "" };
  }
  return out;
}

async function handleTranslate(
  req: Request,
  client: Anthropic,
  type: ExperienceType,
  texts: Record<string, string>
): Promise<Response> {
  const entries = Object.entries(texts).filter(([, v]) => typeof v === "string" && v.trim().length > 0).slice(0, MAX_TRANSLATE_ENTRIES);
  if (entries.length === 0) return json(req, { error: "Rien à traduire : aucun texte français fourni." }, 400);

  const systemPrompt = loadSystemPrompt(type) + TRANSLATE_INSTRUCTIONS;
  const userText = entries.map(([key, value]) => `### ${key}\n${value}`).join("\n\n");

  // deno-lint-ignore no-explicit-any
  let response: any;
  try {
    response = await client.messages.create({
      model: Deno.env.get("EXPERIENCE_DRAFT_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
      tools: [translateToolSchema],
      tool_choice: { type: "tool", name: TRANSLATE_TOOL_NAME },
    } as any);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("generate-experience-draft (translate): Claude a répondu", error.status, error.message.slice(0, 300));
    } else {
      console.error("generate-experience-draft (translate): Claude injoignable", error instanceof Error ? error.message : error);
    }
    return json(req, { error: "L'IA n'a pas pu traduire, réessaie dans un instant." }, 503);
  }

  const toolUse = response.content.find((block: any) => block.type === "tool_use" && block.name === TRANSLATE_TOOL_NAME);
  if (!toolUse) {
    console.error("generate-experience-draft (translate): pas de tool_use dans la réponse", response.stop_reason);
    return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
  }

  const translations = parseTranslations((toolUse.input as Record<string, unknown>)?.translations);
  return json(req, { translations });
}

// ---------------------------------------------------------------------------
// Mode "seo" (sprint 5B, étape 4) : à partir du titre/accroche/description
// déjà rédigés par Shana (pas de notes, lien ou PDF), produit uniquement les
// 4 champs SEO par langue. Ne touche jamais au titre, à la description ou à
// tout autre champ du formulaire.
// ---------------------------------------------------------------------------

const SEO_TOOL_NAME = "fill_seo_fields";

const seoToolSchema = {
  name: SEO_TOOL_NAME,
  description: "Renvoie les champs SEO (titre et méta-description) pour chaque langue fournie.",
  input_schema: {
    type: "object" as const,
    properties: {
      seo_title_en: LANG_STRING,
      seo_title_fr: LANG_STRING,
      seo_title_he: LANG_STRING,
      meta_description_en: LANG_STRING,
      meta_description_fr: LANG_STRING,
      meta_description_he: LANG_STRING,
    },
    required: [],
  },
};

const SEO_INSTRUCTIONS = `
---
Tâche : rédiger uniquement le titre SEO et la méta-description, pas de rédaction depuis zéro du contenu.
- Source : le titre, l'accroche et la description déjà rédigés par Shana, fournis ci-dessous par langue. N'invente aucun fait qui n'y figure pas.
- Pour chaque langue effectivement fournie (titre ou description non vide), produis :
  - seo_title_* : 60 caractères maximum, incluant si pertinent le lieu ou la catégorie, pensé pour Google et l'onglet du navigateur.
  - meta_description_* : 155 caractères maximum, qui donne envie de cliquer, dans la voix STAYMAKOM.
- Si une langue n'a ni titre ni description fournis, laisse ses deux champs SEO vides pour cette langue.
- Ne produis rien d'autre que les champs SEO : pas de titre, pas de description, pas de prix.
- Réponds uniquement via l'outil fourni (fill_seo_fields).`;

function cleanSeoText(v: unknown, max: number): string {
  const s = str(v, max);
  return s ?? "";
}

async function handleSeo(
  req: Request,
  client: Anthropic,
  type: ExperienceType,
  content: Record<string, unknown>
): Promise<Response> {
  const pick = (key: string) => (typeof content[key] === "string" ? (content[key] as string).trim() : "");
  const langs: { code: "en" | "fr" | "he"; label: string; title: string; subtitle: string; description: string }[] = [
    { code: "en", label: "Anglais", title: pick("title"), subtitle: pick("subtitle"), description: pick("long_copy") },
    { code: "fr", label: "Français", title: pick("title_fr"), subtitle: pick("subtitle_fr"), description: pick("long_copy_fr") },
    { code: "he", label: "Hébreu", title: pick("title_he"), subtitle: pick("subtitle_he"), description: pick("long_copy_he") },
  ];

  const usable = langs.filter((l) => l.title || l.description);
  if (usable.length === 0) {
    return json(req, { error: "Renseigne au moins un titre ou une description avant de générer le SEO." }, 400);
  }

  const userText = usable
    .map((l) => {
      const descriptionText = l.description ? htmlToText(l.description, 2000) : "";
      return `### ${l.label}\nTitre : ${l.title || "(vide)"}\nAccroche : ${l.subtitle || "(vide)"}\nDescription : ${descriptionText || "(vide)"}`;
    })
    .join("\n\n");

  const systemPrompt = loadSystemPrompt(type) + SEO_INSTRUCTIONS;

  // deno-lint-ignore no-explicit-any
  let response: any;
  try {
    response = await client.messages.create({
      model: Deno.env.get("EXPERIENCE_DRAFT_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
      tools: [seoToolSchema],
      tool_choice: { type: "tool", name: SEO_TOOL_NAME },
    } as any);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("generate-experience-draft (seo): Claude a répondu", error.status, error.message.slice(0, 300));
    } else {
      console.error("generate-experience-draft (seo): Claude injoignable", error instanceof Error ? error.message : error);
    }
    return json(req, { error: "L'IA n'a pas pu générer le SEO, réessaie dans un instant." }, 503);
  }

  const toolUse = response.content.find((block: any) => block.type === "tool_use" && block.name === SEO_TOOL_NAME);
  if (!toolUse) {
    console.error("generate-experience-draft (seo): pas de tool_use dans la réponse", response.stop_reason);
    return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
  }

  const raw = toolUse.input as Record<string, unknown>;
  const seo = {
    seo_title_en: cleanSeoText(raw.seo_title_en, 60),
    seo_title_fr: cleanSeoText(raw.seo_title_fr, 60),
    seo_title_he: cleanSeoText(raw.seo_title_he, 60),
    meta_description_en: cleanSeoText(raw.meta_description_en, 155),
    meta_description_fr: cleanSeoText(raw.meta_description_fr, 155),
    meta_description_he: cleanSeoText(raw.meta_description_he, 155),
  };
  return json(req, { seo });
}

// ---------------------------------------------------------------------------
// Mode "mood" (chantier Offre, prompt 3) : écrit titre, accroche et description
// pour un ou plusieurs moods d'une fiche, à partir du contenu déjà dans la fiche
// (présentation principale, L'essentiel, inclus, extras, après-réservation) et
// de la description de chaque mood. Pas de notes, de lien ni de PDF. Mêmes
// faits, angle différent. Ne renvoie rien d'autre que ces trois textes et,
// pour un mood sans photo, la photo de la galerie la plus adaptée.
// ---------------------------------------------------------------------------

const MOOD_TOOL_NAME = "write_mood_presentations";
const MAX_MOODS_PER_CALL = 3;

function buildMoodToolSchema(moodSlugs: string[], photoCount: number) {
  return {
    name: MOOD_TOOL_NAME,
    description: "Renvoie, pour chaque mood demandé, le titre, l'accroche et la description de l'expérience vue sous l'angle de ce mood.",
    input_schema: {
      type: "object" as const,
      properties: {
        presentations: {
          type: "array",
          description: "Une entrée par mood demandé.",
          items: {
            type: "object",
            properties: {
              mood_slug: { type: "string", enum: moodSlugs },
              title: LANG_STRING,
              title_fr: LANG_STRING,
              title_he: LANG_STRING,
              subtitle: LANG_STRING,
              subtitle_fr: LANG_STRING,
              subtitle_he: LANG_STRING,
              long_copy: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
              long_copy_fr: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
              long_copy_he: { type: "string", description: "HTML simple : <p>, <strong>, <em> uniquement." },
              ...(photoCount > 0
                ? {
                  cover_photo_number: {
                    type: ["integer", "null"],
                    minimum: 1,
                    maximum: photoCount,
                    description: "Numéro de la photo jointe la plus adaptée à ce mood, ou null.",
                  },
                }
                : {}),
            },
            required: ["mood_slug", "title", "title_fr", "title_he", "subtitle", "subtitle_fr", "subtitle_he", "long_copy", "long_copy_fr", "long_copy_he"],
          },
        },
        to_verify: {
          type: "array",
          description: "Phrases courtes en français : ce qui manquait dans la fiche pour bien écrire cet angle.",
          items: { type: "string" },
        },
      },
      required: ["presentations", "to_verify"],
    },
  };
}

const MOOD_INSTRUCTIONS = `
---
Tâche : réécrire la présentation d'une expérience pour un ou plusieurs moods, sans rédiger une nouvelle fiche.
- Ta seule source est la fiche fournie ci-dessous (présentation actuelle et faits communs) et la description de chaque mood. Tu ne fais aucune recherche.
- Mêmes faits, angle différent : durée, lieu, inclus, âge, taille du groupe restent exactement ceux de la fiche. Tu n'ajoutes aucun fait concret (plat, boisson, équipement, horaire, lieu, nombre, élément de paysage ou de végétation, allure, guide ou autre personne) absent de la fiche.
- S'adresser au lecteur : suis les « Préférences de Shana ». Chaque mood choisit selon son angle (« vous deux » pour un couple, « vous » pour une famille, « tu » sinon) et s'y tient dans tout son texte, même si la présentation actuelle de la fiche fait autrement. Si l'angle du mood demanderait un fait qui manque, écris sans lui et signale-le dans to_verify.
- Pour chaque mood demandé, écris un titre, une accroche (une phrase) et une description (3 à 4 paragraphes, HTML simple) en anglais, en français et en hébreu, chacun écrit nativement, jamais traduit mot à mot.
- Les titres suivent les règles de titre des consignes de marque. Aucun titre ne doit être identique à un « titre déjà pris » fourni ci-dessous, ni à celui d'un autre mood de ta réponse, dans aucune langue.
- Ne produis jamais de prix, de marge, de disponibilité, de créneau, d'information sur le prestataire, de canal de réservation ni de contact : ils n'ont pas leur place dans ces textes.
- Si des photos sont jointes, indique pour chaque mood le numéro de celle qui lui correspond le mieux (cover_photo_number).
- Réponds uniquement via l'outil fourni (write_mood_presentations).`;

interface MoodInput {
  moodIds: string[];
  presentation: Record<string, string>;
  facts: { label: string; value: string }[];
  takenTitles: string[];
  photoUrls: string[];
  needsCover: Set<string>;
}

const PRESENTATION_LANGS = [
  { label: "Anglais", suffix: "" },
  { label: "Français", suffix: "_fr" },
  { label: "Hébreu", suffix: "_he" },
] as const;

function readMoodInput(body: Record<string, unknown>): MoodInput {
  const content = (body.content && typeof body.content === "object" ? body.content : {}) as Record<string, unknown>;
  const presentationRaw = (content.presentation && typeof content.presentation === "object" ? content.presentation : {}) as Record<string, unknown>;
  const presentation: Record<string, string> = {};
  for (const { suffix } of PRESENTATION_LANGS) {
    for (const part of ["title", "subtitle", "long_copy"]) {
      const value = str(presentationRaw[`${part}${suffix}`], 8000);
      if (value) presentation[`${part}${suffix}`] = part === "long_copy" ? htmlToText(value, 3000) : value;
    }
  }
  const facts: MoodInput["facts"] = [];
  for (const entry of Array.isArray(content.facts) ? content.facts.slice(0, 40) : []) {
    if (!entry || typeof entry !== "object") continue;
    const label = str((entry as Record<string, unknown>).label, 80);
    const value = str((entry as Record<string, unknown>).value, 1500);
    if (label && value) facts.push({ label, value });
  }
  const moodIds = Array.from(new Set(strArray(body.mood_ids, MAX_MOODS_PER_CALL)));
  return {
    moodIds,
    presentation,
    facts,
    takenTitles: strArray(body.taken_titles, 30),
    photoUrls: cleanPhotoUrls(body.photo_urls),
    needsCover: new Set(strArray(body.needs_cover_ids, MAX_MOODS_PER_CALL).filter((id) => moodIds.includes(id))),
  };
}

// deno-lint-ignore no-explicit-any
function describeMood(mood: any): string {
  const description = [
    mood.presentation_title_fr || mood.presentation_title,
    mood.launch_description_fr || mood.launch_description,
    htmlToText(mood.intro_rich_text_fr || mood.intro_rich_text || "", 700),
    Array.isArray(mood.bullets) ? mood.bullets.join(" · ") : "",
  ].filter((part) => typeof part === "string" && part.trim().length > 0);
  return `- ${mood.slug} : ${mood.name}${description.length ? `\nDescription du mood : ${description.join(" ")}` : ""}`;
}

// deno-lint-ignore no-explicit-any
async function handleMood(req: Request, supabase: any, client: Anthropic, body: Record<string, unknown>): Promise<Response> {
  const input = readMoodInput(body);
  if (input.moodIds.length === 0) return json(req, { error: "Aucun mood à écrire." }, 400);

  const sourceLength = Object.values(input.presentation).join(" ").length + input.facts.map((f) => f.value).join(" ").length;
  if (sourceLength < 60) {
    return json(req, { error: "La fiche est encore trop vide : remplis d'abord la présentation principale ou L'essentiel." }, 400);
  }

  const { data: moodsData, error: moodsError } = await supabase
    .from("categories")
    .select("id, slug, name, presentation_title, presentation_title_fr, launch_description, launch_description_fr, intro_rich_text, intro_rich_text_fr, bullets")
    .in("id", input.moodIds);
  if (moodsError || !moodsData?.length) return json(req, { error: "Mood introuvable." }, 400);
  // deno-lint-ignore no-explicit-any
  const moods = moodsData as any[];
  const targetsBySlug = new Map<string, { id: string; name: string }>(moods.map((m) => [m.slug, { id: m.id, name: m.name }]));

  // Les photos ne sont jointes que si au moins un mood demandé n'en a pas.
  const photoUrls = input.needsCover.size > 0 ? input.photoUrls : [];

  const parts: string[] = [];
  const presentationText = PRESENTATION_LANGS.map(({ label, suffix }) => {
    const title = input.presentation[`title${suffix}`];
    const subtitle = input.presentation[`subtitle${suffix}`];
    const description = input.presentation[`long_copy${suffix}`];
    if (!title && !subtitle && !description) return null;
    return `### ${label}\nTitre : ${title || "(vide)"}\nAccroche : ${subtitle || "(vide)"}\nDescription : ${description || "(vide)"}`;
  }).filter(Boolean);
  if (presentationText.length) parts.push(`Présentation actuelle de la fiche :\n${presentationText.join("\n\n")}`);
  if (input.facts.length) parts.push(`Faits communs à tous les moods :\n${input.facts.map((f) => `- ${f.label} : ${f.value}`).join("\n")}`);
  if (input.takenTitles.length) parts.push(`Titres déjà pris par les autres moods de cette fiche (interdits) :\n${input.takenTitles.map((t) => `- ${t}`).join("\n")}`);
  parts.push(`Moods à écrire (un bloc par mood, désigné par son slug) :\n${moods.map(describeMood).join("\n")}`);
  if (photoUrls.length) parts.push(`${photoUrls.length} photo(s) de la galerie sont jointes, numérotées.`);

  const warnings: string[] = [];
  // deno-lint-ignore no-explicit-any
  let response: any;
  try {
    response = await callTool(
      client,
      {
        model: Deno.env.get("EXPERIENCE_DRAFT_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: STANDALONE_BRAND_PROMPT + MOOD_WRITING_PROMPT + MOOD_INSTRUCTIONS,
        messages: [{ role: "user", content: [...photoBlocks(photoUrls), { type: "text", text: parts.join("\n\n") }] }],
        tools: [buildMoodToolSchema(moods.map((m) => m.slug), photoUrls.length)],
        tool_choice: { type: "tool", name: MOOD_TOOL_NAME },
      },
      photoUrls.length > 0,
      warnings,
    );
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("generate-experience-draft (mood): Claude a répondu", error.status, error.message.slice(0, 300));
    } else {
      console.error("generate-experience-draft (mood): Claude injoignable", error instanceof Error ? error.message : error);
    }
    return json(req, { error: "L'IA n'a pas pu réécrire ce mood, réessaie dans un instant." }, 503);
  }

  // deno-lint-ignore no-explicit-any
  const toolUse = response.content.find((block: any) => block.type === "tool_use" && block.name === MOOD_TOOL_NAME);
  if (!toolUse) {
    console.error("generate-experience-draft (mood): pas de tool_use dans la réponse", response.stop_reason);
    return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
  }

  const raw = toolUse.input as Record<string, unknown>;
  const { presentations, toVerify } = parseMoodPresentations(raw.presentations, {
    targetsBySlug,
    needsCover: input.needsCover,
    photoUrls,
    takenTitles: input.takenTitles,
  });
  if (Object.keys(presentations).length === 0) {
    return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
  }
  return json(req, { presentations, to_verify: [...strArray(raw.to_verify, 15), ...toVerify], warnings });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Réservé aux administrateurs (même contrôle que generate-dossier-brief)
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json(req, { error: "Connexion requise" }, 401);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) return json(req, { error: "Connexion requise" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json(req, { error: "Réservé aux administrateurs" }, 403);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json(req, { error: "Clé IA manquante : ANTHROPIC_API_KEY n'est pas configurée." }, 500);

    const body = await req.json().catch(() => ({}));
    const type: ExperienceType = body?.type === "hotel" ? "hotel" : "standalone";
    const mode: "draft" | "translate" | "seo" | "mood" =
      body?.mode === "translate" ? "translate" : body?.mode === "seo" ? "seo" : body?.mode === "mood" ? "mood" : "draft";

    const workspaceIdEarly = Deno.env.get("ANTHROPIC_WORKSPACE_ID");
    const anthropicClient = new Anthropic({
      apiKey,
      timeout: AI_TIMEOUT_MS,
      maxRetries: 1,
      defaultHeaders: workspaceIdEarly ? { "anthropic-workspace-id": workspaceIdEarly } : undefined,
    });

    if (mode === "translate") {
      const texts = body?.texts && typeof body.texts === "object" ? (body.texts as Record<string, unknown>) : {};
      const cleanTexts: Record<string, string> = {};
      for (const [key, value] of Object.entries(texts)) {
        if (typeof key === "string" && typeof value === "string") cleanTexts[key.slice(0, 100)] = value.slice(0, 8000);
      }
      return await handleTranslate(req, anthropicClient, type, cleanTexts);
    }

    if (mode === "seo") {
      const content = body?.content && typeof body.content === "object" ? (body.content as Record<string, unknown>) : {};
      return await handleSeo(req, anthropicClient, type, content);
    }

    if (mode === "mood") {
      return await handleMood(req, supabase, anthropicClient, body ?? {});
    }

    const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 20_000) : null;
    const url = typeof body?.url === "string" && body.url.trim() ? body.url.trim() : null;
    const pdfBase64 = typeof body?.pdf_base64 === "string" && body.pdf_base64.trim() ? body.pdf_base64.trim() : null;
    const pdfName = typeof body?.pdf_name === "string" ? body.pdf_name : null;

    if (!notes && !url && !pdfBase64) {
      return json(req, { error: "Donne au moins des notes, un lien ou un PDF." }, 400);
    }
    if (pdfBase64) {
      const approxBytes = (pdfBase64.length * 3) / 4;
      if (approxBytes > MAX_PDF_BYTES) return json(req, { error: "Le PDF dépasse 10 Mo." }, 400);
    }

    const isStandalone = type === "standalone";

    // Moods publiés et brouillons (jamais les archivés).
    const { data: categoriesData } = await supabase.from("categories").select("id, slug, name, status").order("name");
    const categories = (categoriesData ?? [])
      .filter((c) => !isStandalone || c.status !== "archived")
      .map((c) => ({ id: c.id as string, slug: c.slug as string, name: c.name as string }));

    // Région, badges et photos : uniquement pour une expérience seule.
    let regions: (NamedRef & { id: string })[] = [];
    let badges: (NamedRef & { id: string })[] = [];
    if (isStandalone) {
      const [regionsResult, badgesResult] = await Promise.all([
        supabase.from("regions").select("id, slug, name, name_fr").eq("is_active", true).order("display_order"),
        supabase.from("highlight_tags").select("id, slug, label_en, label_fr").eq("is_common", true).order("display_order"),
      ]);
      regions = (regionsResult.data ?? []).map((r) => ({ id: r.id as string, slug: r.slug as string, name: `${r.name_fr} (${r.name})` }));
      badges = (badgesResult.data ?? []).map((b) => ({ id: b.id as string, slug: b.slug as string, name: (b.label_fr || b.label_en) as string }));
    }
    const photoUrls = isStandalone ? cleanPhotoUrls(body?.photo_urls) : [];

    const warnings: string[] = [];
    const userContent = await buildUserContent({ type, notes, url, pdfBase64, pdfName }, { categories, regions, badges }, photoUrls, warnings);

    const systemPrompt = isStandalone
      ? loadSystemPrompt(type) + MOOD_WRITING_PROMPT + TECHNICAL_INSTRUCTIONS + STANDALONE_DRAFT_INSTRUCTIONS
      : loadSystemPrompt(type) + TECHNICAL_INSTRUCTIONS;
    const tool = buildToolSchema(
      { categorySlugs: categories.map((c) => c.slug), regionSlugs: regions.map((r) => r.slug), badgeSlugs: badges.map((b) => b.slug), photoCount: photoUrls.length },
      type,
    );

    // deno-lint-ignore no-explicit-any
    let response: any;
    try {
      response = await callTool(
        anthropicClient,
        {
          model: Deno.env.get("EXPERIENCE_DRAFT_AI_MODEL") || DEFAULT_CLAUDE_MODEL,
          max_tokens: MAX_DRAFT_TOKENS,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
          tools: [tool],
          tool_choice: { type: "tool", name: TOOL_NAME },
        },
        photoUrls.length > 0,
        warnings,
      );
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        console.error("generate-experience-draft: Claude a répondu", error.status, error.message.slice(0, 300));
      } else {
        console.error("generate-experience-draft: Claude injoignable", error instanceof Error ? error.message : error);
      }
      return json(req, { error: "L'IA n'a pas pu générer de brouillon, réessaie dans un instant." }, 503);
    }

    const toolUse = response.content.find((block: any) => block.type === "tool_use" && block.name === TOOL_NAME);
    if (!toolUse) {
      console.error("generate-experience-draft: pas de tool_use dans la réponse", response.stop_reason);
      return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
    }

    let draft: ExperienceDraft;
    let toVerify: string[];
    try {
      ({ draft, toVerify } = parseDraft(toolUse.input as Record<string, unknown>, {
        categoriesBySlug: new Map(categories.map((c) => [c.slug, c.id])),
        regionsBySlug: new Map(regions.map((r) => [r.slug, r.id])),
        badgesBySlug: new Map(badges.map((b): [string, BadgeRef] => [b.slug, { id: b.id, label: b.name }])),
        photoUrls,
        maxCategories: isStandalone ? 3 : 2,
        secondaryOnlySlugs: isStandalone ? [BOATS_CATEGORY_SLUG] : [],
      }));
    } catch (error) {
      console.error("generate-experience-draft: réponse IA invalide", error instanceof Error ? error.message : error);
      return json(req, { error: "La réponse de l'IA n'a pas pu être lue, réessaie." }, 502);
    }

    return json(req, { draft, to_verify: toVerify, warnings });
  } catch (error) {
    console.error("generate-experience-draft: erreur inattendue", error);
    return json(req, { error: "Une erreur inattendue est survenue." }, 500);
  }
});
