import type { VercelRequest, VercelResponse } from "@vercel/node";
import { patchHtml, type LanguageInfo } from "./_seo/patchHead.js";
import { renderBody } from "./_seo/renderBody.js";
import { publishedCategories, resolvePage } from "./_seo/resolvers.js";
import { canonicalRedirect } from "./_seo/redirect.js";
import { ALL_LANGS, type PageLang } from "./_seo/site.js";

// Guichet robots : sert aux seuls robots (Google, IA comme ChatGPT / Claude / Perplexity,
// aperçus WhatsApp / Facebook...) une page complète, lisible sans exécuter le site :
// vrai titre, description, canonical, langues, données structurées, texte de la fiche,
// liens internes et pied de page. Une adresse ou une fiche inexistante répond 404.
// Les visiteurs humains ne passent jamais par cette fonction (voir middleware.ts) :
// leur expérience est strictement inchangée, parcours de paiement compris.
// RÈGLE : rien n'est importé de src/ (plantage constaté le 20/11/2026).

function isPageLang(value: unknown): value is PageLang {
  return typeof value === "string" && (ALL_LANGS as readonly string[]).includes(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = typeof req.query.path === "string" ? req.query.path : "/";
  const lang: PageLang = isPageLang(req.query.lang) ? req.query.lang : "en";
  const publicLangs = (typeof req.query.locales === "string" ? req.query.locales : "en,fr,he")
    .split(",")
    .filter(isPageLang);
  const language: LanguageInfo = { lang, publicLangs, hidden: req.query.hidden === "1" };
  const notFound = req.query.notfound === "1";

  const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
  const origin = `${protocol}://${req.headers.host}`;

  // Une seule adresse par fiche et par langue : toute autre adresse (ancienne route
  // /experience2/..., /hotels/..., mauvais type de fiche, ?lang=en...) répond 301 vers elle.
  let page: Awaited<ReturnType<typeof resolvePage>> | null = null;
  try {
    page = await resolvePage(pathname, lang, notFound);
  } catch {
    page = null; // Base injoignable : page générique plus bas, jamais de redirection à l'aveugle.
  }
  if (page && page.status === 200 && !page.passthrough) {
    const location = canonicalRedirect(pathname, req.query.rawlang, page.canonicalPath, lang, page.contentLang);
    if (location) {
      res.setHeader("cache-control", "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400");
      res.redirect(301, location);
      return;
    }
  }

  let html = "";
  try {
    const originRes = await fetch(`${origin}/index.html`);
    html = await originRes.text();
  } catch {
    res.status(502).send("Bad gateway");
    return;
  }

  let status = 200;
  try {
    if (!page) throw new Error("base injoignable");
    const categories = await publishedCategories(lang).catch(() => []);
    status = page.status;
    if (!page.passthrough) {
      const body = renderBody(page, lang, categories.map((c) => ({ name: c.name, slug: c.slug })));
      html = patchHtml(html, pathname, page, language, body);
    }
  } catch {
    // Base injoignable : on sert la page générique plutôt qu'une erreur au robot.
  }

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400");
  res.status(status).send(html);
}
