// Blog automatique du Journal : rédige un article SEO dans une langue (en / he / fr) à partir
// de la file de sujets (blog_topics) et des vraies fiches publiées, le contrôle, puis
// l'enregistre (programmé à 17:00, brouillon à valider, ou bloqué) et envoie un email à Shana.
//
// Appelants :
//  - la tâche planifiée de la base (secret x-cron-secret), chaque jour à 05:00 heure d'Israël ;
//  - un admin du back-office (bouton « Générer maintenant » ou « Régénérer »).
// La réponse part tout de suite (202) ; le travail continue en arrière-plan et son avancement
// est lisible dans journal_generation_runs.
//
// Corps (tous facultatifs) : { topic_id, post_id (régénérer cet article), only_at_israel_hour }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.127.0";
import { getAdminEmail, isInternalCron } from "../_shared/internal-auth.ts";
import type {
  BlogTopic,
  GeneratedArticle,
  JournalLang,
  JournalSettings,
  ListingContext,
  PublishedArticleRef,
} from "../_shared/journal/types.ts";
import { chooseTopic } from "../_shared/journal/rotation.ts";
import { israelDate, israelHour, nextPublishAt } from "../_shared/journal/schedule.ts";
import { selectListings, type CandidateListing } from "../_shared/journal/listings.ts";
import { coerceArticle, validateArticle } from "../_shared/journal/validate.ts";
import { providerTerms, runContentChecks, type ProviderName } from "../_shared/journal/checks.ts";
import { articleText, bodyWordCount, extractLinks, normalizePath, slugify } from "../_shared/journal/text.ts";
import { articleToolSchema, systemPromptFor, TOOL_NAME, userPrompt } from "../_shared/journal/prompt.ts";
import { journalEmailHtml, journalEmailSubject } from "../_shared/journal/email.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const ALLOWED_ORIGINS = [
  "https://staymakom.com",
  "https://www.staymakom.com",
  "https://stay-makom-experiences.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];
const SITE = "https://www.staymakom.com";
const REJECT_URL = `${SITE}/journal-action`;
// Même modèle que generate-experience-draft (variable d'environnement partagée).
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5";
// Tarif Sonnet (dollars par million de jetons) pour estimer le coût de chaque article.
const PRICE_IN = 3;
const PRICE_OUT = 15;
// Recherche web : 10 $ pour 1 000 recherches.
const PRICE_PER_SEARCH = 0.01;
const MAX_TOKENS = 12_000;
const AI_TIMEOUT_MS = 300_000;
const BOATS_CATEGORY_ID = "06434e23-29f4-4c6b-ba63-b61e68879520";

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

// deno-lint-ignore no-explicit-any
type Db = any;
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

// ---------------------------------------------------------------------------
// Lecture des données
// ---------------------------------------------------------------------------

function pick(row: Row, base: string, lang: JournalLang): string {
  const suffix = lang === "en" ? (row[`${base}_en`] !== undefined ? "_en" : "") : `_${lang}`;
  return (row[`${base}${suffix}`] || "").toString().trim();
}

function standalonePrice(r: Row): number | null {
  if (r.is_bookable === false) return null;
  const child = r.base_price_child;
  const base = Number(r.base_price) || 0;
  const price = r.has_child_price && child != null && child > 0 ? Math.min(base, child) : base;
  return price > 0 && (r.currency || "ILS") === "ILS" ? price : null;
}

