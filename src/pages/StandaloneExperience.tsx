/**
 * Page publique pour afficher une expérience "standalone" (sans hôtel).
 * Source de données : standalone_experiences (pas useExperience2).
 * Étape 1 uniquement : sélection des participants et de la date.
 * Le checkout (infos client + paiement) est délégué à StandaloneCheckout.tsx.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import HeroSection from "@/components/experience-test/HeroSection";
import LocationMap from "@/components/experience-test/LocationMap";
import PracticalInfo from "@/components/experience-test/PracticalInfo";
import WhatsIncludedPhotos2 from "@/components/experience-test/WhatsIncludedPhotos2";
import StandaloneExtrasSection from "@/components/experience-test/StandaloneExtrasSection";
import ReviewsGrid2 from "@/components/experience-test/ReviewsGrid2";
import OtherStandaloneExperiences from "@/components/experience-test/OtherStandaloneExperiences";
import ShareWithFriendsSection from "@/components/experience/ShareWithFriendsSection";

import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import MobileFooterMinimal from "@/components/MobileFooterMinimal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/useLanguage";
import { SEOHead } from "@/components/SEOHead";
import { trackExperiencePageViewed, trackTimeOnExperiencePage } from "@/lib/analytics";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import type { SelectedExtra } from "@/components/experience-test/ExtrasSection2";
import { Users, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StandaloneExperienceData {
  id: string;
  slug: string;
  title: string;
  title_fr?: string | null;
  title_he?: string | null;
  subtitle?: string | null;
  subtitle_fr?: string | null;
  subtitle_he?: string | null;
  long_copy?: string | null;
  long_copy_fr?: string | null;
  long_copy_he?: string | null;
  hero_image?: string | null;
  photos?: string[] | null;
  base_price: number;
  base_price_child?: number | null;
  has_child_price?: boolean | null;
  base_price_type: "per_person" | "fixed" | "per_person_per_night";
  currency: "USD" | "EUR" | "ILS";
  min_party: number;
  max_party: number;
  lead_time_days?: number | null;
  has_time_slots?: boolean | null;
  time_slots?: string[] | null;
  cancellation_policy?: string | null;
  cancellation_policy_fr?: string | null;
  cancellation_policy_he?: string | null;
  duration?: string | null;
  duration_fr?: string | null;
  duration_he?: string | null;
  address?: string | null;
  address_he?: string | null;
  address_fr?: string | null;
  city?: string | null;
  city_he?: string | null;
  city_fr?: string | null;
  region?: string | null;
  region_he?: string | null;
  region_fr?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accessibility_info?: string | null;
  category_id?: string | null;
  categories?: { id: string; slug: string; name: string; name_fr?: string | null; name_he?: string | null; icon?: string | null } | null;
  status: string;
  available_days?: number[] | null;
  blocked_dates?: string[] | null;
  availability_end_date?: string | null;
  availability_mode?: string | null;
  whitelisted_dates?: string[] | null;
  practical_info?: unknown;
  standalone_experience_highlight_tags?: {
    tag_id: string;
    position: number;
    highlight_tags: { id: string; slug: string; label_en: string; label_he?: string | null };
  }[] | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "₪";
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


function computeTotal(
  basePrice: number,
  basePriceChild: number | null | undefined,
  hasChildPrice: boolean | null | undefined,
  priceType: string,
  adults: number,
  children: number,
): number {
  if (priceType === "fixed") return basePrice;
  const childUnitPrice = hasChildPrice && basePriceChild ? basePriceChild : basePrice;
  return basePrice * adults + childUnitPrice * children;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StandaloneExperience() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLaunch = searchParams.get("context") === "launch";
  const { lang } = useLanguage();
  const footerRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  // Booking form state (étape 1 uniquement — les étapes 2 et 3 sont dans StandaloneCheckout.tsx)
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);

  // Mobile booking Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBarHidden, setIsBarHidden] = useState(false);

  const handleToggleExtra = useCallback((extra: SelectedExtra) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) return prev.filter((e) => e.id !== extra.id);
      return [...prev, extra];
    });
  }, []);

  // Sticky top tracking
  const [stickyTop, setStickyTop] = useState(80);

  useEffect(() => {
    const updateTop = () => {
      const header = document.querySelector("header") as HTMLElement | null;
      if (header) setStickyTop(header.getBoundingClientRect().height + 8);
    };
    updateTop();
    window.addEventListener("resize", updateTop);
    const observer = new ResizeObserver(updateTop);
    const header = document.querySelector("header");
    if (header) observer.observe(header);
    return () => {
      window.removeEventListener("resize", updateTop);
      observer.disconnect();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const { data: experience, isLoading, error } = useQuery({
    queryKey: ["standalone-experience-public", slug],
    queryFn: async () => {
      // Liste explicite (jamais "*") : exclut volontairement les colonnes admin-only
      // (supplier_price_adult, supplier_price_child, markup_percent) qui ne doivent
      // jamais transiter vers le navigateur d'un visiteur.
      const PUBLIC_COLUMNS = [
        "id", "slug", "title", "title_fr", "title_he",
        "subtitle", "subtitle_fr", "subtitle_he",
        "long_copy", "long_copy_fr", "long_copy_he",
        "hero_image", "photos",
        "base_price", "base_price_child", "has_child_price", "base_price_type", "currency", "min_party", "max_party",
        "lead_time_days", "has_time_slots", "time_slots",
        "cancellation_policy", "cancellation_policy_fr", "cancellation_policy_he",
        "duration", "duration_fr", "duration_he",
        "address", "address_he", "address_fr",
        "city", "city_he", "city_fr",
        "region", "region_he", "region_fr",
        "latitude", "longitude",
        "accessibility_info", "category_id", "status",
        "available_days", "blocked_dates", "availability_end_date",
        "availability_mode", "whitelisted_dates", "practical_info",
      ].join(", ");

      const { data, error } = await (supabase as any)
        .from("standalone_experiences")
        .select(`${PUBLIC_COLUMNS}, standalone_experience_highlight_tags(tag_id, position, highlight_tags(id, slug, label_en, label_he)), categories(id, slug, name, name_fr, name_he, icon)`)
        .eq("slug", slug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as StandaloneExperienceData;
    },
    enabled: !!slug,
  });

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  useScrollDepth(`standalone/${slug}`);

  useEffect(() => {
    if (!experience?.slug) return;
    trackExperiencePageViewed(experience.slug, experience.title, experience.base_price);
    const start = Date.now();
    const handleVisChange = () => {
      if (document.visibilityState === "hidden") {
        trackTimeOnExperiencePage(experience.slug, (Date.now() - start) / 1000);
      }
    };
    document.addEventListener("visibilitychange", handleVisChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisChange);
      trackTimeOnExperiencePage(experience.slug, (Date.now() - start) / 1000);
    };
  }, [experience?.slug]);

  // Initialise adults au minimum requis une fois l'expérience chargée
  useEffect(() => {
    if (experience?.min_party && adults < experience.min_party) {
      setAdults(experience.min_party);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience?.min_party]);

  // Masquer la barre booking quand le footer est visible
  useEffect(() => {
    const handleScroll = () => {
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        setIsBarHidden(rect.top < window.innerHeight);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const locCity = lang === "he" ? experience?.city_he || experience?.city : lang === "fr" ? experience?.city_fr || experience?.city : experience?.city;
  const locRegion = lang === "he" ? experience?.region_he || experience?.region : lang === "fr" ? experience?.region_fr || experience?.region : experience?.region;

  const categoryName = experience?.categories
    ? (lang === "fr" ? experience.categories.name_fr || experience.categories.name : lang === "he" ? experience.categories.name_he || experience.categories.name : experience.categories.name)
    : undefined;
  const categorySlug = experience?.categories?.slug ?? undefined;

  const currencySymbol = experience ? getCurrencySymbol(experience.currency) : "₪";
  const leadTimeDays = experience?.lead_time_days ?? 0;
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + leadTimeDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();
  const maxDate = experience?.availability_end_date
    ? new Date(experience.availability_end_date + "T23:59:59")
    : undefined;

  const totalPrice = experience
    ? computeTotal(
        experience.base_price,
        experience.base_price_child,
        experience.has_child_price,
        experience.base_price_type,
        adults,
        children,
      )
    : 0;

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const grandTotal = totalPrice + extrasTotal;

  const title =
    lang === "he"
      ? experience?.title_he || experience?.title || ""
      : lang === "fr"
      ? experience?.title_fr || experience?.title || ""
      : experience?.title || "";

  const subtitle =
    lang === "he"
      ? experience?.subtitle_he || experience?.subtitle || undefined
      : lang === "fr"
      ? experience?.subtitle_fr || experience?.subtitle || undefined
      : experience?.subtitle || undefined;

  const longCopy =
    lang === "he"
      ? experience?.long_copy_he || experience?.long_copy || undefined
      : lang === "fr"
      ? experience?.long_copy_fr || experience?.long_copy || undefined
      : experience?.long_copy || undefined;

  const photos: string[] = (() => {
    if (!experience) return [];
    const hero = experience.hero_image;
    const gallery = experience.photos ?? [];
    if (hero) return [hero, ...gallery.filter((p) => p !== hero)];
    return gallery;
  })();

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <V3Header />
        <div className="pt-16 max-w-6xl mx-auto px-4 pb-16">
          <Skeleton className="h-[55vh] w-full mt-4 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-12 mt-10">
            <div className="space-y-5">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-3 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-[97%]" />
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            </div>
            <div className="border rounded-2xl p-5 space-y-4 h-fit">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-3.5 w-2/3 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error / not found
  // -------------------------------------------------------------------------

  if (error || !experience) {
    const notFoundMsg =
      lang === "he"
        ? { title: "החוויה לא נמצאה", desc: "החוויה שחיפשת אינה קיימת או שאינה זמינה יותר." }
        : lang === "fr"
        ? { title: "Expérience non trouvée", desc: "L'expérience que vous recherchez n'existe pas ou n'est plus disponible." }
        : { title: "Experience not found", desc: "The experience you are looking for does not exist or is no longer available." };

    return (
      <div className="min-h-screen bg-background">
        <V3Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">{notFoundMsg.title}</h1>
            <p className="text-muted-foreground">{notFoundMsg.desc}</p>
          </div>
        </div>
        <LaunchFooter />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Booking panel render
  // -------------------------------------------------------------------------

  const renderBookingPanel = () => {
    const availableDays: number[] = experience.available_days ?? [1, 2, 3, 4, 5, 6, 7];
    const blockedDateStrings: string[] = (experience.blocked_dates as string[] | null) ?? [];
    const hasWeekdayRestriction = availableDays.length < 7;
    const isWhitelistMode = experience.availability_mode === "whitelist";
    const whitelistedSet = new Set<string>(
      isWhitelistMode ? (experience.whitelisted_dates as string[] | null) ?? [] : []
    );

    const isDateUnavailable = (date: Date): boolean => {
      const minDateObj = new Date(minDate + "T00:00:00");
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (d < minDateObj) return true;
      if (isWhitelistMode) {
        return !whitelistedSet.has(toLocalDateStr(date));
      }
      if (maxDate && d > maxDate) return true;
      if (hasWeekdayRestriction) {
        const availableJsDays = availableDays.map((n) => (n === 7 ? 0 : n));
        if (!availableJsDays.includes(date.getDay())) return true;
      }
      return blockedDateStrings.includes(toLocalDateStr(date));
    };

    const totalParty = adults + children;

    // ── Étape 1 : participants + date ────────────────────────────────────────
    const priceLabel =
      experience.base_price_type === "fixed"
        ? lang === "he" ? "מחיר קבוע" : lang === "fr" ? "Prix forfaitaire" : "Fixed price"
        : experience.has_child_price
        ? lang === "he" ? "לאדם" : lang === "fr" ? "/ adulte" : "/ adult"
        : lang === "he" ? "לאדם" : lang === "fr" ? "/ personne" : "/ person";

    const canProceedStep1 =
      !!selectedDate &&
      totalParty >= experience.min_party &&
      totalParty <= experience.max_party &&
      adults >= 1 &&
      (!experience.has_time_slots || !!selectedSlot);

    return (
      <div className="rounded-2xl border p-5 space-y-5 shadow-medium">
        {/* Affichage du prix */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {currencySymbol}{experience.base_price.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">{priceLabel}</span>
          </div>
          {experience.base_price_type === "fixed" && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                {lang === "he"
                  ? `עד ${experience.max_party} משתתפים`
                  : lang === "fr"
                  ? `jusqu'à ${experience.max_party} participants`
                  : `up to ${experience.max_party} participants`}
              </p>
              <p className="text-sm font-semibold text-[#ad1414]">
                {lang === "he"
                  ? `${currencySymbol}${(experience.base_price / totalParty).toFixed(0)} לאדם עבור ${totalParty} משתתף${totalParty > 1 ? "ים" : ""}`
                  : lang === "fr"
                  ? `soit ${currencySymbol}${(experience.base_price / totalParty).toFixed(0)} / personne pour ${totalParty} participant${totalParty > 1 ? "s" : ""}`
                  : `i.e. ${currencySymbol}${(experience.base_price / totalParty).toFixed(0)} / person for ${totalParty} participant${totalParty > 1 ? "s" : ""}`}
              </p>
            </div>
          )}
        </div>

        {/* Bloc participants — en premier */}
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-3.5 w-3.5 text-[#ad1414]" />
            {lang === "he" ? "משתתפים" : lang === "fr" ? "Participants" : "Participants"}
          </p>

          {experience.has_child_price ? (
            <>
              {/* Adultes */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    {lang === "he" ? "מבוגרים" : lang === "fr" ? "Adultes" : "Adults"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currencySymbol}{experience.base_price.toFixed(0)} / pers.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdults((a) => Math.max(1, a - 1))}
                    disabled={adults <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] text-center font-semibold">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults((a) => Math.min(experience.max_party - children, a + 1))}
                    disabled={totalParty >= experience.max_party}
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Enfants */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    {lang === "he" ? "ילדים" : lang === "fr" ? "Enfants" : "Children"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currencySymbol}{(experience.base_price_child ?? 0).toFixed(0)} / pers.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChildren((c) => Math.max(0, c - 1))}
                    disabled={children <= 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] text-center font-semibold">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren((c) => Math.min(experience.max_party - adults, c + 1))}
                    disabled={totalParty >= experience.max_party}
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Compteur unique quand pas de tarif enfant différencié */
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {lang === "he" ? "משתתפים" : lang === "fr" ? "Participants" : "Participants"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdults((a) => Math.max(experience.min_party, a - 1))}
                  disabled={adults <= experience.min_party}
                  className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                >
                  −
                </button>
                <span className="min-w-[2ch] text-center font-semibold">{adults}</span>
                <button
                  type="button"
                  onClick={() => setAdults((a) => Math.min(experience.max_party, a + 1))}
                  disabled={adults >= experience.max_party}
                  className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bloc date — en second */}
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Calendar className="h-3.5 w-3.5 text-[#ad1414]" />
            {lang === "he" ? "תאריך" : lang === "fr" ? "Date" : "Date"}
          </p>
          <div className="border rounded-lg overflow-hidden">
            <CalendarPicker
              mode="single"
              showOutsideDays
              selected={selectedDate ? new Date(selectedDate + "T12:00:00") : undefined}
              onSelect={(date) => setSelectedDate(date ? toLocalDateStr(date) : "")}
              disabled={isDateUnavailable}
              defaultMonth={new Date(minDate + "T12:00:00")}
              toDate={maxDate}
              classNames={{
                cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_selected:
                  "bg-[#ad1414] text-white hover:bg-[#ad1414] hover:text-white focus:bg-[#ad1414] focus:text-white",
                day_today: "bg-[#FDF0F0] text-[#ad1414] font-semibold rounded-lg",
                day_disabled: "text-muted-foreground/30 cursor-not-allowed",
                day_outside: "text-muted-foreground/30",
              }}
            />
          </div>
        </div>

        {/* Créneaux horaires */}
        {experience.has_time_slots && (experience.time_slots?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock className="h-3.5 w-3.5 text-[#ad1414]" />
              {lang === "he" ? "שעה" : lang === "fr" ? "Créneau" : "Time slot"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {experience.time_slots!.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "rounded-lg border py-2 text-sm font-medium transition-colors",
                    selectedSlot === slot
                      ? "border-[#ad1414] bg-[#ad1414] text-white"
                      : "border-border hover:border-[#ad1414]/50 hover:bg-[#FDF2F2]"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Extras sélectionnés — ligne de détail par extra */}
        {selectedExtras.length > 0 && (
          <div className="space-y-1.5 border-t pt-3">
            {selectedExtras.map((extra) => {
              const name = lang === "he" ? (extra.name_he || extra.name) : extra.name;
              return (
                <div key={extra.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-medium">+{currencySymbol}{extra.price.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Total dynamique — masqué pour les prix fixes sans extras */}
        {(experience.base_price_type !== "fixed" || extrasTotal > 0) && (
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {lang === "he" ? "סה\"כ" : lang === "fr" ? "Total" : "Total"}
            </span>
            <span className="font-bold text-lg">
              {currencySymbol}{grandTotal.toFixed(0)}
            </span>
          </div>
        )}

        {/* Bouton Continuer — navigue vers la page de checkout dédiée */}
        <Button
          type="button"
          className="w-full rounded-full text-base font-semibold h-12 bg-[#ad1414] text-white hover:bg-[#9a1212] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(173,20,20,0.4)] transition-all duration-200 normal-case"
          onClick={() => {
            const checkoutState = {
              experienceId: experience.id,
              experienceSlug: experience.slug,
              experienceTitle: experience.title,
              experienceTitleFr: experience.title_fr,
              experienceTitleHe: experience.title_he,
              heroImage: experience.hero_image,
              selectedDate,
              selectedSlot: selectedSlot || null,
              adults,
              children,
              basePrice: experience.base_price,
              basePriceChild: experience.base_price_child,
              hasChildPrice: experience.has_child_price,
              basePriceType: experience.base_price_type,
              currency: experience.currency,
              lang,
              totalPrice: grandTotal,
              selectedExtras,
            };
            try {
              localStorage.setItem("staymakom_standalone_cart", JSON.stringify({
                ...checkoutState,
                savedAt: new Date().toISOString(),
              }));
            } catch {
              // localStorage indisponible — on continue sans fallback
            }
            navigate("/standalone-checkout", { state: checkoutState });
          }}
          disabled={!canProceedStep1}
        >
          {lang === "he" ? "המשך ←" : lang === "fr" ? "Continuer →" : "Continue →"}
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ overflowX: "clip" }}
      dir={lang === "he" ? "rtl" : "ltr"}
    >
      <SEOHead
        title={title}
        description={subtitle}
        ogImage={experience.hero_image || undefined}
      />

      <V3Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section>
          <HeroSection
            photos={photos.filter(Boolean)}
            title={title}
            subtitle={subtitle}
            hotelName={undefined}
            hotelImage={undefined}
            city={locCity || undefined}
            region={locRegion || undefined}
            latitude={experience.latitude ?? undefined}
            longitude={experience.longitude ?? undefined}
            lang={lang as "en" | "he" | "fr"}
            experienceId={experience.id}
            hotelId={undefined}
            categoryName={categoryName}
            categorySlug={categorySlug}
            categoryIcon={experience?.categories?.icon ?? undefined}
            minParty={experience.min_party}
            maxParty={experience.max_party}
            averageRating={null}
            reviewsCount={0}
            onScrollToReviews={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}
            slug={experience.slug}
          />
        </section>

        {/* Main content */}
        <div className="max-w-6xl mx-auto pb-24 md:pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 my-8">
          <div className="grid md:grid-cols-[65%_35%] gap-6 lg:gap-10">
            {/* Left Column */}
            <div className="space-y-10 md:space-y-12 min-w-0 overflow-x-hidden">
              {/* What's on the program */}
              <WhatsIncludedPhotos2
                experienceId={experience.id}
                lang={lang}
                longCopy={longCopy}
                source="standalone"
              />

              {/* Extras */}
              <StandaloneExtrasSection
                experienceId={experience.id}
                lang={lang}
                currency={experience.currency}
                selectedExtras={selectedExtras}
                onToggleExtra={handleToggleExtra}
              />

              {/* Map */}
              {experience.latitude && experience.longitude && (
                <LocationMap
                  latitude={experience.latitude}
                  longitude={experience.longitude}
                  hotelName={title}
                  lang={lang as "en" | "he" | "fr"}
                />
              )}

              {/* Share with Friends */}
              <ShareWithFriendsSection
                title={title}
                lang={lang as "en" | "he" | "fr"}
              />

              {/* Reviews */}
              <div ref={reviewsRef}>
                <ReviewsGrid2 experienceId={experience.id} lang={lang} />
              </div>

              {/* Things to know */}
              <PracticalInfo
                experience={experience as any}
                lang={lang as "en" | "he" | "fr"}
              />

              {/* Other Experiences */}
              <OtherStandaloneExperiences
                currentExperienceId={experience.id}
                categoryId={experience.category_id ?? null}
                lang={lang}
              />
            </div>

            {/* Right Column — Sticky Booking Panel (Desktop) */}
            <div className="hidden md:block pr-1 md:-mt-10">
              <div
                className="sticky flex flex-col gap-3 will-change-transform"
                style={{
                  top: `${stickyTop}px`,
                  maxHeight: `calc(100vh - ${stickyTop}px - 16px)`,
                }}
              >
                <div id="standalone-booking-panel" className="flex-1 min-h-0 flex flex-col overflow-y-auto">
                  {renderBookingPanel()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile booking bar — remplace la nav bar du bas */}
        <div
          className={cn(
            "md:hidden fixed left-0 right-0 bottom-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all duration-300",
            isBarHidden ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="px-4">
            <button
              className="flex items-center justify-between py-3.5 w-full text-left min-h-[52px]"
              onClick={() => setIsSheetOpen(true)}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-foreground whitespace-nowrap">
                    {currencySymbol}{experience.base_price.toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {experience.base_price_type === "fixed"
                      ? (lang === "fr" ? "forfait" : "fixed")
                      : (lang === "he" ? "לאדם" : lang === "fr" ? "/ pers." : "/ person")}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {experience.base_price_type === "fixed"
                    ? (lang === "he" ? `עד ${experience.max_party} משתתפים` : lang === "fr" ? `jusqu'à ${experience.max_party} participants` : `up to ${experience.max_party} participants`)
                    : (lang === "he" ? `מינימום ${experience.min_party} משתתפים` : lang === "fr" ? `à partir de ${experience.min_party} participants` : `from ${experience.min_party} guests`)}
                </span>
              </div>
              <span className="rounded-full bg-foreground text-background text-xs font-semibold px-5 py-2.5 shrink-0 ml-3 whitespace-nowrap">
                {lang === "he" ? "הזמן" : lang === "fr" ? "Réserver" : "Book"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile booking Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-4">
              {renderBookingPanel()}
            </div>
          </SheetContent>
        </Sheet>
      </main>

      <footer ref={footerRef as React.RefObject<HTMLElement>}>
        <div className="hidden md:block">
          <LaunchFooter />
        </div>
        <MobileFooterMinimal />
      </footer>

    </div>
  );
}
