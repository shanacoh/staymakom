import { useLocation, useNavigate } from "react-router-dom";
import { Compass, Heart, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useCartExists } from "@/hooks/useCart";

interface NavItem {
  icon: React.ElementType;
  labelEn: string;
  labelHe: string;
  path: string;
  requiresAuth?: boolean;
  authContext?: "wishlist" | "bookings" | "account";
  showCartDot?: boolean;
}

const navItems: NavItem[] = [
  { icon: Compass, labelEn: "Explore", labelHe: "גלה", path: "/launch" },
  { icon: Heart, labelEn: "Saved", labelHe: "שמור", path: "/account?tab=wishlist", requiresAuth: true, authContext: "wishlist" },
  { icon: ShoppingBag, labelEn: "Cart", labelHe: "עגלה", path: "/cart", showCartDot: true },
  { icon: User, labelEn: "Account", labelHe: "חשבון", path: "/account", requiresAuth: true, authContext: "account" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasCart = useCartExists();

  const isActive = (path: string) => {
    const currentFull = location.pathname + location.search;

    if (path === "/launch") {
      return location.pathname === "/launch" || location.pathname === "/launch/experiences";
    }
    if (path === "/cart") {
      return location.pathname === "/cart";
    }

    // "Account" tab: active when on /account with no tab param
    if (path === "/account") {
      return location.pathname === "/account" && !location.search;
    }

    // Wishlist / Bookings: exact match
    if (currentFull === path) return true;

    // Handle mobile-login context mapping
    if (location.pathname === "/mobile-login") {
      const ctx = new URLSearchParams(location.search).get("context");
      if (path.includes("wishlist") && ctx === "wishlist") return true;
      if (path.includes("bookings") && ctx === "bookings") return true;
      if (path === "/account" && ctx === "account") return true;
    }

    return false;
  };

  const handleTap = (item: NavItem) => {
    if (item.requiresAuth && !user) {
      navigate(`/mobile-login?context=${item.authContext || "account"}`);
      return;
    }
    navigate(item.path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-mobile-header border-t border-mobile-border md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleTap(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 pt-1.5 transition-colors relative",
                active ? "text-mobile-active" : "text-mobile-inactive"
              )}
            >
              <span className="relative">
                <item.icon size={22} strokeWidth={active ? 2 : 1.5} />
                {item.showCartDot && hasCart && (
                  <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-[#C4714A]" />
                )}
              </span>
              <span className="text-[10px] leading-tight">{item.labelEn}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
