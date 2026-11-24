// Langues du site : une seule source pour savoir quelles langues existent,
// lesquelles sont proposées aux visiteurs et lesquelles sont montrées à Google.
//
// - Langues « écrites » (en, he, fr) : textes saisis dans le back-office, toujours publiques.
// - Langues « automatiques » (es, ru, de) : traduites par l'IA (table content_translations).
//   Leur visibilité dépend de l'interrupteur unique src/config/languages.json.
//
// Ce fichier ne dépend pas de React : il sert aussi au « traducteur » branché sur les
// lectures de la base (src/lib/contentTranslations/translatingFetch.ts).

import languagesConfig from "../config/languages.json";
import {
  AUTO_LOCALES,
  isAutoLocale,
  type AutoLocale,
} from "../constants/autoLocales";

export type WrittenLocale = "en" | "he" | "fr";
export type Locale = WrittenLocale | AutoLocale;

export const WRITTEN_LOCALES: readonly WrittenLocale[] = ["en", "fr", "he"];
export const ALL_LOCALES: readonly Locale[] = [...WRITTEN_LOCALES, ...AUTO_LOCALES];

export { isAutoLocale, type AutoLocale };

/** true quand l'interrupteur rend espagnol / russe / allemand publics. */
export const AUTO_LOCALES_PUBLIC: boolean = languagesConfig.autoLocalesPublic === true;

/** Libellé court affiché dans le sélecteur de langue. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  he: "עב",
  es: "ES",
  ru: "RU",
  de: "DE",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (ALL_LOCALES as readonly string[]).includes(value);
}

/** Langues proposées dans le sélecteur et annoncées à Google (hreflang, plan du site). */
export function publicLocales(): readonly Locale[] {
  return AUTO_LOCALES_PUBLIC ? ALL_LOCALES : WRITTEN_LOCALES;
}

/**
 * Adresse d'une page dans une langue, telle qu'annoncée à Google (canonical, hreflang,
 * plan du site) : l'anglais garde l'adresse nue, les autres langues portent leur ?lang=.
 * Même règle dans api/bot-meta.ts et api/_seo/sitemap.ts.
 */
export function localizedUrl(pageUrl: string, locale: Locale): string {
  return locale === "en" ? pageUrl : `${pageUrl}?lang=${locale}`;
}

/** Une langue cachée : accessible par ?lang= mais ni proposée ni indexée. */
export function isHiddenLocale(locale: Locale): boolean {
  return !publicLocales().includes(locale);
}

/**
 * Langue des textes d'interface (boutons, menus...). Tant que ces textes ne sont pas
 * traduits en espagnol / russe / allemand, ces langues affichent l'interface en anglais.
 */
export function interfaceLanguage(locale: Locale): WrittenLocale {
  return isAutoLocale(locale) ? "en" : locale;
}

export const LOCALE_STORAGE_KEY = "preferredLang";

function readStoredLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Navigation privée ou stockage bloqué : la langue reste portée par l'adresse.
  }
}

/** Langue de l'appareil, limitée aux langues publiques (jamais une langue cachée). */
function browserLocale(): Locale {
  const code = (navigator.language || "").split("-")[0].toLowerCase();
  const normalized = code === "iw" ? "he" : code; // « iw » = ancien code de l'hébreu
  return isLocale(normalized) && publicLocales().includes(normalized) ? normalized : "en";
}

/**
 * Langue de la page : celle de l'adresse (?lang=) si elle est valide, sinon le dernier
 * choix du visiteur, sinon la langue de son appareil, sinon l'anglais.
 */
export function resolveLocale(search: string = window.location.search): Locale {
  const fromUrl = new URLSearchParams(search).get("lang");
  if (isLocale(fromUrl)) return fromUrl;
  return readStoredLocale() ?? browserLocale();
}
