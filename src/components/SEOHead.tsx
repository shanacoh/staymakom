import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { isHiddenLocale, localizedUrl, publicLocales } from "@/lib/locale";

const BASE_URL = "https://www.staymakom.com";

interface SEOHeadProps {
  title?: string;
  titleEn?: string;
  titleHe?: string;
  titleFr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionHe?: string;
  descriptionFr?: string;
  ogTitle?: string;
  ogTitleEn?: string;
  ogTitleHe?: string;
  ogTitleFr?: string;
  ogDescription?: string;
  ogDescriptionEn?: string;
  ogDescriptionHe?: string;
  ogDescriptionFr?: string;
  ogImage?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  /** Adresse de référence quand la page a plusieurs adresses (ex. un bateau ouvert en /standalone-experience/ → /boat/). */
  canonicalPath?: string;
  /**
   * Langues où le contenu principal existe vraiment (ex. article du Journal seulement en
   * anglais). Absent = toutes. Une langue absente n'est pas annoncée (hreflang) et sa
   * version pointe (canonical) vers l'anglais.
   */
  availableLocales?: readonly string[];
}

export function SEOHead({
  title,
  titleEn,
  titleHe,
  titleFr,
  description,
  descriptionEn,
  descriptionHe,
  descriptionFr,
  ogTitle,
  ogTitleEn,
  ogTitleHe,
  ogTitleFr,
  ogDescription,
  ogDescriptionEn,
  ogDescriptionHe,
  ogDescriptionFr,
  ogImage,
  fallbackTitle = "Staymakom - Curated Boutique Experiences in Israel",
  fallbackDescription = "Discover unique boutique hotels and immersive experiences across Israel. From desert escapes to vineyard retreats, find your perfect getaway.",
  canonicalPath,
  availableLocales,
}: SEOHeadProps) {
  const { lang, locale } = useLanguage();

  useEffect(() => {
    // Determine the correct values based on language
    const finalTitle = lang === "he" 
      ? (titleHe || title || fallbackTitle)
      : lang === "fr"
      ? (titleFr || titleEn || title || fallbackTitle)
      : (titleEn || title || fallbackTitle);
    
    const finalDescription = lang === "he"
      ? (descriptionHe || description || fallbackDescription)
      : lang === "fr"
      ? (descriptionFr || descriptionEn || description || fallbackDescription)
      : (descriptionEn || description || fallbackDescription);
    
    const finalOgTitle = lang === "he"
      ? (ogTitleHe || ogTitle || titleHe || title || fallbackTitle)
      : lang === "fr"
      ? (ogTitleFr || ogTitleEn || ogTitle || titleFr || titleEn || title || fallbackTitle)
      : (ogTitleEn || ogTitle || titleEn || title || fallbackTitle);
    
    const finalOgDescription = lang === "he"
      ? (ogDescriptionHe || ogDescription || descriptionHe || description || fallbackDescription)
      : lang === "fr"
      ? (ogDescriptionFr || ogDescriptionEn || ogDescription || descriptionFr || descriptionEn || description || fallbackDescription)
      : (ogDescriptionEn || ogDescription || descriptionEn || description || fallbackDescription);

    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attr = property ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Set standard meta tags
    updateMetaTag("description", finalDescription);
    
    // Set Open Graph tags
    updateMetaTag("og:title", finalOgTitle, true);
    updateMetaTag("og:description", finalOgDescription, true);
    updateMetaTag("og:type", "website", true);
    // Adresse de référence : jamais de paramètre de filtre (mode, etc.), une seule par langue.
    const pageUrl = `${BASE_URL}${canonicalPath || window.location.pathname}`;
    const isAvailable = (code: string) => !availableLocales || availableLocales.includes(code);
    const canonicalLocale = isAvailable(locale) ? locale : "en";
    updateMetaTag("og:url", localizedUrl(pageUrl, canonicalLocale), true);
    
    if (ogImage) {
      updateMetaTag("og:image", ogImage, true);
    }
    
    // Set Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", finalOgTitle);
    updateMetaTag("twitter:description", finalOgDescription);
    
    if (ogImage) {
      updateMetaTag("twitter:image", ogImage);
    }

    // Canonical : l'anglais garde l'adresse nue, les autres langues portent leur ?lang=
    const setLink = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector<HTMLLinkElement>(selector);
      if (!el) {
        el = document.createElement("link");
        document.head.appendChild(el);
      }
      for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    };
    setLink('link[rel="canonical"]', { rel: "canonical", href: localizedUrl(pageUrl, canonicalLocale) });

    // Hreflang : on annonce à Google uniquement les langues publiques (l'interrupteur
    // src/config/languages.json décide si espagnol / russe / allemand en font partie).
    const declared = publicLocales().filter(isAvailable);
    const announced = new Set<string>([...declared, "x-default"]);
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((el) => {
      if (!announced.has(el.getAttribute("hreflang") || "")) el.remove();
    });
    for (const code of declared) {
      setLink(`link[rel="alternate"][hreflang="${code}"]`, { rel: "alternate", hreflang: code, href: localizedUrl(pageUrl, code) });
    }
    setLink('link[rel="alternate"][hreflang="x-default"]', { rel: "alternate", hreflang: "x-default", href: localizedUrl(pageUrl, "en") });

    // Langue encore cachée : la page reste consultable mais Google ne doit pas l'indexer.
    const robots = document.head.querySelector('meta[name="robots"][data-hidden-locale]');
    if (isHiddenLocale(locale)) {
      if (!robots) {
        const el = document.createElement("meta");
        el.setAttribute("name", "robots");
        el.setAttribute("content", "noindex, follow");
        el.setAttribute("data-hidden-locale", "true");
        document.head.appendChild(el);
      }
    } else {
      robots?.remove();
    }
  }, [
    lang,
    locale,
    title,
    titleEn,
    titleHe,
    titleFr,
    description,
    descriptionEn,
    descriptionHe,
    descriptionFr,
    ogTitle,
    ogTitleEn,
    ogTitleHe,
    ogTitleFr,
    ogDescription,
    ogDescriptionEn,
    ogDescriptionHe,
    ogDescriptionFr,
    ogImage,
    fallbackTitle,
    fallbackDescription,
    canonicalPath,
    availableLocales,
  ]);

  return null;
}
