import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const REGIONS_EN = [
  "Galilee",
  "Tel Aviv & surroundings",
  "Dead Sea",
  "Jerusalem",
  "Northern Coast",
  "Negev",
  "Not decided yet",
  "Other",
];

const REGIONS_FR = [
  "Galilée",
  "Tel Aviv et environs",
  "Mer Morte",
  "Jérusalem",
  "Côte Nord",
  "Néguev",
  "Pas encore décidé",
  "Autre",
];

const REGIONS_HE = [
  "גליל",
  "תל אביב וסביבות",
  "ים המלח",
  "ירושלים",
  "חוף צפוני",
  "נגב",
  "עדיין לא החלטתי",
  "אחר",
];

type PageState = "loading" | "ready" | "submitting" | "done" | "error";

const TailorMadeQuestionnaire = () => {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [firstName, setFirstName] = useState<string | null>(null);
  const [dates, setDates] = useState("");
  const [region, setRegion] = useState("");
  const [otherRegion, setOtherRegion] = useState("");

  const regions = lang === "fr" ? REGIONS_FR : lang === "he" ? REGIONS_HE : REGIONS_EN;

  const getCopy = (en: string, he: string, fr: string = en) =>
    lang === "he" ? he : lang === "fr" ? fr : en;

  useEffect(() => {
    if (!token) { setPageState("error"); return; }

    supabase.functions
      .invoke("submit-tailor-questionnaire", { body: { token, action: "lookup" } })
      .then(({ data, error }) => {
        if (error || !data?.valid) { setPageState("error"); return; }
        if (data.alreadyFilled) { setPageState("done"); return; }
        setFirstName(data.firstName || null);
        setPageState("ready");
      })
      .catch(() => setPageState("error"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dates.trim() || !region || pageState === "submitting") return;
    setPageState("submitting");

    const { data, error } = await supabase.functions.invoke("submit-tailor-questionnaire", {
      body: {
        token,
        dates: dates.trim(),
        region,
        ...(region === "Other" && otherRegion.trim() ? { otherRegion: otherRegion.trim() } : {}),
      },
    });

    if (error || !data?.success) {
      setPageState("ready");
      return;
    }

    if (data.firstName && !firstName) setFirstName(data.firstName);
    setPageState("done");
  };

  const fieldLabel =
    "block text-xs uppercase tracking-[0.12em] text-foreground/60 mb-2 font-medium";

  const BubbleButton = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card border-border/40 text-foreground/70 hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      className="min-h-screen bg-[#f5f5f0] flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="bg-[#1a1a1a] py-6 text-center">
        <p className="text-white text-xl font-light tracking-[0.2em]">STAYMAKOM</p>
        <p className="text-[#c9a87c] text-xs tracking-widest mt-1">
          {getCopy("MORE THAN A STAY, IT'S AN EXPERIENCE", "יותר משהייה, זו חוויה", "PLUS QU'UN SÉJOUR, C'EST UNE EXPÉRIENCE")}
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8 sm:p-10">

          {/* Loading */}
          {pageState === "loading" && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            </div>
          )}

          {/* Error */}
          {pageState === "error" && (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">
                {getCopy("This link is invalid or has expired.", "הקישור הזה אינו תקין או שפג תוקפו.", "Ce lien est invalide ou a expiré.")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getCopy(
                  "Please contact us at hello@staymakom.com",
                  "אנא צרו איתנו קשר בכתובת hello@staymakom.com",
                  "Contactez-nous à hello@staymakom.com"
                )}
              </p>
            </div>
          )}

          {/* Done */}
          {pageState === "done" && (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold tracking-tight">
                {firstName
                  ? getCopy(`Thank you, ${firstName}!`, `תודה, ${firstName}!`, `Merci, ${firstName} !`)
                  : getCopy("Thank you!", "תודה!", "Merci !")}
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                {getCopy(
                  "We've received your answers and will be in touch very soon with a curated proposal just for you.",
                  "קיבלנו את תשובותיכם וניצור איתכם קשר בקרוב עם הצעה מותאמת אישית.",
                  "Nous avons bien reçu vos réponses et reviendrons vers vous très vite avec une proposition sur mesure."
                )}
              </p>
            </div>
          )}

          {/* Form */}
          {(pageState === "ready" || pageState === "submitting") && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {firstName
                    ? getCopy(`Hello, ${firstName} 👋`, `שלום, ${firstName} 👋`, `Bonjour, ${firstName} 👋`)
                    : getCopy("Hello 👋", "שלום 👋", "Bonjour 👋")}
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {getCopy(
                    "Two quick questions to help us find your perfect stay.",
                    "שתי שאלות קצרות כדי לעזור לנו למצוא את השהות המושלמת עבורכם.",
                    "Deux questions rapides pour nous aider à trouver votre séjour idéal."
                  )}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Dates */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("When would you like to travel?", "מתי תרצו לטייל?", "Quand souhaitez-vous voyager ?")} *
                  </label>
                  <Input
                    required
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    placeholder={getCopy(
                      "e.g. Aug 15–20, early September, summer 2026…",
                      "למשל: 15-20 באוגוסט, תחילת ספטמבר, קיץ 2026…",
                      "ex. 15-20 août, début septembre, été 2026…"
                    )}
                    maxLength={200}
                    className="rounded-xl border-border/40"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Which region interests you?", "איזה אזור מעניין אתכם?", "Quelle région vous intéresse ?")} *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {regions.map((r, i) => (
                      <BubbleButton
                        key={REGIONS_EN[i]}
                        label={r}
                        active={region === REGIONS_EN[i]}
                        onClick={() => setRegion(REGIONS_EN[i])}
                      />
                    ))}
                  </div>
                  {region === "Other" && (
                    <Input
                      value={otherRegion}
                      onChange={(e) => setOtherRegion(e.target.value)}
                      placeholder={getCopy("Tell us more…", "ספרו לנו עוד…", "Dites-nous en plus…")}
                      className="mt-3 rounded-xl border-border/40"
                      maxLength={200}
                    />
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-center pt-2">
                  <div className="relative inline-block">
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-1.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#c9a87c]/40"
                    />
                    <button
                      type="submit"
                      disabled={!dates.trim() || !region || pageState === "submitting"}
                      className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-200 hover:opacity-80 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {pageState === "submitting" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        getCopy("Send my answers", "שלח את תשובותי", "Envoyer mes réponses")
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Staymakom
        </p>
      </footer>
    </div>
  );
};

export default TailorMadeQuestionnaire;
