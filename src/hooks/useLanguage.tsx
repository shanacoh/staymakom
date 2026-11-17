import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { trackLanguageSwitched } from "@/lib/analytics";
import {
  interfaceLanguage,
  isAutoLocale,
  isLocale,
  resolveLocale,
  storeLocale,
  type Locale,
  type WrittenLocale,
} from "@/lib/locale";

/**
 * Langue des textes d'interface (en, he, fr). En espagnol / russe / allemand, l'interface
 * reste en anglais tant que ses textes ne sont pas traduits ; le contenu des fiches, lui,
 * arrive déjà traduit (voir src/lib/contentTranslations/translatingFetch.ts).
 */
export type Language = WrittenLocale;
export type { Locale };

export const useLanguage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Langue réelle de la page (en, he, fr, es, ru, de)
  const locale: Locale = resolveLocale(`?${searchParams.toString()}`);
  // Langue des textes d'interface
  const lang: Language = interfaceLanguage(locale);

  useEffect(() => {
    const urlLang = searchParams.get("lang");
    if (isLocale(urlLang)) {
      // Langue présente dans l'adresse : on la retient pour les pages suivantes
      // (beaucoup de liens internes ne recopient pas ?lang=).
      storeLocale(urlLang);
    } else {
      // Au premier chargement sans ?lang=, on écrit la langue détectée dans l'adresse
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("lang", locale);
        return params;
      }, { replace: true }); // replace : ne pas polluer l'historique du navigateur
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sens d'écriture et langue déclarée de la page
  useEffect(() => {
    const html = document.documentElement;
    const rtl = locale === "he";
    html.setAttribute("dir", rtl ? "rtl" : "ltr");
    html.setAttribute("lang", locale);
    document.body.style.direction = rtl ? "rtl" : "ltr";
  }, [locale]);

  const setLanguage = (next: Locale) => {
    if (next === locale) return;
    trackLanguageSwitched(locale, next);
    storeLocale(next); // mémoriser le choix pour les visites suivantes

    // Les fiches déjà chargées contiennent les textes traduits de la langue en cours :
    // en entrant dans (ou en sortant d') une langue traduite automatiquement, on recharge
    // la page pour relire les fiches dans la bonne langue.
    if (isAutoLocale(locale) || isAutoLocale(next)) {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.location.assign(url.toString());
      return;
    }

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("lang", next);
      return params;
    });
  };

  const toggleLanguage = () => {
    setLanguage(lang === "en" ? "he" : "en");
  };

  return { lang, locale, setLanguage, toggleLanguage };
};

// Helper to get localized field value
export const getLocalizedField = <T extends Record<string, any>>(
  obj: T | null | undefined,
  fieldName: string,
  lang: Language
): string | string[] | null => {
  if (!obj) return null;
  
  // For Hebrew, check if *_he field exists and has value
  if (lang === "he") {
    const heField = `${fieldName}_he`;
    if (heField in obj && obj[heField] != null) {
      return obj[heField];
    }
  }
  
  // For French, check if *_fr field exists and has value
  if (lang === "fr") {
    const frField = `${fieldName}_fr`;
    if (frField in obj && obj[frField] != null) {
      return obj[frField];
    }
  }
  
  // Fall back to base field (English) - check both patterns
  // Pattern 1: base field name (e.g., "title")
  if (fieldName in obj && obj[fieldName] != null) {
    return obj[fieldName];
  }
  
  // Pattern 2: _en suffix (e.g., "title_en")
  const enField = `${fieldName}_en`;
  if (enField in obj && obj[enField] != null) {
    return obj[enField];
  }
  
  return null;
};