async function loadCandidates(db: Db, lang: JournalLang): Promise<CandidateListing[]> {
  const [regionsRes, catsRes, saRes, e2Res] = await Promise.all([
    db.from("regions").select("id,slug,name,name_fr,name_he"),
    db.from("categories").select("id,slug,name"),
    db
      .from("standalone_experiences")
      .select(
        "id,slug,title,title_fr,title_he,seo_title_en,seo_title_fr,seo_title_he,subtitle,subtitle_fr,subtitle_he,meta_description_en,meta_description_fr,meta_description_he,city,city_fr,city_he,region_id,category_id,category_ids,base_price,base_price_child,has_child_price,base_price_type,currency,hero_image,thumbnail_image,address,is_bookable,is_featured"
      )
      .eq("status", "published")
      .order("display_order", { ascending: true, nullsFirst: false }),
    db
      .from("experiences2")
      .select(
        "id,slug,title,title_fr,title_he,seo_title_en,seo_title_fr,seo_title_he,subtitle,subtitle_fr,subtitle_he,meta_description_en,meta_description_fr,meta_description_he,category_id,base_price,from_price_ils,hero_image,thumbnail_image,address,hotels2!inner(name,name_he,name_fr,city,city_fr,city_he,region_id,hero_image,address)"
      )
      .eq("status", "published")
      .order("display_order", { ascending: true, nullsFirst: false }),
  ]);
  for (const r of [regionsRes, catsRes, saRes, e2Res]) if (r.error) throw new Error(`Lecture des fiches : ${r.error.message}`);
  const regions = new Map<string, Row>((regionsRes.data as Row[]).map((r) => [r.id, r]));
  const cats = new Map<string, Row>((catsRes.data as Row[]).map((c) => [c.id, c]));
  const regionName = (id: string | null) => {
    const r = id ? regions.get(id) : null;
    return r ? (lang === "en" ? r.name : r[`name_${lang}`] || r.name) : null;
  };

  const out: CandidateListing[] = [];
  for (const r of saRes.data as Row[]) {
    const moodIds: string[] = [...new Set([r.category_id, ...(r.category_ids || [])].filter(Boolean))];
    const isBoat = moodIds.includes(BOATS_CATEGORY_ID);
    out.push({
      id: r.id,
      kind: isBoat ? "boat" : "standalone",
      path: `${isBoat ? "/boat" : "/standalone-experience"}/${r.slug}`,
      title: pick(r, "seo_title", lang) || pick(r, "title", lang) || r.title,
      description: pick(r, "meta_description", lang) || pick(r, "subtitle", lang) || r.subtitle || "",
      city: (lang === "en" ? r.city : r[`city_${lang}`] || r.city) || null,
      region: regionName(r.region_id),
      moods: moodIds.map((id) => cats.get(id)?.name).filter(Boolean),
      from_price_ils: standalonePrice(r),
      price_basis: r.base_price_type === "per_person" ? "per_person" : "per_group",
      cover_image: r.hero_image || r.thumbnail_image || null,
      hotel_name: null,
      address: r.address || null,
      region_slug: r.region_id ? regions.get(r.region_id)?.slug || null : null,
      mood_slugs: moodIds.map((id) => cats.get(id)?.slug).filter(Boolean),
    });
  }
  for (const r of e2Res.data as Row[]) {
    const h = r.hotels2 || {};
    const moodIds = [r.category_id].filter(Boolean);
    out.push({
      id: r.id,
      kind: "experience",
      path: `/experience/${r.slug}`,
      title: pick(r, "seo_title", lang) || pick(r, "title", lang) || r.title,
      description: pick(r, "meta_description", lang) || pick(r, "subtitle", lang) || r.subtitle || "",
      city: (lang === "en" ? h.city : h[`city_${lang}`] || h.city) || null,
      region: regionName(h.region_id),
      moods: moodIds.map((id) => cats.get(id)?.name).filter(Boolean),
      from_price_ils: Number(r.base_price) > 0 ? Math.round(Number(r.base_price)) : r.from_price_ils ? Math.round(Number(r.from_price_ils)) : null,
      price_basis: "package",
      cover_image: r.hero_image || r.thumbnail_image || h.hero_image || null,
      hotel_name: (lang === "he" ? h.name_he : lang === "fr" ? h.name_fr : null) || h.name || null,
      address: r.address || null,
      region_slug: h.region_id ? regions.get(h.region_id)?.slug || null : null,
      mood_slugs: moodIds.map((id) => cats.get(id)?.slug).filter(Boolean),
    });
  }
  return out;
}

