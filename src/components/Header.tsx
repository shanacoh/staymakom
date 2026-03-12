import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import HamburgerMenu from "@/components/HamburgerMenu";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import AccountBubble from "@/components/auth/AccountBubble";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import UserDropdown from "@/components/auth/UserDropdown";
import { useCartExists } from "@/hooks/useCart";
import { trackWishlistIconClicked, trackCartIconClicked } from "@/lib/analytics";

const Header = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isDarkHeroPage = [
    "/gift-card",
    "/companies",
    "/corporate",
    "/contact",
    "/partners",
    "/about",
    "/launch",
  ].includes(location.pathname);
  const isTransparentPage = isHomePage || isDarkHeroPage;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Auth popup state
  const [authDialog, setAuthDialog] = useState<{ open: boolean; tab: "login" | "signup"; context: "favorites" | "account" | "signup" }>({ open: false, tab: "login", context: "account" });

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const hasCart = useCartExists();
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
    trackWishlistIconClicked(0);
    if (user) {
      navigate("/account?tab=wishlist");
    } else {
      setAuthDialog({ open: true, tab: "login", context: "favorites" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolled = currentScrollY > 80;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setIsScrolled(isTransparentPage ? scrolled : true);
      setLastScrollY(currentScrollY);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTransparentPage, lastScrollY]);

  const headerClasses =
    isTransparentPage && !isScrolled
      ? `fixed left-0 right-0 z-50 w-full bg-transparent backdrop-blur-none border-none transition-all duration-200 ${
          isVisible ? "top-0" : "-top-full"
        }`
      : `fixed left-0 right-0 z-50 w-full bg-background/98 backdrop-blur-sm shadow-[0_1px_8px_-2px_rgba(0,0,0,0.06)] border-none transition-all duration-200 ${
          isVisible ? "top-0" : "-top-full"
        }`;

  const logoClasses = isTransparentPage && !isScrolled ? "text-white" : "text-logo";

  return (
    <header className={headerClasses} dir="ltr">
      <div className="container flex items-center justify-between bg-transparent h-14">
        <Link to={getLocalizedPath("/")} className="flex items-center space-x-2">
          <span
            className={`font-sans font-bold tracking-[-0.04em] uppercase text-xl ${logoClasses}`}
          >
            STAYMAKOM
          </span>
        </Link>

        <div className="flex-1"></div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center gap-0.5">
            <button
              onClick={() => handleLang("en")}
              className={`text-xs transition-colors px-0.5 ${
                lang === "en"
                  ? isTransparentPage && !isScrolled
                    ? "text-white font-semibold"
                    : "text-foreground font-semibold"
                  : isTransparentPage && !isScrolled
                    ? "text-white/60 hover:text-white/80"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <span
              className={`text-xs select-none ${
                isTransparentPage && !isScrolled
                  ? "text-white/40"
                  : "text-muted-foreground/40"
              }`}
            >
              |
            </span>
            <button
              onClick={() => handleLang("he")}
              className={`text-[13px] leading-none transition-colors px-0.5 ${
                lang === "he"
                  ? isTransparentPage && !isScrolled
                    ? "text-white font-semibold"
                    : "text-foreground font-semibold"
                  : isTransparentPage && !isScrolled
                    ? "text-white/60 hover:text-white/80"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              עב
            </button>
            <button
              onClick={() => setDisplayCurrency(displayCurrency === "USD" ? "ILS" : "USD")}
              className={`text-xs transition-colors ml-1 ${
                isTransparentPage && !isScrolled
                  ? "text-foreground/70 hover:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {displayCurrency === "USD" ? "$" : "₪"}
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`hidden md:flex text-[11px] h-6 px-2.5 ${
              isTransparentPage && !isScrolled
                ? "border-white/30 text-white hover:bg-white/10 hover:text-white"
                : "border-border/60 hover:bg-foreground/5 hover:border-border"
            }`}
            onClick={() => {
              if (location.pathname !== "/") {
                navigate(getLocalizedPath("/#choose-escape"));
              } else {
                document
                  .getElementById("choose-escape")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            {lang === "he" ? "מלון + חוויה" : "HOTEL + EXPERIENCE"}
          </Button>

          {user ? (
            <UserDropdown
              user={user}
              isTransparent={isTransparentPage && !isScrolled}
              onSignOut={handleSignOut}
            />
          ) : (
            <AccountBubble
              lang={lang as "en" | "fr" | "he"}
              isTransparent={isTransparentPage && !isScrolled}
              onSignIn={() => setAuthDialog({ open: true, tab: "login", context: "account" })}
              onSignUp={() => setAuthDialog({ open: true, tab: "signup", context: "signup" })}
            />
          )}

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { trackCartIconClicked(hasCart ? 1 : 0); navigate("/cart"); }}
            className={`relative h-8 w-8 ${
              isTransparentPage && !isScrolled
                ? "text-white hover:bg-white/10"
                : "hover:bg-foreground/5"
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            {hasCart && (
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[#C4714A]" />
            )}
          </Button>

          {/* Favorites Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoritesClick}
            className={`h-8 w-8 ${
              isTransparentPage && !isScrolled
                ? "text-white hover:bg-white/10"
                : "hover:bg-foreground/5"
            }`}
          >
            <Heart className="h-5 w-5" />
          </Button>

          <HamburgerMenu isScrolled={isScrolled} />
        </div>
      </div>
      
      {/* Auth Dialog - All-in-one signup */}
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

export default Header;
