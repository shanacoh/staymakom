import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import tailoredHero from "@/assets/tailored-request-hero.png";

interface TailoredRequestSectionProps {
  categories?: Array<{ id: string; name: string; name_he?: string | null; slug: string }>;
}

const OCCASIONS_EN = [
  "Just a getaway",
  "Anniversary",
  "Birthday",
  "Proposal",
  "Honeymoon",
  "Friends trip",
  "Family trip",
  "Celebration",
  "Other",
];

const OCCASIONS_HE = [
  "סתם בריחה",
  "יום נישואין",
  "יום הולדת",
  "הצעת נישואין",
  "ירח דבש",
  "טיול חברים",
  "טיול משפחתי",
  "חגיגה",
  "אחר",
];

const TIMING_EN = [
  "Within the next month",
  "In 1 to 3 months",
  "In 3 to 6 months",
  "Later this year",
  "Just exploring ideas",
];

const TIMING_HE = [
  "בחודש הקרוב",
  "בעוד 1 עד 3 חודשים",
  "בעוד 3 עד 6 חודשים",
  "מאוחר יותר השנה",
  "סתם בודק רעיונות",
];

const BUDGET = ["Under $300", "$300 – $600", "$600 – $1,000", "$1,000 – $2,000", "$2,000+"];
const BUDGET_HE = ["עד $300", "$300 – $600", "$600 – $1,000", "$1,000 – $2,000", "$2,000+"];

const PEOPLE = ["2", "3 – 4", "5 – 6", "6+"];

type Step = "step1" | "transition" | "step2" | "done";

