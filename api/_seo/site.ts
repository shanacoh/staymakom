// Identité de la marque et textes fixes servis aux robots (Google, IA, aperçus de liens).
// Les dossiers commençant par « _ » ne deviennent pas des adresses /api/... sur Vercel.
// RÈGLE : les fichiers de api/ n'importent jamais rien de src/ (plantage 500 constaté
// le 20/11/2026) ; entre eux, les imports se font avec l'extension « .js ».

export type PageLang = "en" | "fr" | "he" | "es" | "ru" | "de";
export const ALL_LANGS: readonly PageLang[] = ["en", "fr", "he", "es", "ru", "de"];
export const AUTO_LANGS: readonly PageLang[] = ["es", "ru", "de"];

/**
 * Copie de l'interrupteur src/config/languages.json (autoLocalesPublic) : true = espagnol,
 * russe et allemand sont annoncés à Google (plan du site). Le test
 * src/config/publicRoutes.test.ts vérifie que les deux restent identiques.
 */
export const AUTO_LOCALES_PUBLIC = true;
export const PUBLIC_LANGS: readonly PageLang[] = AUTO_LOCALES_PUBLIC ? ALL_LANGS : ["en", "fr", "he"];

/** Adresse de référence du site (canonical, sitemap, données structurées). */
export const SITE_URL = "https://www.staymakom.com";

export const BRAND = {
  name: "STAYMAKOM",
  legalName: "Staymakom Ltd",
  address: { street: "6 Sokolov Street", city: "Herzliya", country: "IL" },
  email: "shana@staymakom.com",
  logo: `${SITE_URL}/favicon.png`,
  image: `${SITE_URL}/og-image.jpg`,
  tagline: "The Israel most people never find.",
  slogan: "Don't choose a city, choose your escape.",
  /** Description d'entité (Google, IA, llms.txt), décidée le 25/11/2026. */
  description:
    "STAYMAKOM is an online booking platform for curated experiences in Israel, from cooking classes in Tel Aviv and wine tastings in the Negev to desert jeep tours and sunset sails from Herzliya. Travelers choose by mood and book each experience on its own or with a night in a boutique hotel.",
  foundingDate: "2026-06",
  /** Copie de WHATSAPP_NUMBER (src/constants/whatsapp.ts) : le service client. */
  whatsappUrl: "https://wa.me/972555009910",
  socials: {
    instagram: "https://www.instagram.com/staymakom/",
    tiktok: "https://www.tiktok.com/@staymakom",
    linkedin: "https://www.linkedin.com/company/staymakom",
  },
  /** Articles de presse qui parlent de STAYMAKOM (repris dans « sameAs » pour Google et les IA). */
  press: [
    "https://www.jpost.com/travel/article-913937",
    "https://israj.media-j.com/article/66860/voyager-autrement-en-israel-avec-staymakom-shana-cohen-mise-sur-les-tresors-meconnus-du-pays",
  ] as string[],
};

/** Libellés d'interface du contenu servi aux robots. es / ru / de : repli sur l'anglais. */
const UI = {
  en: {
    home: "Home", experiences: "Experiences", boats: "Boats", journal: "Journal", about: "About",
    contact: "Contact", companies: "Companies", partners: "Partners", terms: "Terms & Conditions",
    privacy: "Privacy Policy", cancellation: "Cancellation Policy", cookies: "Cookies", legal: "Legal Notice",
    categories: "Categories", hotels: "Hotels", from: "From", price: "Price", amenities: "Amenities", highlights: "Highlights", rooms: "Rooms", perPerson: "per person", duration: "Duration",
    location: "Location", included: "What's included", notIncluded: "Not included", goodToKnow: "Good to know",
    hotel: "Hotel", stars: "stars", experiencesHere: "Experiences at this hotel", inCategory: "Experiences",
    withHotel: "With a hotel stay", experienceOnly: "Experience only", articles: "Articles",
    notFoundTitle: "Page not found", notFoundText: "This page does not exist or is no longer available.",
    contactLine: "Contact", followUs: "Follow us", published: "Published",
  },
  fr: {
    home: "Accueil", experiences: "Expériences", boats: "Bateaux", journal: "Journal", about: "À propos",
    contact: "Contact", companies: "Entreprises", partners: "Partenaires", terms: "Conditions générales",
    privacy: "Politique de confidentialité", cancellation: "Politique d'annulation", cookies: "Cookies",
    legal: "Mentions légales", categories: "Catégories", hotels: "Hôtels", from: "À partir de", price: "Prix", amenities: "Équipements", highlights: "Points forts", rooms: "Chambres",
    perPerson: "par personne", duration: "Durée", location: "Lieu", included: "Ce qui est inclus",
    notIncluded: "Non inclus", goodToKnow: "Bon à savoir", hotel: "Hôtel", stars: "étoiles",
    experiencesHere: "Expériences dans cet hôtel", inCategory: "Expériences", withHotel: "Avec une nuit d'hôtel",
    experienceOnly: "Expérience seule", articles: "Articles", notFoundTitle: "Page introuvable",
    notFoundText: "Cette page n'existe pas ou n'est plus disponible.", contactLine: "Contact",
    followUs: "Nous suivre", published: "Publié le",
  },
  he: {
    home: "דף הבית", experiences: "חוויות", boats: "סירות", journal: "מגזין", about: "אודות",
    contact: "צור קשר", companies: "חברות", partners: "שותפים", terms: "תנאי שימוש", privacy: "מדיניות פרטיות",
    cancellation: "מדיניות ביטול", cookies: "עוגיות", legal: "מידע משפטי", categories: "קטגוריות",
    hotels: "מלונות", from: "החל מ-", price: "מחיר", amenities: "מתקנים", highlights: "דגשים", rooms: "חדרים", perPerson: "לאדם", duration: "משך", location: "מיקום",
    included: "מה כלול", notIncluded: "לא כלול", goodToKnow: "טוב לדעת", hotel: "מלון", stars: "כוכבים",
    experiencesHere: "חוויות במלון הזה", inCategory: "חוויות", withHotel: "עם לינה במלון",
    experienceOnly: "חוויה בלבד", articles: "כתבות", notFoundTitle: "הדף לא נמצא",
    notFoundText: "הדף הזה לא קיים או שאינו זמין יותר.", contactLine: "צור קשר", followUs: "עקבו אחרינו",
    published: "פורסם",
  },
};

export type UiTexts = typeof UI.en;

export function ui(lang: PageLang): UiTexts {
  return lang === "fr" || lang === "he" ? UI[lang] : UI.en;
}

/** Adresse d'une page dans une langue : anglais = adresse nue, sinon ?lang= (règle de src/lib/locale.ts). */
export function pageUrl(path: string, lang: PageLang = "en"): string {
  const base = `${SITE_URL}${path === "/" ? "/" : path}`;
  return lang === "en" ? base : `${base}?lang=${lang}`;
}

/** Lien interne relatif, en gardant la langue de la page. */
export function href(path: string, lang: PageLang): string {
  return lang === "en" ? path : `${path}?lang=${lang}`;
}

export const OG_LOCALE: Record<PageLang, string> = {
  en: "en_US", fr: "fr_FR", he: "he_IL", es: "es_ES", ru: "ru_RU", de: "de_DE",
};
