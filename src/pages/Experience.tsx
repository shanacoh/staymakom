import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";

// New template components
import HeroSection from "@/components/experience-test/HeroSection";
import ProgramTimeline from "@/components/experience-test/ProgramTimeline";
import YourStaySection from "@/components/experience-test/YourStaySection";
import LocationMap from "@/components/experience-test/LocationMap";
import ReviewsGrid from "@/components/experience-test/ReviewsGrid";
import StickyPriceBar from "@/components/experience-test/StickyPriceBar";
import PracticalInfo from "@/components/experience-test/PracticalInfo";
import HeroBookingPreview from "@/components/experience-test/HeroBookingPreview";

// Keep existing components that are still needed
import BookingPanel from "@/components/experience/BookingPanel";
import ExtrasSection from "@/components/experience/ExtrasSection";
import ShareWithFriendsSection from "@/components/experience/ShareWithFriendsSection";
import OtherExperiencesFromHotel from "@/components/experience/OtherExperiencesFromHotel";

const Experience = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const [selectedExtras, setSelectedExtras] = useState<{ [key: string]: number }>({});
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  
  const footerRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { data: experience, isLoading } = useQuery({
    queryKey: ["experience", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          *,
          hotels (*),
          categories (id, name, name_he, slug)
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  const { data: includes } = useQuery({
    queryKey: ["experience-includes", experience?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience_includes")
        .select("*")
        .eq("experience_id", experience?.id)
        .eq("published", true)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!experience?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["experience-reviews", experience?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience_reviews")
        .select("*")
        .eq("experience_id", experience?.id)
        .eq("published", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!experience?.id,
  });

  const { data: extras } = useQuery({
    queryKey: ["experience-extras", experience?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_extras")
        .select(`
          extra_id,
          extras (*)
        `)
        .eq("experience_id", experience?.id);

      if (error) throw error;
      
      return data
        ?.map((item: any) => item.extras)
        .filter((extra: any) => extra && extra.is_available)
        .sort((a: any, b: any) => (a?.sort_order || 0) - (b?.sort_order || 0)) || [];
    },
    enabled: !!experience?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t(lang, 'experienceNotFound')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Get localized content
  const title = getLocalizedField(experience, 'title', lang) as string || experience.title;
  const subtitle = getLocalizedField(experience, 'subtitle', lang) as string || experience.subtitle;
  const longCopy = getLocalizedField(experience, 'long_copy', lang) as string || experience.long_copy;
  const hotelName = getLocalizedField(experience.hotels, 'name', lang) as string || experience.hotels?.name;
  const city = getLocalizedField(experience.hotels, 'city', lang) as string || experience.hotels?.city;
  const region = getLocalizedField(experience.hotels, 'region', lang) as string || experience.hotels?.region;
  
  // Get category info
  const categoryName = getLocalizedField(experience.categories, 'name', lang) as string || experience.categories?.name;
  const categorySlug = experience.categories?.slug;

  // Hero image: prioritize experience hero, then hotel hero
  const heroImage = experience.hero_image || experience.hotels?.hero_image || '/placeholder.svg';
  
  // Gallery photos: combine all available photos for the modal
  const galleryPhotos: string[] = [];
  if (experience.hero_image) galleryPhotos.push(experience.hero_image);
  if (experience.photos?.length) galleryPhotos.push(...experience.photos.filter((p: string) => p !== experience.hero_image));
  if (experience.hotels?.hero_image && !galleryPhotos.includes(experience.hotels.hero_image)) galleryPhotos.push(experience.hotels.hero_image);
  if (experience.hotels?.photos?.length) galleryPhotos.push(...experience.hotels.photos.filter((p: string) => !galleryPhotos.includes(p)));

  // Calculate average rating
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length 
    : undefined;

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <SEOHead
        titleEn={experience.seo_title_en}
        titleHe={experience.seo_title_he}
        descriptionEn={experience.meta_description_en}
        descriptionHe={experience.meta_description_he}
        ogTitleEn={experience.og_title_en}
        ogTitleHe={experience.og_title_he}
        ogDescriptionEn={experience.og_description_en}
        ogDescriptionHe={experience.og_description_he}
        ogImage={experience.og_image || experience.hero_image}
        fallbackTitle={`${title} - ${hotelName || ''} - StayMakom`}
        fallbackDescription={subtitle || experience.long_copy?.substring(0, 155) || ""}
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section with 65/35 layout */}
        <section>
          <HeroSection
            photos={galleryPhotos}
            title={title}
            subtitle={subtitle}
            hotelName={hotelName || ''}
            hotelImage={experience.hotels?.hero_image}
            city={city}
            region={region}
            latitude={experience.hotels?.latitude ?? undefined}
            longitude={experience.hotels?.longitude ?? undefined}
            averageRating={averageRating}
            reviewsCount={reviews?.length || 0}
            lang={lang}
            categoryName={categoryName}
            categorySlug={categorySlug}
            experienceId={experience.id}
            onScrollToReviews={scrollToReviews}
          />
        </section>

        <div className="max-w-6xl mx-auto pb-24 md:pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 my-8">
          <div className="grid md:grid-cols-[65%_35%] gap-6 lg:gap-10">
            {/* Left Column - Content */}
            <div className="space-y-10 md:space-y-12">
              {/* What's on the Program */}
              {includes && includes.length > 0 && (
                <ProgramTimeline 
                  includes={includes} 
                  lang={lang}
                  introText={longCopy}
                />
              )}

              {/* Extras Section */}
              {extras && extras.length > 0 && (
                <ExtrasSection 
                  extras={extras} 
                  selectedExtras={selectedExtras} 
                  onUpdateQuantity={(extraId, quantity) => {
                    setSelectedExtras(prev => ({
                      ...prev,
                      [extraId]: quantity
                    }));
                  }} 
                />
              )}

              {/* Share with Friends Section */}
              <ShareWithFriendsSection 
                title={title}
                lang={lang as 'en' | 'he' | 'fr'}
              />

              {/* Your Stay - Hotel Section */}
              <YourStaySection 
                hotel={experience.hotels} 
                lang={lang}
              />

              {/* Location Map */}
              {experience.hotels?.latitude && experience.hotels?.longitude && (
                <LocationMap 
                  latitude={experience.hotels.latitude}
                  longitude={experience.hotels.longitude}
                  hotelName={hotelName || ''}
                  lang={lang}
                />
              )}

              {/* Reviews Grid */}
              {reviews && reviews.length > 0 && (
                <div ref={reviewsRef}>
                  <ReviewsGrid 
                    reviews={reviews}
                    lang={lang}
                  />
                </div>
              )}

              {/* Things to Know */}
              <PracticalInfo 
                experience={experience}
                lang={lang}
              />

              {/* Other experiences from this hotel */}
              {experience.hotel_id && (
                <OtherExperiencesFromHotel 
                  hotelId={experience.hotel_id}
                  currentExperienceId={experience.id}
                  hotelName={hotelName || ''}
                />
              )}
            </div>

            {/* Right Column - Sticky Booking Panel (Desktop) */}
            <div className="hidden md:block pr-1" style={{ height: '100%' }}>
              <div className="sticky top-16 space-y-4 will-change-transform">
                {/* Price Callout CTA */}
                <HeroBookingPreview 
                  basePrice={experience.base_price}
                  basePriceType={experience.base_price_type || "per_person"}
                  currency={experience.currency || "USD"}
                  lang={lang}
                  onViewDates={() => {
                    const bookingPanel = document.getElementById('booking-panel');
                    if (bookingPanel) {
                      bookingPanel.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                />
                
                <div id="booking-panel">
                  <BookingPanel 
                    experienceId={experience.id} 
                    hotelId={experience.hotel_id} 
                    basePrice={experience.base_price} 
                    basePriceType={experience.base_price_type || "per_person"} 
                    currency={experience.currency || "USD"} 
                    minParty={experience.min_party || 2} 
                    maxParty={experience.max_party || 4} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Price Bar */}
        <StickyPriceBar
          experienceId={experience.id}
          currency={experience.currency || "USD"}
          lang={lang}
          onViewDates={() => setIsBookingSheetOpen(true)}
          footerRef={footerRef}
        />

        {/* Mobile Booking Sheet */}
        <Sheet open={isBookingSheetOpen} onOpenChange={setIsBookingSheetOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto p-0">
            <div className="p-6">
              <BookingPanel 
                experienceId={experience.id} 
                hotelId={experience.hotel_id} 
                basePrice={experience.base_price} 
                basePriceType={experience.base_price_type || "per_person"} 
                currency={experience.currency || "USD"} 
                minParty={experience.min_party || 2} 
                maxParty={experience.max_party || 4} 
              />
            </div>
          </SheetContent>
        </Sheet>
      </main>

      <footer ref={footerRef as React.RefObject<HTMLElement>}>
        <Footer />
      </footer>
    </div>
  );
};

export default Experience;
