import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { MOBILE_HEADER_HEIGHT } from "@/constants/layout";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCALE_LABELS, publicLocales } from "@/lib/locale";
import { t } from "@/lib/translations";
import { cn } from "@/lib/utils";

// Langues proposées : suit l'interrupteur unique src/config/languages.json.
const LANGUAGES = publicLocales();

// Mêmes formes de surlignage que le sélecteur de l'ordinateur (V3Header).
const BLOB_SHAPES = [
  "rotate-[-4deg] rounded-[60%_40%_75%_25%/35%_65%_45%_55%]",
  "rotate-[3deg]  rounded-[35%_65%_40%_60%/65%_40%_70%_30%]",
  "rotate-[-2deg] rounded-[55%_45%_30%_70%/45%_65%_55%_35%]",
];

const MobileStickyHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  // La langue affichée est celle de la page (locale), pas la langue d'interface :
  // sur une page en russe, c'est bien « RU » qui est indiqué.
  const { locale, setLanguage } = useLanguage();
  const { displayCurrency, cycleCurrency } = useCurrency();
  const [langOpen, setLangOpen] = useState(false);
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
        {/* Langue : un seul bouton compact (langue en cours + flèche) qui ouvre les langues
            proposées, comme le globe de l'ordinateur (liste lue sur l'interrupteur unique). */}
        <div className="ml-auto flex items-center justify-end w-[120px] gap-1" dir="ltr">
          <Popover open={langOpen} onOpenChange={setLangOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-0.5 h-8 px-1.5 text-foreground font-medium leading-none tracking-[0.05em] transition-colors hover:text-foreground/70"
                aria-label={t(locale, "headerLanguage")}
              >
                <span className={locale === "he" ? "text-[13px]" : "text-[11px]"}>{LOCALE_LABELS[locale]}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-56 p-3 rounded-2xl shadow-xl border border-border/30 bg-white"
              dir={locale === "he" ? "rtl" : "ltr"}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40 mb-2">
                {t(locale, "headerLanguage")}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {LANGUAGES.map((code, idx) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLangOpen(false);
                      setLanguage(code);
                    }}
                    aria-pressed={locale === code}
                    className={cn(
                      "relative py-2 font-semibold transition-colors duration-200",
                      code === "he" ? "text-[13px]" : "text-[11px]",
                      locale === code ? "text-[#ad1414]" : "text-black hover:text-black/70",
                    )}
                  >
                    {locale === code && (
                      <span aria-hidden className={cn("absolute inset-x-1 inset-y-0.5 bg-[#ad1414]/15", BLOB_SHAPES[idx % BLOB_SHAPES.length])} />
                    )}
                    <span className="relative z-10">{LOCALE_LABELS[code]}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <button
            onClick={cycleCurrency}
            className="w-[18px] text-center text-[11px] font-medium leading-none tracking-[0.05em] text-muted-foreground hover:text-foreground transition-colors"
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
