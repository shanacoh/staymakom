// Titres et descriptions (onglet du navigateur et résultats Google) des pages sans fiche en base :
// l'accueil et la liste des expériences, dans les six langues.
// Lu par le site (IndexV3, Experiences2) et par le guichet robots (api/bot-meta.ts).
// Fichier sans dépendance : il doit rester lisible par les deux.
// Anglais : texte d'origine, inchangé.

export type SeoLang = "en" | "fr" | "he" | "es" | "ru" | "de";

interface SeoText {
  title: string;
  description: string;
}

export const SEO_STATIC_PAGES: Record<"home" | "experiences", Record<SeoLang, SeoText>> = {
  home: {
    en: {
      title: "STAYMAKOM — Handpicked Hotels & Experiences in Israel",
      description: "We curate Israel's best boutique hotels and pair them with unique local experiences.",
    },
    fr: {
      title: "STAYMAKOM | Hôtels et expériences choisis en Israël",
      description: "Nous sélectionnons les plus beaux hôtels-boutiques d'Israël et les associons à des expériences locales uniques.",
    },
    he: {
      title: "STAYMAKOM — מלונות וחוויות נבחרים בישראל",
      description: "אנחנו אוצרים את המלונות הבוטיק הטובים בישראל ומשלבים אותם עם חוויות מקומיות ייחודיות.",
    },
    es: {
      title: "STAYMAKOM | Hoteles y experiencias seleccionados en Israel",
      description: "Seleccionamos los mejores hoteles boutique de Israel y los combinamos con experiencias locales únicas.",
    },
    ru: {
      title: "STAYMAKOM | Отобранные отели и впечатления в Израиле",
      description: "Мы отбираем лучшие бутик-отели Израиля и дополняем их уникальными местными впечатлениями.",
    },
    de: {
      title: "STAYMAKOM | Ausgewählte Hotels und Erlebnisse in Israel",
      description: "Wir wählen die schönsten Boutiquehotels Israels aus und verbinden sie mit einzigartigen Erlebnissen vor Ort.",
    },
  },
  experiences: {
    en: { title: "All Experiences | Staymakom", description: "Discover all our curated hotel experiences across Israel" },
    fr: { title: "Toutes les expériences | Staymakom", description: "Découvrez toutes nos expériences d'hôtel choisies avec soin en Israël" },
    he: { title: "כל החוויות | Staymakom", description: "גלו את כל חוויות המלון האצורות שלנו ברחבי ישראל" },
    es: { title: "Todas las experiencias | Staymakom", description: "Descubre todas nuestras experiencias de hotel seleccionadas por todo Israel" },
    ru: { title: "Все впечатления | Staymakom", description: "Все наши тщательно отобранные отельные впечатления по Израилю" },
    de: { title: "Alle Erlebnisse | Staymakom", description: "Entdecke all unsere ausgewählten Hotelerlebnisse in ganz Israel" },
  },
};
