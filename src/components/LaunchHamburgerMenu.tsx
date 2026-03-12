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
          {/* Explore Escapes with sub-items */}
          <div className="px-4 py-3 text-[15px] text-foreground">
            <span>{isRTL ? "גלה חוויות ›" : "Explore Escapes ›"}</span>
          </div>
          <div className={`${isRTL ? "mr-3 pr-2" : "ml-3 pl-2"}`}>
            <Link
              to="/launch/experiences?filter=adventure&context=launch"
              onClick={handleNavClick}
              className="px-4 py-2.5 text-[14px] text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors block"
            >
              {isRTL ? "— הרפתקה" : "— Feeling Adventurous"}
            </Link>
            <Link
              to="/launch/experiences?filter=romantic&context=launch"
              onClick={handleNavClick}
              className="px-4 py-2.5 text-[14px] text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors block"
            >
              {isRTL ? "— בריחה רומנטית" : "— Romantic Escape"}
            </Link>
          </div>

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
