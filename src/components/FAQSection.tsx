import { useLanguage } from "@/hooks/useLanguage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function openDesignMyStayDialog() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("staymakom-open-design-my-stay"));
}

type RenderParams = {
  isRTL: boolean;
  lang: string;
};

type FAQItem = {
  q_en: string;
  q_he: string;
  q_fr: string;
  render: (p: RenderParams) => React.ReactNode;
};

const link = "underline underline-offset-2 cursor-pointer hover:text-[#a83c3c] transition-colors";

const FAQ_ITEMS: FAQItem[] = [
  {
    q_en: "Why book through STAYMAKOM?",
    q_he: "למה להזמין דרך STAYMAKOM?",
    q_fr: "Pourquoi réserver via STAYMAKOM ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <>
          <p>STAYMAKOM היא הרבה יותר מפלטפורמת הזמנת מלונות. אנחנו משלבים מלונות נבחרים עם חוויות ייחודיות בהזמנה אחת פשוטה, כדי להפוך את החופשה שלכם לקלה, מעוררת השראה וללא התעסקות מיותרת.</p>
          <p className="mt-3">במקום לבזבז זמן על חיפוש, תכנון ותיאומים, הכל כבר מחכה לכם במקום אחד. החבילות שלנו נועדו להציע חוויה חלקה ומשתלמת יותר מהזמנה נפרדת של כל מרכיב.</p>
        </>
      ) : lang === "fr" ? (
        <>
          <p>STAYMAKOM, c'est bien plus qu'une plateforme de réservation d'hôtels. Nous combinons des hôtels soigneusement sélectionnés avec des expériences uniques, en une seule réservation simple, pour que votre séjour soit facile, inspirant et sans prise de tête.</p>
          <p className="mt-3">Au lieu de passer des heures à chercher, planifier et coordonner chaque élément séparément, tout est déjà réuni au même endroit. Nos formules sont pensées pour offrir une expérience plus fluide et plus avantageuse qu'une réservation à la carte.</p>
        </>
      ) : (
        <>
          <p>STAYMAKOM is more than a hotel booking platform. We combine handpicked hotels with curated experiences in one seamless reservation, making it easier, more inspiring, and more effortless to plan your stay.</p>
          <p className="mt-3">Instead of spending hours searching for where to stay, what to do, and how to organize everything separately, STAYMAKOM brings everything together in one place. Our packages are designed to offer a smoother and more advantageous experience than booking each element individually.</p>
        </>
      ),
  },
  {
    q_en: "Where are your experiences available?",
    q_he: "איפה החוויות זמינות?",
    q_fr: "Où sont disponibles vos expériences ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <p>אנחנו כרגע מתמקדים בישראל, עם חוויות בתל אביב, ירושלים ויעדים רבים נוספים שממתינים לגילוי. לישראל יש הרבה יותר להציע מעבר למסלולים הרגילים — מגוון עשיר של מקומות, אווירות וחוויות לאורך כל הארץ. אנחנו ממשיכים להוסיף יעדים חדשים ומזמינים מטיילים לגלות צד אחר של ישראל.</p>
      ) : lang === "fr" ? (
        <p>Nous nous concentrons actuellement sur Israël, avec des expériences à Tel Aviv, Jérusalem et de nombreuses autres destinations qui n'attendent qu'à être découvertes. Israël a bien plus à offrir que les circuits habituels : une richesse de lieux, d'ambiances et de sensations à travers tout le pays. Nous enrichissons continuellement notre catalogue et invitons les voyageurs à découvrir un Israël autrement.</p>
      ) : (
        <p>We are currently focused on Israel, with experiences across Tel Aviv, Jerusalem, and many more destinations waiting to be discovered. Israel has so much more to offer beyond the usual routes, with a wide variety of places, atmospheres, and experiences across the country. We're continuously adding new destinations and inviting travelers to discover a different side of Israel.</p>
      ),
  },
  {
    q_en: "Can I book an experience without staying overnight?",
    q_he: "האם אפשר להזמין חוויה בלי לינה במלון?",
    q_fr: "Puis-je réserver une expérience sans passer la nuit à l'hôtel ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <>
          <p>כן. עכשיו אפשר להזמין חוויה בפני עצמה או כחלק משהות במלון.</p>
          <p className="mt-3">בין אם אתם מחפשים פעילות מיוחדת, חופשה מלאה או שילוב של השניים – ב-STAYMAKOM תוכלו לבחור את האפשרות שמתאימה לכם.</p>
          <p className="mt-3">חלק מהחוויות כוללות הטבות או מחירים מיוחדים כאשר מזמינים אותן יחד עם מלון, בעוד שאחרות זמינות גם כהזמנה נפרדת.</p>
        </>
      ) : lang === "fr" ? (
        <>
          <p>Oui. Vous pouvez désormais réserver une expérience seule ou l'associer à un séjour à l'hôtel. Que vous recherchiez simplement une activité, une escapade complète ou les deux, STAYMAKOM vous laisse choisir l'option qui correspond le mieux à vos envies.</p>
          <p className="mt-3">Certaines expériences proposent des avantages exclusifs ou des tarifs préférentiels lorsqu'elles sont réservées avec un hôtel, tandis que d'autres sont disponibles indépendamment.</p>
        </>
      ) : (
        <>
          <p>Yes. You can now book experiences on their own or as part of a hotel stay. Whether you're looking for a unique activity, a complete getaway, or both, STAYMAKOM lets you choose the option that suits your plans.</p>
          <p className="mt-3">Some experiences include exclusive benefits or special rates when booked together with a hotel, while others can be enjoyed independently.</p>
        </>
      ),
  },
  {
    q_en: "Who are these experiences for?",
    q_he: "למי החוויות מתאימות?",
    q_fr: "À qui s'adressent ces expériences ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <p>STAYMAKOM מיועדת הן למטיילים המגיעים לישראל והן למקומיים שרוצים לחוות את הארץ אחרת. בין אם זו הפעם הראשונה שאתם מגלים את ישראל, ובין אם אתם מבלים כל קיץ כאן כבר שנים — STAYMAKOM עוזרת לכם לחקור מעבר לתוכניות הרגילות ולגלות חוויות שאולי לא הייתם מוצאים בדרך אחרת.</p>
      ) : lang === "fr" ? (
        <p>STAYMAKOM s'adresse aussi bien aux voyageurs qui découvrent Israël qu'aux locaux qui souhaitent vivre leur pays autrement. Que ce soit votre première fois en Israël ou que vous y passiez chaque été depuis des années, STAYMAKOM vous aide à explorer au-delà des sentiers battus et à vivre des expériences que vous n'auriez peut-être pas trouvées autrement.</p>
      ) : (
        <p>STAYMAKOM is designed both for travelers visiting Israel and for locals looking to experience the country differently. Whether it's your first time discovering Israel or you've been spending every summer here for years, STAYMAKOM helps you explore beyond the usual plans and discover experiences you might not have found otherwise.</p>
      ),
  },
  {
    q_en: "Do I need to plan everything myself?",
    q_he: "האם צריך לתכנן הכל לבד?",
    q_fr: "Dois-je tout organiser moi-même ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <p>לא, וזה בדיוק הרעיון. כל חוויה כבר נבנתה ותוכננה עבורכם, כך שאין צורך להשקיע שעות בחיפושים, תיאומים או הזמנות נפרדות. פשוט בוחרים, מזמינים ונהנים.</p>
      ) : lang === "fr" ? (
        <p>Non, et c'est justement l'idée. Chaque expérience est déjà pensée et préparée pour vous, sans avoir à passer des heures à chercher, coordonner ou réserver plusieurs services séparément. Il suffit de choisir, réserver et profiter.</p>
      ) : (
        <p>No, that's exactly the point. Each experience is already thoughtfully designed for you, so you don't have to spend hours researching, coordinating, or booking multiple services separately. You simply choose, book, and enjoy.</p>
      ),
  },
  {
    q_en: "Is it suitable for a special occasion?",
    q_he: "האם זה מתאים לאירוע מיוחד?",
    q_fr: "Est-ce adapté à une occasion spéciale ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <p>
          בהחלט. החוויות שלנו מושלמות לחגיגת רגע מיוחד או פשוט כדי לקחת זמן לעצמכם. אם יש לכם בקשה מסוימת, תוכלו גם{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            לשלוח פנייה
          </button>{" "}
          ליצירת חוויה מותאמת אישית.
        </p>
      ) : lang === "fr" ? (
        <p>
          Absolument. Nos expériences sont parfaites pour marquer un moment unique ou simplement prendre du temps pour soi. Si vous avez quelque chose de particulier en tête, vous pouvez aussi{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            soumettre une demande
          </button>{" "}
          pour créer une expérience entièrement sur mesure.
        </p>
      ) : (
        <p>
          Yes, our experiences are perfect for celebrating a special moment or simply taking time for yourself. If you have something specific in mind, you can also{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            submit a request
          </button>{" "}
          to design a fully tailored experience.
        </p>
      ),
  },
  {
    q_en: "What if I want something more personalized?",
    q_he: "מה אם אני רוצה משהו יותר מותאם אישית?",
    q_fr: "Et si je veux quelque chose de plus personnalisé ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <p>
          אם אתם מחפשים חוויה ספציפית יותר, תוכלו למלא את{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            טופס ה-Tailor-Made
          </button>{" "}
          שלנו. נעזור לכם ליצור חוויה מותאמת אישית לפי האירוע, ההעדפות וסגנון הטיול שלכם.
        </p>
      ) : lang === "fr" ? (
        <p>
          Si vous cherchez quelque chose de plus spécifique, vous pouvez soumettre une demande via notre{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            formulaire sur mesure
          </button>
          . Nous vous aiderons à créer une expérience adaptée à votre occasion, vos préférences et votre style de voyage.
        </p>
      ) : (
        <p>
          If you're looking for something more specific, you can submit a request through our{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            Tailor-Made form
          </button>
          . We'll help you create a more personalized experience based on your occasion, preferences, and travel style.
        </p>
      ),
  },
  {
    q_en: "Can I cancel or modify my booking?",
    q_he: "אפשר לבטל או לשנות את ההזמנה?",
    q_fr: "Puis-je annuler ou modifier ma réservation ?",
    render: ({ isRTL, lang }) =>
      isRTL ? (
        <p>כן, תנאי הביטול והשינוי מוצגים בצורה ברורה לפני אישור ההזמנה. אנחנו עובדים בשיתוף פעולה עם שותפי המלון שלנו כדי להציע תנאים גמישים, שיאפשרו לכם להזמין בביטחון. ניתן גם לנהל את ההזמנה בקלות ישירות מחשבון הלקוח שלכם.</p>
      ) : lang === "fr" ? (
        <p>Oui, les conditions d'annulation et de modification sont clairement indiquées avant de confirmer votre réservation. Nous travaillons en étroite collaboration avec nos hôtels partenaires pour proposer des conditions flexibles, afin que vous puissiez réserver en toute confiance. Vous pouvez également gérer facilement votre réservation directement depuis votre espace client.</p>
      ) : (
        <p>Yes, cancellation and modification policies are clearly displayed before you confirm your booking. We work closely with our hotel partners to offer flexible conditions so you can book with confidence. You can also easily manage your booking directly from your customer account.</p>
      ),
  },
];

const FAQSection = () => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const sectionLabel =
    lang === "he" ? "שאלות נפוצות" : lang === "fr" ? "Questions fréquentes" : "Questions & Answers";
  const sectionTitle =
    lang === "he" ? "כל מה שרציתם לדעת" : lang === "fr" ? "Tout ce que vous voulez savoir" : "Everything you need to know";

  return (
    <>
      <section className="py-10 sm:py-16 border-t border-border/40" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container px-4 max-w-2xl mx-auto">
          <div className="text-center mb-7 sm:mb-10">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#a83c3c] mb-2">
              {sectionLabel}
            </p>
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.02em] text-foreground">
              {sectionTitle}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border-b border-border/50 last:border-b-0"
              >
                <AccordionTrigger className="text-sm sm:text-base font-medium text-left hover:no-underline text-foreground hover:text-[#a83c3c] py-4 [&[data-state=open]]:text-[#a83c3c] transition-colors duration-200 text-start">
                  {lang === "he" ? item.q_he : lang === "fr" ? item.q_fr : item.q_en}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {item.render({ isRTL, lang })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
};

export default FAQSection;
