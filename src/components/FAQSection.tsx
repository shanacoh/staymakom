import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function openDesignMyStayDialog() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("staymakom-open-design-my-stay"));
}

type RenderParams = {
  isRTL: boolean;
  onExpOnlyClick: () => void;
};

type FAQItem = {
  q_en: string;
  q_he: string;
  render: (p: RenderParams) => React.ReactNode;
};

const link = "underline underline-offset-2 cursor-pointer hover:opacity-70 transition-opacity";

const FAQ_ITEMS: FAQItem[] = [
  {
    q_en: "Can I book an experience without staying overnight?",
    q_he: "האם אפשר להזמין חוויה בלי לינה במלון?",
    render: ({ isRTL, onExpOnlyClick }) =>
      isRTL ? (
        <>
          <p>כרגע, החוויות זמינות רק כחלק משהות במלון, מכיוון שהן נבנו כחוויה מלאה ומחוברת לסביבת המלון.</p>
          <p className="mt-3">בקרוב נציע גם אפשרות להזמין חוויות בלבד, מלונות ל-Day Use, או לינה ללא חוויה.</p>
          <p className="mt-3">
            אם זה מעניין אתכם,{" "}
            <button type="button" onClick={onExpOnlyClick} className={link}>
              לחצו כאן
            </button>{" "}
            כדי להיות הראשונים להתעדכן כשהאפשרויות האלו יהיו זמינות.
          </p>
        </>
      ) : (
        <>
          <p>At the moment, experiences are only available as part of a stay. They are designed to be fully immersive and connected to the hotel environment.</p>
          <p className="mt-3">However, we're currently working on offering more flexibility. Soon, you'll be able to book experiences on their own, day-use access to hotels, or hotel stays without experiences.</p>
          <p className="mt-3">
            If you're interested in one of these options,{" "}
            <button type="button" onClick={onExpOnlyClick} className={link}>
              click here
            </button>{" "}
            to let us know and be the first to hear when they become available.
          </p>
        </>
      ),
  },
  {
    q_en: "Why book through STAYMAKOM?",
    q_he: "למה להזמין דרך STAYMAKOM?",
    render: ({ isRTL }) =>
      isRTL ? (
        <>
          <p>STAYMAKOM היא הרבה יותר מפלטפורמת הזמנת מלונות. אנחנו משלבים מלונות נבחרים עם חוויות ייחודיות בהזמנה אחת פשוטה, כדי להפוך את החופשה שלכם לקלה, מעוררת השראה וללא התעסקות מיותרת.</p>
          <p className="mt-3">במקום לבזבז זמן על חיפוש, תכנון ותיאומים, הכל כבר מחכה לכם במקום אחד. החבילות שלנו נועדו להציע חוויה חלקה ומשתלמת יותר מהזמנה נפרדת של כל מרכיב.</p>
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
    render: ({ isRTL }) =>
      isRTL ? (
        <p>אנחנו כרגע מתמקדים בישראל, עם חוויות בתל אביב, ירושלים ויעדים רבים נוספים שממתינים לגילוי. לישראל יש הרבה יותר להציע מעבר למסלולים הרגילים — מגוון עשיר של מקומות, אווירות וחוויות לאורך כל הארץ. אנחנו ממשיכים להוסיף יעדים חדשים ומזמינים מטיילים לגלות צד אחר של ישראל.</p>
      ) : (
        <p>We are currently focused on Israel, with experiences across Tel Aviv, Jerusalem, and many more destinations waiting to be discovered. Israel has so much more to offer beyond the usual routes, with a wide variety of places, atmospheres, and experiences across the country. We're continuously adding new destinations and inviting travelers to discover a different side of Israel.</p>
      ),
  },
  {
    q_en: "Who are these experiences for?",
    q_he: "למי החוויות מתאימות?",
    render: ({ isRTL }) =>
      isRTL ? (
        <p>STAYMAKOM מיועדת הן למטיילים המגיעים לישראל והן למקומיים שרוצים לחוות את הארץ אחרת. בין אם זו הפעם הראשונה שאתם מגלים את ישראל, ובין אם אתם מבלים כל קיץ כאן כבר שנים — STAYMAKOM עוזרת לכם לחקור מעבר לתוכניות הרגילות ולגלות חוויות שאולי לא הייתם מוצאים בדרך אחרת.</p>
      ) : (
        <p>STAYMAKOM is designed both for travelers visiting Israel and for locals looking to experience the country differently. Whether it's your first time discovering Israel or you've been spending every summer here for years, STAYMAKOM helps you explore beyond the usual plans and discover experiences you might not have found otherwise.</p>
      ),
  },
  {
    q_en: "Do I need to plan everything myself?",
    q_he: "האם צריך לתכנן הכל לבד?",
    render: ({ isRTL }) =>
      isRTL ? (
        <p>לא, וזה בדיוק הרעיון. כל חוויה כבר נבנתה ותוכננה עבורכם, כך שאין צורך להשקיע שעות בחיפושים, תיאומים או הזמנות נפרדות. פשוט בוחרים, מזמינים ונהנים.</p>
      ) : (
        <p>No, that's exactly the point. Each experience is already thoughtfully designed for you, so you don't have to spend hours researching, coordinating, or booking multiple services separately. You simply choose, book, and enjoy.</p>
      ),
  },
  {
    q_en: "Is it suitable for a special occasion?",
    q_he: "האם זה מתאים לאירוע מיוחד?",
    render: ({ isRTL }) =>
      isRTL ? (
        <p>
          בהחלט. החוויות שלנו מושלמות לחגיגת רגע מיוחד או פשוט כדי לקחת זמן לעצמכם. אם יש לכם בקשה מסוימת, תוכלו גם{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            לשלוח פנייה
          </button>{" "}
          ליצירת חוויה מותאמת אישית.
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
    render: ({ isRTL }) =>
      isRTL ? (
        <p>
          אם אתם מחפשים חוויה ספציפית יותר, תוכלו למלא את{" "}
          <button type="button" onClick={openDesignMyStayDialog} className={link}>
            טופס ה-Tailor-Made
          </button>{" "}
          שלנו. נעזור לכם ליצור חוויה מותאמת אישית לפי האירוע, ההעדפות וסגנון הטיול שלכם.
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
    render: ({ isRTL }) =>
      isRTL ? (
        <p>כן, תנאי הביטול והשינוי מוצגים בצורה ברורה לפני אישור ההזמנה. אנחנו עובדים בשיתוף פעולה עם שותפי המלון שלנו כדי להציע תנאים גמישים, שיאפשרו לכם להזמין בביטחון. ניתן גם לנהל את ההזמנה בקלות ישירות מחשבון הלקוח שלכם.</p>
      ) : (
        <p>Yes, cancellation and modification policies are clearly displayed before you confirm your booking. We work closely with our hotel partners to offer flexible conditions so you can book with confidence. You can also easily manage your booking directly from your customer account.</p>
      ),
  },
];

const expOnlyTranslations = {
  en: {
    title: "Coming soon: experiences without an overnight stay",
    description: "Let us know you're interested and we'll notify you as soon as it's available.",
    placeholder: "Your email",
    submit: "Notify me",
    submitting: "Sending…",
    successTitle: "You're on the list!",
    successDescription: "We'll let you know as soon as experience-only bookings are available.",
    close: "Maybe later",
    invalidEmail: "Please enter a valid email",
    error: "Something went wrong. Please try again.",
  },
  he: {
    title: "בקרוב: חוויות ללא לינה",
    description: "ספרו לנו שאתם מעוניינים ונהיה הראשונים ליידע אתכם כשהאפשרות תהיה זמינה.",
    placeholder: "האימייל שלך",
    submit: "עדכנו אותי",
    submitting: "שולח...",
    successTitle: "!אתם ברשימה",
    successDescription: "ניידע אתכם ברגע שהזמנת חוויות בלבד תהיה זמינה.",
    close: "אולי מאוחר יותר",
    invalidEmail: "אימייל לא תקין",
    error: "משהו השתבש. נסה שנית.",
  },
};

const FAQSection = () => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const t = expOnlyTranslations[lang as keyof typeof expOnlyTranslations] || expOnlyTranslations.en;

  const [expOnlyOpen, setExpOnlyOpen] = useState(false);
  const [expEmail, setExpEmail] = useState("");
  const [expSubmitting, setExpSubmitting] = useState(false);
  const [expSubmitted, setExpSubmitted] = useState(false);

  const handleExpOnlyOpen = () => {
    setExpEmail("");
    setExpSubmitted(false);
    setExpOnlyOpen(true);
  };

  const handleExpOnlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(expEmail.trim())) {
      toast.error(t.invalidEmail);
      return;
    }
    setExpSubmitting(true);
    try {
      await supabase.functions
        .invoke("collect-lead", {
          body: { email: expEmail.trim(), source: "experience_only" },
        })
        .catch((err) => {
          console.warn("Experience-only signup failed (non-blocking)", err);
        });
      setExpSubmitted(true);
    } catch {
      toast.error(t.error);
    } finally {
      setExpSubmitting(false);
    }
  };

  return (
    <>
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
                  {item.render({ isRTL, onExpOnlyClick: handleExpOnlyOpen })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Dialog open={expOnlyOpen} onOpenChange={setExpOnlyOpen}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-center font-sans text-xl font-bold tracking-[-0.02em]">
              {expSubmitted ? t.successTitle : t.title}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {expSubmitted ? t.successDescription : t.description}
            </DialogDescription>
          </DialogHeader>

          {!expSubmitted ? (
            <form onSubmit={handleExpOnlySubmit} className="space-y-3 pt-2">
              <Input
                type="email"
                required
                placeholder={t.placeholder}
                value={expEmail}
                onChange={(e) => setExpEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={expSubmitting}>
                {expSubmitting ? t.submitting : t.submit}
              </Button>
              <button
                type="button"
                onClick={() => setExpOnlyOpen(false)}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.close}
              </button>
            </form>
          ) : (
            <div className="pt-4 text-center">
              <Button type="button" onClick={() => setExpOnlyOpen(false)} variant="outline" className="w-full">
                {isRTL ? "סגור" : "Close"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FAQSection;
