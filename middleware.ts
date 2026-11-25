import { next, rewrite } from "@vercel/functions";
import { isHiddenLocale, isLocale, publicLocales } from "./src/lib/locale";
import { classifyPath } from "./src/config/publicRoutes";

// Robots des moteurs de recherche, des aperçus de liens (WhatsApp, Facebook, LinkedIn...)
// et des IA (ChatGPT, Claude, Perplexity, Gemini, Apple, Amazon, Meta, Mistral...).
const BOT_USER_AGENT = new RegExp(
  [
    // Moteurs de recherche
    "googlebot", "google-inspectiontool", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot",
    "sogou", "exabot", "applebot", "petalbot", "seznambot", "qwantify",
    // Aperçus de liens
    "facebookexternalhit", "facebot", "twitterbot", "linkedinbot", "whatsapp", "telegrambot",
    "discordbot", "slackbot", "pinterest", "redditbot", "skypeuripreview", "embedly",
    // IA
    "gptbot", "chatgpt-user", "oai-searchbot", "claudebot", "claude-user", "claude-searchbot",
    "anthropic-ai", "perplexitybot", "perplexity-user", "google-extended", "googleother",
    "gemini", "ccbot", "bytespider", "amazonbot", "meta-externalagent", "meta-externalfetcher",
    "mistralai-user", "cohere-ai", "youbot", "diffbot", "duckassistbot", "timpibot", "ai2bot",
    // Outils d'audit
    "semrushbot", "ahrefsbot", "mj12bot", "ia_archiver", "screaming frog", "lighthouse",
  ].join("|"),
  "i"
);

/**
 * Robot = un robot connu, ou un programme qui ne se présente pas comme un navigateur
 * (tous les navigateurs humains annoncent « Mozilla/... » ; curl, scripts et outils
 * d'audit, non). Les visiteurs humains ne passent jamais par le guichet robots.
 */
function isBot(userAgent: string): boolean {
  if (!userAgent) return true;
  return BOT_USER_AGENT.test(userAgent) || !/mozilla\//i.test(userAgent);
}

export default function middleware(request: Request) {
  if (!isBot(request.headers.get("user-agent") || "")) {
    return next();
  }

  const url = new URL(request.url);
  // Zones privées et parcours de réservation / paiement : jamais touchés.
  const kind = classifyPath(url.pathname);
  if (kind === "private") return next();

  const target = new URL("/api/bot-meta", url);
  target.searchParams.set("path", url.pathname);
  if (kind === "unknown") target.searchParams.set("notfound", "1");

  // Langue demandée (?lang=) et langues à annoncer à Google, d'après l'interrupteur unique
  // src/config/languages.json (le guichet robots n'a ainsi rien à relire lui-même).
  const requested = url.searchParams.get("lang");
  const lang = isLocale(requested) ? requested : "en";
  target.searchParams.set("lang", lang);
  // ?lang= tel qu'écrit dans l'adresse : « ?lang=en » (ou une langue inconnue) est redirigé
  // en 301 vers l'adresse nue par le guichet robots (une seule adresse par langue).
  if (requested !== null) target.searchParams.set("rawlang", requested);
  target.searchParams.set("locales", publicLocales().join(","));
  if (isHiddenLocale(lang)) target.searchParams.set("hidden", "1");
  // Mode de la liste (?mode=live / stay) : utile pour /experiences et /category.
  const mode = url.searchParams.get("mode");
  if (mode === "live" || mode === "stay") target.searchParams.set("mode", mode);
  return rewrite(target);
}

// Toutes les adresses de pages (sans point, donc pas les images ni les fichiers),
// hors /api et /assets. Le tri privé / public / inexistant se fait dans classifyPath.
export const config = {
  runtime: "edge",
  matcher: ["/((?!api/|assets/)[^.]*)"],
};
