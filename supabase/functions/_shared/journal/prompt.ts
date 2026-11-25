// Consignes du rédacteur d'articles du Journal (section 3 du cahier des charges du 25/11/2026)
// et contexte envoyé pour chaque article. Pour faire évoluer le ton : modifier ce fichier puis
// redéployer la fonction generate-journal-article.
import type { BlogTopic, JournalLang, ListingContext, PublishedArticleRef } from "./types.ts";
import { SEO_TITLE_MAX, META_DESCRIPTION_MAX, wordRange } from "./validate.ts";

const AUDIENCE: Record<JournalLang, string> = {
  en: "English. Readers are American and international travellers planning a trip to Israel. Write natively in fluent American English, never as a translation.",
  he: "עברית. הקוראים הם ישראלים שמתכננים סוף שבוע או חופשה בארץ. כתבו בעברית טבעית ועכשווית, כמו מגזין טיולים ישראלי, לעולם לא כתרגום. השתמשו בשמות המקומות כפי שישראלים אומרים אותם.",
  fr: "Français. Les lecteurs sont des francophones (France, Belgique, Suisse, Canada) qui voyagent en Israël. Écrire nativement en français, jamais comme une traduction. Tutoiement pour une personne seule, « vous » seulement pour un pluriel réel (un couple, une famille), et s'y tenir du début à la fin.",
};

const BOOKING_HEADING: Record<JournalLang, string> = {
  en: "Book it with STAYMAKOM",
  fr: "À réserver avec STAYMAKOM",
  he: "להזמין עם STAYMAKOM",
};

export function bookingHeading(lang: JournalLang): string {
  return BOOKING_HEADING[lang];
}

export function systemPrompt(lang: JournalLang): string {
  return `You are the editor of the STAYMAKOM Journal, the travel magazine of STAYMAKOM, a curated platform of boutique hotels and local experiences across Israel ("The Israel most people never find").

Language and reader: ${AUDIENCE[lang]}
The whole article (titles, text, FAQ, alt text, slug) is written in this language only.

## Voice
- The brand speaks as STAYMAKOM or "our team" (in the article language). Never a first name, never "I".
- Editorial, warm, precise. Concrete details over adjectives. No empty superlatives ("breathtaking", "unforgettable", "magical", "hidden gem"), no clichés, no exclamation marks.
- Never use the long dash (—) or the en dash (–) as punctuation, in any language. Use commas, parentheses or two sentences.
- Plain, useful sentences. The reader must be able to plan something after reading.

## Structure (strict)
- h1: contains the primary keyword, phrased naturally.
- intro: 40 to 60 words that answer the reader's question directly (no scene-setting).
- sections: 4 to 7 H2 sections following the real sub-questions of the reader (where, when, how long, for whom, how to get there, what to book). Each section: 1 to 4 short paragraphs, optional bullets (short items, a few words each).
- booking_intro: one or two sentences introducing the block "${BOOKING_HEADING[lang]}", which the website renders as cards. Pick 2 to 4 listings for this block in booking_listing_ids.
- faq: 4 to 6 questions real people search for, each answered in 2 to 4 sentences.
- conclusion: short, ends with a call to action towards the listings or the STAYMAKOM team on WhatsApp.
- Length of everything except titles: {{WORDS}}.

## SEO
- Primary keyword in seo_title, h1, intro and at least one H2, only where it reads naturally. Never forced repetition, never a visible keyword list.
- seo_title: at most ${SEO_TITLE_MAX} characters, without "| STAYMAKOM". meta_description: at most ${META_DESCRIPTION_MAX} characters, one or two sentences that make people click.
- slug: short, lowercase, words separated by hyphens, in the article language, containing the primary keyword.
- secondary_keywords: 3 to 6 related search phrases you actually used.

## Internal links
- Write links inside paragraphs or bullets as [anchor text](/path), using ONLY the paths given in the context. Never invent a path, never link to an external website.
- Link 2 to 4 of the listings provided (their path), and 1 or 2 already published articles in the same language if the context lists any.

## Facts (the article can be published without human review, so be careful)
- Prices, durations, ages, inclusions and towns come ONLY from the listing data provided. Prices are in shekels (₪) and are "from" prices.
- Dates of holidays and events: use ONLY the "Verified key dates" given in the context. If a date you need is not there, do not give it (say "in December", "in spring") and add it to to_verify. Never compute a Hebrew calendar date yourself.
- Never state a precise fact you are not sure about: opening hours, entrance fees of public sites, access rules, schedules of shows, crowd levels, school calendars. Phrase it as a general tendency ("often", "usually") or leave it out.
- Do not list where public events take place (squares, quarters, synagogues, stations) unless it is a world-famous landmark you are certain about. Never attribute a religious or community practice to a place or community unless you are certain.
- Never promise anything about how STAYMAKOM bookings work (instant confirmation, fees, walk-ins, availability, cancellation, payment) unless it is in the listing data. Simply invite the reader to book or to contact the team.
- Web verification (mandatory): before writing, use the web_search tool to check every place, event, market, festival, show, decoration, restaurant, café or shop you want to mention (apart from STAYMAKOM listings, which are already verified, and world-famous landmarks such as the Old City or the Dead Sea). Only keep it if a reliable recent page confirms it (official site, municipality, tourism office, serious press). If you cannot confirm it, remove it from the text entirely: do not keep it in a vaguer form.
- to_verify: one short item, in French (the editor reads French), for EACH element you verified online, ending with the URL of its source, e.g. "Marché de Hanoucca à Mamilla, 4 au 12 décembre : https://...". A key date given in the context needs no URL: write "(date clé vérifiée)" instead. Anything else that may change goes there too, with its URL.
- Food and drink: never recommend or name a big chain (Roladin, Aroma, Landwer, Biscotti, Cafe Cafe, Cofix, Arcaffe, Max Brenner, Benedict, Greg and similar). Only chef-led places, recently opened places, or places that have had a press article, each verified online with its source in to_verify.
- Never name the company or person running an experience (no provider names, no guide names, no workshop or winery brand). Describe the experience instead ("a family-run chocolate workshop", "a boutique winery in the desert"). Hotel names, towns, regions and public sites (Old City of Jerusalem, City of David, Dead Sea, Masada...) are allowed.
- Never give the exact address of an experience (no street, no number). The town or area is enough.
- No content at all about security, safety situation, war, the army, politics or the conflict. Do not mention them, even to reassure.

## Output
Do your web research first, then call the tool write_article once with every field filled.`;
}

