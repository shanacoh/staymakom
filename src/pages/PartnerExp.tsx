import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-road-desert.jpg";
import partnersHeroImg from "@/assets/partners-hero.jpg";
import desertJourneyImg from "@/assets/desert-journey.jpg";

// ── Translations ──────────────────────────────────────────────────────────────

const T = {
  // Slide 1
  eyebrow: {
    fr: "Pour les prestataires d'expériences en Israël",
    en: "For experience providers in Israel",
    he: "לספקי חוויות בישראל",
  },
  slide1Headline: {
    fr: "Vos expériences,\nvisibles par les bons voyageurs.",
    en: "Your experiences,\nseen by the right travelers.",
    he: "החוויות שלך,\nלנוסעים הנכונים.",
  },
  slide1Body: {
    fr: "STAYMAKOM est une plateforme de réservation dédiée à Israël. Nous mettons en valeur des expériences authentiques auprès d'une audience internationale et locale de voyageurs de 28 à 45 ans, en quête de sens et de qualité.",
    en: "STAYMAKOM is a booking platform dedicated to Israel. We showcase authentic experiences to an international and domestic audience of travelers aged 28 to 45, seeking meaning and quality.",
    he: "STAYMAKOM היא פלטפורמת הזמנות המוקדשת לישראל. אנחנו מציגים חוויות אותנטיות לקהל בינלאומי ומקומי של נוסעים בגילאי 28 עד 45, שמחפשים משמעות ואיכות.",
  },
  pill1: { fr: "0 frais", en: "0 fees", he: "ללא עלויות" },
  pill2: { fr: "Deal win-win", en: "Win-win deal", he: "עסקת win-win" },
  pill3: { fr: "20% de commission", en: "20% commission", he: "עמלה 20%" },
  ctaPrimary: { fr: "Proposer mon expérience", en: "Submit my experience", he: "הצע את החוויה שלי" },
  ctaSecondary: { fr: "Voir le site", en: "Visit the site", he: "לאתר" },

  // Slide 2
  slide2Headline: {
    fr: "Votre expérience a une histoire.\nOn la met en scène.",
    en: "Your experience has a story.\nWe put it on stage.",
    he: "לחוויה שלך יש סיפור.\nאנחנו מביאים אותו לקדמת הבמה.",
  },
  card1Title: { fr: "Storytelling éditorial", en: "Editorial storytelling", he: "סיפור עורכי" },
  card1Body: {
    fr: "On ne se contente pas de vous lister. On écrit l'histoire de votre expérience : qui vous êtes, ce que vous faites vivre, pourquoi ça compte. C'est ce qui déclenche une réservation.",
    en: "We don't just list you. We write the story of your experience: who you are, what you create, why it matters. That's what triggers a booking.",
    he: "אנחנו לא סתם מוסיפים אתכם לרשימה. אנחנו כותבים את הסיפור של החוויה שלכם: מי אתם, מה אתם יוצרים, למה זה חשוב. זה מה שמביא הזמנה.",
  },
  card2Title: { fr: "Le bon public, pas tous les publics", en: "The right audience, not every audience", he: "הקהל הנכון, לא כל קהל" },
  card2Body: {
    fr: "Touristes internationaux et Israéliens qui cherchent des expériences vraies, pas des activités génériques. Des gens prêts à payer pour ce qui en vaut la peine.",
    en: "International tourists and Israelis looking for real experiences, not generic activities. People ready to pay for what's worth it.",
    he: "תיירים בינלאומיים וישראלים שמחפשים חוויות אמיתיות, לא פעילויות גנריות. אנשים שמוכנים לשלם על מה שראוי לכך.",
  },
  card3Title: { fr: "Un modèle vraiment win-win", en: "A truly win-win model", he: "מודל win-win אמיתי" },
  card3Body: {
    fr: "0 frais d'entrée. 20% de commission sur les ventes uniquement. On gagne seulement quand vous gagnez. Pas d'abonnement, pas de surprise.",
    en: "0 entry fees. 20% commission on sales only. We earn only when you earn. No subscription, no surprises.",
    he: "0 עלויות כניסה. 20% עמלה על מכירות בלבד. אנחנו מרוויחים רק כשאתם מרוויחים. אין מנוי, אין הפתעות.",
  },
  card4Title: { fr: "On travaille vos enjeux avec vous", en: "We work through your challenges with you", he: "אנחנו עובדים על האתגרים שלכם" },
  card4Body: {
    fr: "Saisonnalité, capacité, tarification, visibilité... On prend le temps de comprendre vos contraintes et on construit le partenariat autour d'elles.",
    en: "Seasonality, capacity, pricing, visibility... We take the time to understand your constraints and build the partnership around them.",
    he: "עונתיות, קיבולת, תמחור, נראות... אנחנו לוקחים זמן להבין את האילוצים שלכם ובונים את השותפות סביבם.",
  },
  callout: {
    fr: "Avant de vous référencer, on prend le temps de comprendre ce que vous proposez. Ce qui fait l'unicité de votre expérience, vos contraintes pratiques, ce qui doit absolument être mis en avant. Parce qu'un bon partenariat commence par écouter.",
    en: "Before listing you, we take the time to understand what you offer. What makes your experience unique, your practical constraints, what absolutely needs to stand out. Because a good partnership starts with listening.",
    he: "לפני שאנחנו מוסיפים אתכם לפלטפורמה, אנחנו לוקחים זמן להבין מה אתם מציעים. מה הופך את החוויה שלכם לייחודית, האילוצים המעשיים, מה חייב להיות בחזית. כי שותפות טובה מתחילה בהקשבה.",
  },

  // Slide 3
  slide3Headline: {
    fr: "Simple à gérer,\ndepuis votre téléphone.",
    en: "Manage everything\nfrom your phone.",
    he: "ניהול פשוט\nמהטלפון.",
  },
  slide3Sub: {
    fr: "On vous met à disposition une application partenaire simple et gratuite. On configure vos expériences ensemble une seule fois. Après, vous gérez tout depuis votre téléphone.",
    en: "We provide you with a simple, free partner app. We set up your experiences together once. After that, you manage everything from your phone.",
    he: "אנחנו מספקים לכם אפליקציית שותפים פשוטה ובחינם. אנחנו מגדירים את החוויות שלכם ביחד פעם אחת. אחרי זה, אתם מנהלים הכל מהטלפון.",
  },
  step1: {
    fr: "On configure vos expériences ensemble : titre, description, tarif, photos, capacité maximale. On s'occupe de tout.",
    en: "We set up your experiences together: title, description, price, photos, max capacity. We handle everything.",
    he: "אנחנו מגדירים את החוויות שלכם ביחד: כותרת, תיאור, מחיר, תמונות, קיבולת מקסימלית. אנחנו מטפלים בהכל.",
  },
  step2: {
    fr: "Vous ouvrez vos créneaux sur le calendrier de l'application. Dès qu'un créneau est disponible, les réservations tombent automatiquement, sans intervention de votre part.",
    en: "You open your time slots on the app calendar. As soon as a slot is available, bookings come in automatically, with no action needed from you.",
    he: "אתם פותחים חלונות זמן בלוח השנה של האפליקציה. ברגע שחלון פתוח, הזמנות מגיעות אוטומטית, ללא כל פעולה מצידכם.",
  },
  step3: {
    fr: "Une réservation arrive : vous recevez une notification par email avec tous les détails.",
    en: "A booking arrives: you receive an email notification with all the details.",
    he: "הזמנה מגיעה: אתם מקבלים התראה במייל עם כל הפרטים.",
  },
  step4: {
    fr: "Suivez vos réservations du mois et votre chiffre d'affaires net en temps réel, directement dans l'application.",
    en: "Track your monthly bookings and net revenue in real time, directly in the app.",
    he: "עקבו אחרי ההזמנות החודשיות ורווח נטו שלכם בזמן אמת, ישירות באפליקציה.",
  },
  notif1: { fr: "Notification email à chaque réservation", en: "Email notification on every booking", he: "התראת אימייל על כל הזמנה" },
  notif2: { fr: "Email de confirmation détaillé envoyé automatiquement", en: "Detailed confirmation email sent automatically", he: "אימייל אישור מפורט נשלח אוטומטית" },
  notif3: { fr: "Annulation gérée selon la politique convenue", en: "Cancellation handled per your agreed policy", he: "ביטול מטופל לפי המדיניות המוסכמת" },

  // Mockup
  mockupExp1: { fr: "Balade dans le désert", en: "Desert hike", he: "טיול במדבר" },
  mockupExp2: { fr: "Atelier céramique", en: "Pottery workshop", he: "סדנת קדרות" },
  mockupExp3: { fr: "Dégustation de vins", en: "Wine tasting", he: "טעימת יינות" },
  mockupBookings: { fr: "Réservations ce mois", en: "Bookings this month", he: "הזמנות החודש" },
  mockupRevenue: { fr: "Revenu net", en: "Net revenue", he: "הכנסה נטו" },
};

