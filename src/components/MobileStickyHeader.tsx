import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { MOBILE_HEADER_HEIGHT } from "@/constants/layout";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/contexts/CurrencyContext";

const MobileStickyHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { lang, setLanguage } = useLanguage();
  const { displayCurrency, cycleCurrency } = useCurrency();
  const handleLang = (l: "en" | "he" | "fr") => {
    setLanguage(l);
  };
  const location = useLocation();
  const navigate = useNavigate();

  const isLaunchHome = location.pathname === "/launch" || location.pathname === "/launch/experiences";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 md:hidden transition-all duration-300 bg-white border-b border-border"
      style={{ height: MOBILE_HEADER_HEIGHT }}
    >
      <div className="relative flex items-center h-full px-2">
        {/* Left: Back arrow or spacer */}
        {!isLaunchHome ? (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-11 h-11 -ml-1 shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        ) : (
          <div className="w-11 shrink-0" />
        )}

        {/* Center: Logo */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 font-sans font-bold tracking-[-0.04em] uppercase text-[20px] leading-none text-foreground"
        >
          STAYMAKOM
        </Link>

        {/* Right: Language + currency switcher */}
        <div className="ml-auto flex items-center justify-end w-[120px] gap-0" dir="ltr">
          <button
            onClick={() => handleLang("en")}
            className={`w-[22px] text-center text-[11px] leading-none tracking-[0.05em] transition-colors ${
              lang === "en"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </button>
          <span className="w-[8px] text-center text-[11px] text-muted-foreground/50 select-none">|</span>
          <button
            onClick={() => handleLang("fr")}
            className={`w-[22px] text-center text-[11px] leading-none tracking-[0.05em] transition-colors ${
              lang === "fr"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            FR
          </button>
          <span className="w-[8px] text-center text-[11px] text-muted-foreground/50 select-none">|</span>
          <button
            onClick={() => handleLang("he")}
            className={`w-[22px] text-center text-[13px] leading-none tracking-[0.05em] transition-colors ${
              lang === "he"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            עב
          </button>
          <button
            onClick={cycleCurrency}
            className="ml-1 w-[18px] text-center text-[11px] font-medium leading-none tracking-[0.05em] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle currency"
          >
            {displayCurrency === "USD" ? "$" : displayCurrency === "EUR" ? "€" : "₪"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileStickyHeader;
