// Une seule adresse par fiche et par langue (sprint SEO du 25/11/2026) : le guichet robots
// répond 301 vers l'adresse de référence quand on lui demande une autre adresse de la même
// page (ancienne route /experience2/..., /hotels/..., fiche appelée sous le mauvais type,
// ?lang=en, majuscules ou barre finale).
import { ALL_LANGS, pageUrl, type PageLang } from "./site.js";

/**
 * Adresse complète vers laquelle rediriger, ou null si l'adresse demandée est déjà la bonne.
 * On garde la langue ; les autres paramètres (mode=stay/live, filtres...) ne font jamais
 * partie de l'adresse de référence.
 */
export function canonicalRedirect(
  pathname: string,
  rawLang: unknown,
  canonicalPath: string | undefined,
  lang: PageLang,
  contentLang?: PageLang
): string | null {
  const requestedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const targetPath = canonicalPath || requestedPath;
  const langInUrl = typeof rawLang === "string" ? rawLang : null;
  // Page écrite dans une seule langue (article du Journal) : une seule adresse, celle de sa langue.
  if (contentLang) {
    if (targetPath === pathname && lang === contentLang && (contentLang !== "en" || langInUrl === null)) return null;
    return pageUrl(targetPath, contentLang);
  }
  // ?lang=en, ou une langue inconnue : l'adresse de référence est l'adresse nue (anglais).
  const wrongLangParam = langInUrl !== null && (langInUrl === "en" || !(ALL_LANGS as readonly string[]).includes(langInUrl));
  if (targetPath === pathname && !wrongLangParam) return null;
  return pageUrl(targetPath, lang);
}
