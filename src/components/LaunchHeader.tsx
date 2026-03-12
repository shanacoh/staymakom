import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import LaunchHamburgerMenu from "@/components/LaunchHamburgerMenu";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import AccountBubble from "@/components/auth/AccountBubble";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import UserDropdown from "@/components/auth/UserDropdown";
import { cn } from "@/lib/utils";

const LaunchHeader = ({ forceScrolled = false }: { forceScrolled?: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(forceScrolled);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [authDialog, setAuthDialog] = useState<{ open: boolean; tab: "login" | "signup"; context: "favorites" | "account" | "signup" }>({ open: false, tab: "login", context: "account" });

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const handleLang = (l: "en" | "he") => {
    setLanguage(l);
  };
  const { getLocalizedPath, navigateLocalized } = useLocalizedNavigation();

  const handleSignOut = async () => {
    await signOut();
    navigateLocalized("/");
  };

  const handleFavoritesClick = () => {
    if (user) {
      navigate("/account?tab=wishlist");
    } else {
      setAuthDialog({ open: true, tab: "login", context: "favorites" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolled = forceScrolled || currentScrollY > 60;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setIsScrolled(scrolled);
      setLastScrollY(currentScrollY);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const headerClasses = !isScrolled
    ? `fixed left-0 right-0 z-50 w-full bg-transparent backdrop-blur-none border-b border-transparent transition-all duration-300 ease-in-out ${isVisible ? "top-0" : "-top-full"}`
    : `fixed left-0 right-0 z-50 w-full bg-[#FAF8F4]/95 backdrop-blur-[12px] border-b border-[#E8E0D4] transition-all duration-300 ease-in-out ${isVisible ? "top-0" : "-top-full"}`;

  const logoClasses = !isScrolled ? "text-white" : "text-[#1A1814]";

  const isRTL = lang === "he";

  return (
    <header className={`${headerClasses} hidden md:block`} dir="ltr">
      <div className={cn(
        "container flex items-center bg-transparent h-14",
        isRTL ? "flex-row-reverse" : "flex-row"
      )}>
        <Link to="/launch" className="flex items-center space-x-2">
          <span className={`font-sans font-bold tracking-[-0.04em] uppercase text-xl ${logoClasses}`}>
            STAYMAKOM
          </span>
        </Link>

        <div className="flex-1"></div>

        <div className={cn(
          "flex items-center space-x-3",
          isRTL && "flex-row-reverse space-x-reverse"
        )}>
          <div
            className="hidden md:flex items-center gap-0"
            dir="ltr"
          >
            <button
              onClick={() => handleLang("en")}
              className={`w-[22px] text-center text-[11px] leading-none tracking-[0.05em] transition-colors ${
                lang === "en"
                  ? !isScrolled ? "text-white font-medium" : "text-foreground font-medium"
                  : !isScrolled ? "text-white/60 hover:text-white/80" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <span className={`w-[8px] text-center text-[11px] select-none ${!isScrolled ? "text-white/35" : "text-muted-foreground/50"}`}>|</span>
            <button
              onClick={() => handleLang("he")}
              className={`w-[22px] text-center text-[13px] leading-none tracking-[0.05em] transition-colors ${
                lang === "he"
                  ? !isScrolled ? "text-white font-medium" : "text-foreground font-medium"
                  : !isScrolled ? "text-white/60 hover:text-white/80" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              עב
            </button>
            <button
              onClick={() => setDisplayCurrency(displayCurrency === "USD" ? "ILS" : "USD")}
              className={`ml-1 w-[18px] text-center text-[11px] font-medium leading-none tracking-[0.05em] transition-colors ${
                !isScrolled ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {displayCurrency === "USD" ? "$" : "₪"}
            </button>
          </div>

          {/* No HOTEL + EXPERIENCE button on launch page */}

          {user ? (
            <UserDropdown
              user={user}
              isTransparent={!isScrolled}
              onSignOut={handleSignOut}
            />
          ) : (
            <AccountBubble
              lang={lang as "en" | "fr" | "he"}
              isTransparent={!isScrolled}
              onSignIn={() => setAuthDialog({ open: true, tab: "login", context: "account" })}
              onSignUp={() => setAuthDialog({ open: true, tab: "signup", context: "signup" })}
            />
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoritesClick}
            className={`h-8 w-8 rounded-none ${!isScrolled ? "text-white hover:bg-white/10" : "text-[#1A1814] hover:bg-[#F0EBE3]"}`}
          >
            <Heart className="h-5 w-5" />
          </Button>

          <LaunchHamburgerMenu isScrolled={isScrolled} />
        </div>
      </div>

      <AuthPromptDialog
        open={authDialog.open}
        onOpenChange={(open) => setAuthDialog((prev) => ({ ...prev, open }))}
        lang={lang as "en" | "fr" | "he"}
        defaultTab={authDialog.tab}
        context={authDialog.context}
        onSignupSuccess={() => {
          setAuthDialog({ open: false, tab: "login", context: "account" });
          navigateLocalized("/account");
        }}
      />
    </header>
  );
};

export default LaunchHeader;
