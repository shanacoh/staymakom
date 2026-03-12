import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "en" | "fr" | "he";

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
  lang?: Lang;
}

const INTEREST_CATEGORIES = [
  { id: "romantic", labelEn: "Romantic", labelFr: "Romantique", labelHe: "רומנטי", icon: "💕" },
  { id: "nature", labelEn: "Nature & Adventure", labelFr: "Nature & Aventure", labelHe: "טבע והרפתקאות", icon: "🏔️" },
  { id: "gastronomy", labelEn: "Gastronomy", labelFr: "Gastronomie", labelHe: "גסטרונומיה", icon: "🍷" },
  { id: "wellness", labelEn: "Wellness & Spa", labelFr: "Bien-être & Spa", labelHe: "ספא ורווחה", icon: "🧘" },
  { id: "family", labelEn: "Family", labelFr: "Famille", labelHe: "משפחה", icon: "👨‍👩‍👧‍👦" },
  { id: "golden_age", labelEn: "Golden Age", labelFr: "Âge d'Or", labelHe: "גיל הזהב", icon: "✨" },
];

const REFERRAL_SOURCES = [
  { id: "instagram", labelEn: "Instagram", labelFr: "Instagram", labelHe: "אינסטגרם", icon: "📸" },
  { id: "tiktok", labelEn: "TikTok", labelFr: "TikTok", labelHe: "טיקטוק", icon: "🎵" },
  { id: "ads", labelEn: "Online Ads", labelFr: "Publicité en ligne", labelHe: "פרסום אונליין", icon: "📢" },
  { id: "friend", labelEn: "Friend's Recommendation", labelFr: "Recommandation d'un ami", labelHe: "המלצת חבר", icon: "💬" },
  { id: "blog", labelEn: "Blog / Article", labelFr: "Blog / Article", labelHe: "בלוג / כתבה", icon: "📰" },
  { id: "other", labelEn: "Other", labelFr: "Autre", labelHe: "אחר", icon: "🌐" },
];

const COUNTRIES = [
  { code: "IL", labelEn: "Israel", labelFr: "Israël", labelHe: "ישראל" },
  { code: "FR", labelEn: "France", labelFr: "France", labelHe: "צרפת" },
  { code: "US", labelEn: "United States", labelFr: "États-Unis", labelHe: "ארה״ב" },
  { code: "GB", labelEn: "United Kingdom", labelFr: "Royaume-Uni", labelHe: "בריטניה" },
  { code: "CA", labelEn: "Canada", labelFr: "Canada", labelHe: "קנדה" },
  { code: "DE", labelEn: "Germany", labelFr: "Allemagne", labelHe: "גרמניה" },
  { code: "BE", labelEn: "Belgium", labelFr: "Belgique", labelHe: "בלגיה" },
  { code: "CH", labelEn: "Switzerland", labelFr: "Suisse", labelHe: "שווייץ" },
  { code: "IT", labelEn: "Italy", labelFr: "Italie", labelHe: "איטליה" },
  { code: "ES", labelEn: "Spain", labelFr: "Espagne", labelHe: "ספרד" },
  { code: "NL", labelEn: "Netherlands", labelFr: "Pays-Bas", labelHe: "הולנד" },
  { code: "AU", labelEn: "Australia", labelFr: "Australie", labelHe: "אוסטרליה" },
  { code: "BR", labelEn: "Brazil", labelFr: "Brésil", labelHe: "ברזיל" },
  { code: "AR", labelEn: "Argentina", labelFr: "Argentine", labelHe: "ארגנטינה" },
  { code: "MX", labelEn: "Mexico", labelFr: "Mexique", labelHe: "מקסיקו" },
  { code: "ZA", labelEn: "South Africa", labelFr: "Afrique du Sud", labelHe: "דרום אפריקה" },
  { code: "OTHER", labelEn: "Other", labelFr: "Autre", labelHe: "אחר" },
];

function getCopy(lang: Lang) {
  switch (lang) {
    case "fr":
      return {
        step1Title: "Bienvenue chez STAYMAKOM",
        step1Subtitle: "Parlez-nous un peu de vous",
        firstName: "Prénom",
        lastName: "Nom",
        phone: "Téléphone (optionnel)",
        nationality: "Nationalité",
        selectCountry: "Sélectionnez votre pays",
        birthdate: "Date de naissance (optionnel)",
        step2Title: "Quels types d'expériences vous intéressent ?",
        step2Subtitle: "Sélectionnez tout ce qui vous correspond (optionnel)",
        step3Title: "Comment nous avez-vous connu ?",
        step3Subtitle: "Cela nous aide à mieux vous servir (optionnel)",
        specifyOther: "Précisez...",
        next: "Suivant",
        back: "Retour",
        finish: "Commencer l'aventure",
        skip: "Passer",
      };
    case "he":
      return {
        step1Title: "ברוכים הבאים ל-STAYMAKOM",
        step1Subtitle: "ספרו לנו קצת על עצמכם",
        firstName: "שם פרטי",
        lastName: "שם משפחה",
        phone: "טלפון (אופציונלי)",
        nationality: "לאום",
        selectCountry: "בחרו את המדינה שלכם",
        birthdate: "תאריך לידה (אופציונלי)",
        step2Title: "אילו סוגי חוויות מעניינים אתכם?",
        step2Subtitle: "בחרו את כל מה שמתאים לכם (אופציונלי)",
        step3Title: "איך שמעתם עלינו?",
        step3Subtitle: "זה עוזר לנו לשרת אתכם טוב יותר (אופציונלי)",
        specifyOther: "פרטו...",
        next: "הבא",
        back: "חזרה",
        finish: "להתחיל את ההרפתקה",
        skip: "לדלג",
      };
    default:
      return {
        step1Title: "Welcome to STAYMAKOM",
        step1Subtitle: "Tell us a bit about yourself",
        firstName: "First Name",
        lastName: "Last Name",
        phone: "Phone (optional)",
        nationality: "Nationality",
        selectCountry: "Select your country",
        birthdate: "Date of birth (optional)",
        step2Title: "What types of experiences interest you?",
        step2Subtitle: "Select all that apply (optional)",
        step3Title: "How did you hear about us?",
        step3Subtitle: "This helps us serve you better (optional)",
        specifyOther: "Please specify...",
        next: "Next",
        back: "Back",
        finish: "Start the adventure",
        skip: "Skip",
      };
  }
}

