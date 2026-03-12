import { useMemo, useState } from "react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, Loader2, Check, User, UserPlus } from "lucide-react";
import OAuthButtons from "./OAuthButtons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Lang = "en" | "fr" | "he";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Lang;
  defaultTab?: "login" | "signup";
  onSignupSuccess?: (userId: string) => void;
  context?: "favorites" | "account" | "signup";
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().optional(),
  email: z.string().email(),
  country: z.string().min(1, "Required"),
  password: z.string().min(6),
  interests: z.array(z.string()).optional(),
});

const COUNTRIES = [
  { value: "IL", label: { en: "Israel", fr: "Israël", he: "ישראל" } },
  { value: "FR", label: { en: "France", fr: "France", he: "צרפת" } },
  { value: "US", label: { en: "United States", fr: "États-Unis", he: "ארה״ב" } },
  { value: "GB", label: { en: "United Kingdom", fr: "Royaume-Uni", he: "בריטניה" } },
  { value: "DE", label: { en: "Germany", fr: "Allemagne", he: "גרמניה" } },
  { value: "IT", label: { en: "Italy", fr: "Italie", he: "איטליה" } },
  { value: "ES", label: { en: "Spain", fr: "Espagne", he: "ספרד" } },
  { value: "CA", label: { en: "Canada", fr: "Canada", he: "קנדה" } },
  { value: "AU", label: { en: "Australia", fr: "Australie", he: "אוסטרליה" } },
  { value: "OTHER", label: { en: "Other", fr: "Autre", he: "אחר" } },
];

const INTERESTS = [
  { id: "romantic", label: { en: "Romantic Escape", fr: "Escapade Romantique", he: "בריחה רומנטית" } },
  { id: "nature", label: { en: "Nature & Outdoor", fr: "Nature & Plein Air", he: "טבע ושטח" } },
  { id: "gastronomy", label: { en: "Foody Discovery", fr: "Découverte Culinaire", he: "גילוי קולינרי" } },
  { id: "wellness", label: { en: "Mindful Reset", fr: "Reset Bien-être", he: "איפוס מודע" } },
  { id: "family", label: { en: "Family Fun", fr: "Fun en Famille", he: "כיף משפחתי" } },
  { id: "golden", label: { en: "Golden Age", fr: "Âge d'Or", he: "גיל הזהב" } },
  { id: "active", label: { en: "Active Adventure", fr: "Aventure Active", he: "הרפתקה פעילה" } },
  { id: "work", label: { en: "Work Unplugged", fr: "Travail Déconnecté", he: "עבודה מנותקת" } },
];

const REFERRAL_SOURCES = [
  { id: "instagram", label: { en: "Instagram", fr: "Instagram", he: "אינסטגרם" } },
  { id: "tiktok", label: { en: "TikTok", fr: "TikTok", he: "טיקטוק" } },
  { id: "facebook", label: { en: "Facebook Ads", fr: "Publicité Facebook", he: "פרסומת פייסבוק" } },
  { id: "google", label: { en: "Google", fr: "Google", he: "גוגל" } },
  { id: "friend", label: { en: "Friend/Family", fr: "Ami/Famille", he: "חבר/משפחה" } },
  { id: "press", label: { en: "Press/Blog", fr: "Presse/Blog", he: "עיתונות/בלוג" } },
  { id: "other", label: { en: "Other", fr: "Autre", he: "אחר" } },
];

