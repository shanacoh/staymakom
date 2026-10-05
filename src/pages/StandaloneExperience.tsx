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
import WhatsIncludedPhotos2 from "@/components/experience-test/WhatsIncludedPhotos2";
import EssentialsBlock from "@/components/experience/EssentialsBlock";
import AskTeam from "@/components/experience/AskTeam";
import HeroKeyFacts from "@/components/experience/HeroKeyFacts";
import { buildStandaloneKeyFacts } from "@/lib/heroKeyFacts";
import StandaloneExtrasSection from "@/components/experience-test/StandaloneExtrasSection";
import StandaloneRequestPanel from "@/components/experience-test/StandaloneRequestPanel";
import { ReviewsBlock } from "@/components/reviews/ReviewsBlock";
import { ReviewsTeaser } from "@/components/reviews/ReviewsTeaser";
import { ReassuranceLine } from "@/components/reviews/ReassuranceLine";
import { useReviewsSummary } from "@/hooks/useReviewsSummary";
import OtherStandaloneExperiences from "@/components/experience-test/OtherStandaloneExperiences";
import ShareWithFriendsSection from "@/components/experience/ShareWithFriendsSection";
import VitrineBookingBlockedDialog from "@/components/VitrineBookingBlockedDialog";

import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import MobileFooterMinimal from "@/components/MobileFooterMinimal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { SEOHead } from "@/components/SEOHead";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumbJsonLd";
import {
  trackExperiencePageViewed,
  trackTimeOnExperiencePage,
  trackExperienceViewed,
  trackExperienceEngaged,
  trackSectionViewed,
  trackParticipantsChanged,
  trackStandaloneDateSelected,
  trackSlotSelected,
  trackRateOptionSelected,
  trackExtraToggled,
  trackBookClicked,
  trackRequestClicked,
  trackBookingPanelOpened,
  trackVitrineBlockedShown,
  trackHeroCtaClicked,
  type ProductLike,
} from "@/lib/analytics";
import { useSetCurrentProduct } from "@/contexts/CurrentProductContext";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import type { SelectedExtra } from "@/components/experience-test/ExtrasSection2";
import { Users, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { fr, he } from "date-fns/locale";

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
  has_rate_options?: boolean | null;
  is_bookable?: boolean | null;
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
  accessibility_info_fr?: string | null;
  accessibility_info_he?: string | null;
  languages?: string[] | null;
  schedule_note?: string | null;
  schedule_note_fr?: string | null;
  schedule_note_he?: string | null;
  access_note?: string | null;
  access_note_fr?: string | null;
  access_note_he?: string | null;
  hide_exact_address?: boolean | null;
  session_labels?: Record<string, { en?: string; fr?: string; he?: string }> | null;
  essentials_private_on_request?: boolean | null;
  seo_title_en?: string | null;
  seo_title_fr?: string | null;
  seo_title_he?: string | null;
  meta_description_en?: string | null;
  meta_description_fr?: string | null;
  meta_description_he?: string | null;
  og_title_en?: string | null;
  og_title_fr?: string | null;
  og_title_he?: string | null;
  og_description_en?: string | null;
  og_description_fr?: string | null;
  og_description_he?: string | null;
  og_image?: string | null;
  standalone_experience_highlight_tags?: {
    tag_id: string;
    position: number;
    highlight_tags: { id: string; slug: string; label_en: string; label_he?: string | null };
  }[] | null;
}

