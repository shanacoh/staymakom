import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Globe } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const LANGUAGES = [
  { code: "en" as const, label: "EN" },
  { code: "fr" as const, label: "FR" },
  { code: "he" as const, label: "עב" },
];

const CURRENCIES = [
  { code: "USD" as const, symbol: "$" },
  { code: "EUR" as const, symbol: "€" },
  { code: "ILS" as const, symbol: "₪" },
];

const BLOB_SHAPES = [
  "rotate-[-4deg] rounded-[60%_40%_75%_25%/35%_65%_45%_55%]",
  "rotate-[3deg]  rounded-[35%_65%_40%_60%/65%_40%_70%_30%]",
  "rotate-[-2deg] rounded-[55%_45%_30%_70%/45%_65%_55%_35%]",
];

const LaunchHeader = ({ forceScrolled = false }: { forceScrolled?: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(forceScrolled);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [authDialog, setAuthDialog] = useState<{ open: boolean; tab: "login" | "signup"; context: "favorites" | "account" | "signup" }>({ open: false, tab: "login", context: "account" });

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const handleLang = (l: "en" | "he" | "fr") => {
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
    : `fixed left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-[12px] border-b border-border transition-all duration-300 ease-in-out ${isVisible ? "top-0" : "-top-full"}`;

  const logoClasses = !isScrolled ? "text-white" : "text-foreground";

  const isRTL = lang === "he";

  return (
    <header className={`${headerClasses} hidden md:block`} dir="ltr">
      <div className="container flex flex-row items-center bg-transparent h-14">
        <Link to="/launch" className="flex items-center space-x-2">
          <span className={`font-sans font-bold tracking-[-0.04em] uppercase text-xl ${logoClasses}`}>
            STAYMAKOM
          </span>
        </Link>

        <div className="flex-1"></div>

        <div className="flex items-center space-x-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  !isScrolled ? "text-white/80 hover:text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
                )}
                aria-label="Langue et devise"
              >
                <Globe className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-48 p-4 rounded-2xl shadow-xl border border-border/40 bg-white"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Language */}
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40 mb-2">
                {lang === "he" ? "שפה" : lang === "fr" ? "Langue" : "Language"}
              </p>
              <div className="flex gap-1 mb-4">
                {LANGUAGES.map(({ code, label }, idx) => (
                  <button
                    key={code}
                    onClick={() => handleLang(code)}
                    className={cn(
                      "relative flex-1 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                      lang === code ? "text-[#ad1414]" : "text-black hover:text-black/70"
                    )}
                  >
                    {lang === code && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0.5 inset-y-0 bg-[#ad1414]/15",
                          BLOB_SHAPES[idx % BLOB_SHAPES.length]
                        )}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                ))}
              </div>

              {/* Currency */}
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40 mb-2">
                {lang === "he" ? "מטבע" : lang === "fr" ? "Devise" : "Currency"}
              </p>
              <div className="flex gap-1">
                {CURRENCIES.map(({ code, symbol }, idx) => (
                  <button
                    key={code}
                    onClick={() => setDisplayCurrency(code)}
                    className={cn(
                      "relative flex-1 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                      displayCurrency === code ? "text-[#ad1414]" : "text-black hover:text-black/70"
                    )}
                  >
                    {displayCurrency === code && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0.5 inset-y-0 bg-[#ad1414]/15",
                          BLOB_SHAPES[(idx + 1) % BLOB_SHAPES.length]
                        )}
                      />
                    )}
                    <span className="relative z-10">{symbol}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

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
            className={`h-8 w-8 rounded-none ${!isScrolled ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
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