function copyFor(lang: Lang) {
  switch (lang) {
    case "fr":
      return {
        headers: {
          favorites: {
            title: "Sauvegarder dans vos favoris",
            subtitle: "Connectez-vous pour sauvegarder vos expériences préférées.",
          },
          account: {
            title: "Bon retour",
            subtitle: "Connectez-vous pour accéder à votre compte.",
          },
          signup: {
            title: "Rejoignez Staymakom",
            subtitle: "Créez un compte pour accéder à des expériences exclusives.",
          },
        },
        tabs: { login: "Connexion", signup: "Inscription" },
        fields: {
          firstName: "Prénom",
          lastName: "Nom",
          phone: "Téléphone (optionnel)",
          email: "Email",
          country: "Nationalité",
          password: "Mot de passe",
          interests: "Qu'est-ce qui vous intéresse ?",
          referralSource: "Comment nous avez-vous connu ?",
        },
        actions: { login: "Continuer", signup: "Créer mon compte" },
        toasts: {
          okLogin: "Connecté !",
          okSignup: "Compte créé !",
          invalid: "Vérifiez vos informations.",
        },
        legal: {
          prefix: "En continuant, j'accepte les",
          terms: "Conditions d'utilisation",
          and: "et reconnais la",
          privacy: "Politique de confidentialité",
        },
        toggle: {
          noAccount: "Pas encore de compte ?",
          hasAccount: "Déjà un compte ?",
          signUp: "S'inscrire",
          signIn: "Se connecter",
        },
      };
    case "he":
      return {
        headers: {
          favorites: {
            title: "שמרו לרשימת המועדפים",
            subtitle: "התחברו לשמור חוויות שאהבתם.",
          },
          account: {
            title: "ברוכים השבים",
            subtitle: "התחברו לגשת לחשבון שלכם.",
          },
          signup: {
            title: "הצטרפו ל-Staymakom",
            subtitle: "צרו חשבון לגישה לחוויות בלעדיות.",
          },
        },
        tabs: { login: "התחברות", signup: "הרשמה" },
        fields: {
          firstName: "שם פרטי",
          lastName: "שם משפחה",
          phone: "טלפון (אופציונלי)",
          email: "אימייל",
          country: "לאום",
          password: "סיסמה",
          interests: "מה מעניין אותך?",
          referralSource: "איך שמעת עלינו?",
        },
        actions: { login: "המשך", signup: "צור חשבון" },
        toasts: {
          okLogin: "התחברת!",
          okSignup: "החשבון נוצר!",
          invalid: "בדקו את הפרטים.",
        },
        legal: {
          prefix: "בהמשך, אני מקבל/ת את",
          terms: "תנאי השימוש",
          and: "ומאשר/ת את",
          privacy: "מדיניות הפרטיות",
        },
        toggle: {
          noAccount: "אין לך חשבון?",
          hasAccount: "כבר יש לך חשבון?",
          signUp: "הרשמה",
          signIn: "התחברות",
        },
      };
    default:
      return {
        headers: {
          favorites: {
            title: "Save to your wishlist",
            subtitle: "Sign in to save experiences you love.",
          },
          account: {
            title: "Welcome back",
            subtitle: "Sign in to access your account.",
          },
          signup: {
            title: "Join Staymakom",
            subtitle: "Create an account to unlock exclusive experiences.",
          },
        },
        tabs: { login: "Sign In", signup: "Sign Up" },
        fields: {
          firstName: "First Name",
          lastName: "Last Name",
          phone: "Phone (optional)",
          email: "Email",
          country: "Nationality",
          password: "Password",
          interests: "What interests you?",
          referralSource: "How did you hear about us?",
        },
        actions: { login: "Continue", signup: "Create my account" },
        toasts: {
          okLogin: "Signed in!",
          okSignup: "Account created!",
          invalid: "Please check your details.",
        },
        legal: {
          prefix: "By continuing, I accept the",
          terms: "Terms of Use",
          and: "and acknowledge the",
          privacy: "Privacy Policy",
        },
        toggle: {
          noAccount: "No account yet?",
          hasAccount: "Already have an account?",
          signUp: "Sign up",
          signIn: "Sign in",
        },
      };
  }
}