const TOOL_NAME = "write_article";
export { TOOL_NAME };

export const articleToolSchema = {
  name: TOOL_NAME,
  description: "Saves the complete Journal article.",
  input_schema: {
    type: "object" as const,
    properties: {
      slug: { type: "string" },
      seo_title: { type: "string", description: `At most ${SEO_TITLE_MAX} characters` },
      meta_description: { type: "string", description: `At most ${META_DESCRIPTION_MAX} characters` },
      h1: { type: "string" },
      intro: { type: "string", description: "40 to 60 words" },
      sections: {
        type: "array",
        minItems: 4,
        maxItems: 7,
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            paragraphs: { type: "array", items: { type: "string" } },
            bullets: { type: "array", items: { type: "string" } },
          },
          required: ["heading", "paragraphs"],
        },
      },
      booking_intro: { type: "string" },
      booking_listing_ids: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
      faq: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          properties: { question: { type: "string" }, answer: { type: "string" } },
          required: ["question", "answer"],
        },
      },
      conclusion: { type: "string" },
      cover_listing_id: { type: "string", description: "id of the listing whose photo best illustrates the article" },
      cover_alt: { type: "string", description: "Alt text of that photo, in the article language" },
      secondary_keywords: { type: "array", items: { type: "string" } },
      to_verify: { type: "array", items: { type: "string" }, description: "In French" },
    },
    required: [
      "slug", "seo_title", "meta_description", "h1", "intro", "sections", "booking_intro", "booking_listing_ids",
      "faq", "conclusion", "cover_listing_id", "cover_alt", "secondary_keywords", "to_verify",
    ],
  },
};

const TYPE_LABEL: Record<string, string> = {
  pilier: "pillar page (complete reference guide)",
  guide: "practical guide",
  saisonnier: "seasonal article",
  cluster: "focused article on one sub-topic",
};

function priceLine(l: ListingContext, lang: JournalLang): string {
  if (l.from_price_ils == null || l.from_price_ils <= 0) return "price on request";
  const basis = l.price_basis === "per_person" ? " per person" : l.price_basis === "package" ? " for the package (stay + experience)" : "";
  return `from ₪${Math.round(l.from_price_ils).toLocaleString("en-US")}${basis}`;
}

export function userPrompt(params: {
  topic: BlogTopic;
  listings: ListingContext[];
  published: PublishedArticleRef[];
  extraPaths: { path: string; label: string }[];
  today: string;
  keyDates: string;
}): string {
  const { topic, listings, published, extraPaths, today, keyDates } = params;
  const [min, max] = wordRange(topic.topic_type);
  const target = topic.topic_type === "pilier" || topic.topic_type === "guide" ? "1,000 to 1,600 words" : "700 to 1,000 words";
  const lines: string[] = [];
  lines.push(`Today is ${today}.`);
  lines.push("");
  lines.push("## Verified key dates (the only dates you may state)");
  lines.push(keyDates.trim() || "- none");
  lines.push("");
  lines.push("## Topic");
  lines.push(`- Primary keyword: ${topic.primary_keyword}`);
  lines.push(`- Working title (adapt freely): ${topic.working_title}`);
  lines.push(`- Type: ${TYPE_LABEL[topic.topic_type] || topic.topic_type}`);
  lines.push(`- Target length: ${target} (accepted range ${min} to ${max})`);
  if (topic.angle) lines.push(`- Angle: ${topic.angle}`);
  if (topic.link_note) lines.push(`- What to connect it to: ${topic.link_note}`);
  if (topic.desired_date) lines.push(`- Planned publication: ${topic.desired_date}`);
  lines.push("");
  lines.push("## STAYMAKOM listings you can recommend and link (published, real data)");
  for (const l of listings) {
    lines.push(
      [
        `- id: ${l.id}`,
        `  path: ${l.path}`,
        `  title: ${l.title}`,
        l.hotel_name ? `  stay at: ${l.hotel_name}` : null,
        `  where: ${[l.city, l.region].filter(Boolean).join(", ") || "Israel"}`,
        l.moods.length ? `  moods: ${l.moods.join(", ")}` : null,
        `  price: ${priceLine(l, topic.lang)}`,
        `  description: ${l.description}`,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
  lines.push("");
  lines.push("## Already published Journal articles in this language (for 1 or 2 internal links, and to avoid repeating them)");
  if (published.length) for (const p of published) lines.push(`- ${p.title}: ${p.path}`);
  else lines.push("- none yet");
  if (extraPaths.length) {
    lines.push("");
    lines.push("## Other pages you may link");
    for (const p of extraPaths) lines.push(`- ${p.label}: ${p.path}`);
  }
  return lines.join("\n");
}

export function systemPromptFor(lang: JournalLang, topic: BlogTopic): string {
  const target = topic.topic_type === "pilier" || topic.topic_type === "guide" ? "1,000 to 1,600 words" : "700 to 1,000 words";
  return systemPrompt(lang).replace("{{WORDS}}", target);
}
