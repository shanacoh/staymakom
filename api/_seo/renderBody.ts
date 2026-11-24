// Met en page le contenu d'une page pour les robots : un menu, un seul titre H1, le texte,
// les intertitres H2, les liens internes en vrais liens, et un pied de page avec
// l'identité légale, le contact, les réseaux sociaux et les conditions.
// Ce HTML est placé dans <div id="root"> : pour un navigateur qui exécute le site,
// React le remplace aussitôt par la vraie page.
import type { PageLink, PageModel } from "./model.js";
import { BRAND, href, ui, type PageLang } from "./site.js";
import { escapeHtml } from "./text.js";

const e = (value: string) => escapeHtml(value);

function linkList(links: PageLink[]): string {
  if (!links.length) return "";
  const items = links
    .map((l) => `<li><a href="${e(l.href)}">${e(l.label)}</a>${l.note ? ` - ${e(l.note)}` : ""}</li>`)
    .join("");
  return `<ul>${items}</ul>`;
}

function header(lang: PageLang, categories: { name: string; slug: string }[]): string {
  const t = ui(lang);
  const main: PageLink[] = [
    { label: t.home, href: href("/", lang) },
    { label: t.experiences, href: href("/experiences", lang) },
    ...categories.map((c) => ({ label: c.name, href: href(`/category/${c.slug}`, lang) })),
    { label: t.boats, href: href("/boat", lang) },
    { label: t.journal, href: href("/journal", lang) },
    { label: t.about, href: href("/about", lang) },
    { label: t.contact, href: href("/contact", lang) },
  ];
  return `<header><nav aria-label="Main">${linkList(main)}</nav></header>`;
}

function footer(lang: PageLang): string {
  const t = ui(lang);
  const pages: PageLink[] = [
    { label: t.about, href: href("/about", lang) },
    { label: t.contact, href: href("/contact", lang) },
    { label: t.companies, href: href("/companies", lang) },
    { label: t.partners, href: href("/partners", lang) },
    { label: t.terms, href: href("/terms", lang) },
    { label: t.privacy, href: href("/privacy", lang) },
    { label: t.cancellation, href: href("/cancellation-policy", lang) },
    { label: t.cookies, href: href("/cookies", lang) },
    { label: t.legal, href: href("/legal", lang) },
  ];
  const socials: PageLink[] = [
    { label: "Instagram", href: BRAND.socials.instagram },
    { label: "TikTok", href: BRAND.socials.tiktok },
    { label: "LinkedIn", href: BRAND.socials.linkedin },
  ];
  return [
    "<footer>",
    `<p><strong>${e(BRAND.name)}</strong> - ${e(BRAND.tagline)}</p>`,
    `<address>${e(BRAND.legalName)}, ${e(BRAND.address.street)}, ${e(BRAND.address.city)}, Israel. ${e(t.contactLine)}: <a href="mailto:${e(BRAND.email)}">${e(BRAND.email)}</a></address>`,
    `<nav aria-label="Legal">${linkList(pages)}</nav>`,
    `<p>${e(t.followUs)}:</p>${linkList(socials)}`,
    "</footer>",
  ].join("");
}

function mainContent(page: PageModel, lang: PageLang): string {
  const t = ui(lang);
  if (page.status === 404) {
    return `<main><h1>${e(t.notFoundTitle)}</h1><p>${e(t.notFoundText)}</p><p><a href="${e(href("/", lang))}">${e(t.home)}</a> · <a href="${e(href("/experiences", lang))}">${e(t.experiences)}</a></p></main>`;
  }
  const parts: string[] = ["<main>"];
  if (page.breadcrumbs?.length) {
    const crumbs = page.breadcrumbs.map((c) => `<a href="${e(href(c.path, lang))}">${e(c.name)}</a>`).join(" › ");
    parts.push(`<nav aria-label="Breadcrumb"><p>${crumbs}</p></nav>`);
  }
  parts.push("<article>");
  if (page.h1) parts.push(`<h1>${e(page.h1)}</h1>`);
  for (const p of page.intro || []) parts.push(`<p>${e(p)}</p>`);
  if (page.facts?.length) {
    const facts = page.facts
      .map((f) => (f.label ? `<dt>${e(f.label)}</dt><dd>${e(f.value)}</dd>` : `<dd>${e(f.value)}</dd>`))
      .join("");
    parts.push(`<dl>${facts}</dl>`);
  }
  for (const section of page.sections || []) {
    const body = [
      ...(section.paragraphs || []).map((p) => `<p>${e(p)}</p>`),
      section.list?.length ? `<ul>${section.list.map((i) => `<li>${e(i)}</li>`).join("")}</ul>` : "",
      linkList(section.links || []),
    ].join("");
    if (!body) continue;
    parts.push(`<section>${section.heading ? `<h2>${e(section.heading)}</h2>` : ""}${body}</section>`);
  }
  parts.push("</article></main>");
  return parts.join("");
}

export function renderBody(page: PageModel, lang: PageLang, categories: { name: string; slug: string }[]): string {
  return `${header(lang, categories)}${mainContent(page, lang)}${footer(lang)}`;
}
