import { Heart, Calendar, Gift, User, Bookmark, ChevronRight, LogOut, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AccountSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const getCopy = (lang: string) => {
  if (lang === "he") {
    return {
      wishlist: "מועדפים",
      bookings: "הזמנות",
      giftCards: "כרטיסי מתנה",
      myAccount: "החשבון שלי",
      savedCarts: "שמור להמשך",
      helpSupport: "עזרה ותמיכה",
      signOut: "התנתק",
    };
  }
  return {
    wishlist: "Saved Escapes",
    bookings: "My Bookings",
    giftCards: "Gift Cards",
    myAccount: "Personal Information",
    savedCarts: "Saved for Later",
    helpSupport: "Help & Support",
    signOut: "Sign Out",
  };
};

export default function AccountSidebar({ activeTab, onTabChange }: AccountSidebarProps) {
  const { lang } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const copy = getCopy(lang);

  const navItems = [
    { id: "bookings", icon: Calendar, label: copy.bookings },
    { id: "wishlist", icon: Heart, label: copy.wishlist },
    { id: "savedcarts", icon: Bookmark, label: copy.savedCarts },
    { id: "giftcards", icon: Gift, label: copy.giftCards },
    { id: "profile", icon: User, label: copy.myAccount },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/launch");
  };

  return (
    <nav className="sticky top-24 space-y-0.5">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] transition-all duration-200",
              "hover:bg-muted/40",
              isActive
                ? "bg-foreground/[0.04] text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] transition-colors flex-shrink-0",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            />
            <span className="flex-1 text-left">{item.label}</span>
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-foreground" />
            )}
          </button>
        );
      })}

      <Separator className="!my-3" />

      <button
        onClick={() => navigate("/contact")}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] text-muted-foreground hover:bg-muted/40 transition-all"
      >
        <MessageCircle className="h-[18px] w-[18px] flex-shrink-0" />
        <span className="flex-1 text-left">{copy.helpSupport}</span>
      </button>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] text-destructive/70 hover:bg-destructive/5 transition-all"
      >
        <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
        <span className="flex-1 text-left">{copy.signOut}</span>
      </button>
    </nav>
  );
}
