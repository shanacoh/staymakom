import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Compass, Heart, Luggage, User } from "lucide-react";
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
  { icon: Compass, labelEn: "Explore", labelHe: "גלה", path: "/" },
  { icon: Heart, labelEn: "Saved", labelHe: "שמור", path: "/account?tab=wishlist", requiresAuth: true, authContext: "wishlist" },
  { icon: Luggage, labelEn: "Trips", labelHe: "טיולים", path: "/cart", showCartDot: true },
  { icon: User, labelEn: "Account", labelHe: "חשבון", path: "/account", requiresAuth: true, authContext: "account" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasCart = useCartExists();

  // ── État par défaut (en haut de page) : pastille flottante.
  //    Dès qu'on scrolle, elle se transforme en barre pleine largeur. ──
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY < 60) {
          setIsScrolled(false);
        } else if (currentY > lastScrollY.current + 4) {
          setIsScrolled(true);
        } else if (currentY < lastScrollY.current - 4) {
          setIsScrolled(false);
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    const currentFull = location.pathname + location.search;

    if (path === "/") {
      return location.pathname === "/";
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
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center justify-around transition-all duration-300 ease-out rounded-full bg-white/15 backdrop-blur-[8px] border border-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
          isScrolled
            ? "w-auto gap-1 h-14 mb-3 px-3"
            : "w-auto gap-2 h-[68px] mb-4 px-5"
        )}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleTap(item)}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300 relative",
                isScrolled ? "gap-0 px-2.5" : "gap-1 px-3",
                active ? "text-black" : "text-black/50"
              )}
            >
              <span className="relative">
                <item.icon size={isScrolled ? 22 : 26} strokeWidth={active ? 2 : 1.5} />
                {item.showCartDot && hasCart && (
                  <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-[#C4714A]" />
                )}
              </span>
              <span
                className={cn(
                  "leading-tight overflow-hidden transition-all duration-300",
                  isScrolled ? "max-h-0 opacity-0 text-[10px]" : "max-h-4 opacity-100 text-[11px]"
                )}
              >
                {item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
