import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSitemap } from "./_seo/sitemap.js";

// /sitemap.xml : plan du site fabriqué en direct depuis les fiches publiées (cache 1 h).
// Adresse branchée dans vercel.json. RÈGLE : rien n'est importé de src/.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const xml = await buildSitemap();
  if (!xml) {
    // Base injoignable : on demande à Google de repasser plus tard plutôt que de lui
    // donner un plan du site vide (qui ferait croire que les fiches ont disparu).
    res.setHeader("retry-after", "3600");
    res.setHeader("cache-control", "no-store");
    res.status(503).send("Sitemap temporarily unavailable");
    return;
  }
  res.setHeader("content-type", "application/xml; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