interface RateOption {
  id: string;
  label: string;
  label_fr?: string | null;
  label_he?: string | null;
  price_adult: number;
  price_child?: number | null;
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


function toProductLike(experience: StandaloneExperienceData): ProductLike {
  return {
    slug: experience.slug,
    title: experience.title,
    category: experience.categories
      ? { slug: experience.categories.slug, name: experience.categories.name }
      : null,
    city: experience.city,
    region: experience.region,
    base_price: experience.base_price,
    base_price_type: experience.base_price_type,
    currency: experience.currency,
    is_bookable: experience.is_bookable,
  };
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
  const isVitrineContext = searchParams.get("context") === "vitrine";
  const [showVitrineDialog, setShowVitrineDialog] = useState(false);
  const { lang } = useLanguage();
  const footerRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const includedRef = useRef<HTMLDivElement>(null);
  const extrasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const essentialsRef = useRef<HTMLDivElement>(null);
  const otherExperiencesRef = useRef<HTMLDivElement>(null);

  // Booking form state (étape 1 uniquement — les étapes 2 et 3 sont dans StandaloneCheckout.tsx)
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedRateOptionId, setSelectedRateOptionId] = useState<string>("");
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);

  // Mobile booking Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBarHidden, setIsBarHidden] = useState(false);

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
        "lead_time_days", "has_time_slots", "time_slots", "has_rate_options", "is_bookable",
        "cancellation_policy", "cancellation_policy_fr", "cancellation_policy_he",
        "duration", "duration_fr", "duration_he",
        "address", "address_he", "address_fr",
        "city", "city_he", "city_fr",
        "region", "region_he", "region_fr",
        "latitude", "longitude",
        "accessibility_info", "accessibility_info_fr", "accessibility_info_he", "category_id", "status",
        "available_days", "blocked_dates", "availability_end_date",
        "availability_mode", "whitelisted_dates", "practical_info",
        "languages", "schedule_note", "schedule_note_fr", "schedule_note_he",
        "access_note", "access_note_fr", "access_note_he", "hide_exact_address",
        "session_labels", "essentials_private_on_request",
        "seo_title_en", "seo_title_fr", "seo_title_he",
        "meta_description_en", "meta_description_fr", "meta_description_he",
        "og_title_en", "og_title_fr", "og_title_he",
        "og_description_en", "og_description_fr", "og_description_he", "og_image",
      ].join(", ");

      // Une fiche est visible en détail si elle est publiée, ou si elle est en
      // brouillon mais explicitement partagée en vitrine (show_on_v3_only) —
      // même règle que la liste de la page /vitrine, pour éviter un "not found"
      // sur une carte pourtant visible en vitrine.
      const { data, error } = await (supabase as any)
        .from("standalone_experiences")
        .select(`${PUBLIC_COLUMNS}, standalone_experience_highlight_tags(tag_id, position, highlight_tags(id, slug, label_en, label_he)), categories(id, slug, name, name_fr, name_he, icon)`)
        .eq("slug", slug!)
        .or("status.eq.published,and(status.eq.draft,show_on_v3_only.eq.true)")
        .single();
      if (error) throw error;
      return data as StandaloneExperienceData;
    },
    enabled: !!slug,
  });

  const { data: rateOptions } = useQuery({
    queryKey: ["standalone-rate-options-public", experience?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_rate_options")
        .select("id, label, label_fr, label_he, price_adult, price_child")
        .eq("experience_id", experience!.id)
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data as RateOption[];
    },
    enabled: !!experience?.id && !!experience?.has_rate_options,
  });

  const selectedRateOption = (rateOptions ?? []).find((o) => o.id === selectedRateOptionId) ?? null;

  useSetCurrentProduct(experience ? toProductLike(experience) : null, "standalone");

  const handleToggleExtra = useCallback((extra: SelectedExtra) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      trackExtraToggled(experience?.slug ?? "", extra.name, !exists, extra.price);
      if (exists) return prev.filter((e) => e.id !== extra.id);
      return [...prev, extra];
    });
  }, [experience?.slug]);

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  useScrollDepth(`standalone/${slug}`);

  useEffect(() => {
    if (!experience?.slug) return;
    trackExperiencePageViewed(experience.slug, experience.title, experience.base_price);
    trackExperienceViewed(toProductLike(experience), "standalone");
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

  // experience_engaged : à 15/30/60/120s si l'onglet est visible, avec le scroll max atteint
  useEffect(() => {
    if (!experience?.slug) return;
    let maxScrollPercent = 0;
    const updateMaxScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((window.scrollY / docHeight) * 100);
      if (pct > maxScrollPercent) maxScrollPercent = pct;
    };
    window.addEventListener("scroll", updateMaxScroll, { passive: true });
    updateMaxScroll();

    const thresholds = [15, 30, 60, 120] as const;
    const timers = thresholds.map((seconds) =>
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          trackExperienceEngaged(toProductLike(experience), "standalone", seconds, maxScrollPercent);
        }
      }, seconds * 1000)
    );

    return () => {
      window.removeEventListener("scroll", updateMaxScroll);
      timers.forEach(clearTimeout);
    };
  }, [experience?.slug]);

  // section_viewed : une fois par section, dès qu'elle entre dans le viewport
  useEffect(() => {
    if (!experience?.slug) return;
    const sections: { ref: React.RefObject<HTMLElement>; name: "included" | "extras" | "map" | "reviews" | "essentials" | "other_experiences" }[] = [
      { ref: includedRef, name: "included" },
      { ref: extrasRef, name: "extras" },
      { ref: mapRef, name: "map" },
      { ref: reviewsRef, name: "reviews" },
      { ref: essentialsRef, name: "essentials" },
      { ref: otherExperiencesRef, name: "other_experiences" },
    ];
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const match = sections.find((s) => s.ref.current === entry.target);
          if (!match || seen.has(match.name)) return;
          seen.add(match.name);
          trackSectionViewed(match.name, experience.slug);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach((s) => {
      if (s.ref.current) observer.observe(s.ref.current);
    });
    return () => observer.disconnect();
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

  // /boat : quand ce bateau précis n'a pas encore d'avis, on élargit aux avis de la catégorie "bateaux".
  const { data: boatExperienceIdsForFallback } = useQuery({
    queryKey: ["boat-experience-ids-for-reviews-fallback"],
    queryFn: async () => {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "bateaux")
        .maybeSingle();
      if (!category) return [];
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id")
        .eq("category_id", category.id);
      if (error) return [];
      return (data || []).map((e) => e.id);
    },
    enabled: categorySlug === "bateaux",
    staleTime: 10 * 60 * 1000,
  });

  const { data: reviewsSummary } = useReviewsSummary({
    scope: "standalone_experience",
    entityId: experience?.id,
    fallbackExperienceIds: categorySlug === "bateaux" ? boatExperienceIdsForFallback : undefined,
  });

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
    ? selectedRateOption
      ? computeTotal(
          selectedRateOption.price_adult,
          selectedRateOption.price_child,
          experience.has_child_price,
          "per_person",
          adults,
          children,
        )
      : computeTotal(
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

    // Expérience non réservable en ligne : formulaire de demande à la place
    // du panneau de réservation/paiement.
    if (experience.is_bookable === false) {
      return (
        <StandaloneRequestPanel
          experienceId={experience.id}
          lang={lang as "en" | "fr" | "he"}
          minParty={experience.min_party}
          maxParty={experience.max_party}
          minDate={minDate}
          maxDate={maxDate}
          isDateUnavailable={isDateUnavailable}
          experienceTitle={title}
        />
      );
    }

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
      (!experience.has_time_slots || !!selectedSlot) &&
      (!experience.has_rate_options || !!selectedRateOptionId);

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
                    onClick={() => {
                      trackParticipantsChanged(experience.slug, Math.max(1, adults - 1), children);
                      setAdults((a) => Math.max(1, a - 1));
                    }}
                    disabled={adults <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] text-center font-semibold">{adults}</span>
                  <button
                    type="button"
                    onClick={() => {
                      trackParticipantsChanged(experience.slug, Math.min(experience.max_party - children, adults + 1), children);
                      setAdults((a) => Math.min(experience.max_party - children, a + 1));
                    }}
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
                    onClick={() => {
                      trackParticipantsChanged(experience.slug, adults, Math.max(0, children - 1));
                      setChildren((c) => Math.max(0, c - 1));
                    }}
                    disabled={children <= 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] text-center font-semibold">{children}</span>
                  <button
                    type="button"
                    onClick={() => {
                      trackParticipantsChanged(experience.slug, adults, Math.min(experience.max_party - adults, children + 1));
                      setChildren((c) => Math.min(experience.max_party - adults, c + 1));
                    }}
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
                  onClick={() => {
                    trackParticipantsChanged(experience.slug, Math.max(experience.min_party, adults - 1), children);
                    setAdults((a) => Math.max(experience.min_party, a - 1));
                  }}
                  disabled={adults <= experience.min_party}
                  className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
                >
                  −
                </button>
                <span className="min-w-[2ch] text-center font-semibold">{adults}</span>
                <button
                  type="button"
                  onClick={() => {
                    trackParticipantsChanged(experience.slug, Math.min(experience.max_party, adults + 1), children);
                    setAdults((a) => Math.min(experience.max_party, a + 1));
                  }}
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
              locale={lang === "fr" ? fr : lang === "he" ? he : undefined}
              selected={selectedDate ? new Date(selectedDate + "T12:00:00") : undefined}
              onSelect={(date) => {
                if (date) {
                  const daysAhead = Math.round(
                    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
                      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) /
                      86400000
                  );
                  trackStandaloneDateSelected(experience.slug, toLocalDateStr(date), daysAhead);
                }
                setSelectedDate(date ? toLocalDateStr(date) : "");
              }}
              disabled={isDateUnavailable}
              defaultMonth={new Date(minDate + "T12:00:00")}
              toDate={maxDate}
              classNames={{
                head_row: "flex w-full",
                head_cell: "flex-1 text-center text-muted-foreground font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
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
                  onClick={() => {
                    trackSlotSelected(experience.slug, slot);
                    setSelectedSlot(slot);
                  }}
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

        {/* Options tarifaires (formules à prix différents, ex: menus au restaurant) */}
        {experience.has_rate_options && (rateOptions?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              {lang === "he" ? "בחר תפריט" : lang === "fr" ? "Choisissez une formule" : "Choose a formula"}
            </p>
            <div className="space-y-2">
              {rateOptions!.map((option) => {
                const optionLabel =
                  lang === "he" ? option.label_he || option.label : lang === "fr" ? option.label_fr || option.label : option.label;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      trackRateOptionSelected(experience.slug, optionLabel, option.price_adult, experience.currency);
                      setSelectedRateOptionId(option.id);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      selectedRateOptionId === option.id
                        ? "border-[#ad1414] bg-[#FDF2F2]"
                        : "border-border hover:border-[#ad1414]/50"
                    )}
                  >
                    <span className="font-medium">{optionLabel}</span>
                    <span className="font-semibold whitespace-nowrap ml-2">
                      {currencySymbol}{option.price_adult.toFixed(0)} {priceLabel}
                    </span>
                  </button>
                );
              })}
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
            if (isVitrineContext) {
              trackVitrineBlockedShown(experience.slug);
              setShowVitrineDialog(true);
              return;
            }
            trackBookClicked(toProductLike(experience), "standalone", "panel");
            const checkoutState = {
              experienceId: experience.id,
              experienceSlug: experience.slug,
              experienceTitle: experience.title,
              experienceTitleFr: experience.title_fr,
              experienceTitleHe: experience.title_he,
              heroImage: experience.hero_image,
              selectedDate,
              selectedSlot: selectedSlot || null,
              selectedRateOptionId: selectedRateOptionId || null,
              selectedRateOptionLabel: selectedRateOption
                ? (lang === "he" ? selectedRateOption.label_he || selectedRateOption.label : lang === "fr" ? selectedRateOption.label_fr || selectedRateOption.label : selectedRateOption.label)
                : null,
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

        <ReassuranceLine lang={lang as "fr" | "en" | "he"} />

        {experience.cancellation_policy && (
          <p className="text-xs text-muted-foreground text-center">
            {getLocalizedField(experience, "cancellation_policy", lang) as string || experience.cancellation_policy}
          </p>
        )}

        <AskTeam placement="ask_team_panel" experienceTitle={title} lang={lang as "en" | "fr" | "he"} />

        <ReviewsTeaser
          reviews={reviewsSummary?.reviews ?? []}
          lang={lang as "fr" | "en" | "he"}
          onSeeAllClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}
        />
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
        titleEn={experience.seo_title_en || undefined}
        titleFr={experience.seo_title_fr || undefined}
        titleHe={experience.seo_title_he || undefined}
        description={subtitle}
        descriptionEn={experience.meta_description_en || undefined}
        descriptionFr={experience.meta_description_fr || undefined}
        descriptionHe={experience.meta_description_he || undefined}
        ogTitleEn={experience.og_title_en || undefined}
        ogTitleFr={experience.og_title_fr || undefined}
        ogTitleHe={experience.og_title_he || undefined}
        ogDescriptionEn={experience.og_description_en || undefined}
        ogDescriptionFr={experience.og_description_fr || undefined}
        ogDescriptionHe={experience.og_description_he || undefined}
        ogImage={experience.og_image || experience.hero_image || undefined}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": experience.title,
            "description": subtitle || undefined,
            "image": experience.hero_image || undefined,
            "url": `https://staymakom.com/standalone-experience/${experience.slug}`,
            "brand": { "@type": "Brand", "name": "STAYMAKOM" },
            ...(experience.base_price != null && {
              "offers": {
                "@type": "Offer",
                "price": experience.base_price,
                "priceCurrency": experience.currency || "ILS",
                "availability": "https://schema.org/InStock",
                "url": `https://staymakom.com/standalone-experience/${experience.slug}`
              }
            }),
            ...(reviewsSummary && reviewsSummary.count > 0 && reviewsSummary.averageRating != null && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": Number(reviewsSummary.averageRating.toFixed(1)),
                "reviewCount": reviewsSummary.count
              }
            })
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", url: "https://staymakom.com/" },
              {
                name: "Experience Only",
                url: categorySlug
                  ? `https://staymakom.com/category/${categorySlug}?mode=live`
                  : "https://staymakom.com/experiences?mode=live",
              },
              ...(categoryName && categorySlug
                ? [{ name: categoryName, url: `https://staymakom.com/category/${categorySlug}` }]
                : []),
              { name: title, url: `https://staymakom.com/standalone-experience/${experience.slug}` },
            ])
          ),
        }}
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
            experienceType="standalone"
            hotelId={undefined}
            categoryName={categoryName}
            categorySlug={categorySlug}
            categoryIcon={experience?.categories?.icon ?? undefined}
            experienceMode="live"
            minParty={experience.min_party}
            maxParty={experience.max_party}
            averageRating={reviewsSummary?.averageRating ?? null}
            reviewsCount={reviewsSummary?.count ?? 0}
            onScrollToReviews={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}
            slug={experience.slug}
            keyFacts={
              <HeroKeyFacts
                lang={lang as "en" | "he" | "fr"}
                facts={buildStandaloneKeyFacts(
                  {
                    duration: (getLocalizedField(experience, "duration", lang) as string) || experience.duration || null,
                    minParty: experience.min_party,
                    maxParty: experience.max_party,
                    cancellation_policy: experience.cancellation_policy,
                    cancellation_policy_fr: experience.cancellation_policy_fr,
                    cancellation_policy_he: experience.cancellation_policy_he,
                  },
                  lang as "en" | "he" | "fr",
                )}
                // Même valeur et même mise en forme que le panneau de réservation (aucun calcul).
                fromPrice={
                  experience.is_bookable === false
                    ? null
                    : {
                        amount: `${currencySymbol}${experience.base_price.toFixed(0)}`,
                        unit:
                          experience.base_price_type === "fixed"
                            ? (lang === "he" ? "מחיר קבוע" : lang === "fr" ? "forfait" : "fixed")
                            : (lang === "he" ? "לאדם" : lang === "fr" ? "/ pers." : "/ person"),
                      }
                }
                onSeeDates={() => {
                  trackHeroCtaClicked("see_dates", experience.slug);
                  // Ordinateur : on descend jusqu'au panneau. Mobile : on ouvre la feuille de réservation.
                  if (window.matchMedia("(min-width: 768px)").matches) {
                    document.getElementById("standalone-booking-panel")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    setIsSheetOpen(true);
                  }
                }}
              />
            }
          />
        </section>

        {/* Main content */}
        <div className="max-w-6xl mx-auto pb-24 md:pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 my-8">
          <div className="grid md:grid-cols-[65%_35%] gap-6 lg:gap-10">
            {/* Left Column */}
            <div className="space-y-10 md:space-y-12 min-w-0 overflow-x-hidden">
              {/* L'essentiel */}
              <div ref={essentialsRef} className="space-y-3">
                <EssentialsBlock experience={experience} experienceTitle={title} lang={lang as "en" | "fr" | "he"} />
                <div className="md:hidden">
                  <AskTeam placement="ask_team_mobile" experienceTitle={title} lang={lang as "en" | "fr" | "he"} />
                </div>
              </div>

              {/* What's on the program */}
              <div ref={includedRef}>
                <WhatsIncludedPhotos2
                  experienceId={experience.id}
                  lang={lang}
                  longCopy={longCopy}
                  source="standalone"
                />
              </div>

              {/* Extras */}
              <div ref={extrasRef}>
                <StandaloneExtrasSection
                  experienceId={experience.id}
                  lang={lang}
                  currency={experience.currency}
                  selectedExtras={selectedExtras}
                  onToggleExtra={handleToggleExtra}
                />
              </div>

              {/* Map */}
              {experience.latitude && experience.longitude && (
                <div ref={mapRef}>
                  <LocationMap
                    latitude={experience.latitude}
                    longitude={experience.longitude}
                    hotelName={title}
                    lang={lang as "en" | "he" | "fr"}
                  />
                </div>
              )}

              {/* Share with Friends */}
              <ShareWithFriendsSection
                title={title}
                lang={lang as "en" | "he" | "fr"}
              />

              {/* Reviews */}
              <div ref={reviewsRef}>
                <ReviewsBlock
                  reviews={reviewsSummary?.reviews ?? []}
                  averageRating={reviewsSummary?.averageRating ?? null}
                  lang={lang as "fr" | "en" | "he"}
                  scope="standalone_experience"
                  entityId={experience.id}
                />
              </div>

              {/* Other Experiences */}
              <div ref={otherExperiencesRef}>
                <OtherStandaloneExperiences
                  currentExperienceId={experience.id}
                  categoryId={experience.category_id ?? null}
                  lang={lang}
                />
              </div>
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
              onClick={() => {
                trackBookingPanelOpened(experience.slug);
                if (experience.is_bookable === false) {
                  trackRequestClicked(toProductLike(experience), "standalone", "mobile_bar");
                } else {
                  trackBookClicked(toProductLike(experience), "standalone", "mobile_bar");
                }
                setIsSheetOpen(true);
              }}
            >
              <div className="flex flex-col min-w-0">
                {experience.is_bookable === false ? (
                  <span className="text-base font-bold text-foreground whitespace-nowrap">
                    {lang === "he" ? "לפי בקשה" : lang === "fr" ? "Sur demande" : "On request"}
                  </span>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <span className="rounded-full bg-foreground text-background text-xs font-semibold px-5 py-2.5 shrink-0 ml-3 whitespace-nowrap">
                {experience.is_bookable === false
                  ? (lang === "he" ? "בקשה" : lang === "fr" ? "Demander" : "Request")
                  : (lang === "he" ? "הזמן" : lang === "fr" ? "Réserver" : "Book")}
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

        <VitrineBookingBlockedDialog
          open={showVitrineDialog}
          onClose={() => setShowVitrineDialog(false)}
          lang={lang as "en" | "he" | "fr"}
        />
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