type Lang = "fr" | "en" | "he";
const tx = (key: keyof typeof T, lang: Lang): string =>
  (T[key] as Record<Lang, string>)[lang] ?? (T[key] as Record<Lang, string>).en;

// ── Component ──────────────────────────────────────────────────────────────────

const PartnerExp = () => {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const isRTL = lang === "he";

  const [current, setCurrent] = useState(0);
  const TOTAL = 3;
  const touchStartX = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(TOTAL - 1, idx)));
  }, []);

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) {
      isRTL ? prev() : next();
    } else {
      isRTL ? next() : prev();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") isRTL ? prev() : next();
      if (e.key === "ArrowLeft") isRTL ? next() : prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, isRTL]);

  const slideImgs = [heroImg, partnersHeroImg, desertJourneyImg];

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-[#FAF8F4]" dir={isRTL ? "rtl" : "ltr"}>
      <LaunchHeader forceScrolled={true} />

      <main
        className="flex-1 relative overflow-hidden pt-14"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Track */}
        <div
          ref={trackRef}
          className="flex h-[calc(100vh-56px)]"
          style={{
            width: `${TOTAL * 100}%`,
            transform: `translateX(${isRTL ? (current / TOTAL) * 100 : -(current / TOTAL) * 100}%)`,
            transition: "transform 0.35s ease",
          }}
        >
          {/* ── SLIDE 1 ── */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: `${100 / TOTAL}%` }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slideImgs[0]})` }}
            />
            <div className="absolute inset-0 bg-black/52" />
            <div
              className="relative z-10 text-white text-center px-6 max-w-2xl mx-auto space-y-6"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-white/70 font-sans">
                {tx("eyebrow", l)}
              </p>
              <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-[-0.02em] whitespace-pre-line">
                {tx("slide1Headline", l)}
              </h1>
              <p className="text-sm sm:text-base text-white/85 max-w-lg mx-auto leading-relaxed">
                {tx("slide1Body", l)}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {(["pill1", "pill2", "pill3"] as const).map((k) => (
                  <span
                    key={k}
                    className="px-3 py-1.5 rounded-full bg-white/10 border border-white/25 text-white text-xs font-medium backdrop-blur-sm"
                  >
                    {tx(k, l)}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  to="/"
                  className="px-8 py-3 rounded-md bg-[#C2714A] hover:bg-[#B06540] text-white text-sm font-semibold uppercase tracking-wide transition-all duration-200 shadow-md hover:-translate-y-0.5"
                >
                  {tx("ctaSecondary", l)}
                </Link>
              </div>
            </div>
          </div>

          {/* ── SLIDE 2 ── */}
          <div
            className="relative flex items-center justify-center overflow-y-auto py-20"
            style={{ width: `${100 / TOTAL}%` }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slideImgs[1]})` }}
            />
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="relative z-10 w-full max-w-3xl mx-auto px-6 space-y-8"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-[1.15] tracking-[-0.02em] text-center whitespace-pre-line">
                {tx("slide2Headline", l)}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {(
                  [
                    ["card1Title", "card1Body"],
                    ["card2Title", "card2Body"],
                    ["card3Title", "card3Body"],
                    ["card4Title", "card4Body"],
                  ] as [keyof typeof T, keyof typeof T][]
                ).map(([titleK, bodyK]) => (
                  <div
                    key={titleK}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 space-y-1.5"
                  >
                    <p className="font-sans font-semibold text-white text-sm uppercase tracking-[0.06em]">
                      {tx(titleK, l)}
                    </p>
                    <p className="font-sans text-xs text-white/80 leading-relaxed">
                      {tx(bodyK, l)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-l-4 border-[#C2714A] bg-white/8 backdrop-blur-sm rounded-r-xl px-5 py-4">
                <p className="text-white text-xs sm:text-sm leading-relaxed font-medium italic">
                  {tx("callout", l)}
                </p>
              </div>
            </div>
          </div>

          {/* ── SLIDE 3 ── */}
          <div
            className="relative flex items-center justify-center overflow-y-auto py-20"
            style={{ width: `${100 / TOTAL}%` }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slideImgs[2]})` }}
            />
            <div className="absolute inset-0 bg-black/68" />
            <div
              className="relative z-10 w-full max-w-4xl mx-auto px-6 space-y-6"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <div className="text-center space-y-2">
                <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-[1.15] tracking-[-0.02em] whitespace-pre-line">
                  {tx("slide3Headline", l)}
                </h2>
                <p className="text-white/75 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                  {tx("slide3Sub", l)}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Left */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    {(["step1", "step2", "step3", "step4"] as const).map((k, i) => (
                      <div key={k} className="flex gap-3 items-start">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-[#C2714A] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-white/90 text-xs sm:text-sm leading-relaxed">{tx(k, l)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/8 backdrop-blur-sm rounded-xl border border-white/15 p-3 space-y-2">
                    {(["notif1", "notif2", "notif3"] as const).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#C2714A] shrink-0" />
                        <span className="text-white/85 text-xs">{tx(k, l)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — mockup */}
                <AppMockup lang={l} isRTL={isRTL} />
              </div>
            </div>
          </div>
        </div>

        {/* Arrows */}
        <button
          onClick={isRTL ? next : prev}
          disabled={isRTL ? current === TOTAL - 1 : current === 0}
          aria-label="Previous"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-all disabled:opacity-20",
            isRTL ? "right-4 md:right-8" : "left-4 md:left-8"
          )}
        >
          {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <button
          onClick={isRTL ? prev : next}
          disabled={isRTL ? current === 0 : current === TOTAL - 1}
          aria-label="Next"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-all disabled:opacity-20",
            isRTL ? "left-4 md:left-8" : "right-4 md:right-8"
          )}
        >
          {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2" dir="ltr">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>
    </div>
  );
};

// ── App Mockup ─────────────────────────────────────────────────────────────────

const CALENDAR_DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const CAL_STATE: ("empty" | "avail" | "booked")[] = [
  "empty", "avail", "avail", "booked", "avail", "avail", "empty",
  "avail", "avail", "booked", "booked", "avail", "avail", "avail",
  "avail", "booked", "avail", "avail", "avail", "empty", "empty",
];

const AppMockup = ({ lang, isRTL }: { lang: Lang; isRTL: boolean }) => {
  const exps = [
    { name: tx("mockupExp1", lang), on: true },
    { name: tx("mockupExp2", lang), on: false },
    { name: tx("mockupExp3", lang), on: true },
  ];

  return (
    <div
      className="bg-[#1a1814]/80 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-3 max-w-xs mx-auto w-full"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {CALENDAR_DAYS.map((d, i) => (
          <span key={i} className="text-[9px] text-white/40 font-medium pb-1">{d}</span>
        ))}
        {CAL_STATE.map((state, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium",
              state === "avail" && "bg-emerald-500/70 text-white",
              state === "booked" && "bg-red-400/70 text-white",
              state === "empty" && "bg-white/5"
            )}
          >
            {state !== "empty" ? i + 1 : ""}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10" />

      <div className="space-y-2">
        {exps.map(({ name, on }, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/80 truncate">{name}</span>
            <div
              className={cn(
                "w-8 h-4 rounded-full flex items-center px-0.5 transition-colors",
                on ? "bg-[#C2714A]" : "bg-white/20"
              )}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full bg-white shadow transition-transform",
                  on ? "translate-x-4" : "translate-x-0"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10" />

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/8 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/50 uppercase tracking-wide">{tx("mockupBookings", lang)}</p>
          <p className="text-base font-bold text-white mt-0.5">12</p>
        </div>
        <div className="bg-white/8 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/50 uppercase tracking-wide">{tx("mockupRevenue", lang)}</p>
          <p className="text-base font-bold text-[#C2714A] mt-0.5">3 060 ₪</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerExp;
