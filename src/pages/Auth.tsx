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

import heroImage from "@/assets/desert-hotel-pool.jpg";

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
  const { user, signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
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
    // Don't redirect if onboarding is in progress
    if (user && !showOnboarding && !newUserId) {
      navigate("/account?tab=bookings");
    }
  }, [user, navigate, showOnboarding, newUserId]);

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

  return (
    <>
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Hero Section - Left Side */}
        <div className="relative w-full lg:w-1/2 h-[30vh] sm:h-[35vh] lg:h-screen">
          <img
            src={heroImage}
            alt="Luxury desert retreat"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        
        {/* Back to Home - Mobile/Tablet */}
        <Link 
          to="/" 
          className="absolute top-4 left-4 lg:top-8 lg:left-8 flex items-center gap-2 text-white/90 hover:text-white transition-colors z-10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Hero Content */}
        <div className="absolute bottom-8 left-4 right-4 lg:bottom-16 lg:left-12 lg:right-12 text-white">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-wide mb-2 lg:mb-4">
            STAYMAKOM
          </h1>
          <p className="text-white/80 text-sm sm:text-base lg:text-lg max-w-md">
            Experience extraordinary stays in handpicked destinations
          </p>
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo for desktop */}
          <div className="hidden lg:block text-center mb-8">
            <h2 className="font-display text-2xl tracking-widest text-foreground">STAYMAKOM</h2>
            <p className="text-muted-foreground text-sm mt-1">Your journey begins here</p>
          </div>

          {forgotPasswordMode ? (
            /* Forgot Password Form */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Reset your password</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={resetLoading}
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button type="submit" variant="cta" className="w-full h-12" disabled={resetLoading}>
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setForgotPasswordMode(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </form>
            </div>
          ) : (
            /* Login/Signup Tabs */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/60 rounded-full h-12">
                <TabsTrigger 
                  value="login" 
                  className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-0">
                {/* OAuth Buttons */}
                <OAuthButtons disabled={loading} />

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      disabled={loading}
                      className="h-12 rounded-xl"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        disabled={loading}
                        className="h-12 pr-10 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordMode(true)}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" variant="cta" className="w-full h-12" disabled={loading || isLocked}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLocked ? 'Locked...' : 'Sign In'}
                  </Button>

                  {isLocked && (
                    <p className="text-sm text-destructive text-center">
                      Too many attempts. Try again in {Math.ceil((lockedUntil! - Date.now()) / 60000)} minute(s).
                    </p>
                  )}
                </form>

                <p className="text-center text-sm text-muted-foreground pt-4">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4 mt-0">
                {/* OAuth Buttons */}
                <OAuthButtons disabled={loading} />

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name <span className="text-muted-foreground">(Optional)</span></Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupData.displayName}
                      onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                      disabled={loading}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      disabled={loading}
                      className="h-12 rounded-xl"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        disabled={loading}
                        className="h-12 pr-10 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="tos"
                      checked={signupData.tosAccepted}
                      onCheckedChange={(checked) =>
                        setSignupData({ ...signupData, tosAccepted: checked as boolean })
                      }
                      disabled={loading}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="tos"
                      className="text-sm leading-relaxed text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the{" "}
                      <Link to="/terms" className="text-primary hover:underline">terms of service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">privacy policy</Link>
                    </label>
                  </div>
                  {errors.tosAccepted && (
                    <p className="text-sm text-destructive">{errors.tosAccepted}</p>
                  )}

                  <Button type="submit" variant="cta" className="w-full h-12" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground pt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
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
