import { useState } from "react";
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
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import tailoredHero from "@/assets/tailored-request-hero.png";

interface TailoredRequestSectionProps {
  categories?: Array<{id: string;name: string;name_he?: string | null;slug: string;}>;
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
"Other"];

const OCCASIONS_HE = [
"סתם בריחה",
"יום נישואין",
"יום הולדת",
"הצעת נישואין",
"ירח דבש",
"טיול חברים",
"טיול משפחתי",
"חגיגה",
"אחר"];


const TIMING_EN = [
"Within the next month",
"In 1 to 3 months",
"In 3 to 6 months",
"Later this year",
"Just exploring ideas"];

const TIMING_HE = [
"בחודש הקרוב",
"בעוד 1 עד 3 חודשים",
"בעוד 3 עד 6 חודשים",
"מאוחר יותר השנה",
"סתם בודק רעיונות"];


const BUDGET = ["Under $300", "$300 – $600", "$600 – $1,000", "$1,000 – $2,000", "$2,000+"];
const BUDGET_HE = ["עד $300", "$300 – $600", "$600 – $1,000", "$1,000 – $2,000", "$2,000+"];

const PEOPLE = ["2", "3 – 4", "5 – 6", "6+"];

const TailoredRequestSection = ({ categories }: TailoredRequestSectionProps) => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [moods, setMoods] = useState<string[]>([]);
  const [otherMood, setOtherMood] = useState("");
  const [occasion, setOccasion] = useState("");
  const [otherOccasion, setOtherOccasion] = useState("");
  const [timing, setTiming] = useState("");
  const [budget, setBudget] = useState("");
  const [people, setPeople] = useState("");
  const [description, setDescription] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getCopy = (en: string, he: string) => isRTL ? he : en;

  const toggleMood = (slug: string) => {
    setMoods((prev) =>
    prev.includes(slug) ? prev.filter((m) => m !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName.trim() || !lastName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("collect-lead", {
        body: {
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          source: "tailored_request",
          metadata: {
            moods,
            otherMood: otherMood.trim() || undefined,
            occasion: occasion === "Other" ? otherOccasion.trim() || "Other" : occasion,
            timing,
            budget,
            people,
            description: description.trim() || undefined
          }
        }
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast.error(getCopy("Something went wrong. Please try again.", "שגיאה, נסה שנית."));
    } finally {
      setSubmitting(false);
    }
  };

  const occasions = isRTL ? OCCASIONS_HE : OCCASIONS_EN;
  const timings = isRTL ? TIMING_HE : TIMING_EN;
  const budgets = isRTL ? BUDGET_HE : BUDGET;

  const fieldLabel = "block text-xs uppercase tracking-[0.12em] text-foreground/60 mb-2 font-medium";
  const cardInput =
  "rounded-xl border-border/40 bg-card shadow-soft focus-within:shadow-medium focus-within:ring-1 focus-within:ring-accent/40 transition-all duration-300";

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
          <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-tight text-white">
            {getCopy("Looking for something truly unique?", "מחפשים משהו באמת ייחודי?")}
          </h2>
          <p className="text-white/85 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {getCopy(
              "Some escapes can't be found in a list. Tell us yours.",
              "יש בריחות שלא ניתן למצוא ברשימה. ספרו לנו על שלכם."
            )}
          </p>
          <Button
            onClick={() => { setDialogOpen(true); setSubmitted(false); }}
            className="group mt-2"
          >
            {getCopy("DESIGN MY STAY", "עצבו את השהייה שלכם")}
            <ArrowRight className={cn(
              "h-4 w-4 transition-transform group-hover:translate-x-1",
              isRTL ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2"
            )} />
          </Button>
        </div>
      </section>

      {/* ─── Dialog with Form ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          {submitted ?
          <div className="text-center py-12 space-y-4 animate-in fade-in duration-500">
              <CheckCircle className="h-10 w-10 text-accent mx-auto" />
              <h3 className="font-sans text-2xl sm:text-3xl font-bold tracking-[-0.02em]">
                {getCopy("Thank you", "תודה")}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                {getCopy(
                "Your request has been received. If your idea matches upcoming experiences, we will reach out to you.",
                "הבקשה שלך התקבלה. אם הרעיון שלך מתאים לחוויות קרובות, ניצור איתך קשר."
              )}
              </p>
            </div> :

          <>
              <DialogHeader>
                <DialogTitle className="font-sans text-xl font-bold tracking-[-0.02em]">
                  {getCopy("Tell us about your dream stay", "ספרו לנו על השהייה החלומית שלכם")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                {/* Mood — multi-select chips */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Mood of experience", "אווירת החוויה")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories?.map((cat) => {
                    const label = getLocalizedField(cat, "name", lang) as string || cat.name;
                    const active = moods.includes(cat.slug);
                    return (
                      <button
                        type="button"
                        key={cat.slug}
                        onClick={() => toggleMood(cat.slug)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200",
                          active ?
                          "bg-foreground text-background border-foreground" :
                          "bg-card border-border/40 text-foreground/70 hover:border-foreground/30 hover:text-foreground shadow-soft"
                        )}>
                        
                          {label}
                        </button>);

                  })}
                    <button
                    type="button"
                    onClick={() => toggleMood("__other__")}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200",
                      moods.includes("__other__") ?
                      "bg-foreground text-background border-foreground" :
                      "bg-card border-border/40 text-foreground/70 hover:border-foreground/30 hover:text-foreground shadow-soft"
                    )}>
                    
                      {getCopy("Other", "אחר")}
                    </button>
                  </div>
                  {moods.includes("__other__") &&
                <Input
                  value={otherMood}
                  onChange={(e) => setOtherMood(e.target.value)}
                  placeholder={getCopy("Describe your mood…", "תאר את האווירה…")}
                  className={cn("mt-2", cardInput)}
                  maxLength={200} />

                }
                </div>

                {/* Occasion */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Occasion", "אירוע")}
                  </label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger className={cn("w-full", cardInput)}>
                      <SelectValue placeholder={getCopy("Select an occasion", "בחר אירוע")} />
                    </SelectTrigger>
                    <SelectContent>
                      {occasions.map((o, i) =>
                    <SelectItem key={i} value={OCCASIONS_EN[i]}>
                          {o}
                        </SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                  {occasion === "Other" &&
                <Input
                  value={otherOccasion}
                  onChange={(e) => setOtherOccasion(e.target.value)}
                  placeholder={getCopy("Tell us more…", "ספר לנו עוד…")}
                  className={cn("mt-2", cardInput)}
                  maxLength={200} />

                }
                </div>

                {/* When */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("When would you like to travel?", "מתי תרצו לטייל?")}
                  </label>
                  <Select value={timing} onValueChange={setTiming}>
                    <SelectTrigger className={cn("w-full", cardInput)}>
                      <SelectValue placeholder={getCopy("Select timing", "בחר תזמון")} />
                    </SelectTrigger>
                    <SelectContent>
                      {timings.map((t, i) =>
                    <SelectItem key={i} value={TIMING_EN[i]}>
                          {t}
                        </SelectItem>
                    )}
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
                      {budgets.map((b, i) =>
                    <SelectItem key={i} value={BUDGET[i]}>
                          {b}
                        </SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of people */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Number of people", "מספר אנשים")}
                  </label>
                  <Select value={people} onValueChange={setPeople}>
                    <SelectTrigger className={cn("w-full", cardInput)}>
                      <SelectValue placeholder={getCopy("Select", "בחר")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PEOPLE.map((p) =>
                    <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Tell us what you have in mind", "ספרו לנו מה יש לכם בראש")}
                  </label>
                  <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={getCopy(
                    "Describe your dream stay in a few words.",
                    "תארו את השהייה החלומית שלכם בכמה מילים."
                  )}
                  className={cn("min-h-[100px] resize-none", cardInput)}
                  maxLength={1000} />
                
                </div>

                {/* First Name & Last Name */}
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
                    maxLength={100} />
                  
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
                    maxLength={100} />
                  
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className={fieldLabel}>
                    {getCopy("Phone", "טלפון")}
                  </label>
                  <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={getCopy("Your phone number (optional)", "מספר טלפון (אופציונלי)")}
                  className={cardInput}
                  maxLength={50} />
                
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
                  maxLength={255} />
                
                </div>

                {/* Submit */}
                <Button
                type="submit"
                disabled={submitting}
                variant="cta"
                className="w-full rounded-full py-6 text-sm font-semibold uppercase tracking-[0.12em]">
                
                  {submitting ?
                <Loader2 className="h-4 w-4 animate-spin" /> :

                getCopy("DESIGN MY STAY", "עצבו את השהייה שלכם")
                }
                </Button>

                {/* Legal microcopy */}
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
          }
        </DialogContent>
      </Dialog>
    </>);

};

export default TailoredRequestSection;