import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Calendar,
  Heart,
  Gift,
  User,
  Globe,
  MessageCircle,
  LogOut,
  ChevronRight,
  Bookmark,
  Info,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TIER_CONFIG = {
  explorer: { label: "Explorer", emoji: "🧭", nextLabel: "Traveler", nextPoints: 500, min: 0 },
  traveler: { label: "Traveler", emoji: "✈️", nextLabel: "Insider", nextPoints: 1500, min: 500 },
  insider: { label: "Insider", emoji: "⭐", nextLabel: "Circle", nextPoints: 3000, min: 1500 },
  circle: { label: "Circle", emoji: "💎", nextLabel: null, nextPoints: null, min: 3000 },
};

const HOW_TO_EARN: Record<string, string> = {
  explorer: "Book experiences to earn points — 1 USD spent = 1 point, 4 NIS = 1 point. Reach 500 points to unlock Traveler.",
  traveler: "Keep booking! You need 1,500 points total to reach Insider.",
  insider: "You're almost at the top. Reach 3,000 points to join Circle.",
  circle: "You've reached the highest tier. Every booking continues to earn points.",
};

const ALL_TIERS = [
  { key: "explorer", label: "Explorer", range: "0 – 499 pts", benefits: ["Access to all public experiences", "Earn 1 point per USD spent", "Save favorites & build wishlists"] },
  { key: "traveler", label: "Traveler", range: "500 – 1,499 pts", benefits: ["Early access to limited experiences", "Member-only opportunities", "Exclusive seasonal offers"] },
  { key: "insider", label: "Insider", range: "1,500 – 2,999 pts", benefits: ["Priority reservations", "Curated insider recommendations", "Seasonal perks & surprises"] },
  { key: "circle", label: "Circle", range: "3,000+ pts", benefits: ["Private concierge service", "Bespoke itineraries", "Invitation-only events"] },
];

export default function MobileAccountHome() {
  const [tierSheetOpen, setTierSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-header", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url, created_at, membership_progress, loyalty_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="px-6 pt-20 pb-32 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Member";
  const initials = displayName
    .split(" ")
    .map((n: string) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const tier = (profile?.loyalty_tier as keyof typeof TIER_CONFIG) || "explorer";
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.explorer;
  const progress = profile?.membership_progress || 0;
  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "MMM yyyy")
    : "";

  const nextPoints = tierConfig.nextPoints;
  const tierMin = tierConfig.min;
  const progressPercent = nextPoints
    ? Math.min(100, Math.max(0, ((progress - tierMin) / (nextPoints - tierMin)) * 100))
    : 100;
  const remaining = nextPoints ? Math.max(0, nextPoints - progress) : 0;

  const menuItems = [
    {
      icon: Calendar,
      label: "My Bookings",
      onClick: () => navigate("/account?tab=bookings"),
    },
    {
      icon: Heart,
      label: "Saved Escapes",
      onClick: () => navigate("/account?tab=wishlist"),
    },
    {
      icon: Bookmark,
      label: "Saved for Later",
      onClick: () => navigate("/account?tab=savedcarts"),
    },
    {
      icon: Gift,
      label: "Gift Cards",
      onClick: () => navigate("/account?tab=giftcards"),
    },
    {
      icon: User,
      label: "Personal Information",
      onClick: () => navigate("/account?tab=profile"),
    },
    {
      icon: Globe,
      label: "Language & Currency",
      onClick: () => toast.info("Use the language switcher in the header bar."),
    },
    {
      icon: MessageCircle,
      label: "Help & Support",
      onClick: () => navigate("/contact"),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/launch");
  };

  return (
    <>
    <div className="px-6 pt-20 pb-32">
      {/* TOP SECTION — Avatar + Name */}
      <div className="flex flex-col items-center text-center pt-4 mb-6">
        <Avatar className="h-[72px] w-[72px] border-2 border-border/40 shadow-sm mb-3">
          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
          <AvatarFallback className="bg-foreground text-background text-xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-[20px] font-bold text-foreground leading-tight">
          {displayName}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {tierConfig.label} · Since {memberSince}
        </p>
        <button
          onClick={() => setTierSheetOpen(true)}
          className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full border border-border/60 text-xs text-foreground active:bg-muted/40 transition-colors"
        >
          {tierConfig.emoji} {tierConfig.label}
          <ChevronRight size={12} className="text-muted-foreground" />
        </button>
      </div>

      {/* MEMBERSHIP PROGRESS */}
      {nextPoints && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {progress} / {nextPoints} pts
              </span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
                    {HOW_TO_EARN[tier] || HOW_TO_EARN.explorer}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-xs text-muted-foreground">
              {tierConfig.nextLabel}
            </span>
          </div>
          <div className="h-[3px] w-full bg-muted rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {remaining} pts to unlock {tierConfig.nextLabel}
          </p>
        </div>
      )}

      {/* MENU LIST */}
      <div>
        {menuItems.map((item, i) => (
          <div key={item.label}>
            {i > 0 && <Separator className="my-0" />}
            <button
              onClick={item.onClick}
              className="w-full flex items-center gap-3.5 py-[14px] text-left transition-colors active:bg-muted/40"
            >
              <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-[15px] text-foreground">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            </button>
          </div>
        ))}

        <Separator className="my-0" />

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3.5 py-[14px] text-left transition-colors active:bg-muted/40"
        >
          <LogOut className="h-5 w-5 text-destructive/70 flex-shrink-0" />
          <span className="flex-1 text-[15px] text-destructive/80">Sign Out</span>
        </button>
      </div>
    </div>

      {/* Tier details sheet */}
      <Sheet open={tierSheetOpen} onOpenChange={setTierSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-serif text-xl text-center">STAYMAKOM Club Tiers</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            {ALL_TIERS.map((t) => {
              const isActive = t.key === tier;
              return (
                <div
                  key={t.key}
                  className={`rounded-xl border p-4 transition-colors ${
                    isActive
                      ? "border-foreground/40 bg-foreground/[0.03]"
                      : "border-border/50 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base text-foreground">{t.label}</span>
                      {isActive && (
                        <span className="text-[10px] font-medium tracking-wider uppercase bg-foreground text-background px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{t.range}</span>
                  </div>
                  <ul className="space-y-1">
                    {t.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-foreground/50 mt-0.5">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