export default function OnboardingFlow({ open, onComplete, userId, lang = "en" }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const copy = getCopy(lang);
  const isRTL = lang === "he";

  // Form data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<string>("");
  const [otherReferralText, setOtherReferralText] = useState("");

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Compute final referral source
      const finalReferral = selectedReferral === "other" && otherReferralText.trim()
        ? `other: ${otherReferralText.trim()}`
        : selectedReferral || null;

      // Update user_profiles
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          display_name: `${firstName} ${lastName}`.trim() || null,
          phone: phone || null,
          interests: selectedInterests.length > 0 ? selectedInterests : null,
          referral_source: finalReferral,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      // Update customers table
      const { error: customerError } = await supabase
        .from("customers")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          address_country: country || null,
          birthdate: birthdate || null,
        })
        .eq("user_id", userId);

      if (customerError) throw customerError;

      toast.success(lang === "fr" ? "Profil mis à jour !" : lang === "he" ? "הפרופיל עודכן!" : "Profile updated!");
      onComplete();
    } catch (error: any) {
      
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const getInterestLabel = (interest: typeof INTEREST_CATEGORIES[0]) => {
    if (lang === "fr") return interest.labelFr;
    if (lang === "he") return interest.labelHe;
    return interest.labelEn;
  };

  const getReferralLabel = (source: typeof REFERRAL_SOURCES[0]) => {
    if (lang === "fr") return source.labelFr;
    if (lang === "he") return source.labelHe;
    return source.labelEn;
  };

  const getCountryLabel = (c: typeof COUNTRIES[0]) => {
    if (lang === "fr") return c.labelFr;
    if (lang === "he") return c.labelHe;
    return c.labelEn;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg rounded-2xl p-0 overflow-hidden border-0 shadow-2xl"
        dir={isRTL ? "rtl" : "ltr"}
        hideCloseButton
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-serif text-2xl text-foreground mb-2">{copy.step1Title}</h2>
                <p className="text-muted-foreground">{copy.step1Subtitle}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{copy.firstName} *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{copy.lastName} *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Nationality - Required */}
                <div className="space-y-2">
                  <Label>{copy.nationality} *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder={copy.selectCountry} />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {getCountryLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date of birth - Optional */}
                <div className="space-y-2">
                  <Label htmlFor="birthdate">{copy.birthdate}</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{copy.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    onComplete();
                  }}
                >
                  {copy.skip}
                </Button>
                <Button
                  variant="cta"
                  className="flex-1 gap-2"
                  onClick={() => setStep(2)}
                  disabled={!firstName.trim() || !lastName.trim() || !country}
                >
                  {copy.next}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-foreground mb-2">{copy.step2Title}</h2>
                <p className="text-muted-foreground">{copy.step2Subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {INTEREST_CATEGORIES.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                      selectedInterests.includes(interest.id)
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/50 hover:border-border hover:bg-muted/50"
                    )}
                  >
                    {selectedInterests.includes(interest.id) && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-2xl mb-2">{interest.icon}</span>
                    <span className="text-sm font-medium text-center">{getInterestLabel(interest)}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4" />
                  {copy.back}
                </Button>
                <Button variant="cta" className="flex-1 gap-2" onClick={() => setStep(3)}>
                  {copy.next}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Referral Source */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-foreground mb-2">{copy.step3Title}</h2>
                <p className="text-muted-foreground">{copy.step3Subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {REFERRAL_SOURCES.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setSelectedReferral(source.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                      selectedReferral === source.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/50 hover:border-border hover:bg-muted/50"
                    )}
                  >
                    {selectedReferral === source.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-2xl mb-2">{source.icon}</span>
                    <span className="text-sm font-medium text-center">{getReferralLabel(source)}</span>
                  </button>
                ))}
              </div>

              {/* Text input for "Other" */}
              {selectedReferral === "other" && (
                <div className="animate-fade-in">
                  <Input
                    placeholder={copy.specifyOther}
                    value={otherReferralText}
                    onChange={(e) => setOtherReferralText(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(2)}>
                  <ChevronLeft className="h-4 w-4" />
                  {copy.back}
                </Button>
                <Button variant="cta" className="flex-1 gap-2" onClick={handleSubmit} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {copy.finish}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
