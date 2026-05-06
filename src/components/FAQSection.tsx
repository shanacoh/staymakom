import { useLanguage } from "@/hooks/useLanguage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q_en: "Can I book an experience without staying overnight?",
    a_en: "At the moment, experiences are only available as part of a stay. They are designed to be fully immersive and connected to the hotel environment.\n\nHowever, we're currently working on offering more flexibility. Soon, you'll be able to book experiences on their own, day-use access to hotels, or hotel stays without experiences.\n\nIf you're interested in one of these options, click here to let us know and be the first to hear when they become available.",
    q_he: "האם אפשר להזמין חוויה בלי לינה במלון?",
    a_he: "כרגע, החוויות זמינות רק כחלק משהות במלון, מכיוון שהן נבנו כחוויה מלאה ומחוברת לסביבת המלון. בקרוב נציע גם אפשרות להזמין חוויות בלבד, מלונות ל-Day Use, או לינה ללא חוויה. אם זה מעניין אתכם, לחצו כאן כדי להיות הראשונים להתעדכן כשהאפשרויות האלו יהיו זמינות.",
  },
  {
    q_en: "Why book through STAYMAKOM instead of directly with the hotel?",
    a_en: "STAYMAKOM is more than a hotel booking platform. We combine handpicked hotels with curated experiences in one seamless reservation, making it easier, more inspiring, and more effortless to plan your stay.\n\nInstead of spending hours searching for where to stay, what to do, and how to organize everything separately, STAYMAKOM brings everything together in one place. Our packages are designed to offer a smoother and often more advantageous experience than booking each element individually.",
    q_he: "למה להזמין דרך STAYMAKOM ולא ישירות דרך המלון?",
    a_he: "STAYMAKOM היא הרבה יותר מפלטפורמת הזמנת מלונות. אנחנו משלבים מלונות נבחרים עם חוויות ייחודיות בהזמנה אחת פשוטה, כדי להפוך את החופשה שלכם לקלה, מעוררת השראה וללא התעסקות מיותרת. במקום לבזבז זמן על חיפוש, תכנון ותיאומים, הכל כבר מחכה לכם במקום אחד. החבילות שלנו נועדו להציע חוויה חלקה ולעיתים גם משתלמת יותר מהזמנה נפרדת של כל מרכיב.",
  },
  {
    q_en: "Where are your experiences available?",
    a_en: "We are currently focused on Israel, with experiences in destinations like Tel Aviv, Jerusalem, and beyond. New destinations will be added progressively.",
    q_he: "איפה החוויות זמינות?",
    a_he: "כרגע STAYMAKOM מתמקדת בישראל, עם חוויות בתל אביב, ירושלים ויעדים נוספים ברחבי הארץ. יעדים חדשים יתווספו בהמשך.",
  },
  {
    q_en: "Who are these experiences for?",
    a_en: "STAYMAKOM is designed for travelers looking for more than just a hotel, as well as locals seeking a unique and effortless escape.",
    q_he: "למי החוויות מתאימות?",
    a_he: "STAYMAKOM מיועדת למטיילים שמחפשים יותר מסתם מלון, וגם למקומיים שרוצים ליהנות מחופשה ייחודית, פשוטה ומלאת השראה.",
  },
  {
    q_en: "Do I need to plan everything myself?",
    a_en: "No, that's exactly the point. Each experience is already thoughtfully designed for you, so you don't have to spend hours researching, coordinating, or booking multiple services separately. You simply choose, book, and enjoy.",
    q_he: "האם צריך לתכנן הכל לבד?",
    a_he: "לא, וזה בדיוק הרעיון. כל חוויה כבר נבנתה ותוכננה עבורכם, כך שאין צורך להשקיע שעות בחיפושים, תיאומים או הזמנות נפרדות. פשוט בוחרים, מזמינים ונהנים.",
  },
  {
    q_en: "Is it suitable for a special occasion?",
    a_en: "Yes, our experiences are perfect for celebrating a special moment or simply taking time for yourself. If you have something specific in mind, you can also submit a request to design a fully tailored experience.",
    q_he: "האם זה מתאים לאירוע מיוחד?",
    a_he: "בהחלט. החוויות שלנו מושלמות לחגיגת רגע מיוחד או פשוט כדי לקחת זמן לעצמכם. אם יש לכם בקשה מסוימת, תוכלו גם לשלוח פנייה ליצירת חוויה מותאמת אישית.",
  },
  {
    q_en: "What if I want something more personalized?",
    a_en: "If you're looking for something more specific, you can submit a request through our Tailor-Made form. We'll help you create a more personalized experience based on your occasion, preferences, and travel style.",
    q_he: "מה אם אני רוצה משהו יותר מותאם אישית?",
    a_he: "אם אתם מחפשים חוויה ספציפית יותר, תוכלו למלא את טופס ה-Tailor-Made שלנו. נעזור לכם ליצור חוויה מותאמת אישית לפי האירוע, ההעדפות וסגנון הטיול שלכם.",
  },
  {
    q_en: "Can I cancel or modify my booking?",
    a_en: "STAYMAKOM has negotiated favorable cancellation and modification policies with its hotel partners. These conditions are clearly displayed for each date and room category before you confirm your booking.",
    q_he: "אפשר לבטל או לשנות את ההזמנה?",
    a_he: "STAYMAKOM דאגה לתנאי ביטול ושינוי נוחים מול המלונות השותפים שלנו. כל התנאים מוצגים בצורה ברורה עבור כל תאריך וסוג חדר לפני אישור ההזמנה.",
  },
];

const FAQSection = () => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  return (
    <section className="py-10 sm:py-16 border-t border-border/40" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container px-4 max-w-2xl mx-auto">
        <div className="text-center mb-7 sm:mb-10">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
            {isRTL ? "שאלות נפוצות" : "Questions & Answers"}
          </p>
          <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.02em]">
            {isRTL ? "כל מה שרציתם לדעת" : "Everything you need to know"}
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-b border-border/50 last:border-b-0"
            >
              <AccordionTrigger className="text-sm sm:text-base font-medium text-left hover:no-underline hover:text-primary py-4 [&[data-state=open]]:text-primary transition-colors duration-200 text-start">
                {isRTL ? item.q_he : item.q_en}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                {(isRTL ? item.a_he : item.a_en)
                  .split("\n\n")
                  .map((para, i) => (
                    <p key={i} className={i > 0 ? "mt-3" : ""}>
                      {para}
                    </p>
                  ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