export default function AuthPromptDialog({
  open,
  onOpenChange,
  lang,
  defaultTab = "login",
  onSignupSuccess,
  context,
}: Props) {
  const c = useMemo(() => copyFor(lang), [lang]);
  const { signIn, signUp } = useAuth();
  const isRTL = lang === "he";

  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    country: "",
    password: "",
    interests: [] as string[],
    referralSource: "",
  });

  const toggleInterest = (id: string) => {
    setSignupData((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(loginData);
    if (!parsed.success) {
      toast.error(c.toasts.invalid);
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(parsed.data.email, parsed.data.password);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(c.toasts.okLogin);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(signupData);
    if (!parsed.success) {
      toast.error(c.toasts.invalid);
      return;
    }

    setLoading(true);
    try {
      const displayName = `${parsed.data.firstName} ${parsed.data.lastName}`;
      const { error, data } = await signUp(
        parsed.data.email,
        parsed.data.password,
        displayName
      );
      if (error) {
        toast.error(error.message);
        return;
      }

      const userId = data?.user?.id;
      if (userId) {
        // Update user_profiles with additional data
        await supabase.from("user_profiles").update({
          display_name: displayName,
          phone: parsed.data.phone || null,
          interests: parsed.data.interests,
          referral_source: signupData.referralSource || null,
        }).eq("user_id", userId);

        // Create customer record
        await supabase.from("customers").upsert({
          user_id: userId,
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          phone: parsed.data.phone || null,
          address_country: parsed.data.country,
        }, { onConflict: "user_id" });
      }

      toast.success(c.toasts.okSignup);
      onOpenChange(false);
      if (onSignupSuccess && userId) {
        onSignupSuccess(userId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl max-h-[min(90vh,700px)] flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header - compact */}
        {(() => {
          // Determine header content based on context and current tab
          const headerKey = context === "favorites" ? "favorites" : tab === "signup" ? "signup" : "account";
          const header = c.headers[headerKey];
          const HeaderIcon = context === "favorites" ? Heart : tab === "signup" ? UserPlus : User;
          
          return (
            <div className="pt-5 pb-3 px-5 text-center bg-gradient-to-b from-muted/50 to-transparent shrink-0">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                <HeaderIcon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-serif text-xl text-foreground">{header.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{header.subtitle}</p>
            </div>
          );
        })()}

        {/* Scrollable content */}
        <div className="px-5 pb-5 overflow-y-auto flex-1">
          {/* Tabs */}
          <div className="flex p-1 bg-muted/60 rounded-full mb-4">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${
                tab === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.tabs.login}
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${
                tab === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.tabs.signup}
            </button>
          </div>

          {/* OAuth */}
          <OAuthButtons lang={lang} disabled={loading} />

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3 animate-fade-in">
              <div className="space-y-1">
                <Label htmlFor="login-email" className="text-xs font-medium">
                  {c.fields.email}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData((p) => ({ ...p, email: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="login-password" className="text-xs font-medium">
                  {c.fields.password}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData((p) => ({ ...p, password: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm"
                />
              </div>
              <Button type="submit" variant="cta" className="w-full h-10 text-sm mt-2" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {c.actions.login}
              </Button>
              
              {/* Toggle to signup */}
              <p className="text-xs text-muted-foreground text-center pt-3">
                {c.toggle.noAccount}{" "}
                <button 
                  type="button" 
                  onClick={() => setTab("signup")} 
                  className="text-foreground font-medium underline hover:no-underline"
                >
                  {c.toggle.signUp}
                </button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3 animate-fade-in">
              {/* Row 1: First + Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-firstname" className="text-xs font-medium">
                    {c.fields.firstName} *
                  </Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData((p) => ({ ...p, firstName: e.target.value }))}
                    disabled={loading}
                    className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-lastname" className="text-xs font-medium">
                    {c.fields.lastName} *
                  </Label>
                  <Input
                    id="signup-lastname"
                    type="text"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData((p) => ({ ...p, lastName: e.target.value }))}
                    disabled={loading}
                    className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Phone + Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-phone" className="text-xs font-medium">
                    {c.fields.phone}
                  </Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => setSignupData((p) => ({ ...p, phone: e.target.value }))}
                    disabled={loading}
                    className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-country" className="text-xs font-medium">
                    {c.fields.country} *
                  </Label>
                  <Select
                    value={signupData.country}
                    onValueChange={(v) => setSignupData((p) => ({ ...p, country: v }))}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label[lang]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs font-medium">
                  {c.fields.email} *
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData((p) => ({ ...p, email: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="signup-password" className="text-xs font-medium">
                  {c.fields.password} *
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData((p) => ({ ...p, password: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-lg bg-muted/50 border-border/50 text-sm"
                />
              </div>

              {/* Interests */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-medium">{c.fields.interests}</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => {
                    const selected = signupData.interests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        disabled={loading}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-foreground border-border/50 hover:bg-muted"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {interest.label[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Referral Source */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-medium">{c.fields.referralSource}</Label>
                <div className="flex flex-wrap gap-2">
                  {REFERRAL_SOURCES.map((source) => {
                    const selected = signupData.referralSource === source.id;
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => setSignupData((p) => ({ ...p, referralSource: source.id }))}
                        disabled={loading}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-foreground border-border/50 hover:bg-muted"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {source.label[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legal acceptance text */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed pt-3">
                {c.legal.prefix}{" "}
                <Link to="/terms" className="text-primary hover:underline">{c.legal.terms}</Link>
                {" "}{c.legal.and}{" "}
                <Link to="/privacy" className="text-primary hover:underline">{c.legal.privacy}</Link>.
              </p>

              <Button type="submit" variant="cta" className="w-full h-10 text-sm mt-3" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {c.actions.signup}
              </Button>
              
              {/* Toggle to login */}
              <p className="text-xs text-muted-foreground text-center pt-3">
                {c.toggle.hasAccount}{" "}
                <button 
                  type="button" 
                  onClick={() => setTab("login")} 
                  className="text-foreground font-medium underline hover:no-underline"
                >
                  {c.toggle.signIn}
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
