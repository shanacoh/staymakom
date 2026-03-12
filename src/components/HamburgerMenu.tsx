import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { t } from "@/lib/translations";

interface HamburgerMenuProps {
  isScrolled?: boolean;
}

const HamburgerMenu = ({ isScrolled = false }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { getLocalizedPath } = useLocalizedNavigation();
  const isRTL = lang === "he";

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const menuItems = [
    { label: lang === 'he' ? 'חוויות חדשות' : 'New Experiences', to: "/experiences2" },
    { label: t(lang, "hamburgerGiftCard"), to: "/gift-card" },
    { label: t(lang, "hamburgerCompanyReward"), to: "/corporate" },
    { label: t(lang, "hamburgerHotelPartnership"), to: "/partners" },
    { label: t(lang, "hamburgerJournal"), to: "/journal" },
    { label: t(lang, "hamburgerAbout"), to: "/about" },
    { label: t(lang, "hamburgerContact"), to: "/contact" },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${!isScrolled ? "text-white hover:bg-white/10" : "hover:bg-foreground/5"}`}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[230px] p-2 bg-white border border-border/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-xl"
        sideOffset={8}
      >
        <nav className="flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={getLocalizedPath(item.to)}
              onClick={handleNavClick}
              className="px-4 py-3 text-[15px] text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {!user && (
            <Link
              to={getLocalizedPath("/auth")}
              onClick={handleNavClick}
              className="px-4 py-3 text-[15px] text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
            >
              {t(lang, "hamburgerSignIn")}
            </Link>
          )}

        </nav>
      </PopoverContent>
    </Popover>
  );
};

export default HamburgerMenu;

