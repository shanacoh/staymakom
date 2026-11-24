// Pages sans fiche en base (À propos, Contact, conditions...) : titre, description et
// titre principal servis aux robots. Textes repris des pages du site (src/lib/translations.ts
// et src/pages/*.tsx) : si l'un change, mettre l'autre à jour.
import type { PageLang } from "./site.js";

interface StaticText {
  title: string;
  description: string;
  h1: string;
}

type StaticEntry = { en: StaticText; fr?: StaticText; he?: StaticText };

export const STATIC_PAGE_TEXTS: Record<string, StaticEntry> = {
  "/about": {
    en: { title: "About STAYMAKOM | Curated Hotel Stays in Israel", h1: "Reimagining how you experience Israel", description: "Discover STAYMAKOM, a curated booking platform combining boutique hotels and immersive local experiences in Israel." },
    fr: { title: "À propos de STAYMAKOM | Séjours d'hôtel choisis en Israël", h1: "Réinventer la façon de vivre Israël", description: "Découvrez STAYMAKOM, une plateforme de réservation qui associe hôtels-boutiques et expériences locales immersives en Israël." },
    he: { title: "אודות STAYMAKOM | חוויות אירוח מובחרות בישראל", h1: "מחדשים את הדרך שבה אתם חווים את ישראל", description: "גלו את STAYMAKOM - פלטפורמת הזמנות מובחרת המשלבת מלונות בוטיק וחוויות מקומיות סוחפות בישראל." },
  },
  "/contact": {
    en: { title: "Contact | STAYMAKOM", h1: "Let's talk", description: "Contact the STAYMAKOM team to plan a curated hotel stay or a tailor-made trip in Israel, by email or WhatsApp." },
    fr: { title: "Contact | STAYMAKOM", h1: "Parlons-en", description: "Contactez l'équipe STAYMAKOM pour préparer un séjour d'hôtel ou un voyage sur mesure en Israël, par email ou WhatsApp." },
    he: { title: "צור קשר | STAYMAKOM", h1: "בואו נדבר", description: "צרו קשר עם צוות STAYMAKOM לתכנון שהייה במלון או טיול בהתאמה אישית בישראל, במייל או בוואטסאפ." },
  },
  "/companies": {
    en: { title: "Corporate Retreats & Team Experiences in Israel | STAYMAKOM", h1: "Create meaningful moments for your team", description: "Team retreats, offsites and corporate gifts in Israel: STAYMAKOM pairs boutique hotels with curated group experiences for companies." },
    fr: { title: "Séminaires et expériences d'équipe en Israël | STAYMAKOM", h1: "Créez des moments qui comptent pour votre équipe", description: "Séminaires, offsites et cadeaux d'entreprise en Israël : STAYMAKOM associe hôtels-boutiques et expériences de groupe choisies." },
    he: { title: "נופשים וחוויות צוות בישראל | STAYMAKOM", h1: "צרו רגעים משמעותיים לצוות שלכם", description: "נופשי חברה, ימי גיבוש ומתנות לעובדים בישראל: STAYMAKOM משלבת מלונות בוטיק עם חוויות קבוצתיות נבחרות." },
  },
  "/partners": {
    en: { title: "Become a Partner | STAYMAKOM", h1: "Let's create extraordinary stays together", description: "Hotels and local experience providers in Israel: join STAYMAKOM to reach international travelers looking for curated stays." },
    fr: { title: "Devenir partenaire | STAYMAKOM", h1: "Créons ensemble des séjours d'exception", description: "Hôtels et prestataires d'expériences en Israël : rejoignez STAYMAKOM pour toucher des voyageurs internationaux en quête de séjours choisis." },
    he: { title: "הצטרפו כשותפים | STAYMAKOM", h1: "בואו ניצור שהיות יוצאות דופן ביחד", description: "מלונות וספקי חוויות בישראל: הצטרפו ל-STAYMAKOM כדי להגיע למטיילים בינלאומיים שמחפשים שהיות נבחרות." },
  },
  "/consulting": {
    en: { title: "Consulting | STAYMAKOM - Make Israel Speak Every Language", h1: "Make Israel speak every language", description: "STAYMAKOM consulting helps Israeli hospitality brands reach international travelers through multilingual content, influencer strategy, and brand positioning." },
  },
  "/terms": {
    en: { title: "Terms & Conditions | STAYMAKOM", h1: "Terms & Conditions", description: "Read STAYMAKOM's Terms & Conditions. Learn about our booking platform, user responsibilities, and policies for discovering unique hospitality experiences in Israel." },
    fr: { title: "Conditions générales | STAYMAKOM", h1: "Conditions générales", description: "Les conditions générales de STAYMAKOM : fonctionnement de la plateforme de réservation, responsabilités des utilisateurs et règles applicables." },
    he: { title: "תנאי שימוש | STAYMAKOM", h1: "תנאי שימוש", description: "תנאי השימוש של STAYMAKOM: אופן פעולת פלטפורמת ההזמנות, אחריות המשתמשים והכללים החלים." },
  },
  "/privacy": {
    en: { title: "Privacy Policy | STAYMAKOM", h1: "Privacy Policy", description: "Learn how STAYMAKOM protects your privacy. Read about data collection, usage, storage, and your rights under Israeli privacy regulations." },
    fr: { title: "Politique de confidentialité | STAYMAKOM", h1: "Politique de confidentialité", description: "Comment STAYMAKOM protège vos données : collecte, utilisation, conservation et vos droits selon la réglementation israélienne." },
    he: { title: "מדיניות פרטיות | STAYMAKOM", h1: "מדיניות פרטיות", description: "איך STAYMAKOM מגינה על הפרטיות שלכם: איסוף, שימוש ושמירת מידע, והזכויות שלכם לפי החוק בישראל." },
  },
  "/cancellation-policy": {
    en: { title: "Cancellation & Refund Policy | STAYMAKOM", h1: "Cancellation & Refund Policy", description: "Understand STAYMAKOM's cancellation and refund policies. Each hotel defines its own terms for cancellations, refunds, and modifications." },
    fr: { title: "Politique d'annulation et de remboursement | STAYMAKOM", h1: "Politique d'annulation et de remboursement", description: "Les règles d'annulation et de remboursement de STAYMAKOM. Chaque hôtel fixe ses propres conditions d'annulation, de remboursement et de modification." },
    he: { title: "מדיניות ביטול והחזרים | STAYMAKOM", h1: "מדיניות ביטול והחזרים", description: "מדיניות הביטול וההחזרים של STAYMAKOM. כל מלון קובע את תנאי הביטול, ההחזר והשינוי שלו." },
  },
  "/cookies": {
    en: { title: "Cookie Policy | STAYMAKOM", h1: "Cookie Policy", description: "Learn about how STAYMAKOM uses cookies to improve your experience. Manage your cookie preferences for essential, performance, and marketing cookies." },
  },
  "/legal": {
    en: { title: "Legal Notice | STAYMAKOM", h1: "Legal Notice", description: "Legal notice and company information for STAYMAKOM Ltd. Learn about our company registration, contact details, and intellectual property rights." },
  },
  "/journal": {
    en: { title: "Journal | STAYMAKOM", h1: "Journal", description: "Stories, places, and insights from extraordinary stays across Israel" },
    fr: { title: "Journal | STAYMAKOM", h1: "Journal", description: "Récits, lieux et conseils autour de séjours hors du commun en Israël" },
    he: { title: "יומן | STAYMAKOM", h1: "יומן", description: "סיפורים, מקומות ותובנות משהיות יוצאות דופן ברחבי ישראל" },
  },
  "/boat": {
    en: { title: "Boat Trips in Israel | STAYMAKOM", h1: "Boat trips in Israel", description: "Private boat trips, sunset cruises and sailing experiences along Israel's coast, curated and bookable with STAYMAKOM." },
    fr: { title: "Sorties en bateau en Israël | STAYMAKOM", h1: "Sorties en bateau en Israël", description: "Bateaux privés, croisières au coucher du soleil et sorties en voilier le long de la côte israélienne, choisis et réservables avec STAYMAKOM." },
    he: { title: "שייט בישראל | STAYMAKOM", h1: "שייט בישראל", description: "שייט פרטי, שייט שקיעה וחוויות הפלגה לאורך חופי ישראל, נבחרים וזמינים להזמנה ב-STAYMAKOM." },
  },
};

