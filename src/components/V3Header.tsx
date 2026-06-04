import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LaunchHamburgerMenu from "@/components/LaunchHamburgerMenu";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface V3HeaderProps {
  mode: "stay" | "live";
  setMode: (mode: "stay" | "live") => void;
}

const V3Header = ({ mode, setMode }: V3HeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const { displayCurrency, cycleCurrency } = useCurrency();

  const handleFavoritesClick = () => {
    navigate(user ? "/account?tab=wishlist" : "/auth");
  };

  const isRTL = lang === "he";

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 w-full bg-white border-b border-[#E8E0D4] hidden md:block"
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
          <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xl text-[#1A1814]">
            STAYMAKOM
          </span>
        </Link>

        {/* Center — Toggle */}
        <div className="flex-1 flex items-center justify-center" dir="ltr">
          <div className="flex items-center bg-white border border-[#82BCC0] rounded-full p-1 gap-0.5">

            {/* With Hotel */}
            <button
              onClick={() => setMode("stay")}
              className={cn(
                "w-[130px] flex flex-row items-center px-4 gap-3 py-1.5 rounded-full transition-all duration-200",
                mode === "stay"
                  ? "bg-gradient-to-br from-[#B8DAD8] to-[#8BC3BF] shadow-sm"
                  : "hover:bg-[#F0FAF9]"
              )}
            >
              <Moon className="h-3.5 w-3.5 flex-shrink-0 text-[#1A1814]" strokeWidth={1.5} />
              <span className="text-center ml-2">
                <span className="block font-bold text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "עם" : lang === "fr" ? "Avec" : "With"}
                </span>
                <span className="block font-bold text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "מלון" : lang === "fr" ? "Hôtel" : "Hotel"}
                </span>
              </span>
            </button>

            {/* Experience Only */}
            <button
              onClick={() => setMode("live")}
              className={cn(
                "w-[130px] flex flex-row items-center px-4 gap-3 py-1.5 rounded-full transition-all duration-200",
                mode === "live"
                  ? "bg-gradient-to-br from-[#B8DAD8] to-[#8BC3BF] shadow-sm"
                  : "hover:bg-[#F0FAF9]"
              )}
            >
              <Sun className="h-3.5 w-3.5 flex-shrink-0 text-[#1A1814]" strokeWidth={1.5} />
              <span className="text-center">
                <span className="block font-bold text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "חוויות" : lang === "fr" ? "Expériences" : "Experience"}
                </span>
                <span className="block font-bold text-[10px] uppercase tracking-wider text-[#1A1814] leading-[13px]">
                  {lang === "he" ? "בלבד" : lang === "fr" ? "seules" : "Only"}
                </span>
              </span>
            </button>

          </div>
        </div>

        {/* Right — Actions */}
        <div className={cn("flex items-center space-x-3", isRTL && "flex-row-reverse space-x-reverse")}>
          {/* Language + currency */}
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

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoritesClick}
            className="h-8 w-8 rounded-none text-[#1A1814] hover:bg-[#F0EBE3]"
          >
            <Heart className="h-5 w-5" />
          </Button>

          <LaunchHamburgerMenu isScrolled={true} />
        </div>
      </div>

    </header>
  );
};

export default V3Header;
