import { useSearchParams, useNavigate } from "react-router-dom";
import { Heart, CalendarDays, User } from "lucide-react";
import { Button } from "@/components/ui/button";


const contextConfig = {
  wishlist: {
    title: "Saved",
    message: "Log in to access your saved stays",
    icon: Heart,
  },
  bookings: {
    title: "Your Bookings",
    message: "Log in to access your bookings",
    icon: CalendarDays,
  },
  account: {
    title: "My Account",
    message: "Log in to access your account",
    icon: User,
  },
} as const;

type ContextKey = keyof typeof contextConfig;

const MobileAuthPrompt = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const context = (searchParams.get("context") as ContextKey) || "account";
  const config = contextConfig[context] || contextConfig.account;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <Icon size={40} strokeWidth={1.3} className="text-primary mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2 text-center">
          {config.title}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {config.message}
        </p>
        <Button
          variant="outline"
          className="rounded-full px-8 border-primary text-primary hover:bg-primary/5"
          onClick={() => navigate("/auth?tab=login")}
        >
          Log in
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          No account yet?{" "}
          <button
            onClick={() => navigate("/auth?tab=signup")}
            className="text-primary underline underline-offset-2 hover:text-primary-glow"
          >
            Join the list
          </button>
        </p>
      </div>
      
    </div>
  );
};

export default MobileAuthPrompt;