/** Alias : même page, autre adresse. */
export const STATIC_ALIASES: Record<string, string> = { "/corporate": "/companies" };

export function staticText(path: string, lang: PageLang): StaticText | null {
  const entry = STATIC_PAGE_TEXTS[STATIC_ALIASES[path] || path];
  if (!entry) return null;
  return (lang === "fr" || lang === "he" ? entry[lang] : undefined) || entry.en;
}

/** Accueil et liste des expériences : copie de src/config/seoStaticPages.ts (modifier les deux ensemble). */
export const SEO_HOME_AND_LIST: Record<"home" | "experiences", Record<PageLang, { title: string; description: string }>> = {
  home: {
    en: { title: "STAYMAKOM | Handpicked Hotels & Experiences in Israel", description: "We curate Israel's best boutique hotels and pair them with unique local experiences." },
    fr: { title: "STAYMAKOM | Hôtels et expériences choisis en Israël", description: "Nous sélectionnons les plus beaux hôtels-boutiques d'Israël et les associons à des expériences locales uniques." },
    he: { title: "STAYMAKOM | מלונות וחוויות נבחרים בישראל", description: "אנחנו אוצרים את המלונות הבוטיק הטובים בישראל ומשלבים אותם עם חוויות מקומיות ייחודיות." },
    es: { title: "STAYMAKOM | Hoteles y experiencias seleccionados en Israel", description: "Seleccionamos los mejores hoteles boutique de Israel y los combinamos con experiencias locales únicas." },
    ru: { title: "STAYMAKOM | Отобранные отели и впечатления в Израиле", description: "Мы отбираем лучшие бутик-отели Израиля и дополняем их уникальными местными впечатлениями." },
    de: { title: "STAYMAKOM | Ausgewählte Hotels und Erlebnisse in Israel", description: "Wir wählen die schönsten Boutiquehotels Israels aus und verbinden sie mit einzigartigen Erlebnissen vor Ort." },
  },
  experiences: {
    en: { title: "All Experiences | Staymakom", description: "Browse curated local experiences across Israel, from desert adventures to culinary discoveries, bookable alone or paired with a stay." },
    fr: { title: "Toutes les expériences | Staymakom", description: "Découvrez toutes nos expériences d'hôtel choisies avec soin en Israël" },
    he: { title: "כל החוויות | Staymakom", description: "גלו את כל חוויות המלון האצורות שלנו ברחבי ישראל" },
    es: { title: "Todas las experiencias | Staymakom", description: "Descubre todas nuestras experiencias de hotel seleccionadas por todo Israel" },
    ru: { title: "Все впечатления | Staymakom", description: "Все наши тщательно отобранные отельные впечатления по Израилю" },
    de: { title: "Alle Erlebnisse | Staymakom", description: "Entdecke all unsere ausgewählten Hotelerlebnisse in ganz Israel" },
  },
};
