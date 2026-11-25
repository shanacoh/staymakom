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
      title: "Things to Do in Israel: Experiences & Boutique Hotels | STAYMAKOM",
      description: "Unique things to do in Israel, booked online: Negev wine tastings, desert jeeps, sunset sails, Tel Aviv cooking classes. Book them alone or with a boutique hotel.",
    },
    fr: {
      title: "Voyage en Israël : expériences et hôtels boutique | STAYMAKOM",
      description: "Votre voyage en Israël autrement : vin dans le Néguev, jeep dans le désert, voile à Herzliya, cuisine à Tel Aviv. Seules ou avec une nuit en hôtel boutique.",
    },
    he: {
      title: "חוויות ויום כיף בישראל, עם מלון בוטיק | STAYMAKOM",
      description: "יום כיף, חוויה זוגית או חופשה עם הילדים: סדנאות, טעימות יין, ג'יפים במדבר ושייט בשקיעה, עם לילה במלון בוטיק או בלי. בוחרים לפי מצב רוח ומזמינים אונליין.",
    },
    es: {
      title: "Qué hacer en Israel: experiencias y hoteles boutique | STAYMAKOM",
      description: "Experiencias únicas en Israel, reservadas online: catas en el Néguev, jeeps en el desierto, velero al atardecer, cocina en Tel Aviv. Solas o con hotel boutique.",
    },
    ru: {
      title: "Чем заняться в Израиле: впечатления и бутик-отели | STAYMAKOM",
      description: "Необычные впечатления в Израиле онлайн: вино в Негеве, джипы в пустыне, парусные прогулки на закате, кулинария в Тель-Авиве. Отдельно или с бутик-отелем.",
    },
    de: {
      title: "Unternehmungen in Israel: Erlebnisse & Boutiquehotels | STAYMAKOM",
      description: "Besondere Erlebnisse in Israel online buchen: Weinproben im Negev, Jeeptouren, Segeln bei Sonnenuntergang, Kochkurse in Tel Aviv. Allein oder mit Boutiquehotel.",
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
