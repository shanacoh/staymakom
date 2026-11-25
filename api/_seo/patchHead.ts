// Remplit l'en-tête de la page (titre, description, canonical, langues, Open Graph,
// données structurées) et place le contenu lisible dans <div id="root">.
import type { PageModel } from "./model.js";
import { OG_LOCALE, pageUrl, type PageLang } from "./site.js";
import { escapeHtml } from "./text.js";

export interface LanguageInfo {
  lang: PageLang;
  /** Langues annoncées à Google (d'après l'interrupteur src/config/languages.json). */
  publicLangs: PageLang[];
  /** Langue encore cachée : la page ne doit pas être indexée. */
  hidden: boolean;
}

function setMeta(html: string, pattern: RegExp, tag: string): string {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `${tag}\n</head>`);
}

export function patchHtml(html: string, pathname: string, page: PageModel, language: LanguageInfo, bodyHtml: string): string {
  const { lang } = language;
  const path = page.canonicalPath || pathname;
  // Une langue où la page n'est pas traduite n'est pas déclarée : sa version renvoie
  // (canonical) vers l'anglais, et seules les langues réellement disponibles sont annoncées.
  const isAvailable = (code: PageLang) => !page.availableLangs || page.availableLangs.includes(code);
  const declaredLangs = language.publicLangs.filter(isAvailable);
  const canonicalUrl = pageUrl(path, isAvailable(lang) ? lang : "en");

  html = html.replace(/<html[^>]*>/, `<html lang="${lang}"${lang === "he" ? ' dir="rtl"' : ""}>`);

  if (page.title) {
    const title = escapeHtml(page.title);
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
    html = setMeta(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`);
    html = setMeta(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`);
  }
  if (page.description) {
    const description = escapeHtml(page.description);
    html = setMeta(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${description}" />`);
    html = setMeta(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${description}" />`);
    html = setMeta(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${description}" />`);
  }
  if (page.image) {
    const image = escapeHtml(page.image);
    html = setMeta(html, /<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${image}" />`);
    html = setMeta(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${image}" />`);
    // Les dimensions par défaut (celles de og-image.jpg) ne valent plus pour une autre image.
    html = html.replace(/<meta property="og:image:(width|height)" content="[^"]*"\s*\/?>\s*/g, "");
  }
  html = setMeta(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = setMeta(html, /<meta property="og:locale" content="[^"]*"\s*\/?>/, `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`);

  const extras: string[] = [];
  if (page.status === 404) {
    extras.push(`<meta name="robots" content="noindex, follow" />`);
  } else {
    extras.push(`<link rel="canonical" href="${canonicalUrl}" />`);
    for (const code of declaredLangs) {
      extras.push(`<link rel="alternate" hreflang="${code}" href="${pageUrl(path, code)}" />`);
    }
    extras.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(path, "en")}" />`);
    if (language.hidden) extras.push(`<meta name="robots" content="noindex, follow" />`);
  }
  for (const block of (page.jsonLd || []).filter(Boolean)) {
    const jsonLd = JSON.stringify(block).replace(/</g, "\\u003c");
    extras.push(`<script type="application/ld+json">${jsonLd}</script>`);
  }
  html = html.replace("</head>", `${extras.join("\n")}\n</head>`);

  if (bodyHtml) {
    html = html.replace(/<div id="root"><\/div>/, `<div id="root">${bodyHtml}</div>`);
  }
  return html;
}