/** Articles publiés lisibles dans cette langue (nouveaux articles de la langue + anciens articles traduits). */
async function loadPublished(db: Db, lang: JournalLang): Promise<PublishedArticleRef[]> {
  const { data, error } = await db
    .from("journal_posts")
    .select("slug,lang,title,title_en,title_he,primary_keyword")
    .eq("pipeline_status", "published")
    .order("published_at", { ascending: false });
  if (error) throw new Error(`Lecture des articles : ${error.message}`);
  const out: PublishedArticleRef[] = [];
  for (const p of data as Row[]) {
    const legacy = !p.title;
    if (!legacy && p.lang === lang) out.push({ title: p.title, path: `/journal/${p.slug}`, lang, primary_keyword: p.primary_keyword });
    if (legacy && lang === "en" && p.title_en) out.push({ title: p.title_en, path: `/journal/${p.slug}`, lang, primary_keyword: null });
    if (legacy && lang === "he" && p.title_he) out.push({ title: p.title_he, path: `/journal/${p.slug}`, lang, primary_keyword: null });
  }
  return out;
}

async function loadSettings(db: Db): Promise<JournalSettings> {
  const { data, error } = await db.from("journal_settings").select("*").eq("id", true).single();
  if (error || !data) throw new Error(`Réglages du Journal introuvables : ${error?.message}`);
  return data as JournalSettings;
}

// ---------------------------------------------------------------------------
// Rédaction (Claude) : une tentative, puis une correction si le contrôle de forme échoue
// ---------------------------------------------------------------------------

interface DraftResult {
  article: GeneratedArticle | null;
  errors: string[];
  attempts: number;
  inputTokens: number;
  outputTokens: number;
  webSearches: number;
  model: string;
}

// Recherche web de l'API Claude (décision de Shana du 25/11/2026) : tout lieu, événement,
// marché, festival ou décoration cité doit être vérifié en ligne, sinon il est retiré.
// Version « basique » de l'outil : c'est celle que le modèle du rédacteur (Sonnet 4.5) accepte.
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 8 };
// La fonction serveur s'arrête au bout de ~400 s : au-delà de ce délai, plus de 2e tentative.
const WRITING_DEADLINE_MS = 300_000;

