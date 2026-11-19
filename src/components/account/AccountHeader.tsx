import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { tPage } from "@/lib/translations";

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

// Paliers du club : les noms (Explorer, Traveler...) restent en anglais dans toutes les langues,
// les avantages sont traduits (clés accountHeader__benefit…).
const ALL_TIERS = [
  { key: "explorer", label: "Explorer", min: 0, max: 499, benefits: ["accountHeader__benefitPublicAccess", "accountHeader__benefitEarnPoints", "accountHeader__benefitWishlists"] },
  { key: "traveler", label: "Traveler", min: 500, max: 1499, benefits: ["accountHeader__benefitEarlyAccess", "accountHeader__benefitMemberOnly", "accountHeader__benefitSeasonalOffers"] },
  { key: "insider", label: "Insider", min: 1500, max: 2999, benefits: ["accountHeader__benefitPriority", "accountHeader__benefitInsiderTips", "accountHeader__benefitPerks"] },
  { key: "circle", label: "Circle", min: 3000, max: null, benefits: ["accountHeader__benefitConcierge", "accountHeader__benefitBespoke", "accountHeader__benefitEvents"] },
] as const;

export default function AccountHeader({ userId, userEmail }: AccountHeaderProps) {
  const [tierSheetOpen, setTierSheetOpen] = useState(false);
  useLanguage();

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
      <div className="bg-foreground h-16 rounded-lg mb-6 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-[3px] w-[200px] rounded-full" />
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || userEmail?.split("@")[0] || tPage("accountHeader__member");
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
      <div className="bg-foreground h-16 rounded-lg mb-6 flex items-center justify-between px-6">
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
              {tPage("accountHeader__pointsTo")(remaining.toLocaleString(), tierConfig.nextLabel)}
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
            <SheetTitle className="font-serif text-xl text-center">{tPage("accountHeader__clubTiers")}</SheetTitle>
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
                          {tPage("accountHeader__current")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{tPage("accountHeader__pointsRange")(t.min, t.max)}</span>
                  </div>
                  <ul className="space-y-1">
                    {t.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-foreground/50 mt-0.5">•</span>
                        {tPage(b)}
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
