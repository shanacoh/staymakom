import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import OAuthButtons from "@/components/auth/OAuthButtons";
import OnboardingFlow from "@/components/auth/OnboardingFlow";

import heroImage from "@/assets/hero-road-desert.jpg";
import { Heart } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  displayName: z.string().optional(),
  tosAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms of service",
  }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, isPasswordRecovery } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    displayName: "",
    tosAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Don't redirect if onboarding is in progress or password recovery
    if (user && !showOnboarding && !newUserId && !isPasswordRecovery) {
      navigate("/account?tab=bookings");
    }
  }, [user, navigate, showOnboarding, newUserId, isPasswordRecovery]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
        navigate("/account?tab=bookings");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isLocked) {
      const remainingMin = Math.ceil((lockedUntil! - Date.now()) / 60000);
      toast.error(`Too many attempts. Try again in ${remainingMin} minute(s).`);
      return;
    }
    
    try {
      const validated = loginSchema.parse(loginData);
      setLoading(true);

      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCK_DURATION);
          setLoginAttempts(0);
          toast.error("Account temporarily locked. Try again in 5 minutes.");
        } else {
          toast.error("Invalid email or password");
        }
      } else {
        setLoginAttempts(0);
        setLockedUntil(null);
        toast.success("Welcome back!");
        navigate("/account?tab=bookings");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path) {
            fieldErrors[error.path[0]] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = signupSchema.parse(signupData);
      setLoading(true);

      const { error, data } = await signUp(
        validated.email,
        validated.password,
        validated.displayName
      );

      if (error) {
        if (error.message.includes("already registered")) {
          toast.success("If this email is registered, you will receive a confirmation. Please check your inbox.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.info("Please check your inbox for a confirmation email.");
        } else if (error.message.includes("User not found")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
      } else {
        // Signup successful → open onboarding IMMEDIATELY
        // Even if data.user.id is not available yet, we show onboarding
        const userId = data?.user?.id || null;
        setNewUserId(userId);
        setShowOnboarding(true);
        toast.success("Account created! Let's complete your profile.");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path) {
            fieldErrors[error.path[0]] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !z.string().email().safeParse(resetEmail).success) {
      toast.error("Please enter a valid email address");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setForgotPasswordMode(false);
        setResetEmail("");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Password recovery mode — show new password form
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Set New Password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat your password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={updatingPassword}>
              {updatingPassword ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen background */}
      <div
        className="min-h-screen relative flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/55" />

        {/* Back to Home */}
        <Link
          to="/"
          className="absolute top-5 left-5 z-10 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-xs font-semibold uppercase tracking-[0.1em]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        {/* Centered card */}
        <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="pt-8 pb-4 px-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ad1414]/10 mb-3">
              <Heart className="h-6 w-6 text-[#ad1414]" />
            </div>
            <h1 className="font-sans text-lg font-bold uppercase tracking-[-0.02em] text-foreground mb-1">
              Welcome to STAYMAKOM
            </h1>
            <p className="text-xs text-muted-foreground">Your journey begins here</p>
          </div>

          {/* Card body */}
          <div className="px-6 pb-6">
            {forgotPasswordMode ? (
              /* Forgot Password */
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 mx-auto bg-[#ad1414]/10 rounded-full flex items-center justify-center mb-3">
                    <Mail className="h-5 w-5 text-[#ad1414]" />
                  </div>
                  <h3 className="font-sans text-sm font-bold uppercase tracking-[-0.02em] text-foreground">Reset your password</h3>
                  <p className="text-xs text-muted-foreground">Enter your email and we'll send you a reset link</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="reset-email" className="text-xs font-semibold uppercase tracking-[0.10em]">Email</Label>
                    <Input id="reset-email" type="email" placeholder="your@email.com" value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)} disabled={resetLoading}
                      className="h-11 rounded-xl bg-muted/50 border-border/50 text-sm" />
                  </div>

                  <button type="submit" disabled={resetLoading}
                    className="w-full h-11 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50">
                    <span className="relative inline-flex items-center gap-2">
                      <span aria-hidden className="absolute inset-x-0 bottom-0.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40" />
                      {resetLoading && <Loader2 className="relative h-4 w-4 animate-spin" />}
                      <span className="relative text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Send Reset Link</span>
                    </span>
                  </button>

                  <button type="button" onClick={() => setForgotPasswordMode(false)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                    <ArrowLeft className="h-3 w-3" /> Back to Sign In
                  </button>
                </form>
              </div>
            ) : (
              /* Sign In / Sign Up Tabs */
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 p-1 bg-muted/60 rounded-full h-10">
                  <TabsTrigger value="login"
                    className="rounded-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup"
                    className="rounded-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-3 mt-0">
                  <OAuthButtons disabled={loading} />

                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-[0.10em]">Email</Label>
                      <Input id="login-email" type="email" placeholder="your@email.com"
                        value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        disabled={loading} className="h-11 rounded-xl bg-muted/50 border-border/50 text-sm" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-[0.10em]">Password</Label>
                      <div className="relative">
                        <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          disabled={loading} className="h-11 pr-10 rounded-xl bg-muted/50 border-border/50 text-sm" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={() => setForgotPasswordMode(true)}
                        className="text-xs text-[#ad1414] hover:opacity-80 transition-opacity">
                        Forgot password?
                      </button>
                    </div>

                    {/* Sign In — blob rouge calé sur le texte */}
                    <button type="submit" disabled={loading || isLocked}
                      className="w-full h-11 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50">
                      <span className="relative inline-flex items-center gap-2">
                        <span aria-hidden className="absolute inset-x-0 bottom-0.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40" />
                        {loading && <Loader2 className="relative h-4 w-4 animate-spin" />}
                        <span className="relative text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                          {isLocked ? "Locked..." : "Sign In"}
                        </span>
                      </span>
                    </button>

                    {isLocked && (
                      <p className="text-xs text-destructive text-center">
                        Too many attempts. Try again in {Math.ceil((lockedUntil! - Date.now()) / 60000)} minute(s).
                      </p>
                    )}
                  </form>

                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setActiveTab("signup")}
                      className="text-[#ad1414] font-medium hover:underline">
                      Sign up
                    </button>
                  </p>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup" className="space-y-3 mt-0">
                  <OAuthButtons disabled={loading} />

                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-[0.10em]">
                        Display Name <span className="text-muted-foreground normal-case">(Optional)</span>
                      </Label>
                      <Input id="signup-name" type="text" placeholder="John Doe"
                        value={signupData.displayName} onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                        disabled={loading} className="h-11 rounded-xl bg-muted/50 border-border/50 text-sm" />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-[0.10em]">Email</Label>
                      <Input id="signup-email" type="email" placeholder="your@email.com"
                        value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        disabled={loading} className="h-11 rounded-xl bg-muted/50 border-border/50 text-sm" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-[0.10em]">Password</Label>
                      <div className="relative">
                        <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          disabled={loading} className="h-11 pr-10 rounded-xl bg-muted/50 border-border/50 text-sm" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="tos" checked={signupData.tosAccepted}
                        onCheckedChange={(checked) => setSignupData({ ...signupData, tosAccepted: checked as boolean })}
                        disabled={loading} className="mt-0.5" />
                      <label htmlFor="tos" className="text-xs leading-relaxed text-muted-foreground">
                        I accept the{" "}
                        <Link to="/terms" className="text-[#ad1414] hover:underline">terms of service</Link>
                        {" "}and{" "}
                        <Link to="/privacy" className="text-[#ad1414] hover:underline">privacy policy</Link>
                      </label>
                    </div>
                    {errors.tosAccepted && <p className="text-xs text-destructive">{errors.tosAccepted}</p>}

                    {/* Create Account — pill sombre */}
                    <Button type="submit"
                      className="w-full rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest py-3 hover:bg-foreground/90 transition-colors"
                      disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>

                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setActiveTab("login")}
                      className="text-[#ad1414] font-medium hover:underline">
                      Sign in
                    </button>
                  </p>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Dialog */}
      {newUserId && (
        <OnboardingFlow
          open={showOnboarding}
          onComplete={() => {
            setShowOnboarding(false);
            navigate("/account?tab=bookings");
          }}
          userId={newUserId}
          lang="en"
        />
      )}
    </>
  );
};

export default Auth;
