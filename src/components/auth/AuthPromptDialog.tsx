import { useMemo, useState } from "react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { uiRecord, pageLocale, uiGroup } from "@/lib/translations";

type Lang = "en" | "fr" | "he";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Lang;
  defaultTab?: "login" | "signup";
  onSignupSuccess?: (userId: string) => void;
  context?: "favorites" | "account" | "signup";
};

type Tab = "login" | "signup" | "forgot";

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

/** Messages d'erreur précis par champ, pour remplacer le message générique
 *  "Vérifiez vos informations" qui n'explique pas d'où vient le problème. */
const FIELD_ERROR_MESSAGES: Record<string, Record<Lang, string>> = {
  firstName: uiRecord("authPromptDialogPleaseEnterYourFirstName"),
  lastName: uiRecord("authPromptDialogPleaseEnterYourLastName"),
  email: uiRecord("authPromptDialogThisEmailAddressIsnT"),
  country: uiRecord("authPromptDialogPleaseSelectYourNationality"),
  password: uiRecord("authPromptDialogYourPasswordMustBeAt"),
};

function getSignupErrorMessage(errors: z.ZodIssue[], lang: Lang, fallback: string): string {
  const firstField = errors[0]?.path[0] as string | undefined;
  return (firstField && FIELD_ERROR_MESSAGES[firstField]?.[pageLocale()]) || fallback;
}

const COUNTRIES = [
  { value: "IL", label: uiRecord("authPromptDialogIsrael") },
  { value: "FR", label: uiRecord("authPromptDialogFrance") },
  { value: "US", label: uiRecord("authPromptDialogUnitedStates") },
  { value: "GB", label: uiRecord("authPromptDialogUnitedKingdom") },
  { value: "DE", label: uiRecord("authPromptDialogGermany") },
  { value: "IT", label: uiRecord("authPromptDialogItaly") },
  { value: "ES", label: uiRecord("authPromptDialogSpain") },
  { value: "CA", label: uiRecord("authPromptDialogCanada") },
  { value: "AU", label: uiRecord("authPromptDialogAustralia") },
  { value: "OTHER", label: uiRecord("authPromptDialogOther") },
];

const INTERESTS = [
  { id: "romantic", label: uiRecord("authPromptDialogRomanticEscape") },
  { id: "nature", label: uiRecord("authPromptDialogNatureOutdoor") },
  { id: "gastronomy", label: uiRecord("authPromptDialogFoodyDiscovery") },
  { id: "wellness", label: uiRecord("authPromptDialogMindfulReset") },
  { id: "family", label: uiRecord("authPromptDialogFamilyFun") },
  { id: "golden", label: uiRecord("authPromptDialogGoldenAge") },
  { id: "active", label: uiRecord("authPromptDialogActiveAdventure") },
  { id: "work", label: uiRecord("authPromptDialogWorkUnplugged") },
];

const REFERRAL_SOURCES = [
  { id: "instagram", label: uiRecord("authPromptDialogInstagram") },
  { id: "tiktok", label: uiRecord("authPromptDialogTiktok") },
  { id: "facebook", label: uiRecord("authPromptDialogFacebookAds") },
  { id: "google", label: uiRecord("authPromptDialogGoogle") },
  { id: "friend", label: uiRecord("authPromptDialogFriendFamily") },
  { id: "press", label: uiRecord("authPromptDialogPressBlog") },
  { id: "other", label: uiRecord("authPromptDialogOther") },
];

// Textes : clés « authPromptDialog__… » de src/lib/translations.ts (et src/lib/uiTranslations/).
function copyFor() {
  return uiGroup("authPromptDialog");
}

