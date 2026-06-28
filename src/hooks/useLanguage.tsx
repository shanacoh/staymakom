import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { trackLanguageSwitched } from "@/lib/analytics";

export type Language = "en" | "he" | "fr";

const STORAGE_KEY = "preferredLang";
const VALID_LANGS: Language[] = ["en", "he", "fr"];

const detectInitialLanguage = (): Language => {
  // 1. Préférence déjà sauvegardée (visite précédente)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && VALID_LANGS.includes(saved as Language)) return saved as Language;

  // 2. Langue configurée dans le navigateur/appareil
  const browserLang = (navigator.language || "").split("-")[0].toLowerCase();
  if (browserLang === "fr") return "fr";
  if (browserLang === "he" || browserLang === "iw") return "he"; // "iw" = ancien code hébreu
  return "en";
};

export const useLanguage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlLang = searchParams.get("lang");
  // Si l'URL a un paramètre de langue valide, on l'utilise ; sinon on détecte
  const lang: Language = (urlLang && VALID_LANGS.includes(urlLang as Language))
    ? (urlLang as Language)
    : detectInitialLanguage();

  // Au premier chargement sans paramètre ?lang=, on écrit la langue détectée dans l'URL
  useEffect(() => {
    if (!searchParams.get("lang")) {
      const detected = detectInitialLanguage();
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("lang", detected);
        return params;
      }, { replace: true }); // replace:true pour ne pas polluer l'historique du navigateur
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set html dir and lang attributes based on language
  useEffect(() => {
    const html = document.documentElement;
    if (lang === "he") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "he");
      document.body.style.direction = "rtl";
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", lang === "fr" ? "fr" : "en");
      document.body.style.direction = "ltr";
    }
  }, [lang]);

  const setLanguage = (newLang: Language) => {
    trackLanguageSwitched(lang, newLang);
    localStorage.setItem(STORAGE_KEY, newLang); // mémoriser le choix pour les visites suivantes
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("lang", newLang);
      return params;
    });
  };

  const toggleLanguage = () => {
    setLanguage(lang === "en" ? "he" : "en");
  };

  return { lang, setLanguage, toggleLanguage };
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