const TailoredRequestSection = ({ categories }: TailoredRequestSectionProps) => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<Step>("step1");
  const [leadId, setLeadId] = useState<string | null>(null);

  // Step 1 fields
  const [occasion, setOccasion] = useState("");
  const [otherOccasion, setOtherOccasion] = useState("");
  const [people, setPeople] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 fields
  const [moods, setMoods] = useState<string[]>([]);
  const [otherMood, setOtherMood] = useState("");
  const [timing, setTiming] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = () => {
      resetForm();
      setDialogOpen(true);
    };
    window.addEventListener("staymakom-open-design-my-stay", handler);
    return () => window.removeEventListener("staymakom-open-design-my-stay", handler);
  }, []);

  const resetForm = () => {
    setStep("step1");
    setLeadId(null);
    setOccasion("");
    setOtherOccasion("");
    setPeople("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setMoods([]);
    setOtherMood("");
    setTiming("");
    setBudget("");
    setDescription("");
  };

  const getCopy = (en: string, he: string) => (isRTL ? he : en);

  const toggleMood = (slug: string) => {
    setMoods((prev) =>
      prev.includes(slug) ? prev.filter((m) => m !== slug) : [...prev, slug]
    );
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName.trim() || !lastName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("collect-lead", {
        body: {
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          source: "tailored_request",
          metadata: {
            occasion: occasion === "Other" ? otherOccasion.trim() || "Other" : occasion,
            people,
          },
        },
      });
      if (error) throw error;
      setLeadId(data?.leadId ?? null);
      setStep("transition");
    } catch {
      toast.error(getCopy("Something went wrong. Please try again.", "שגיאה, נסה שנית."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2Submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("collect-lead", {
        body: {
          source: "tailored_request",
          leadId,
          metadata: {
            moods,
            otherMood: otherMood.trim() || undefined,
            timing,
            budget,
            description: description.trim() || undefined,
          },
        },
      });
      if (error) throw error;
      setStep("done");
    } catch {
      // Silent fail — step 2 is optional, data saved is a bonus
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  const occasions = isRTL ? OCCASIONS_HE : OCCASIONS_EN;
  const timings = isRTL ? TIMING_HE : TIMING_EN;
  const budgets = isRTL ? BUDGET_HE : BUDGET;

  const fieldLabel =
    "block text-xs uppercase tracking-[0.12em] text-foreground/60 mb-2 font-medium";
  const cardInput =
    "rounded-xl border-border/40 bg-card shadow-soft focus-within:shadow-medium focus-within:ring-1 focus-within:ring-accent/40 transition-all duration-300";

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
          : "bg-card border-border/40 text-foreground/70 hover:border-foreground/30 hover:text-foreground shadow-soft"
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* ─── Photo Hero Banner ─── */}
      <section
        className="relative w-full bg-cover bg-center py-16 sm:py-20 md:py-24"
        style={{ backgroundImage: `url(${tailoredHero})` }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 max-w-2xl mx-auto text-center px-4 space-y-4">
          {!isRTL && (
            <p className="text-[11px] tracking-[0.25em] uppercase font-medium text-white/55">
              YOUR TRIP. YOUR RULES.
            </p>
          )}
          <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-tight text-white">
            {getCopy("Looking for something truly unique?", "מחפשים משהו באמת ייחודי?")}
          </h2>
          <div className="space-y-2">
            <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              {getCopy(
                "Proposal, family vacation, long stay, special occasion, business getaway...",
                "הצעת נישואין, חופשה משפחתית, שהות ארוכה, אירוע מיוחד, נסיעת עסקים..."
              )}
            </p>
            <p className="text-white text-sm sm:text-base font-medium max-w-lg mx-auto">
              {getCopy(
                "Drop your idea, we handle everything.",
                "שתפו אותנו ברעיון, אנחנו מטפלים בכל השאר."
              )}
            </p>
          </div>
          {!isRTL && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {["Tailor-made", "Authentic", "Truly unique", "Best price guaranteed"].map((perk) => (
                <span
                  key={perk}
                  className="px-3 py-1 rounded-full text-[11px] tracking-wide border border-white/30 text-white/70"
                >
                  {perk}
                </span>
              ))}
            </div>
          )}
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="group mt-2"
          >
            {getCopy("DESIGN MY STAY", "עצבו את השהייה שלכם")}
            <ArrowRight
              className={cn(
                "h-4 w-4 transition-transform group-hover:translate-x-1",
                isRTL ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2"
              )}
            />
          </Button>
        </div>
      </section>

      {/* ─── Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
          dir={isRTL ? "rtl" : "ltr"}
        >

          {/* ── STEP 1 ── */}
          {step === "step1" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-sans text-xl font-bold tracking-[-0.02em]">
                  {getCopy("Tell us about your dream stay", "ספרו לנו על השהייה החלומית שלכם")}
                </DialogTitle>
                <p className="text-sm text-muted-foreground pt-1">
                  {getCopy(
                    "Takes less than a minute — we'll handle the rest.",
                    "פחות מדקה — אנחנו נטפל בכל השאר."
                  )}
                </p>
              </DialogHeader>

              <form onSubmit={handleStep1Submit} className="space-y-6 pt-2">

                {/* Occasion bubbles */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("What's the occasion?", "מה האירוע?")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {occasions.map((o, i) => (
                      <BubbleButton
                        key={OCCASIONS_EN[i]}
                        label={o}
                        active={occasion === OCCASIONS_EN[i]}
                        onClick={() => setOccasion(OCCASIONS_EN[i])}
                      />
                    ))}
                  </div>
                  {occasion === "Other" && (
                    <Input
                      value={otherOccasion}
                      onChange={(e) => setOtherOccasion(e.target.value)}
                      placeholder={getCopy("Tell us more…", "ספר לנו עוד…")}
                      className={cn("mt-2", cardInput)}
                      maxLength={200}
                    />
                  )}
                </div>

                {/* Number of people */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("How many people?", "כמה אנשים?")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PEOPLE.map((p) => (
                      <BubbleButton
                        key={p}
                        label={p}
                        active={people === p}
                        onClick={() => setPeople(p)}
                      />
                    ))}
                  </div>
                </div>

                {/* First & Last name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={fieldLabel}>
                      {getCopy("First name", "שם פרטי")} *
                    </label>
                    <Input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={getCopy("First name", "שם פרטי")}
                      className={cardInput}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>
                      {getCopy("Last name", "שם משפחה")} *
                    </label>
                    <Input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={getCopy("Last name", "שם משפחה")}
                      className={cardInput}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Email", "אימייל")} *
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={getCopy("Your email", "כתובת האימייל שלך")}
                    className={cardInput}
                    maxLength={255}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Phone", "טלפון")}
                    <span className="normal-case tracking-normal font-normal text-muted-foreground/60 ml-1">
                      ({getCopy("optional", "אופציונלי")})
                    </span>
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={getCopy("Your phone number", "מספר טלפון")}
                    className={cardInput}
                    maxLength={50}
                  />
                </div>

                {/* CTA */}
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="cta"
                  className="w-full rounded-full py-6 text-sm font-semibold uppercase tracking-[0.12em]"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    getCopy("Send my request", "שלחו את הבקשה שלי")
                  )}
                </Button>

                <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                  {getCopy(
                    "By submitting this form you agree to receive Staymakom updates and accept our ",
                    "בשליחת טופס זה אתם מסכימים לקבל עדכונים מ-Staymakom ומקבלים את "
                  )}
                  <Link to="/terms" className="underline underline-offset-2 hover:text-foreground/60">
                    {getCopy("Terms", "התנאים")}
                  </Link>
                  {getCopy(" and ", " ו")}
                  <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground/60">
                    {getCopy("Privacy Policy", "מדיניות הפרטיות")}
                  </Link>
                  .
                </p>
              </form>
            </>
          )}

          {/* ── TRANSITION ── */}
          {step === "transition" && (
            <div className="text-center py-8 space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="font-sans text-2xl font-bold tracking-[-0.02em]">
                  {getCopy("We'll be in touch soon.", "ניצור איתך קשר בקרוב.")}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  {getCopy(
                    "Your request is on its way to our team. Want to give us more to work with? A few extra details help us find the perfect match.",
                    "הבקשה שלך בדרך לצוות שלנו. רוצה לעזור לנו למצוא את ההתאמה המושלמת? כמה פרטים נוספים יעזרו לנו מאוד."
                  )}
                </p>
              </div>

              <div className="space-y-3 max-w-xs mx-auto">
                <Button
                  onClick={() => setStep("step2")}
                  variant="cta"
                  className="w-full rounded-full py-5 text-sm font-semibold uppercase tracking-[0.12em] gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {getCopy("Help us curate my stay", "עזרו לנו לאצור את השהות שלי")}
                </Button>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2 block mx-auto"
                >
                  {getCopy("No thanks, I'm done", "לא תודה, סיימתי")}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === "step2" && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <DialogTitle className="font-sans text-xl font-bold tracking-[-0.02em]">
                    {getCopy("A little more about you", "עוד קצת עליכם")}
                  </DialogTitle>
                </div>
                <p className="text-sm text-muted-foreground pt-1">
                  {getCopy(
                    "Optional — helps us suggest the perfect match.",
                    "אופציונלי — עוזר לנו למצוא את ההתאמה המושלמת."
                  )}
                </p>
              </DialogHeader>

              <div className="space-y-6 pt-2">

                {/* Mood chips */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Mood of experience", "אווירת החוויה")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories?.map((cat) => {
                      const label = (getLocalizedField(cat, "name", lang) as string) || cat.name;
                      return (
                        <BubbleButton
                          key={cat.slug}
                          label={label}
                          active={moods.includes(cat.slug)}
                          onClick={() => toggleMood(cat.slug)}
                        />
                      );
                    })}
                    <BubbleButton
                      label={getCopy("Other", "אחר")}
                      active={moods.includes("__other__")}
                      onClick={() => toggleMood("__other__")}
                    />
                  </div>
                  {moods.includes("__other__") && (
                    <Input
                      value={otherMood}
                      onChange={(e) => setOtherMood(e.target.value)}
                      placeholder={getCopy("Describe your mood…", "תאר את האווירה…")}
                      className={cn("mt-2", cardInput)}
                      maxLength={200}
                    />
                  )}
                </div>

                {/* Timing */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("When would you like to travel?", "מתי תרצו לטייל?")}
                  </label>
                  <Select value={timing} onValueChange={setTiming}>
                    <SelectTrigger className={cn("w-full", cardInput)}>
                      <SelectValue placeholder={getCopy("Select timing", "בחר תזמון")} />
                    </SelectTrigger>
                    <SelectContent>
                      {timings.map((t, i) => (
                        <SelectItem key={i} value={TIMING_EN[i]}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Budget", "תקציב")}
                  </label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger className={cn("w-full", cardInput)}>
                      <SelectValue placeholder={getCopy("Select budget", "בחר תקציב")} />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((b, i) => (
                        <SelectItem key={i} value={BUDGET[i]}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Wishes */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Any additional wishes?", "יש משאלות נוספות?")}
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={getCopy(
                      "Describe your dream stay in a few words…",
                      "תארו את השהייה החלומית שלכם בכמה מילים…"
                    )}
                    className={cn("min-h-[100px] resize-none", cardInput)}
                    maxLength={1000}
                  />
                </div>

                {/* CTA */}
                <Button
                  type="button"
                  onClick={handleStep2Submit}
                  disabled={submitting}
                  variant="cta"
                  className="w-full rounded-full py-6 text-sm font-semibold uppercase tracking-[0.12em] gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {getCopy("Refine my stay", "דייקו את השהות שלי")}
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2 block mx-auto text-center"
                >
                  {getCopy("Skip for now", "דלג לעת עתה")}
                </button>
              </div>
            </>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div className="text-center py-12 space-y-4 animate-in fade-in duration-500">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="font-sans text-2xl sm:text-3xl font-bold tracking-[-0.02em]">
                {getCopy("You're all set!", "הכל מוכן!")}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                {getCopy(
                  "Thank you for sharing. We'll use your preferences to curate the perfect stay — and reach out as soon as we find a match.",
                  "תודה על השיתוף. נשתמש בהעדפות שלך לאצור את השהות המושלמת וניצור קשר ברגע שנמצא התאמה."
                )}
              </p>
              <Button
                variant="outline"
                className="rounded-full mt-2"
                onClick={() => setDialogOpen(false)}
              >
                {getCopy("Close", "סגור")}
              </Button>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
};

export default TailoredRequestSection;
