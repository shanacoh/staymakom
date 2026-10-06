import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import { trackNewsletterSubscribed, identifyLead } from "@/lib/analytics";
import heroImage from "@/assets/hero-road-desert.jpg";

/**
 * Page d'attente affichée à la place de la home pendant la préparation de l'offre d'hiver.
 * Activée / désactivée depuis `src/config/sitePause.ts`.
 * L'inscription newsletter utilise le même circuit que la popup (table `leads`,
 * source "newsletter_popup"), avec `metadata.origin = "winter_pause"` pour les distinguer.
 */

const COPY = {
  en: {
    eyebrow: "Winter collection",
    title: "We're getting\nwinter ready.",
    sub: "Sorry for the wait. STAYMAKOM is taking a short break to prepare its winter collection. We'll be back in a few days.",
    formTitle: "Be the first to know",
    formSub: "Sign up to our newsletter so you don't miss a thing.",
    emailPlaceholder: "Your email",
    submit: "Sign up",
    submitting: "Signing up…",
    successTitle: "You're in!",
    successSub: "You'll be the first to hear about our winter collection.",
    booked: "Already booked with us? Nothing changes for your stay.",
    invalidEmail: "Please enter a valid email",
    error: "Something went wrong. Please try again.",
  },
  fr: {
    eyebrow: "Offre d'hiver",
    title: "On prépare\nl'hiver.",
    sub: "Désolés pour l'attente. STAYMAKOM fait une courte pause pour préparer son offre d'hiver. On revient dans quelques jours.",
    formTitle: "Sois parmi les premiers informés",
    formSub: "Inscris-toi à la newsletter pour ne rien manquer.",
    emailPlaceholder: "Ton email",
    submit: "Je m'inscris",
    submitting: "Inscription…",
    successTitle: "C'est fait !",
    successSub: "Tu seras parmi les premiers à découvrir notre offre d'hiver.",
    booked: "Tu as déjà réservé ? Rien ne change pour ton séjour.",
    invalidEmail: "Email invalide",
    error: "Une erreur est survenue. Réessaye.",
  },
  he: {
    eyebrow: "קולקציית החורף",
    title: "מתכוננים\nלחורף.",
    sub: "סליחה על ההמתנה. STAYMAKOM יוצאת להפסקה קצרה כדי להכין את קולקציית החורף שלה. נחזור בעוד כמה ימים.",
    formTitle: "היו הראשונים לדעת",
    formSub: "הירשמו לניוזלטר כדי לא לפספס דבר.",
    emailPlaceholder: "האימייל שלך",
    submit: "הרשמה",
    submitting: "נרשמים...",
    successTitle: "נרשמת בהצלחה!",
    successSub: "תהיו הראשונים לשמוע על קולקציית החורף שלנו.",
    booked: "כבר הזמנתם אצלנו? שום דבר לא משתנה בחופשה שלכם.",
    invalidEmail: "אימייל לא תקין",
    error: "משהו השתבש. נסו שוב.",
  },
};

const LANG_LABELS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "he", label: "עב" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WinterPause = () => {
  const { lang, setLanguage } = useLanguage();
  const isRTL = lang === "he";
  const copy = COPY[lang] ?? COPY.en;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      toast.error(copy.invalidEmail);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("collect-lead", {
        body: {
          email: cleanEmail,
          source: "newsletter_popup",
          metadata: { origin: "winter_pause", lang },
        },
      });
      if (error) throw error;
      trackNewsletterSubscribed(cleanEmail.split("@")[1] || "");
      identifyLead(cleanEmail);
      setSubmitted(true);
    } catch {
      toast.error(copy.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Image de fond */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/60" />

      {/* En-tête : nom de marque + choix de la langue */}
      <header className="relative z-10 flex items-center justify-between p-5 sm:p-8" dir="ltr">
        <div className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-white">
          STAYMAKOM
        </div>
        <div className="flex items-center gap-1">
          {LANG_LABELS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={lang === code}
              className={
                "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-colors " +
                (lang === code ? "bg-white text-foreground" : "text-white/70 hover:text-white")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Contenu */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 pb-12 gap-5 sm:gap-6">
        <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/70">
          {copy.eyebrow}
        </p>

        <h1
          className="font-sans font-bold uppercase leading-[1.05] tracking-[-0.03em] text-white whitespace-pre-line"
          style={{ fontSize: "clamp(2.25rem, 8vw, 5rem)", textShadow: "0 2px 40px rgba(0,0,0,0.3)" }}
        >
          {copy.title}
        </h1>

        <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-md">
          {copy.sub}
        </p>

        {/* Inscription newsletter */}
        <div className="w-full max-w-md mt-2 bg-white rounded-3xl shadow-2xl p-6 sm:p-7 text-start">
          {!submitted ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h2 className="font-sans text-lg font-bold uppercase tracking-[-0.02em] text-foreground leading-tight">
                  {copy.formTitle}
                </h2>
                <p className="text-sm text-black/50 leading-relaxed">{copy.formSub}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy.emailPlaceholder}
                  autoComplete="email"
                  disabled={submitting}
                  className="w-full h-11 px-4 rounded-xl border border-black/10 bg-black/[0.03] text-sm text-foreground placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#ad1414]/30"
                />

                {/* Même bouton que la popup newsletter (trait de feutre rouge) */}
                <div className="relative inline-block w-full">
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-1.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative w-full inline-flex items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-xs py-3.5 transition-colors disabled:opacity-60"
                  >
                    {submitting ? copy.submitting : (
                      <>
                        {copy.submit}
                        <ArrowRight
                          className={`h-3.5 w-3.5 transition-transform ${
                            isRTL ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2 group-hover:translate-x-1"
                          }`}
                        />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 mt-0.5 shrink-0 text-[#ad1414]" />
              <div className="space-y-1">
                <h2 className="font-sans text-lg font-bold uppercase tracking-[-0.02em] text-foreground leading-tight">
                  {copy.successTitle}
                </h2>
                <p className="text-sm text-black/50 leading-relaxed">{copy.successSub}</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-white/70 text-xs max-w-xs">{copy.booked}</p>
      </main>
    </div>
  );
};

export default WinterPause;
