/**
 * Page publique V2 pour afficher une expérience
 * Supporte le parcours multi-hôtels via experience2_hotels
 * Utilise experiences2 + hotels2 + intégration HyperGuest
 */
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useExperience2 } from "@/hooks/useExperience2";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingPanel2 } from "@/components/experience/BookingPanel2";
import HeroSection from "@/components/experience-test/HeroSection";
import HeroBookingPreview2 from "@/components/experience-test/HeroBookingPreview2";

import YourStaySection from "@/components/experience-test/YourStaySection";
import LocationMap from "@/components/experience-test/LocationMap";
import StickyPriceBar from "@/components/experience-test/StickyPriceBar";
import PracticalInfo from "@/components/experience-test/PracticalInfo";
import ReviewsGrid2 from "@/components/experience-test/ReviewsGrid2";
import ExtrasSection2, { type SelectedExtra } from "@/components/experience-test/ExtrasSection2";
import ShareWithFriendsSection from "@/components/experience/ShareWithFriendsSection";
import OtherExperiences2 from "@/components/experience-test/OtherExperiences2";
import WhatsIncludedPhotos2 from "@/components/experience-test/WhatsIncludedPhotos2";
import Header from "@/components/Header";
import LaunchHeader from "@/components/LaunchHeader";
import Footer from "@/components/Footer";
import LaunchFooter from "@/components/LaunchFooter";
import MobileFooterMinimal from "@/components/MobileFooterMinimal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { SEOHead } from "@/components/SEOHead";
import { trackExperiencePageViewed, trackTimeOnExperiencePage } from "@/lib/analytics";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { MapPin, Moon } from "lucide-react";

