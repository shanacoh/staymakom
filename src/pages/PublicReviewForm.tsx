import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SEOHead } from "@/components/SEOHead";
import { trackReviewLinkOpened, trackReviewSubmitted } from "@/lib/analytics";

type Lang = "fr" | "en" | "he";

const T: Record<string, Record<Lang, string>> = {
  title: { fr: "Votre avis compte", en: "Your feedback matters", he: "חוות דעתך חשובה לנו" },
  intro: {
    fr: "Quelques mots sur votre expérience suffisent, qu'elle ait été parfaite ou non.",
    en: "A few words about your experience are enough, whether it was perfect or not.",
    he: "כמה מילים על החוויה שלכם מספיקות, בין אם הייתה מושלמת ובין אם לא.",
  },
  ratingLabel: { fr: "Votre note", en: "Your rating", he: "הדירוג שלכם" },
  commentLabel: { fr: "Votre avis", en: "Your review", he: "חוות הדעת שלכם" },
  consent: {
    fr: "J'accepte que mon avis soit publié avec mon prénom et l'initiale de mon nom",
    en: "I agree for my review to be published with my first name and last initial",
    he: "אני מסכימ/ה שחוות הדעת שלי תפורסם עם שמי הפרטי והאות הראשונה של שם המשפחה",
  },
  submit: { fr: "Envoyer mon avis", en: "Submit my review", he: "שלחו את חוות הדעת" },
  thanksTitle: { fr: "Merci pour votre avis !", en: "Thank you for your review!", he: "תודה על חוות הדעת!" },
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
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    if (rating == null && !comment.trim()) return;
    setSubmitting(true);
    setErrorMsg("");
    const { data, error } = await supabase.functions.invoke("submit-review", {
      body: { token, rating, comment: comment.trim() || null, consent_to_publish: consent },
    });
    setSubmitting(false);
    if (error || !data || data.error) {
      setErrorMsg(t("error"));
      return;
    }
    trackReviewSubmitted(rating, experienceTitle ? "standalone_or_experience2" : "unknown");
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir={lang === "he" ? "rtl" : "ltr"}>
      <SEOHead title={t("title")} description={t("intro")} />
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-medium">{t("title")}</h1>
          {experienceTitle && <p className="text-sm text-muted-foreground mt-1">{experienceTitle}</p>}
        </div>

        {submitted || alreadySubmitted ? (
          <div className="rounded-2xl border p-6 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-[#ad1414] mx-auto" />
            <p className="font-semibold text-lg">{t("thanksTitle")}</p>
            <p className="text-sm text-muted-foreground">{alreadySubmitted && !submitted ? t("alreadySubmitted") : t("thanksBody")}</p>
          </div>
        ) : (
          <div className="rounded-2xl border p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              {customerFirstName ? `${customerFirstName}, ` : ""}
              {t("intro")}
            </p>

            <div>
              <p className="text-sm font-medium mb-2">{t("ratingLabel")}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}/5`}>
                    <Star className={`h-8 w-8 ${rating != null && n <= rating ? "fill-foreground text-foreground" : "text-muted-foreground"}`} />
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

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

            <Button
              className="w-full rounded-full h-12 bg-[#ad1414] text-white hover:bg-[#9a1212]"
              disabled={submitting || (rating == null && !comment.trim())}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("submit")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
