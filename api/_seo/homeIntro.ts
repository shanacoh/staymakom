// Accueil servi aux robots : titre principal (H1), slogan (H2) et section « À propos ».
// Copie des textes du site (src/lib/translations.ts et src/lib/uiTranslations/, clés
// homeHeroEyebrow, homeAboutTitle, homeAboutText) : le test src/config/seoHomeIntro.test.ts
// vérifie que les deux restent identiques. Dans aboutText, [texte](/adresse) = lien interne.
import type { PageLang } from "./site.js";

export interface HomeIntro {
  eyebrow: string;
  aboutTitle: string;
  aboutText: string;
}

/** Slogan de la marque, en anglais dans toutes les langues (décision du 17/11/2026). */
export const HOME_SLOGAN = "Don't choose a city, choose your escape";

export const HOME_INTRO: Record<PageLang, HomeIntro> = {
  en: {
    eyebrow: "Curated experiences and boutique hotels in Israel",
    aboutTitle: "About STAYMAKOM",
    aboutText: "STAYMAKOM is an online booking platform for curated things to do in Israel. Choose by mood (romantic, family, food, nature, history, on the water) and book experiences that last a few hours, a day or a night: [cooking classes in Tel Aviv](/category/taste), [wine tastings in the Negev](/category/taste) and Zichron Yaakov, desert jeep tours, [sunset sails from Herzliya](/boat), [family activities in Jerusalem](/category/family). Each experience can be booked on its own or with a night in a hand-picked boutique hotel, from Tel Aviv and Jerusalem to the Galilee, the Golan, the Dead Sea and Eilat. Payment is online, most experiences offer free cancellation, and our team answers on WhatsApp.",
  },
  fr: {
    eyebrow: "Expériences et hôtels boutique sélectionnés en Israël",
    aboutTitle: "À propos de STAYMAKOM",
    aboutText: "STAYMAKOM est une plateforme de réservation d'expériences sélectionnées pour votre voyage en Israël. On choisit selon son envie (romantique, famille, gastronomie, nature, histoire, mer) et on réserve des expériences de quelques heures, d'une journée ou d'une nuit : [cours de cuisine à Tel Aviv](/category/taste), [dégustations dans le Néguev](/category/taste) et à Zichron Yaakov, jeep dans le désert, [voile au coucher du soleil depuis Herzliya](/boat), [sorties en famille à Jérusalem](/category/family). Chaque expérience se réserve seule ou avec une nuit dans un hôtel boutique sélectionné, de Tel Aviv et Jérusalem à la Galilée, au Golan, à la mer Morte et à Eilat. Paiement en ligne, annulation gratuite sur la plupart des expériences, et une équipe qui répond sur WhatsApp.",
  },
  he: {
    eyebrow: "חוויות ומלונות בוטיק נבחרים בישראל",
    aboutTitle: "על STAYMAKOM",
    aboutText: "STAYMAKOM היא פלטפורמה להזמנת חוויות נבחרות בישראל. בוחרים לפי מצב רוח (רומנטי, משפחה, אוכל, טבע, היסטוריה, ים) ומזמינים חוויות של כמה שעות, יום שלם או לילה: [סדנאות בישול בתל אביב](/category/taste), [טעימות יין בנגב](/category/taste) ובזכרון יעקב, ג'יפים במדבר, [שייט בשקיעה מהרצליה](/boat) ו[פעילויות למשפחות בירושלים](/category/family). כל חוויה אפשר להזמין בפני עצמה או עם לילה במלון בוטיק נבחר, מתל אביב וירושלים ועד הגליל, הגולן, ים המלח ואילת. התשלום אונליין, לרוב החוויות יש ביטול חינם, והצוות שלנו זמין בוואטסאפ.",
  },
  es: {
    eyebrow: "Experiencias y hoteles boutique seleccionados en Israel",
    aboutTitle: "Sobre STAYMAKOM",
    aboutText: "STAYMAKOM es una plataforma de reserva online de experiencias seleccionadas en Israel. Eliges según cómo quieras sentirte (romántico, en familia, gastronomía, naturaleza, historia, en el agua) y reservas experiencias de unas horas, un día o una noche: [clases de cocina en Tel Aviv](/category/taste), [catas de vino en el Néguev](/category/taste) y en Zijron Yaakov, jeeps en el desierto, [paseos en velero al atardecer desde Herzliya](/boat), [actividades en familia en Jerusalén](/category/family). Cada experiencia se reserva sola o con una noche en un hotel boutique seleccionado, desde Tel Aviv y Jerusalén hasta Galilea, el Golán, el Mar Muerto y Eilat. El pago es online, la mayoría de las experiencias tienen cancelación gratuita y nuestro equipo responde por WhatsApp.",
  },
  ru: {
    eyebrow: "Избранные впечатления и бутик-отели в Израиле",
    aboutTitle: "О STAYMAKOM",
    aboutText: "STAYMAKOM является онлайн-платформой для бронирования избранных впечатлений в Израиле. Вы выбираете по настроению (романтика, семья, гастрономия, природа, история, море) и бронируете впечатления на несколько часов, на день или на ночь: [кулинарные мастер-классы в Тель-Авиве](/category/taste), [дегустации вина в Негеве](/category/taste) и в Зихрон-Яакове, джип-туры по пустыне, [парусные прогулки на закате из Герцлии](/boat), [семейные развлечения в Иерусалиме](/category/family). Каждое впечатление можно забронировать отдельно или вместе с ночью в избранном бутик-отеле, от Тель-Авива и Иерусалима до Галилеи, Голанских высот, Мёртвого моря и Эйлата. Оплата онлайн, для большинства впечатлений действует бесплатная отмена, а наша команда отвечает в WhatsApp.",
  },
  de: {
    eyebrow: "Ausgewählte Erlebnisse und Boutiquehotels in Israel",
    aboutTitle: "Über STAYMAKOM",
    aboutText: "STAYMAKOM ist eine Online-Buchungsplattform für ausgewählte Erlebnisse in Israel. Du wählst nach Stimmung (romantisch, Familie, Kulinarik, Natur, Geschichte, auf dem Wasser) und buchst Erlebnisse für ein paar Stunden, einen Tag oder eine Nacht: [Kochkurse in Tel Aviv](/category/taste), [Weinproben im Negev](/category/taste) und in Zichron Yaakov, Jeeptouren in der Wüste, [Segeltörns bei Sonnenuntergang ab Herzliya](/boat), [Familienausflüge in Jerusalem](/category/family). Jedes Erlebnis lässt sich einzeln buchen oder mit einer Nacht in einem ausgewählten Boutiquehotel, von Tel Aviv und Jerusalem bis nach Galiläa, auf die Golanhöhen, ans Tote Meer und nach Eilat. Du bezahlst online, die meisten Erlebnisse sind kostenlos stornierbar, und unser Team antwortet auf WhatsApp.",
  },
};
