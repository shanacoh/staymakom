import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SEOHead } from "@/components/SEOHead";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import MobileFooterMinimal from "@/components/MobileFooterMinimal";
import { trackReviewLinkOpened, trackReviewSubmitted } from "@/lib/analytics";
import heroImage from "@/assets/hero-road-desert.jpg";

type Lang = "fr" | "en" | "he";

const T: Record<string, Record<Lang, string>> = {
  eyebrow: { fr: "Votre expérience", en: "Your experience", he: "החוויה שלכם" },
  title: { fr: "Racontez-nous\nvotre moment.", en: "Tell us about\nyour moment.", he: "ספרו לנו\nעל הרגע שלכם." },
  intro: {
    fr: "Quelques mots suffisent, que votre expérience ait été parfaite ou non.",
    en: "A few words are enough, whether your experience was perfect or not.",
    he: "כמה מילים מספיקות, בין אם החוויה הייתה מושלמת ובין אם לא.",
  },
  ratingLabel: { fr: "Votre note", en: "Your rating", he: "הדירוג שלכם" },
  commentLabel: { fr: "Votre avis", en: "Your review", he: "חוות הדעת שלכם" },
  suggestionLabel: {
    fr: "Une suggestion, une question ?",
    en: "A suggestion or a question?",
    he: "הצעה או שאלה?",
  },
  suggestionIntro: {
    fr: "On avance avec vous : n'hésitez pas à nous dire ce qui vous ferait plaisir ou ce qu'on pourrait améliorer.",
    en: "We're building this with you, so feel free to tell us what you'd love to see or what we could improve.",
    he: "אנחנו מתקדמים יחד איתכם, אל תהססו לספר לנו מה ישמח אתכם או מה אפשר לשפר.",
  },
  consent: {
    fr: "J'accepte que mon avis soit publié",
    en: "I agree for my review to be published",
    he: "אני מסכימ/ה שחוות הדעת שלי תפורסם",
  },
  newsletter: {
    fr: "Je souhaite aussi recevoir les actualités STAYMAKOM par email",
    en: "I'd also like to receive STAYMAKOM news by email",
    he: "אשמח גם לקבל עדכונים מ-STAYMAKOM במייל",
  },
  submit: { fr: "Envoyer mon avis", en: "Submit my review", he: "שלחו את חוות הדעת" },
  thanksEyebrow: { fr: "Merci", en: "Thank you", he: "תודה" },
  thanksTitle: { fr: "Votre avis\nest bien arrivé.", en: "Your review\nhas arrived.", he: "חוות הדעת שלכם\nהתקבלה." },
  thanksBody: {
    fr: "On l'a bien reçu. S'il est publié, ce sera uniquement avec votre accord.",
    en: "We've received it. If published, it will only be with your consent.",
    he: "קיבלנו אותה. אם תפורסם, זה יהיה רק בהסכמתכם.",
  },
  error: { fr: "Une erreur est survenue, réessayez.", en: "Something went wrong, please try again.", he: "משהו השתבש, נסו שוב." },
  alreadySubmitted: {
    fr: "Un avis a déjà été déposé avec ce lien. Merci encore !",
    en: "A review has already been submitted with this link. Thanks again!",
    he: "חוות דעת כבר נשלחה עם קישור זה. תודה שוב!",
  },
  notFoundEyebrow: { fr: "Lien expiré", en: "Expired link", he: "קישור שפג תוקפו" },
  notFound: { fr: "Ce lien n'est plus valide.", en: "This link is no longer valid.", he: "הקישור אינו תקף יותר." },
};