async function writeArticle(
  client: Anthropic,
  topic: BlogTopic,
  system: string,
  user: string,
  validate: (a: GeneratedArticle) => string[]
): Promise<DraftResult> {
  const model = Deno.env.get("EXPERIENCE_DRAFT_AI_MODEL") || DEFAULT_CLAUDE_MODEL;
  const started = Date.now();
  // deno-lint-ignore no-explicit-any
  const messages: any[] = [{ role: "user", content: user }];
  const result: DraftResult = { article: null, errors: [], attempts: 0, inputTokens: 0, outputTokens: 0, webSearches: 0, model };

  // Au plus 8 appels : recherches (avec reprises « pause_turn »), rédaction, puis une correction.
  for (let call = 0; call < 8 && result.attempts < 2; call++) {
    // deno-lint-ignore no-explicit-any
    const response: any = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system,
      messages,
      tools: [WEB_SEARCH_TOOL, articleToolSchema],
      // « auto » : le rédacteur peut chercher sur le web avant d'appeler write_article.
      tool_choice: { type: "auto" },
      // deno-lint-ignore no-explicit-any
    } as any);
    result.inputTokens += response.usage?.input_tokens || 0;
    result.outputTokens += response.usage?.output_tokens || 0;
    result.webSearches += response.usage?.server_tool_use?.web_search_requests || 0;
    messages.push({ role: "assistant", content: response.content });

    // Recherches en cours côté serveur : on relance sans rien ajouter, il reprend où il en était.
    if (response.stop_reason === "pause_turn") continue;

    // deno-lint-ignore no-explicit-any
    const toolUse = response.content.find((b: any) => b.type === "tool_use" && b.name === TOOL_NAME);
    if (!toolUse) {
      if (response.stop_reason === "max_tokens") {
        result.errors = ["Réponse coupée avant l'article (trop longue)"];
        break;
      }
      messages.push({ role: "user", content: "Your research is done: now call the write_article tool with the complete article." });
      continue;
    }
    result.attempts++;
    const article = coerceArticle(toolUse.input);
    const errors = response.stop_reason === "max_tokens" ? ["Article coupé (trop long)", ...validate(article)] : validate(article);
    result.article = article;
    result.errors = errors;
    if (!errors.length || result.attempts >= 2) break;
    if (Date.now() - started > WRITING_DEADLINE_MS) {
      result.errors = [...errors, "Pas de 2e tentative : temps de rédaction dépassé"];
      break;
    }
    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUse.id,
          is_error: true,
          content: `The article was rejected by the automatic checks. Fix ALL of these problems and call write_article again with the complete corrected article (same language, same topic). Do not search again unless a fix needs a new source:\n- ${errors.join("\n- ")}`,
        },
      ],
    });
  }
  if (!result.article && !result.errors.length) result.errors = ["Le rédacteur n'a pas rendu d'article"];
  console.log(
    `generate-journal-article: ${topic.primary_keyword} (${topic.lang}) ${result.attempts} tentative(s), ${result.webSearches} recherche(s), erreurs: ${result.errors.length}`
  );
  return result;
}

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uniqueSlug(db: Db, base: string, exceptId: string | null): Promise<string> {
  const root = base || `article-${Date.now()}`;
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const { data } = await db.from("journal_posts").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === exceptId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

function publishLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Asia/Jerusalem",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.error("generate-journal-article: RESEND_API_KEY manquante, email non envoyé");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "StayMakom <hello@staymakom.com>", to: [to], subject, html }),
  });
  if (!res.ok) console.error("generate-journal-article: Resend a refusé l'email", res.status, (await res.text()).slice(0, 300));
}

// ---------------------------------------------------------------------------
// Génération complète
// ---------------------------------------------------------------------------

interface RunParams {
  runId: string;
  topicId: string | null;
  postId: string | null;
  /**
   * Test volontaire des contrôles (admin ou tâche planifiée seulement) : phrase ajoutée à la
   * conclusion AVANT les contrôles de fond, ex. un nom de prestataire. Jamais utilisé par la
   * génération quotidienne.
   */
  testInjectText: string | null;
}

