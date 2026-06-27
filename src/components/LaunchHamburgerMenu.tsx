import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/hooks/useLanguage";

interface LaunchHamburgerMenuProps {
  isScrolled?: boolean;
}

const LaunchHamburgerMenu = ({ isScrolled = false }: LaunchHamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`h-[30px] w-[30px] p-0 rounded-full ${!isScrolled ? "text-white hover:bg-white/10" : "hover:bg-muted"}`}
          aria-label="Open menu"
        >
          <Menu className="h-[18px] w-[18px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-2 bg-white border border-border/30 shadow-xl rounded-2xl"
        sideOffset={8}
      >
        <nav className="flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
          <Link
            to="/launch/experiences?context=launch"
            onClick={handleNavClick}
            className="px-4 py-3 text-[15px] text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
          >
            {isRTL ? "גלה חוויות" : "Explore Escapes"}
          </Link>

          <Link
            to="/gift-card"
            onClick={handleNavClick}
            className="px-4 py-3 text-[15px] text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
          >
            {isRTL ? "כרטיס מתנה" : "Gift a Stay"}
          </Link>

          <Link
            to="/partners"
            onClick={handleNavClick}
            className="px-4 py-3 text-[15px] text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
          >
            {isRTL ? "הפוך לשותף" : "I'm a hotel"}
          </Link>

          <Link
            to="/about?context=launch"
            onClick={handleNavClick}
            className="px-4 py-3 text-[15px] text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
          >
            {isRTL ? "אודות" : "About"}
          </Link>

          <Link
            to="/contact?context=launch"
            onClick={handleNavClick}
            className="px-4 py-3 text-[15px] text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
          >
            {isRTL ? "צרו קשר" : "Contact"}
          </Link>
        </nav>
      </PopoverContent>
    </Popover>
  );
};

export default LaunchHamburgerMenu;
