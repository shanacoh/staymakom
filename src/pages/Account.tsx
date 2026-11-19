import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { Loader2, ChevronLeft } from "lucide-react";
import WishlistSection from "@/components/account/WishlistSection";
import MyStaymakomSection from "@/components/account/MyStaymakomSection";
import MyAccountSection from "@/components/account/MyAccountSection";
import AccountHeader from "@/components/account/AccountHeader";
import RecommendedExperiences from "@/components/account/RecommendedExperiences";
import RecommendedJournal from "@/components/account/RecommendedJournal";
import PersonalizedRequestSection from "@/components/account/PersonalizedRequestSection";
import GiftCardsSection from "@/components/account/GiftCardsSection";
import AccountSidebar from "@/components/account/AccountSidebar";
import OnboardingFlow from "@/components/auth/OnboardingFlow";
import MobileAccountHome from "@/components/account/MobileAccountHome";
import { useIsMobile } from "@/hooks/use-mobile";
import { tPage } from "@/lib/translations";

// Titres des onglets sur téléphone (clés account__tab… de translations.ts).
const MOBILE_TAB_TITLES = {
  bookings: "account__tabBookings",
  wishlist: "account__tabWishlist",
  giftcards: "account__tabGiftCards",
  profile: "account__tabProfile",
} as const;

const ALLOWED_TABS = ["wishlist", "bookings", "giftcards", "profile"] as const;
type AccountTab = (typeof ALLOWED_TABS)[number];

const Account = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const isMobile = useIsMobile();

  const normalizedTab: AccountTab | null =
    tabFromUrl && (ALLOWED_TABS as readonly string[]).includes(tabFromUrl)
      ? (tabFromUrl as AccountTab)
      : null;

  const effectiveTab: AccountTab = normalizedTab || "bookings";

  const [activeTab, setActiveTab] = useState<AccountTab>(effectiveTab);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // If user lands on /account without a tab param, default to bookings (and keep URL in sync)
  useEffect(() => {
    if (!normalizedTab) {
      navigate("/account?tab=bookings", { replace: true });
    }
  }, [normalizedTab, navigate]);

  useEffect(() => {
    setActiveTab(effectiveTab);
  }, [effectiveTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile-onboarding", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("user_profiles")
        .select("onboarding_completed_at, display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile && !profile.onboarding_completed_at && !profile.display_name) {
      setShowOnboarding(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // === MOBILE LAYOUT ===
  if (isMobile) {
    const mobileTab = effectiveTab;
    const titleKey = MOBILE_TAB_TITLES[mobileTab as keyof typeof MOBILE_TAB_TITLES];
    const pageTitle = titleKey ? tPage(titleKey) : tPage("account__title");

    return (
      <div className="min-h-screen pb-24">
        {/* Mobile sub-page header */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border/50 md:hidden">
          <div className="flex items-center h-14 px-2">
            <button
              onClick={() => navigate("/account?tab=bookings")}
              className="flex items-center justify-center w-11 h-11"
              aria-label={tPage("account__back")}
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-foreground">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="pt-16 px-4">
          {mobileTab === "bookings" && <MyStaymakomSection userId={user.id} />}
          {mobileTab === "wishlist" && <WishlistSection userId={user.id} />}
          {mobileTab === "giftcards" && (
            <GiftCardsSection userId={user.id} userEmail={user.email} />
          )}
          {mobileTab === "profile" && (
            <MyAccountSection userId={user.id} userEmail={user.email} mobile />
          )}
        </div>
      </div>
    );
  }

  // === DESKTOP LAYOUT (unchanged) ===
  const renderContent = () => {
    switch (activeTab) {
      case "wishlist":
        return (
          <>
            <WishlistSection userId={user.id} />
            <RecommendedExperiences
              userId={user.id}
              title={tPage("account__youMightAlsoLike")}
              subtitle={tPage("account__basedOnFavorites")}
              compact
              limit={4}
            />
            <PersonalizedRequestSection
              userName={profile?.display_name || undefined}
              userEmail={user.email}
            />
          </>
        );
      case "bookings":
        return (
          <>
            <MyStaymakomSection userId={user.id} />
            <RecommendedExperiences
              userId={user.id}
              title={tPage("account__nextAdventure")}
              subtitle={tPage("account__discoverMore")}
              compact
              limit={4}
            />
            <PersonalizedRequestSection
              userName={profile?.display_name || undefined}
              userEmail={user.email}
            />
          </>
        );
      case "giftcards":
        return (
          <>
            <GiftCardsSection userId={user.id} userEmail={user.email} />
            <PersonalizedRequestSection
              userName={profile?.display_name || undefined}
              userEmail={user.email}
            />
          </>
        );
      case "profile":
        return (
          <>
            <MyAccountSection userId={user.id} userEmail={user.email} />
            <PersonalizedRequestSection
              userName={profile?.display_name || undefined}
              userEmail={user.email}
            />
            <RecommendedJournal userId={user.id} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <V3Header />
      <main className="flex-1 pt-24 pb-16">
        {/* Full-width header area */}
        <div className="container">
          <AccountHeader userId={user.id} userEmail={user.email} />
        </div>

        {/* Content with sidebar */}
        <div className="container">
          <div className="flex gap-10">
            {/* Sidebar */}
            <aside className="hidden md:block w-56 flex-shrink-0">
              <AccountSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AccountTab)} />
            </aside>

            {/* Main content area */}
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
      <LaunchFooter />
      {user && (
        <OnboardingFlow
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default Account;
