import { next, rewrite } from "@vercel/functions";

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
