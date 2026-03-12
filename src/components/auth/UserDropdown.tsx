import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as AuthUser } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Calendar, Gift, User, LogOut, Star, LayoutDashboard, Hotel } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";

interface UserDropdownProps {
  user: AuthUser;
  isTransparent?: boolean;
  onSignOut: () => void;
}

const TIER_ICONS: Record<string, string> = {
  explorer: "🌱",
  traveler: "✈️",
  adventurer: "🏔️",
  elite: "👑",
};

const TIER_LABELS: Record<string, { en: string; he: string }> = {
  explorer: { en: "Explorer", he: "חוקר" },
  traveler: { en: "Traveler", he: "מטייל" },
  adventurer: { en: "Adventurer", he: "הרפתקן" },
  elite: { en: "Elite", he: "עילית" },
};

const getCopy = (lang: string) => {
  if (lang === "he") {
    return {
      myFavorites: "המועדפים שלי",
      myBookings: "ההזמנות שלי",
      myGiftCards: "כרטיסי המתנה שלי",
      myAccount: "החשבון שלי",
      signOut: "התנתקות",
      dashboard: "לוח בקרה",
      hotelDashboard: "לוח בקרת מלון",
      points: "נק׳",
    };
  }
  return {
    myFavorites: "My Favorites",
    myBookings: "My Bookings",
    myGiftCards: "My Gift Cards",
    myAccount: "My Account",
    signOut: "Sign Out",
    dashboard: "Dashboard",
    hotelDashboard: "Hotel Dashboard",
    points: "pts",
  };
};

const UserDropdown = ({ user, isTransparent, onSignOut }: UserDropdownProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { role } = useAuth();
  const copy = getCopy(lang);

  // Fetch user profile data
  const { data: profile } = useQuery({
    queryKey: ["user-profile-dropdown", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url, loyalty_tier, total_points")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user.id,
  });

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const tier = profile?.loyalty_tier || "explorer";
  const points = profile?.total_points || 0;

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setOpen(false);
    onSignOut();
  };

  const menuItems = [
    { icon: Heart, label: copy.myFavorites, path: "/account?tab=wishlist" },
    { icon: Calendar, label: copy.myBookings, path: "/account?tab=bookings" },
    { icon: Gift, label: copy.myGiftCards, path: "/account?tab=giftcards" },
    { icon: User, label: copy.myAccount, path: "/account?tab=profile" },
  ];

  // Add admin/hotel admin dashboard option if applicable
  const dashboardItem = role === "admin" 
    ? { icon: LayoutDashboard, label: copy.dashboard, path: "/admin" }
    : role === "hotel_admin"
      ? { icon: Hotel, label: copy.hotelDashboard, path: "/hotel-admin" }
      : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${
            isTransparent
              ? "ring-2 ring-white/30 hover:ring-white/60"
              : "ring-2 ring-primary/20 hover:ring-primary/40"
          }`}
        >
          <Avatar className="h-8 w-8">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback
              className={`text-xs font-medium ${
                isTransparent
                  ? "bg-white/20 text-white"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 p-0 rounded-2xl shadow-xl border-border/30 overflow-hidden"
      >
        {/* Header with gradient */}
        <div className="p-4 bg-gradient-to-br from-muted/60 via-muted/30 to-transparent border-b border-border/20">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{displayName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {TIER_ICONS[tier]} {TIER_LABELS[tier]?.[lang as "en" | "he"] || TIER_LABELS[tier]?.en}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {points} {copy.points}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-2">
          {dashboardItem && (
            <>
              <button
                onClick={() => handleNavigate(dashboardItem.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-primary/5 transition-colors"
              >
                <dashboardItem.icon className="h-4 w-4 text-muted-foreground" />
                {dashboardItem.label}
              </button>
              <Separator className="my-1" />
            </>
          )}
          
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-primary/5 transition-colors"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </button>
          ))}

          <Separator className="my-1" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {copy.signOut}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserDropdown;
