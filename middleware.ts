import { next, rewrite } from "@vercel/functions";
import { isHiddenLocale, isLocale, publicLocales } from "./src/lib/locale";

// Robots que Google/Meta/etc. utilisent pour lire le contenu avant de l'indexer
// ou d'en générer un aperçu (WhatsApp, Facebook, Twitter/X, Slack, LinkedIn...).
const BOT_USER_AGENT = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|redditbot|skypeuripreview|ia_archiver/i;

export default function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!BOT_USER_AGENT.test(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  const target = new URL("/api/bot-meta", url);
  target.searchParams.set("path", url.pathname);

  // Langue demandée (?lang=) et langues à annoncer à Google, d'après l'interrupteur unique
  // src/config/languages.json (le guichet robots n'a ainsi rien à relire lui-même).
  const requested = url.searchParams.get("lang");
  const lang = isLocale(requested) ? requested : "en";
  target.searchParams.set("lang", lang);
  target.searchParams.set("locales", publicLocales().join(","));
  if (isHiddenLocale(lang)) target.searchParams.set("hidden", "1");
  return rewrite(target);
}

// Volontairement limité aux fiches de contenu public (hôtel, expérience, catégorie,
// journal, accueil, liste des expériences). Ne touche JAMAIS /checkout,
// /standalone-checkout, /booking, /account, /cart, /auth, /admin, /hotel-admin,
// /gift-card — ces routes ne passent même pas par ce middleware.
export const config = {
  runtime: "edge",
  matcher: [
    "/",
    "/experiences",
    "/hotel/:slug",
    "/experience/:slug",
    "/category/:slug",
    "/journal/:slug",
    "/standalone-experience/:slug",
  ],
};
