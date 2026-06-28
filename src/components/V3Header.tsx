import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Heart, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LaunchHamburgerMenu from "@/components/LaunchHamburgerMenu";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import AccountBubble from "@/components/auth/AccountBubble";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import UserDropdown from "@/components/auth/UserDropdown";

interface V3HeaderProps {
  mode?: "stay" | "live";
  setMode?: (mode: "stay" | "live") => void;
  showModeToggle?: boolean;
}

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

const V3Header = ({ mode, setMode, showModeToggle = false }: V3HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const [authDialog, setAuthDialog] = useState<{ open: boolean; tab: "login" | "signup"; context: "favorites" | "account" | "signup" }>({ open: false, tab: "login", context: "account" });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleFavoritesClick = () => {
    if (user) {
      navigate("/account?tab=wishlist");
    } else {
      setAuthDialog({ open: true, tab: "login", context: "favorites" });
    }
  };

  const isRTL = lang === "he";

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 w-full bg-white border-b border-[#E8E0D4]"
      dir="ltr"
    >
      <div
        className="container flex flex-row items-center h-14"
      >
        {/* Left — Logo */}
        <Link to="/" className="flex items-center">
          {/* Desktop : wordmark complet */}
          <span className="hidden md:block font-sans font-bold tracking-[-0.04em] uppercase text-xl text-foreground">
            STAYMAKOM
          </span>
          {/* Mobile : monogramme compact */}
          <span className="md:hidden font-sans font-bold tracking-[-0.04em] uppercase text-lg text-foreground">
            SM
          </span>
        </Link>

        {/* Center — Toggle (uniquement sur /v3) */}
        <div className="flex-1 flex items-center justify-center mt-0.5" dir="ltr">
          {showModeToggle && mode !== undefined && setMode !== undefined && (
            <div className="flex items-center bg-white border border-[#C85555] rounded-full p-1 gap-0.5">

              {/* With Hotel */}
              <button
                onClick={() => setMode("stay")}
                className={cn(
                  "flex flex-row items-center gap-2 px-3 sm:px-4 py-1 rounded-full transition-all duration-200 w-[108px] sm:w-[130px]",
                  mode === "stay"
                    ? "bg-gradient-to-br from-[#F2C4C4] to-[#D47070] shadow-sm"
                    : "hover:bg-[#FDF2F2]"
                )}
              >
                <Moon className="h-3.5 w-3.5 flex-shrink-0 text-foreground" strokeWidth={1.5} />
                <span className="flex-1 text-center">
                  <span className={cn("block font-bold uppercase tracking-wider text-foreground leading-[13px]", "text-[9px] sm:text-[10px]")}>
                    {lang === "he" ? "עם" : lang === "fr" ? "Avec" : "With"}
                  </span>
                  <span className={cn("block font-bold uppercase tracking-wider text-foreground leading-[13px]", "text-[9px] sm:text-[10px]")}>
                    {lang === "he" ? "מלון" : lang === "fr" ? "Hôtel" : "Hotel"}
                  </span>
                </span>
                <span className="w-3.5 flex-shrink-0" aria-hidden />
              </button>

              {/* Experience Only */}
              <button
                onClick={() => setMode("live")}
                className={cn(
                  "flex flex-row items-center gap-2 px-3 sm:px-4 py-1 rounded-full transition-all duration-200 w-[108px] sm:w-[130px]",
                  mode === "live"
                    ? "bg-gradient-to-br from-[#F2C4C4] to-[#D47070] shadow-sm"
                    : "hover:bg-[#FDF2F2]"
                )}
              >
                <Sun className="h-3.5 w-3.5 flex-shrink-0 text-foreground" strokeWidth={1.5} />
                <span className="flex-1 text-center">
                  <span className={cn("block font-bold uppercase tracking-wider text-foreground leading-[13px]", "text-[9px] sm:text-[10px]")}>
                    {lang === "he" ? "חוויות" : lang === "fr" ? "Expériences" : "Experience"}
                  </span>
                  <span className={cn("block font-bold uppercase tracking-wider text-foreground leading-[13px]", "text-[9px] sm:text-[10px]")}>
                    {lang === "he" ? "בלבד" : lang === "fr" ? "seules" : "Only"}
                  </span>
                </span>
                <span className="w-3.5 flex-shrink-0" aria-hidden />
              </button>

            </div>
          )}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* Globe — langue et devise, mobile ET desktop */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[30px] w-[30px] rounded-full" aria-label="Langue et devise">
                <Globe className="h-[18px] w-[18px] text-foreground" strokeWidth={1.5} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-72 p-4 rounded-2xl shadow-xl border border-border/30 bg-white"
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
                    onClick={() => setLanguage(code)}
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

          {/* Compte / Connexion — masqué sur mobile (accessible via bottom nav) */}
          <div className="hidden sm:block">
            {user ? (
              <UserDropdown user={user} isTransparent={false} onSignOut={handleSignOut} />
            ) : (
              <AccountBubble
                lang={lang as "en" | "fr" | "he"}
                isTransparent={false}
                onSignIn={() => setAuthDialog({ open: true, tab: "login", context: "account" })}
                onSignUp={() => setAuthDialog({ open: true, tab: "signup", context: "signup" })}
              />
            )}
          </div>

          {/* Heart — masqué sur mobile (accessible via bottom nav "Saved") */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoritesClick}
            className="hidden sm:flex h-[30px] w-[30px] rounded-full text-foreground hover:bg-muted"
          >
            <Heart className="h-[18px] w-[18px]" />
          </Button>

          <div className="hidden sm:block">
            <LaunchHamburgerMenu isScrolled={true} />
          </div>
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
          navigate("/account");
        }}
      />
    </header>
  );
};

export default V3Header;
