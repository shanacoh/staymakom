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

interface V3HeaderProps {
  mode: "stay" | "live";
  setMode: (mode: "stay" | "live") => void;
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

const V3Header = ({ mode, setMode }: V3HeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const { displayCurrency, cycleCurrency, setDisplayCurrency } = useCurrency();

  const handleFavoritesClick = () => {
    navigate(user ? "/account?tab=wishlist" : "/auth");
  };

  const isRTL = lang === "he";

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 w-full bg-white border-b border-[#E8E0D4]"
      dir="ltr"
    >
      <div
        className={cn(
          "container flex items-center h-14",
          isRTL ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Left — Logo */}
        <Link to="/v3" className="flex items-center">
          {/* Desktop : wordmark complet */}
          <span className="hidden md:block font-sans font-bold tracking-[-0.04em] uppercase text-xl text-[#1A1814]">
            STAYMAKOM
          </span>
          {/* Mobile : monogramme compact */}
          <span className="md:hidden font-sans font-bold tracking-[-0.04em] uppercase text-lg text-[#1A1814]">
            SM
          </span>
        </Link>

        {/* Center — Toggle */}
        <div className="flex-1 flex items-center justify-center" dir="ltr">
          <div className="flex items-center bg-white border border-[#C85555] rounded-full p-1 gap-0.5">

            {/* With Hotel */}
            <button
              onClick={() => setMode("stay")}
              className={cn(
                "w-[100px] sm:w-[130px] flex flex-row items-center px-3 sm:px-4 gap-2 sm:gap-3 py-1.5 rounded-full transition-all duration-200",
                mode === "stay"
                  ? "bg-gradient-to-br from-[#F2C4C4] to-[#D47070] shadow-sm"
                  : "hover:bg-[#FDF2F2]"
              )}
            >
              <Moon className="h-3.5 w-3.5 flex-shrink-0 text-[#1A1814]" strokeWidth={1.5} />
              <span className="text-center ml-1 sm:ml-2">
                <span className="block font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "עם" : lang === "fr" ? "Avec" : "With"}
                </span>
                <span className="block font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "מלון" : lang === "fr" ? "Hôtel" : "Hotel"}
                </span>
              </span>
            </button>

            {/* Experience Only */}
            <button
              onClick={() => setMode("live")}
              className={cn(
                "w-[100px] sm:w-[130px] flex flex-row items-center px-3 sm:px-4 gap-2 sm:gap-3 py-1.5 rounded-full transition-all duration-200",
                mode === "live"
                  ? "bg-gradient-to-br from-[#F2C4C4] to-[#D47070] shadow-sm"
                  : "hover:bg-[#FDF2F2]"
              )}
            >
              <Sun className="h-3.5 w-3.5 flex-shrink-0 text-[#1A1814]" strokeWidth={1.5} />
              <span className="text-center">
                <span className="block font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "חוויות" : lang === "fr" ? "Expériences" : "Experience"}
                </span>
                <span className="block font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "בלבד" : lang === "fr" ? "seules" : "Only"}
                </span>
              </span>
            </button>

          </div>
        </div>

        {/* Right — Actions */}
        <div className={cn("flex items-center space-x-2 sm:space-x-3", isRTL && "flex-row-reverse space-x-reverse")}>

          {/* Desktop : langue + devise en texte */}
          <div className="hidden md:flex items-center gap-0" dir="ltr">
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "w-[22px] text-center text-[11px] leading-none tracking-[0.05em] transition-colors",
                lang === "en" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
            <span className="w-[8px] text-center text-[11px] select-none text-muted-foreground/50">|</span>
            <button
              onClick={() => setLanguage("fr")}
              className={cn(
                "w-[22px] text-center text-[11px] leading-none tracking-[0.05em] transition-colors",
                lang === "fr" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              FR
            </button>
            <span className="w-[8px] text-center text-[11px] select-none text-muted-foreground/50">|</span>
            <button
              onClick={() => setLanguage("he")}
              className={cn(
                "w-[22px] text-center text-[13px] leading-none tracking-[0.05em] transition-colors",
                lang === "he" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              עב
            </button>
            <button
              onClick={cycleCurrency}
              className="ml-1 w-[18px] text-center text-[11px] font-medium leading-none tracking-[0.05em] transition-colors text-muted-foreground hover:text-foreground"
            >
              {displayCurrency === "USD" ? "$" : displayCurrency === "EUR" ? "€" : "₪"}
            </button>
          </div>

          {/* Mobile : icône globe ouvrant un popover compact */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="md:hidden p-1.5 rounded-full hover:bg-[#F0EBE3] transition-colors" aria-label="Langue et devise">
                <Globe className="h-[18px] w-[18px] text-[#1A1814]" strokeWidth={1.5} />
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

          {/* Heart — masqué sur mobile (accessible via bottom nav "Saved") */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoritesClick}
            className="hidden sm:flex h-8 w-8 rounded-none text-[#1A1814] hover:bg-[#F0EBE3]"
          >
            <Heart className="h-5 w-5" />
          </Button>

          <div className="hidden md:block">
            <LaunchHamburgerMenu isScrolled={true} />
          </div>
        </div>
      </div>

    </header>
  );
};

export default V3Header;
