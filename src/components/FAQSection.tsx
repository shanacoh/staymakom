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
  lang: string;
  onExpOnlyClick: () => void;
};

type FAQItem = {
  q_en: string;
  q_he: string;
  q_fr: string;
  render: (p: RenderParams) => React.ReactNode;
};

const link = "underline underline-offset-2 cursor-pointer hover:opacity-70 transition-opacity";

const FAQ_ITEMS: FAQItem[] = [
  {
    q_en: "Can I book an experience without staying overnight?",
    q_he: "האם אפשר להזמין חוויה בלי לינה במלון?",
    q_fr: "Puis-je réserver une expérience sans passer la nuit ?",
    render: ({ isRTL, lang, onExpOnlyClick }) =>
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
      ) : lang === "fr" ? (
        <>
          <p>Pour l'instant, les expériences sont uniquement disponibles dans le cadre d'un séjour à l'hôtel. Elles sont conçues pour être vécues en immersion totale, en lien avec l'environnement de l'établissement.</p>
          <p className="mt-3">Nous travaillons à offrir plus de flexibilité. Bientôt, vous pourrez réserver des expériences seules, accéder aux hôtels en journée, ou séjourner sans expérience.</p>
          <p className="mt-3">
            Si cela vous intéresse,{" "}
            <button type="button" onClick={onExpOnlyClick} className={link}>
              cliquez ici
            </button>{" "}
            pour être parmi les premiers informés dès que ces options seront disponibles.
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
  fr: {
    title: "Bientôt : des expériences sans nuit d'hôtel",
    description: "Signalez votre intérêt et nous vous préviendrons dès que c'est disponible.",
    placeholder: "Votre email",
    submit: "Me prévenir",
    submitting: "Envoi…",
    successTitle: "Vous êtes sur la liste !",
    successDescription: "Nous vous informerons dès que les réservations d'expériences seules seront disponibles.",
    close: "Peut-être plus tard",
    invalidEmail: "Veuillez entrer un email valide",
    error: "Une erreur s'est produite. Veuillez réessayer.",
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

  const sectionLabel =
    lang === "he" ? "שאלות נפוצות" : lang === "fr" ? "Questions fréquentes" : "Questions & Answers";
  const sectionTitle =
    lang === "he" ? "כל מה שרציתם לדעת" : lang === "fr" ? "Tout ce que vous voulez savoir" : "Everything you need to know";

  return (
    <>
      <section className="py-10 sm:py-16 border-t border-border/40" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container px-4 max-w-2xl mx-auto">
          <div className="text-center mb-7 sm:mb-10">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {sectionLabel}
            </p>
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.02em]">
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
                <AccordionTrigger className="text-sm sm:text-base font-medium text-left hover:no-underline hover:text-primary py-4 [&[data-state=open]]:text-primary transition-colors duration-200 text-start">
                  {lang === "he" ? item.q_he : lang === "fr" ? item.q_fr : item.q_en}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {item.render({ isRTL, lang, onExpOnlyClick: handleExpOnlyOpen })}
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
                {lang === "he" ? "סגור" : lang === "fr" ? "Fermer" : "Close"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FAQSection;
