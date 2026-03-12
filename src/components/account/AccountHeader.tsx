import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AccountHeaderProps {
  userId?: string;
  userEmail?: string;
}

const TIER_CONFIG = {
  explorer: {
    label: "Explorer",
    nextTier: "traveler" as const,
    nextLabel: "Traveler",
    nextPoints: 500,
    min: 0,
  },
  traveler: {
    label: "Traveler",
    nextTier: "insider" as const,
    nextLabel: "Insider",
    nextPoints: 1500,
    min: 500,
  },
  insider: {
    label: "Insider",
    nextTier: "circle" as const,
    nextLabel: "Circle",
    nextPoints: 3000,
    min: 1500,
  },
  circle: {
    label: "Circle",
    nextTier: null,
    nextLabel: null,
    nextPoints: null,
    min: 3000,
  },
};

const ALL_TIERS = [
  {
    key: "explorer",
    label: "Explorer",
    range: "0 – 499 pts",
    benefits: [
      "Access to all public experiences",
      "Earn 1 point per USD spent",
      "Save favorites & build wishlists",
    ],
  },
  {
    key: "traveler",
    label: "Traveler",
    range: "500 – 1,499 pts",
    benefits: [
      "Early access to limited experiences",
      "Member-only opportunities",
      "Exclusive seasonal offers",
    ],
  },
  {
    key: "insider",
    label: "Insider",
    range: "1,500 – 2,999 pts",
    benefits: [
      "Priority reservations",
      "Curated insider recommendations",
      "Seasonal perks & surprises",
    ],
  },
  {
    key: "circle",
    label: "Circle",
    range: "3,000+ pts",
    benefits: [
      "Private concierge service",
      "Bespoke itineraries",
      "Invitation-only events",
    ],
  },
];

export default function AccountHeader({ userId, userEmail }: AccountHeaderProps) {
  const [tierSheetOpen, setTierSheetOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-header", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url, membership_progress, loyalty_tier")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="bg-[#1A1814] h-16 rounded-lg mb-6 flex items-center px-6">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-48 ml-4" />
      </div>
    );
  }

  const displayName = profile?.display_name || userEmail?.split("@")[0] || "Member";
  const tier = (profile?.loyalty_tier as keyof typeof TIER_CONFIG) || "explorer";
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.explorer;
  const progress = profile?.membership_progress || 0;

  // Progress calculation
  const nextPoints = tierConfig.nextPoints;
  const tierMin = tierConfig.min;
  const progressPercent = nextPoints
    ? Math.min(100, Math.max(0, ((progress - tierMin) / (nextPoints - tierMin)) * 100))
    : 100;
  const remaining = nextPoints ? Math.max(0, nextPoints - progress) : 0;

  return (
    <>
      <div className="bg-[#1A1814] h-16 rounded-lg mb-6 flex items-center justify-between px-6">
        {/* Left: Avatar + Name + Tier */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 bg-[#B8935A]">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-[#B8935A] text-white text-base font-medium">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-2">
            <span className="text-white text-[15px]" style={{ fontFamily: "Inter, sans-serif" }}>
              {displayName}
            </span>
            <span className="text-white/40">·</span>
            <button
              onClick={() => setTierSheetOpen(true)}
              className="border border-white/30 px-2 py-0.5 rounded text-white text-[11px] uppercase hover:border-white/50 transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {tierConfig.label}
            </button>
          </div>
        </div>

        {/* Right: Progress bar */}
        {nextPoints && (
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[11px]" style={{ fontFamily: "Inter, sans-serif" }}>
              {remaining.toLocaleString()} pts to {tierConfig.nextLabel}
            </span>
            <div className="w-[200px]">
              <div className="h-[3px] w-full bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
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