export default function AuthPromptDialog({
  open,
  onOpenChange,
  lang,
  defaultTab = "login",
  onSignupSuccess,
  context,
}: Props) {
  const c = useMemo(() => copyFor(), [lang]);
  const { signIn, signUp } = useAuth();
  const isRTL = lang === "he";

  const [tab, setTab] = useState<Tab>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
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
    marketingOptIn: true,
  });

  const toggleInterest = (id: string) => {
    setSignupData((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error(c.toasts.invalid);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(c.toasts.resetSent);
      setTab("login");
    } finally {
      setLoading(false);
    }
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
      toast.error(getSignupErrorMessage(parsed.error.issues, lang, c.toasts.invalid));
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
          marketing_opt_in: signupData.marketingOptIn,
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
          const headerKey = context === "favorites" && tab !== "forgot" ? "favorites" : tab === "signup" ? "signup" : "account";
          const header = tab === "forgot"
            ? { title: c.forgot.title, subtitle: "" }
            : c.headers[headerKey];
          const HeaderIcon = Heart;

          return (
            <div className="pt-5 pb-3 px-5 text-center shrink-0">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ad1414]/10 mb-2">
                <HeaderIcon className="h-5 w-5 text-[#ad1414]" />
              </div>
              <DialogTitle asChild>
                <h2 className="font-sans text-lg font-bold uppercase tracking-[-0.02em] text-foreground">{header.title}</h2>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">{header.subtitle}</p>
            </div>
          );
        })()}

        {/* Scrollable content */}
        <div className="px-5 pb-5 overflow-y-auto flex-1">
          {/* Tabs */}
          <div className={`flex p-1 bg-muted/60 rounded-full mb-4 ${tab === "forgot" ? "hidden" : ""}`}>
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
          {tab !== "forgot" && <OAuthButtons lang={lang} disabled={loading} />}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3 animate-fade-in">
              <div className="space-y-1">
                <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-[0.10em]">
                  {c.fields.email}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData((p) => ({ ...p, email: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-[0.10em]">
                  {c.fields.password}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData((p) => ({ ...p, password: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setResetEmail(loginData.email); setTab("forgot"); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {c.forgot.link}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <span className="relative inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40"
                  />
                  {loading && <Loader2 className="relative h-4 w-4 animate-spin" />}
                  <span className="relative text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                    {c.actions.login}
                  </span>
                </span>
              </button>

              {/* Toggle to signup */}
              <p className="text-xs text-muted-foreground text-center pt-3">
                {c.toggle.noAccount}{" "}
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="text-[#ad1414] font-medium hover:underline"
                >
                  {c.toggle.signUp}
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {tab === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-3 animate-fade-in">
              <p className="text-xs text-muted-foreground text-center">{c.forgot.subtitle}</p>
              <div className="space-y-1">
                <Label htmlFor="reset-email" className="text-xs font-semibold uppercase tracking-[0.10em]">
                  {c.fields.email}
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={loading}
                  className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <span className="relative inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40"
                  />
                  {loading && <Loader2 className="relative h-4 w-4 animate-spin" />}
                  <span className="relative text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                    {c.actions.sendReset}
                  </span>
                </span>
              </button>
              <p className="text-xs text-muted-foreground text-center pt-1">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-[#ad1414] font-medium hover:underline"
                >
                  {c.forgot.back}
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
                  <Label htmlFor="signup-firstname" className="text-xs font-semibold uppercase tracking-[0.10em]">
                    {c.fields.firstName} *
                  </Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData((p) => ({ ...p, firstName: e.target.value }))}
                    disabled={loading}
                    className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-lastname" className="text-xs font-semibold uppercase tracking-[0.10em]">
                    {c.fields.lastName} *
                  </Label>
                  <Input
                    id="signup-lastname"
                    type="text"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData((p) => ({ ...p, lastName: e.target.value }))}
                    disabled={loading}
                    className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Phone + Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-phone" className="text-xs font-semibold uppercase tracking-[0.10em]">
                    {c.fields.phone}
                  </Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => setSignupData((p) => ({ ...p, phone: e.target.value }))}
                    disabled={loading}
                    className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-country" className="text-xs font-semibold uppercase tracking-[0.10em]">
                    {c.fields.country} *
                  </Label>
                  <Select
                    value={signupData.country}
                    onValueChange={(v) => setSignupData((p) => ({ ...p, country: v }))}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label[pageLocale()]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-[0.10em]">
                  {c.fields.email} *
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData((p) => ({ ...p, email: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-[0.10em]">
                  {c.fields.password} *
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData((p) => ({ ...p, password: e.target.value }))}
                  disabled={loading}
                  className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
                />
              </div>

              {/* Interests */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.10em]">{c.fields.interests}</Label>
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
                            ? "bg-[#ad1414] text-white border-[#ad1414]"
                            : "bg-muted/50 text-foreground border-border/50 hover:bg-muted"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {interest.label[pageLocale()]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Referral Source */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.10em]">{c.fields.referralSource}</Label>
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
                            ? "bg-[#ad1414] text-white border-[#ad1414]"
                            : "bg-muted/50 text-foreground border-border/50 hover:bg-muted"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {source.label[pageLocale()]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Marketing consent - pre-checked */}
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="signup-marketing"
                  checked={signupData.marketingOptIn}
                  onCheckedChange={(checked) =>
                    setSignupData((p) => ({ ...p, marketingOptIn: checked === true }))
                  }
                  disabled={loading}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="signup-marketing"
                  className="text-xs text-muted-foreground leading-relaxed font-normal cursor-pointer"
                >
                  {c.marketing}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest py-2.5 mt-3 hover:bg-foreground/90 transition-colors"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {c.actions.signup}
              </Button>

              {/* Legal acceptance text */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed pt-1">
                {c.legal.prefix}{" "}
                <Link to="/terms" className="text-[#ad1414] hover:underline">{c.legal.terms}</Link>
                {" "}{c.legal.and}{" "}
                <Link to="/privacy" className="text-[#ad1414] hover:underline">{c.legal.privacy}</Link>.
              </p>

              {/* Toggle to login */}
              <p className="text-xs text-muted-foreground text-center pt-3">
                {c.toggle.hasAccount}{" "}
                <button 
                  type="button" 
                  onClick={() => setTab("login")} 
                  className="text-[#ad1414] font-medium hover:underline"
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