export default function PublicReviewForm() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [experienceTitle, setExperienceTitle] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");

  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [suggestion, setSuggestion] = useState("");
  // Pré-cochées par défaut : la plupart des clients sont contents de voir leur avis publié
  // et de rester informés, ils gardent la main pour décocher avant d'envoyer.
  const [consent, setConsent] = useState(true);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isRTL = lang === "he";
  const t = (key: keyof typeof T) => T[key][lang] || T[key].en;

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("get-review-request-by-token", { body: { token } });
      if (error || !data || data.error) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLang((data.lang as Lang) || "en");
      setExperienceTitle(data.experienceTitle || "");
      setCustomerFirstName(data.customerFirstName || "");
      if (data.status === "submitted") setAlreadySubmitted(true);
      trackReviewLinkOpened(data.status === "submitted" ? "already_submitted" : "opened");
      setLoading(false);
    })();
  }, [token]);

  const handleSubmit = async () => {
    if (rating == null && !comment.trim() && !suggestion.trim()) return;
    setSubmitting(true);
    setErrorMsg("");
    const { data, error } = await supabase.functions.invoke("submit-review", {
      body: {
        token,
        rating,
        comment: comment.trim() || null,
        consent_to_publish: consent,
        suggestion: suggestion.trim() || null,
        newsletter_opt_in: newsletterOptIn,
      },
    });
    setSubmitting(false);
    if (error || !data || data.error) {
      setErrorMsg(t("error"));
      return;
    }
    trackReviewSubmitted(rating, experienceTitle ? "standalone_or_experience2" : "unknown");
    setSubmitted(true);
  };

  const showThanks = submitted || alreadySubmitted;

  // Bandeau haut façon 404 : même image, même structure (eyebrow / titre / sous-texte),
  // pour que cette page se sente comme le reste du site plutôt que comme un formulaire isolé.
  const Hero = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) => (
    <div className="relative h-[42vh] min-h-[280px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center px-4 flex flex-col items-center gap-3">
        <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/70">
          {eyebrow}
        </p>
        <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[-0.03em] leading-[1.15] text-white whitespace-pre-line">
          {title}
        </h1>
        {sub && <p className="text-white/75 text-xs sm:text-sm max-w-xs sm:max-w-sm">{sub}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead title={t("title").replace("\n", " ")} description={t("intro")} />
      <V3Header />

      <main className="flex-1">
        {notFound ? (
          <>
            <Hero eyebrow={t("notFoundEyebrow")} title={t("notFound")} />
          </>
        ) : (
          <>
            <Hero
              eyebrow={t("eyebrow")}
              title={showThanks ? t("thanksTitle") : t("title")}
              sub={!showThanks && experienceTitle ? experienceTitle : undefined}
            />

            <div className="max-w-md mx-auto px-4 -mt-10 relative z-10 pb-16">
              {showThanks ? (
                <div className="rounded-2xl border bg-background p-6 text-center space-y-3 shadow-medium">
                  <CheckCircle2 className="h-10 w-10 text-[#ad1414] mx-auto" />
                  <p className="font-serif text-lg font-medium">{t("thanksEyebrow")}</p>
                  <p className="text-sm text-muted-foreground">
                    {alreadySubmitted && !submitted ? t("alreadySubmitted") : t("thanksBody")}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border bg-background p-6 space-y-5 shadow-medium">
                  <p className="text-sm text-muted-foreground">
                    {customerFirstName ? `${customerFirstName}, ` : ""}
                    {t("intro")}
                  </p>

                  <div>
                    <p className="text-sm font-medium mb-2">{t("ratingLabel")}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}/5`}>
                          <Star className={`h-8 w-8 ${rating != null && n <= rating ? "fill-[#ad1414] text-[#ad1414]" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">{t("commentLabel")}</p>
                    <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} id="public-consent" />
                    <label htmlFor="public-consent" className="text-xs text-muted-foreground leading-snug">
                      {t("consent")}
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox checked={newsletterOptIn} onCheckedChange={(v) => setNewsletterOptIn(!!v)} id="public-newsletter" />
                    <label htmlFor="public-newsletter" className="text-xs text-muted-foreground leading-snug">
                      {t("newsletter")}
                    </label>
                  </div>

                  <div className="pt-2 border-t border-border space-y-2">
                    <p className="text-sm font-medium">{t("suggestionLabel")}</p>
                    <p className="text-xs text-muted-foreground">{t("suggestionIntro")}</p>
                    <Textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={3} />
                  </div>

                  {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

                  <Button
                    className="w-full rounded-full text-base font-semibold h-12 bg-[#ad1414] text-white hover:bg-[#9a1212] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(173,20,20,0.4)] transition-all duration-200 normal-case"
                    disabled={submitting || (rating == null && !comment.trim() && !suggestion.trim())}
                    onClick={handleSubmit}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("submit")}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>
      <MobileFooterMinimal />
    </div>
  );
}