async function generate(db: Db, client: Anthropic, params: RunParams) {
  const finishRun = (fields: Row) =>
    db.from("journal_generation_runs").update({ ...fields, finished_at: new Date().toISOString() }).eq("id", params.runId);

  try {
    const settings = await loadSettings(db);
    const today = israelDate();
    const notes: string[] = [];

    // 1. Sujet
    let existingPost: Row | null = null;
    let topic: BlogTopic | null = null;
    if (params.postId) {
      const { data } = await db.from("journal_posts").select("*").eq("id", params.postId).single();
      existingPost = data;
      if (!existingPost?.topic_id) throw new Error("Article sans sujet d'origine : impossible de le régénérer.");
      if (existingPost.pipeline_status === "published") throw new Error("Article déjà publié : le dépublier avant de le régénérer.");
      params.topicId = existingPost.topic_id;
    }
    if (params.topicId) {
      const { data, error } = await db.from("blog_topics").select("*").eq("id", params.topicId).single();
      if (error || !data) throw new Error("Sujet introuvable.");
      topic = data as BlogTopic;
    } else {
      const { data: todo } = await db.from("blog_topics").select("*").eq("status", "a_faire");
      const { data: recent } = await db
        .from("journal_generation_runs")
        .select("lang")
        .in("status", ["done", "blocked"])
        .not("lang", "is", null)
        .order("started_at", { ascending: false })
        .limit(6);
      const choice = chooseTopic((todo || []) as BlogTopic[], ((recent || []) as Row[]).map((r) => r.lang), today);
      notes.push(...choice.notes);
      topic = choice.topic;
    }
    if (!topic) {
      await finishRun({ status: "skipped", error: "File de sujets vide", notes });
      await sendEmail(
        settings.notify_email,
        "Journal · aucun article aujourd'hui (file vide)",
        `<p style="font-family:Inter,Arial,sans-serif;font-size:15px;">La file de sujets du Journal est vide : aucun article n'a été généré aujourd'hui. Ajoute des sujets dans le back-office (Journal, onglet « File de sujets »).</p>`
      );
      return;
    }
    const lang = topic.lang;
    await db.from("journal_generation_runs").update({ topic_id: topic.id, lang }).eq("id", params.runId);

    // 2. Contexte : fiches, articles publiés, pages de moods
    const candidates = await loadCandidates(db, lang);
    const listings = selectListings(candidates, topic);
    if (listings.length < 2) throw new Error("Moins de 2 fiches publiées disponibles pour ce sujet.");
    const published = (await loadPublished(db, lang)).filter((p) => !existingPost || p.path !== `/journal/${existingPost.slug}`);
    const { data: moodRows } = await db.from("categories").select("slug,name").eq("status", "published").in("slug", topic.link_moods.length ? topic.link_moods : ["-"]);
    const extraPaths = [
      ...((moodRows || []) as Row[]).filter((m) => m.slug !== "bateaux").map((m) => ({ path: `/category/${m.slug}`, label: m.name })),
      { path: "/experiences", label: "All STAYMAKOM experiences" },
    ];
    const contextListings: ListingContext[] = listings.map(({ region_slug: _r, mood_slugs: _m, ...l }) => l);
    const safeListings = contextListings.map((l) => ({ ...l, address: null })); // l'adresse ne part jamais au rédacteur

    // 3. Rédaction + contrôle de forme
    const validate = (a: GeneratedArticle) =>
      validateArticle(a, {
        topicType: topic!.topic_type,
        listings: contextListings,
        extraAllowedPaths: [...published.map((p) => p.path), ...extraPaths.map((p) => p.path)],
      });
    const draft = await writeArticle(
      client,
      topic,
      systemPromptFor(lang, topic),
      userPrompt({ topic, listings: safeListings, published: published.slice(0, 15), extraPaths, today, keyDates: settings.key_dates || "" }),
      validate
    );
    const costUsd =
      Math.round(((draft.inputTokens * PRICE_IN + draft.outputTokens * PRICE_OUT) / 1_000_000 + draft.webSearches * PRICE_PER_SEARCH) * 10000) / 10000;
    const article = draft.article;
    if (!article || !article.h1) throw new Error(`Le rédacteur n'a pas rendu d'article exploitable : ${draft.errors.join(" ; ")}`);
    if (params.testInjectText) {
      article.conclusion = `${article.conclusion} ${params.testInjectText}`.trim();
      notes.push(`Test volontaire des contrôles : phrase ajoutée « ${params.testInjectText} ».`);
    }

    // 4. Contrôles de fond
    const { data: providers } = await db.from("providers").select("name,provider_type");
    const { data: dup } = await db
      .from("journal_posts")
      .select("id,title,title_en")
      .eq("lang", lang)
      .in("pipeline_status", ["scheduled", "published"])
      .ilike("primary_keyword", topic.primary_keyword.replace(/[%_]/g, "\\$&"))
      .neq("id", existingPost?.id || "00000000-0000-0000-0000-000000000000")
      .limit(1);
    const contentReasons = runContentChecks({
      text: [articleText(article), article.seo_title, article.meta_description, article.cover_alt].join("\n"),
      lang,
      providerTerms: providerTerms((providers || []) as ProviderName[], settings.provider_aliases || [], settings.provider_allowlist || []),
      forbiddenWords: settings.forbidden_words || {},
      chainNames: settings.chain_names || [],
      listingAddresses: contextListings.map((l) => l.address),
      duplicateOf: dup?.[0] ? dup[0].title || dup[0].title_en : null,
    });
    const blockReasons = [...draft.errors, ...contentReasons];

    // 5. Statut : bloqué, brouillon de calibrage (3 premiers) ou programmé
    let status: "blocked" | "draft" | "scheduled" = "scheduled";
    if (blockReasons.length) status = "blocked";
    else if (existingPost?.pipeline_status === "draft") {
      // Régénération d'un brouillon : il reste un brouillon, sans reprendre une place de calibrage.
      status = "draft";
    } else if (settings.manual_review_remaining > 0) {
      // Décompte atomique : deux générations simultanées ne prennent pas la même place.
      const { data: dec } = await db
        .from("journal_settings")
        .update({ manual_review_remaining: settings.manual_review_remaining - 1 })
        .eq("id", true)
        .eq("manual_review_remaining", settings.manual_review_remaining)
        .select("manual_review_remaining");
      if (dec && dec.length) {
        status = "draft";
        notes.push(`Article de calibrage : il attend ta validation (encore ${dec[0].manual_review_remaining} après celui-ci).`);
      }
    }
    const publishAt = status === "scheduled" ? nextPublishAt(new Date(), settings.publish_hour) : null;
    if (status === "scheduled" && !settings.auto_publish) {
      notes.push("La publication automatique est en pause : l'article attendra que tu la rallumes (ou « Publier maintenant »).");
    }

    // 6. Enregistrement
    const byId = new Map(contextListings.map((l) => [l.id, l]));
    const bookingIds = [...new Set(article.booking_listing_ids)].filter((id) => byId.has(id)).slice(0, 4);
    const cover = byId.get(article.cover_listing_id) || byId.get(bookingIds[0]) || contextListings[0];
    const slug = existingPost
      ? existingPost.slug
      : await uniqueSlug(db, slugify(article.slug || article.h1, lang) || slugify(topic.working_title, lang), null);
    console.log(`generate-journal-article: slug proposé « ${article.slug} » → « ${slug} »`);
    const wordCount = bodyWordCount(article);
    const row = {
      lang,
      slug,
      category: "Guides",
      author_name: "STAYMAKOM",
      title: article.h1,
      seo_title: article.seo_title.slice(0, 60) || null,
      meta_description: article.meta_description.slice(0, 155) || null,
      intro: article.intro,
      body: article.sections,
      booking_intro: article.booking_intro,
      conclusion: article.conclusion,
      faq: article.faq,
      cover_image: cover?.cover_image || null,
      cover_alt: article.cover_alt,
      primary_keyword: topic.primary_keyword,
      secondary_keywords: article.secondary_keywords,
      linked_listings: bookingIds.map((id) => ({ id, kind: byId.get(id)!.kind, path: byId.get(id)!.path })),
      internal_links: [...new Set(extractLinks(articleText(article)).map(normalizePath))],
      to_verify: article.to_verify,
      block_reason: blockReasons.length ? blockReasons.join("\n") : null,
      topic_id: topic.id,
      topic_group: topic.topic_group,
      pipeline_status: status,
      scheduled_at: publishAt ? publishAt.toISOString() : null,
      generated_at: new Date().toISOString(),
      generation_meta: {
        model: draft.model,
        attempts: draft.attempts,
        web_searches: draft.webSearches,
        input_tokens: draft.inputTokens,
        output_tokens: draft.outputTokens,
        cost_usd: costUsd,
        word_count: wordCount,
        listings_offered: contextListings.map((l) => l.id),
      },
    };
    const saved = existingPost
      ? await db.from("journal_posts").update(row).eq("id", existingPost.id).select("id").single()
      : await db.from("journal_posts").insert(row).select("id").single();
    if (saved.error) {
      if (status === "draft") {
        await db.from("journal_settings").update({ manual_review_remaining: settings.manual_review_remaining }).eq("id", true);
      }
      throw new Error(`Enregistrement de l'article : ${saved.error.message}`);
    }
    const postId = saved.data.id as string;
    await db.from("blog_topics").update({ status: "genere" }).eq("id", topic.id).eq("status", "a_faire");

    // 7. Lien « Rejeter » (usage unique, 24 h) et email
    const token = randomToken();
    await db.from("journal_action_tokens").insert({
      post_id: postId,
      action: "reject",
      token_hash: await sha256Hex(token),
      expires_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
    });
    const editUrl = `${SITE}/admin/journal/article/${postId}`;
    const emailParams = {
      title: article.h1,
      lang,
      status,
      publishAtLabel: publishAt ? `le ${publishLabel(publishAt)}` : null,
      blockReasons,
      toVerify: article.to_verify,
      notes,
      keyword: topic.primary_keyword,
      wordCount,
      costUsd,
      links: { preview: `${editUrl}?tab=preview`, edit: editUrl, publish: `${editUrl}?action=publish`, reject: `${REJECT_URL}?t=${token}` },
    } as const;
    await sendEmail(settings.notify_email, journalEmailSubject(emailParams), journalEmailHtml(emailParams));

    await finishRun({
      status: status === "blocked" ? "blocked" : "done",
      post_id: postId,
      notes,
      input_tokens: draft.inputTokens,
      output_tokens: draft.outputTokens,
      cost_usd: costUsd,
      error: blockReasons.length ? blockReasons.join("\n") : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("generate-journal-article:", message);
    await finishRun({ status: "failed", error: message.slice(0, 2000) });
    try {
      const settings = await loadSettings(db);
      await sendEmail(
        settings.notify_email,
        "Journal · la génération du jour a échoué",
        `<p style="font-family:Inter,Arial,sans-serif;font-size:15px;">La génération de l'article du jour n'a pas abouti : ${message
          .replace(/</g, "&lt;")
          .slice(0, 500)}</p><p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#555;">Tu peux relancer depuis le back-office (Journal, « Générer maintenant »).</p>`
      );
    } catch {
      // rien de plus à faire
    }
  }
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const fromCron = await isInternalCron(req, db);
  const adminEmail = fromCron ? null : await getAdminEmail(req, db);
  if (!fromCron && !adminEmail) return json(req, { error: "Réservé aux administrateurs" }, 401);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json(req, { error: "Clé IA manquante : ANTHROPIC_API_KEY n'est pas configurée." }, 500);

  const body = await req.json().catch(() => ({}));
  if (fromCron && typeof body?.only_at_israel_hour === "number" && israelHour() !== body.only_at_israel_hour) {
    return json(req, { skipped: "pas encore l'heure en Israël" });
  }

  // Une seule génération automatique par jour (index unique sur run_date pour la tâche planifiée).
  const { data: run, error: runError } = await db
    .from("journal_generation_runs")
    // Une demande précise (sujet ou article donné) n'est pas « l'article du jour ».
    .insert({ trigger: fromCron && !body?.topic_id && !body?.post_id ? "cron" : "admin", run_date: israelDate() })
    .select("id")
    .single();
  if (runError) {
    if (runError.code === "23505") return json(req, { skipped: "article du jour déjà généré" });
    return json(req, { error: runError.message }, 500);
  }

  const workspaceId = Deno.env.get("ANTHROPIC_WORKSPACE_ID");
  const client = new Anthropic({
    apiKey,
    timeout: AI_TIMEOUT_MS,
    maxRetries: 1,
    defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
  });
  EdgeRuntime.waitUntil(
    generate(db, client, {
      runId: run.id,
      topicId: typeof body?.topic_id === "string" ? body.topic_id : null,
      postId: typeof body?.post_id === "string" ? body.post_id : null,
      testInjectText: typeof body?.test_inject_text === "string" ? body.test_inject_text.slice(0, 300) : null,
    })
  );
  return json(req, { run_id: run.id }, 202);
});