export default function Experience2() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isLaunch = searchParams.get("context") === "launch";
  const { lang } = useLanguage();
  const { data: experience, isLoading, error } = useExperience2(slug || null);
  const footerRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [stickyTop, setStickyTop] = useState(80);

  // Dynamic sticky top based on header height
  useEffect(() => {
    const updateTop = () => {
      const header = document.querySelector('header') as HTMLElement | null;
      if (header) {
        setStickyTop(header.getBoundingClientRect().height + 8);
      }
    };
    updateTop();
    window.addEventListener('resize', updateTop);
    const observer = new ResizeObserver(updateTop);
    const header = document.querySelector('header');
    if (header) observer.observe(header);
    return () => {
      window.removeEventListener('resize', updateTop);
      observer.disconnect();
    };
  }, []);

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleExtra = useCallback((extra: SelectedExtra) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) return prev.filter((e) => e.id !== extra.id);
      return [...prev, extra];
    });
  }, []);

  const t = {
    en: {
      notFound: "Experience not found",
      notFoundDesc: "The experience you are looking for does not exist or is no longer available.",
      notConfigured: "Hotel not configured",
      notConfiguredDesc: "This experience is not yet available for booking.",
      viewDates: "View availability",
      yourJourney: "Your Journey",
      nightsAt: "nights at",
      night: "night",
      nights: "nights",
      step: "Step",
    },
    he: {
      notFound: "החוויה לא נמצאה",
      notFoundDesc: "החוויה שחיפשת אינה קיימת או שאינה זמינה יותר.",
      notConfigured: "המלון לא מוגדר",
      notConfiguredDesc: "חוויה זו אינה זמינה עדיין להזמנה.",
      viewDates: "לתאריכים",
      yourJourney: "המסלול שלך",
      nightsAt: "לילות ב",
      night: "לילה",
      nights: "לילות",
      step: "תחנה",
    },
    fr: {
      notFound: "Expérience non trouvée",
      notFoundDesc: "L'expérience que vous recherchez n'existe pas ou n'est plus disponible.",
      notConfigured: "Hôtel non configuré",
      notConfiguredDesc: "Cette expérience n'est pas encore disponible pour la réservation.",
      viewDates: "Voir les disponibilités",
      yourJourney: "Votre Parcours",
      nightsAt: "nuits à",
      night: "nuit",
      nights: "nuits",
      step: "Étape",
    },
  }[lang] || {
    notFound: "Experience not found",
    notFoundDesc: "The experience you are looking for does not exist or is no longer available.",
    notConfigured: "Hotel not configured",
    notConfiguredDesc: "This experience is not yet available for booking.",
    viewDates: "View availability",
    yourJourney: "Your Journey",
    nightsAt: "nights at",
    night: "night",
    nights: "nights",
    step: "Step",
  };

  // ---------------------------------------------------------------------------
  // Multi-hotel parcours data (must be before any early return for hooks)
  // ---------------------------------------------------------------------------

  const parcoursHotels: {
    position: number;
    nights: number;
    notes: string | null;
    notes_he: string | null;
    hotel: any;
  }[] = ((experience as any)?.experience2_hotels || []).map((eh: any) => ({
    position: eh.position ?? 1,
    nights: eh.nights ?? 1,
    notes: eh.notes ?? null,
    notes_he: eh.notes_he ?? null,
    hotel: eh.hotels2,
  }));

  const legacyHotel = experience?.hotels2;
  const hasMultiHotel = parcoursHotels.length > 0;

  const allHotelPhotos = useMemo(() => {
    if (hasMultiHotel) {
      const photos: string[] = [];
      for (const ph of parcoursHotels) {
        if (ph.hotel?.hero_image) photos.push(ph.hotel.hero_image);
        if (Array.isArray(ph.hotel?.photos)) {
          photos.push(...ph.hotel.photos);
        }
      }
      return photos;
    }
    if (legacyHotel) {
      return [legacyHotel.hero_image, ...(legacyHotel.photos || [])].filter(Boolean) as string[];
    }
    return [];
  }, [hasMultiHotel, parcoursHotels, legacyHotel]);

  // ---------------------------------------------------------------------------
  // Reviews for rating display in hero
  // ---------------------------------------------------------------------------

  const { data: reviewsData } = useQuery({
    queryKey: ["experience2-reviews-rating", experience?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience2_reviews")
        .select("rating")
        .eq("experience_id", experience!.id)
        .eq("is_visible", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!experience?.id,
  });

  const reviewsCount = reviewsData?.length ?? 0;
  const averageRating = reviewsCount > 0
    ? reviewsData!.reduce((acc, r) => acc + r.rating, 0) / reviewsCount
    : null;

  // ---------------------------------------------------------------------------
  // Availability rules (public, only active)
  // ---------------------------------------------------------------------------

  const { data: availabilityRules = [] } = useQuery({
    queryKey: ["availability_rules_public", experience?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience2_availability_rules")
        .select("id, rule_type, days_of_week, date_from, date_to, specific_dates, label, label_he, origin")
        .eq("experience_id", experience!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        rule_type: string;
        days_of_week: number[] | null;
        date_from: string | null;
        date_to: string | null;
        specific_dates: string[] | null;
        label: string | null;
        label_he: string | null;
        origin: string;
      }>;
    },
    enabled: !!experience?.id,
  });

  // Analytics: scroll depth
  useScrollDepth(`experience/${slug}`);

  // Analytics: track page view + time on page
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

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {isLaunch ? <LaunchHeader forceScrolled /> : <Header />}
        <div className="pt-16 max-w-6xl mx-auto px-4 pb-16">
          <Skeleton className="h-[55vh] w-full mt-4" />
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-12 mt-10">
            <div className="space-y-5">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-20" />
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
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error / not found
  // ---------------------------------------------------------------------------

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-background">
        {isLaunch ? <LaunchHeader forceScrolled /> : <Header />}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">{t.notFound}</h1>
            <p className="text-muted-foreground">{t.notFoundDesc}</p>
          </div>
        </div>
        {isLaunch ? <LaunchFooter /> : <Footer />}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived data (after early returns, no hooks below)
  // ---------------------------------------------------------------------------

  const primaryHotel = hasMultiHotel ? parcoursHotels[0]?.hotel : legacyHotel;
  const category = experience.categories;
  const hyperguestPropertyId = primaryHotel?.hyperguest_property_id;

  // All prices are computed in ILS internally, converted at display time via CurrencyContext
  const displayCurrency = "ILS";

  // Photos rule: if experience has its own hero/gallery → use only those (never mix with hotel photos)
  // If experience has NO photos at all → fall back to hotel photos so there's always something to show
  const hasExpPhotos = !!experience.hero_image || (experience.photos?.length ?? 0) > 0;
  const expHero = experience.hero_image;
  const expGallery: string[] = experience.photos ?? [];

  const photos: string[] = hasExpPhotos
    ? expHero
      ? [expHero, ...expGallery.filter((p: string) => p !== expHero)]
      : expGallery
    : allHotelPhotos.length > 0
      ? allHotelPhotos
      : ([primaryHotel?.hero_image].filter(Boolean) as string[]);

  // ---------------------------------------------------------------------------
  // Localized content
  // ---------------------------------------------------------------------------

  const title = lang === "he" ? experience.title_he || experience.title : experience.title;
  const subtitle = lang === "he" ? experience.subtitle_he || experience.subtitle : experience.subtitle;
  const primaryHotelName = lang === "he" ? primaryHotel?.name_he || primaryHotel?.name : primaryHotel?.name;
  const city = lang === "he" ? primaryHotel?.city_he || primaryHotel?.city : primaryHotel?.city;
  const region = lang === "he" ? primaryHotel?.region_he || primaryHotel?.region : primaryHotel?.region;
  const categoryName = lang === "he" ? category?.name_he || category?.name : category?.name;
  const longCopy = lang === "he" ? experience.long_copy_he || experience.long_copy : experience.long_copy;

  // ---------------------------------------------------------------------------
  // Build hotel data for YourStaySection (per hotel)
  // ---------------------------------------------------------------------------

  const buildHotelData = (hotel: any) => {
    if (!hotel) return null;
    return {
      id: hotel.id,
      name: hotel.name,
      name_he: hotel.name_he || undefined,
      slug: hotel.slug,
      hero_image: hotel.hero_image || undefined,
      photos: hotel.photos || undefined,
      city: hotel.city || undefined,
      city_he: hotel.city_he || undefined,
      region: hotel.region || undefined,
      region_he: hotel.region_he || undefined,
      star_rating: hotel.star_rating ?? undefined,
      check_in_time: hotel.check_in_time || undefined,
      check_out_time: hotel.check_out_time || undefined,
      number_of_rooms: hotel.number_of_rooms ?? undefined,
      property_type: hotel.property_type || undefined,
      latitude: hotel.latitude ?? undefined,
      longitude: hotel.longitude ?? undefined,
    };
  };


  // ---------------------------------------------------------------------------
  // Compute total nights for display
  // ---------------------------------------------------------------------------

  const totalNights = hasMultiHotel ? parcoursHotels.reduce((sum, ph) => sum + (ph.nights || 1), 0) : null;

  // ---------------------------------------------------------------------------
  // Render: Journey overview for multi-hotel
  // ---------------------------------------------------------------------------

  const renderJourneyOverview = () => {
    if (!hasMultiHotel || parcoursHotels.length <= 1) return null;

    return (
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold">{t.yourJourney}</h2>
        {totalNights && (
          <p className="text-muted-foreground">
            {totalNights} {totalNights === 1 ? t.night : t.nights}
          </p>
        )}
        <div className="relative">
          {/* Vertical line connecting steps */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {parcoursHotels.map((ph, idx) => {
              const hotelName = lang === "he" ? ph.hotel?.name_he || ph.hotel?.name : ph.hotel?.name;
              const hotelCity = lang === "he" ? ph.hotel?.city_he || ph.hotel?.city : ph.hotel?.city;
              const notes = lang === "he" ? ph.notes_he || ph.notes : ph.notes;

              return (
                <div key={ph.hotel?.id || idx} className="relative flex gap-4">
                  {/* Step indicator */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {idx + 1}
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="flex items-start gap-4">
                      {/* Hotel thumbnail */}
                      {ph.hotel?.hero_image && (
                        <img
                          src={ph.hotel.hero_image}
                          alt={hotelName || ""}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{hotelName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Moon className="h-4 w-4" />
                          <span>
                            {ph.nights} {ph.nights === 1 ? t.night : t.nights}
                          </span>
                          {hotelCity && (
                            <>
                              <MapPin className="h-4 w-4 ml-2" />
                              <span>{hotelCity}</span>
                            </>
                          )}
                        </div>
                        {notes && <p className="text-sm text-muted-foreground mt-1">{notes}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Hotels stay sections
  // ---------------------------------------------------------------------------

  const renderStaySections = () => {
    if (hasMultiHotel) {
      return parcoursHotels.map((ph, idx) => {
        const hotelData = buildHotelData(ph.hotel);
        if (!hotelData) return null;
        return <YourStaySection key={ph.hotel?.id || idx} hotel={hotelData} lang={lang as "en" | "he" | "fr"} />;
      });
    }

    // Legacy single hotel
    const hotelData = buildHotelData(legacyHotel);
    if (!hotelData) return null;
    return <YourStaySection hotel={hotelData} lang={lang as "en" | "he" | "fr"} />;
  };

  // ---------------------------------------------------------------------------
  // Render: Location maps for all hotels
  // ---------------------------------------------------------------------------

  const renderMaps = () => {
    if (hasMultiHotel) {
      return parcoursHotels
        .filter((ph) => ph.hotel?.latitude && ph.hotel?.longitude)
        .map((ph, idx) => {
          const hotelName = lang === "he" ? ph.hotel?.name_he || ph.hotel?.name : ph.hotel?.name;
          return (
            <LocationMap
              key={ph.hotel?.id || idx}
              latitude={ph.hotel.latitude}
              longitude={ph.hotel.longitude}
              hotelName={hotelName || ""}
              lang={lang as "en" | "he" | "fr"}
            />
          );
        });
    }

    // Legacy single hotel
    if (legacyHotel?.latitude && legacyHotel?.longitude) {
      return (
        <LocationMap
          latitude={legacyHotel.latitude}
          longitude={legacyHotel.longitude}
          hotelName={primaryHotelName || ""}
          lang={lang as "en" | "he" | "fr"}
        />
      );
    }

    return null;
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: 'clip' }} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <SEOHead
        title={title}
        description={subtitle || undefined}
        ogImage={experience.hero_image || primaryHotel?.hero_image || undefined}
      />

      {isLaunch ? <LaunchHeader forceScrolled /> : <Header />}

      <main className="flex-1">
        {/* Hero Section */}
        <section>
          <HeroSection
        photos={photos.filter(Boolean)}
        title={title}
        subtitle={subtitle || undefined}
        hotelName={primaryHotelName}
        hotelImage={primaryHotel?.hero_image || undefined}
        city={city || undefined}
        region={region || undefined}
        latitude={primaryHotel?.latitude ?? undefined}
        longitude={primaryHotel?.longitude ?? undefined}
        lang={lang as "en" | "he" | "fr"}
        experienceId={experience.id}
        hotelId={primaryHotel?.id}
        categoryName={categoryName || undefined}
        categorySlug={category?.slug || undefined}
        minParty={experience.min_party || 2}
        maxParty={experience.max_party || 4}
        averageRating={averageRating}
        reviewsCount={reviewsCount}
        onScrollToReviews={scrollToReviews}
        slug={experience.slug}
      />
        </section>

      {/* Contenu principal — aligned to V1 layout */}
      <div className="max-w-6xl mx-auto pb-28 md:pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 my-8">
        <div className="grid md:grid-cols-[65%_35%] gap-6 lg:gap-10">
          {/* Left Column - Content */}
          <div className="space-y-10 md:space-y-12 min-w-0 overflow-x-hidden">
            {/* Journey Overview (multi-hotel) */}
            {renderJourneyOverview()}

            {/* What's on the program */}
            <WhatsIncludedPhotos2 experienceId={experience.id} lang={lang} longCopy={longCopy || undefined} />

            {/* Extras / Add-ons */}
            <ExtrasSection2
              experienceId={experience.id}
              lang={lang}
              currency={displayCurrency}
              selectedExtras={selectedExtras}
              onToggleExtra={handleToggleExtra}
            />

            {/* Hotel stay section(s) */}
            {renderStaySections()}

            {/* Location map(s) */}
            {renderMaps()}

            {/* Share with Friends — below map */}
            <ShareWithFriendsSection
              title={title}
              lang={lang as "en" | "he" | "fr"}
            />

            {/* Reviews */}
            <div ref={reviewsRef}>
              <ReviewsGrid2 experienceId={experience.id} lang={lang} />
            </div>

            {/* Practical Info - Things to know */}
            <PracticalInfo experience={experience} lang={lang as "en" | "he" | "fr"} />

            {/* Other Experiences */}
            <OtherExperiences2
              currentExperienceId={experience.id}
              categoryId={category?.id ?? null}
              lang={lang}
            />
          </div>

          {/* Right Column - Sticky Booking Panel (Desktop) */}
          <div className="hidden md:block pr-1 md:-mt-10">
            {/* Price callout — non sticky, scrolls with page */}
            <div className="mb-3">
              <HeroBookingPreview2
                experienceId={experience.id}
                currency={displayCurrency}
                lang={lang as "en" | "he" | "fr"}
                hyperguestPropertyId={hyperguestPropertyId || null}
                minParty={experience.min_party || 2}
                minNights={experience.min_nights || 1}
                onViewDates={() => {
                  const bookingPanel = document.getElementById('booking-panel-v2');
                  if (bookingPanel) {
                    bookingPanel.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            </div>

            <div
              className="sticky flex flex-col gap-3 will-change-transform"
              style={{
                top: `${stickyTop}px`,
                maxHeight: `calc(100vh - ${stickyTop}px - 16px)`,
              }}
            >
              {/* Availability rules notice */}
              {availabilityRules.length > 0 && (
                <div className="shrink-0 rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1.5">
                  <p className="text-xs font-medium flex items-center gap-1.5 text-foreground/80">
                    <span>📅</span>
                    {lang === "he" ? "זמינות" : "Disponibilité"}
                  </p>
                  <ul className="space-y-1">
                    {availabilityRules.map((rule) => {
                      const msg = lang === "he" ? rule.label_he : rule.label;
                      if (!msg) return null;
                      return (
                        <li key={rule.id} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-foreground/40 shrink-0">·</span>
                          <span>{msg}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div id="booking-panel-v2" className="flex-1 min-h-0 flex flex-col">
                <BookingPanel2
                  experienceId={experience.id}
                  experienceTitle={lang === "he" ? experience.title_he || experience.title : experience.title}
                  experienceSlug={experience.slug}
                  hotelId={primaryHotel?.id || ""}
                  hotelName={lang === "he" ? (primaryHotel?.name_he || primaryHotel?.name || "") : (primaryHotel?.name || "")}
                  hyperguestPropertyId={hyperguestPropertyId || null}
                  currency={displayCurrency}
                  minParty={experience.min_party || 2}
                  maxParty={experience.max_party || 4}
                  lang={lang as "en" | "he" | "fr"}
                  selectedExtras={selectedExtras}
                  onToggleExtra={handleToggleExtra}
                  availabilityRules={availabilityRules}
                  adultsOnly={primaryHotel?.adults_only ?? false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Mobile Sticky Price Bar — sits above bottom nav */}
        <StickyPriceBar
          experienceId={experience.id}
          currency={displayCurrency}
          lang={lang as "en" | "he" | "fr"}
          onViewDates={() => setIsSheetOpen(true)}
          footerRef={footerRef}
          hyperguestPropertyId={hyperguestPropertyId || null}
          selectedExtrasTotal={selectedExtras.reduce((sum, e) => sum + e.price, 0)}
          minParty={experience.min_party || 2}
          minNights={experience.min_nights || 1}
        />

        {/* Mobile Booking Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh] overflow-y-auto p-0">
            <div className="p-6 space-y-4">
              {availabilityRules.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1.5">
                  <p className="text-xs font-medium flex items-center gap-1.5 text-foreground/80">
                    <span>📅</span>
                    {lang === "he" ? "זמינות" : "Disponibilité"}
                  </p>
                  <ul className="space-y-1">
                    {availabilityRules.map((rule) => {
                      const msg = lang === "he" ? rule.label_he : rule.label;
                      if (!msg) return null;
                      return (
                        <li key={rule.id} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-foreground/40 shrink-0">·</span>
                          <span>{msg}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <BookingPanel2
                experienceId={experience.id}
                experienceTitle={lang === "he" ? experience.title_he || experience.title : experience.title}
                experienceSlug={experience.slug}
                hotelId={primaryHotel?.id || ""}
                hotelName={lang === "he" ? (primaryHotel?.name_he || primaryHotel?.name || "") : (primaryHotel?.name || "")}
                hyperguestPropertyId={hyperguestPropertyId || null}
                currency={displayCurrency}
                minParty={experience.min_party || 2}
                maxParty={experience.max_party || 4}
                lang={lang as "en" | "he" | "fr"}
                selectedExtras={selectedExtras}
                onToggleExtra={handleToggleExtra}
                availabilityRules={availabilityRules}
                adultsOnly={primaryHotel?.adults_only ?? false}
              />
            </div>
          </SheetContent>
        </Sheet>
      </main>

      <footer ref={footerRef as React.RefObject<HTMLElement>}>
        {/* Desktop: full footer, Mobile: minimal copyright */}
        <div className="hidden md:block">
          {isLaunch ? <LaunchFooter /> : <Footer />}
        </div>
        <MobileFooterMinimal />
      </footer>
    </div>
  );
}
