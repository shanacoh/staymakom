import { Button } from "@/components/ui/button";
import { Loader2, Heart, Users, Sparkles, Leaf, Wine, Zap, Laptop, Brain, Mountain, Utensils, Plane, Camera, Music, Book, Coffee, Sun, Moon, Star, Compass, Map, Globe, Briefcase, Award, Gift, Gem, Crown, Shield, Flame, Droplet, Wind, Cloud, TreePine, Flower2, MapPin, Building, type LucideIcon } from "lucide-react";

// Icon mapping for dynamic category icons
const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  users: Users,
  sparkles: Sparkles,
  leaf: Leaf,
  wine: Wine,
  zap: Zap,
  laptop: Laptop,
  brain: Brain,
  mountain: Mountain,
  utensils: Utensils,
  plane: Plane,
  camera: Camera,
  music: Music,
  book: Book,
  coffee: Coffee,
  sun: Sun,
  moon: Moon,
  star: Star,
  compass: Compass,
  map: Map,
  globe: Globe,
  briefcase: Briefcase,
  award: Award,
  gift: Gift,
  gem: Gem,
  crown: Crown,
  shield: Shield,
  flame: Flame,
  droplet: Droplet,
  wind: Wind,
  cloud: Cloud,
  "tree-pine": TreePine,
  flower: Flower2
};
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import RotatingText from "@/components/RotatingText";
import ContactDialog from "@/components/ContactDialog";
import ExperienceCard from "@/components/ExperienceCard";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { SEOHead } from "@/components/SEOHead";
import JournalSection from "@/components/JournalSection";
import AIExperienceAssistant from "@/components/AIExperienceAssistant";
import StickyAIButton from "@/components/StickyAIButton";
import MarqueeBanner from "@/components/MarqueeBanner";
import HowItWorksBanner from "@/components/HowItWorksBanner";
import heroImage from "@/assets/hero-image-new.jpg";
import desertHero from "@/assets/desert-hero.jpg";
import desertKioskHero from "@/assets/desert-kiosk-hero.png";
import desertHotelPool from "@/assets/desert-hotel-pool.jpg";
import desertJourney from "@/assets/desert-journey.jpg";
import romanticImg from "@/assets/romantic-category.jpg";
import familyImg from "@/assets/family-category.jpg";
import goldenAgeImg from "@/assets/golden-age-category.jpg";
import natureImg from "@/assets/nature-category.jpg";
import tasteImg from "@/assets/taste-category.jpg";
import activeImg from "@/assets/active-category.jpg";
import handpickedHero from "@/assets/handpicked-hero.jpg";
import giftCardHero from "@/assets/gift-card-hero.jpg";
import whoIsForRoad from "@/assets/who-is-for-road.png";

import { ArrowRight } from "lucide-react";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import LoadingScreen from "@/components/LoadingScreen";

const fallbackImages: Record<string, string> = {
  "romantic": romanticImg,
  "family": familyImg,
  "golden-age": goldenAgeImg,
  "beyond-nature": natureImg,
  "taste-affair": tasteImg,
  "active-break": activeImg
};


const Index = () => {
  const navigate = useNavigate();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { lang } = useLanguage();
  const { getLocalizedPath } = useLocalizedNavigation();
  const carouselRef = useRef<HTMLDivElement>(null);
  const latestCarouselRef = useRef<HTMLDivElement>(null);
  const isRTL = lang === 'he';

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("status", "published")
        .eq("show_on_home", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: latestExperiences, isLoading: isLoadingExperiences } = useQuery({
    queryKey: ["latest-experiences"],
    queryFn: async () => {
      // First fetch featured experiences (manually pinned)
      const { data: featured, error: featuredError } = await supabase
        .from("experiences2")
        .select(`
          *,
          experience2_hotels(
            position,
            nights,
            hotel:hotels2(
              id, name, name_he, city, city_he, region, region_he, hero_image
            )
          ),
          experience2_highlight_tags(
            highlight_tags(
              id,
              slug,
              label_en,
              label_he
            )
          )
        `)
        .eq("status", "published")
        .eq("featured_on_home", true)
        .order("home_display_order", { ascending: true });
      if (featuredError) throw featuredError;

      const featuredIds = (featured || []).map((e: any) => e.id);
      let recent: any[] = [];

      // Fill remaining slots with most recent (up to 8 total)
      if (featuredIds.length < 8) {
        let query = supabase
          .from("experiences2")
          .select(`
            *,
            experience2_hotels(
              position,
              nights,
              hotel:hotels2(
                id, name, name_he, city, city_he, region, region_he, hero_image
              )
            ),
            experience2_highlight_tags(
              highlight_tags(
                id,
                slug,
                label_en,
                label_he
              )
            )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(8 - featuredIds.length);

        if (featuredIds.length > 0) {
          query = query.not("id", "in", `(${featuredIds.join(",")})`);
        }

        const { data: recentData, error: recentError } = await query;
        if (recentError) throw recentError;
        recent = recentData || [];
      }

      const allExps = [...(featured || []), ...recent];

      return allExps.map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return {
          ...exp,
          hotels: primaryHotel || null,
          experience_highlight_tags: exp.experience2_highlight_tags || [],
        };
      });
    }
  });

  const { data: allExperiences, isLoading: isLoadingAllExperiences } = useQuery({
    queryKey: ["all-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
          *,
          experience2_hotels(
            position,
            nights,
            hotel:hotels2(
              id, name, name_he, city, city_he, region, region_he, hero_image
            )
          ),
          experience2_highlight_tags(
            highlight_tags(
              id,
              slug,
              label_en,
              label_he
            )
          )
        `)
        .eq("status", "published");
      if (error) throw error;
      return (data || []).map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return {
          ...exp,
          hotels: primaryHotel || null,
          experience_highlight_tags: exp.experience2_highlight_tags || [],
        };
      });
    }
  });

  // Fetch homepage SEO settings
  const { data: homepageSEO } = useQuery({
    queryKey: ["homepage-seo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("key", "homepage")
        .single();
      if (error) throw error;
      return data;
    }
  });

  const filteredExperiences = selectedCategoryId
    ? allExperiences?.filter(exp => exp.category_id === selectedCategoryId)
        .slice(0, 4)
    : latestExperiences?.slice(0, 8);

  const selectedCategory = categories?.find(cat => cat.id === selectedCategoryId);

  // Auto-scroll for carousel
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !filteredExperiences || filteredExperiences.length === 0) return;

    const scrollInterval = setInterval(() => {
      const scrollAmount = carousel.scrollLeft + (carousel.offsetWidth * 0.75 + 12);
      const maxScroll = carousel.scrollWidth - carousel.offsetWidth;
      if (scrollAmount >= maxScroll - 10) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(scrollInterval);
  }, [filteredExperiences]);

  // No more interval-based auto-scroll for latest experiences - using CSS animation instead

  // Category display names mapping
  const getCategoryDisplay = (slug: string) => {
    const displayMap: Record<string, string> = {
      'romantic': lang === 'he' ? t(lang, 'categoryRomantic') : t('en', 'categoryRomantic'),
      'family': lang === 'he' ? t(lang, 'categoryFamily') : t('en', 'categoryFamily'),
      'golden-age': lang === 'he' ? t(lang, 'categoryGoldenAge') : t('en', 'categoryGoldenAge'),
      'nature': lang === 'he' ? t(lang, 'categoryNature') : t('en', 'categoryNature'),
      'beyond-nature': lang === 'he' ? t(lang, 'categoryNature') : t('en', 'categoryNature'),
      'taste': lang === 'he' ? t(lang, 'categoryTaste') : t('en', 'categoryTaste'),
      'taste-affair': lang === 'he' ? t(lang, 'categoryTaste') : t('en', 'categoryTaste'),
      'active': lang === 'he' ? t(lang, 'categoryActive') : t('en', 'categoryActive'),
      'active-break': lang === 'he' ? t(lang, 'categoryActive') : t('en', 'categoryActive'),
      'work-unplugged': lang === 'he' ? t(lang, 'categoryWorkUnplugged') : t('en', 'categoryWorkUnplugged'),
      'mindful-reset': lang === 'he' ? t(lang, 'categoryMindfulReset') : t('en', 'categoryMindfulReset'),
    };
    return displayMap[slug] || slug;
  };

  const isPageLoading = isLoading || isLoadingExperiences;

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <LoadingScreen isLoading={isPageLoading} />
      <SEOHead
        titleEn={homepageSEO?.seo_title_en}
        titleHe={homepageSEO?.seo_title_he}
        descriptionEn={homepageSEO?.meta_description_en}
        descriptionHe={homepageSEO?.meta_description_he}
        ogTitleEn={homepageSEO?.og_title_en}
        ogTitleHe={homepageSEO?.og_title_he}
        ogDescriptionEn={homepageSEO?.og_description_en}
        ogDescriptionHe={homepageSEO?.og_description_he}
        ogImage={homepageSEO?.og_image}
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[450px] flex items-center justify-center md:items-end md:justify-start">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/30" />
          
          <div className={`relative z-10 container text-white px-4 sm:px-6 pb-6 md:pb-12 flex flex-col items-center text-center md:items-start md:text-left ${isRTL ? 'md:mr-0 md:mr-4 lg:mr-[1cm] md:text-right' : 'md:ml-0 md:ml-4 lg:ml-[1cm] md:text-left'}`}>
            <h1 className="font-sans text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 tracking-[-0.02em] animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase max-w-4xl text-slate-50 pt-4">
              {/* Mobile: "MORE THAN A STAY, IT'S A" on one line */}
              <span className="md:hidden">
                {t(lang, 'heroTitle1')} {t(lang, 'heroTitle2')}
              </span>
              {/* Desktop: original layout with line break */}
              <span className="hidden md:inline">
                {t(lang, 'heroTitle1')}
                <br />
                {t(lang, 'heroTitle2')}{" "}
              </span>
              {/* Rotating category - on its own line on mobile */}
              <span className="block md:inline">
                <RotatingText
                  words={categories?.map(cat => getLocalizedField(cat, 'name', lang) as string) || ["Romance", "Adventure", "Family"]}
                  interval={2500}
                />
              </span>
            </h1>
            <button
              onClick={() => {
                const element = document.getElementById('choose-escape');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-3 sm:mt-4 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-foreground font-semibold uppercase tracking-wide text-xs sm:text-sm rounded-md hover:bg-white/90 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
            >
              {t(lang, 'heroCTA')}
            </button>
          </div>
        </section>

        {/* How It Works Banner */}
        <HowItWorksBanner />

        {/* Categories Section */}
        <section id="choose-escape" className="container py-4 sm:py-6 md:py-8 px-4 scroll-mt-16">
          <div className="text-center mb-3 sm:mb-4">
            <h2 className="font-sans text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-[-0.02em] mb-1.5">
              {t(lang, 'chooseCityTitle')}<br />{t(lang, 'chooseEscapeTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              {t(lang, 'chooseCitySubtitle')}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {categories?.map(category => (
                  <CategoryCard key={category.slug} category={category} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Marquee Banner */}
        <MarqueeBanner />

        {/* Handpicked Hotels Hero Section */}
        <section className="relative py-10 sm:py-14 md:py-18 overflow-hidden">
          <div className="absolute inset-0">
            <img src={handpickedHero} alt="Israeli countryside road" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="container max-w-3xl relative z-10 px-4 text-center">
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] mb-3 text-white">
              {t(lang, 'handpickedTitle1')}<br />
              {t(lang, 'handpickedTitle2')}
            </h2>
            <div className="text-[11px] sm:text-xs md:text-sm leading-relaxed text-white/95 max-w-2xl mx-auto space-y-2">
              <p>{t(lang, 'handpickedP1')}</p>
              <p>{t(lang, 'handpickedP2')}</p>
              <p>{t(lang, 'handpickedP3')}</p>
            </div>
          </div>
        </section>

        {/* Category Experiences Section */}
        <section className="container py-8 sm:py-12 md:py-16 px-4">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-muted-foreground mb-1.5">
              {t(lang, 'yourExperiences')}
            </p>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium mb-6 sm:mb-8">
              {t(lang, 'followHeart')}
            </h2>
            
            {/* Category Tabs */}
            {!isLoading && categories && (
              <div className={`flex flex-nowrap justify-start sm:justify-center gap-1 sm:gap-2 mb-4 sm:mb-8 overflow-x-auto overflow-y-visible py-1.5 px-2 sm:px-0 -mx-4 sm:mx-0 scrollbar-hide ${isRTL ? 'flex-row-reverse' : ''}`}>
                {categories.map(category => (
                  <button
                    key={category.slug}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 sm:gap-1.5 group cursor-pointer flex-shrink-0 w-12 sm:w-16 transition-all ${selectedCategoryId === category.id ? 'text-primary scale-105' : ''}`}
                  >
                    {/* Icon with circular hover background */}
                    <div className={`p-1.5 sm:p-2 rounded-full transition-all group-hover:bg-muted ${selectedCategoryId === category.id ? 'bg-primary/10' : ''}`}>
                      {(() => {
                        const IconComponent = category.icon ? iconMap[category.icon] : null;
                        return IconComponent ? (
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                        ) : (
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                        );
                      })()}
                    </div>
                    
                    {/* 2-line text with fixed height */}
                    <span className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wide text-center h-6 sm:h-7 leading-[12px] sm:leading-[14px] whitespace-pre-line transition-colors ${selectedCategoryId === category.id ? 'text-primary' : 'group-hover:text-primary'}`}>
                      {getCategoryDisplay(category.slug)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Experiences Grid/Carousel */}
          {isLoadingExperiences || isLoadingAllExperiences ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <>
              {/* Mobile & Tablet Carousel */}
              <div className="lg:hidden relative mb-8">
                <div ref={carouselRef} className="overflow-x-auto -mx-4 px-4 snap-x snap-mandatory scroll-smooth scrollbar-hide">
                  <div className="flex gap-3 pb-4">
                    {[...(filteredExperiences || []), ...(filteredExperiences || [])].map((experience, index) => (
                      <div key={`${experience.id}-${index}`} className="flex-shrink-0 w-[75vw] md:w-[30vw] snap-center">
                        <ExperienceCard
                          experience={experience}
                          rating={8.5 + Math.random() * 0.5}
                          reviewCount={50 + Math.floor(Math.random() * 950)}
                        />
                      </div>
                    ))}
                    {selectedCategoryId && filteredExperiences && filteredExperiences.length < 4 &&
                      Array.from({ length: 4 - filteredExperiences.length }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="flex-shrink-0 w-[75vw] md:w-[30vw] snap-center invisible"></div>
                      ))
                    }
                  </div>
                </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden lg:grid lg:grid-cols-4 gap-2 md:gap-3 mb-8">
                {filteredExperiences?.map(experience => (
                  <ExperienceCard
                    key={experience.id}
                    experience={experience}
                    rating={8.5 + Math.random() * 0.5}
                    reviewCount={50 + Math.floor(Math.random() * 950)}
                  />
                ))}
                {selectedCategoryId && filteredExperiences && filteredExperiences.length < 4 &&
                  Array.from({ length: 4 - filteredExperiences.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="invisible"></div>
                  ))
                }
              </div>

            </>
          )}

          {/* Single Dynamic CTA */}
          <div className="text-center mt-8">
            <Button
              asChild
              size="lg"
              className="bg-black hover:bg-black/90 text-white rounded-full px-8"
            >
              <Link to={selectedCategoryId && selectedCategory 
                ? `/category/${selectedCategory.slug}${lang === 'he' ? '?lang=he' : ''}` 
                : `/experiences${lang === 'he' ? '?lang=he' : ''}`
              }>
                {selectedCategoryId && selectedCategory 
                  ? `${t(lang, 'viewMoreOf')} ${getLocalizedField(selectedCategory, 'name', lang)}`
                  : t(lang, 'viewAllExperiences')
                }
              </Link>
            </Button>
          </div>
        </section>

        {/* Who STAYMAKOM is for Section */}
        <section className="relative py-12 md:py-16 overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${whoIsForRoad})` }}
          />
          
          
          <div className="container relative z-10 max-w-4xl px-4">
            {/* Title */}
            <h2 className="text-center font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] text-foreground mb-8 md:mb-10">
              {lang === 'he' ? 'למי STAYMAKOM מיועד' : 'Who STAYMAKOM is for'}
            </h2>
            
            {/* Cards Grid - 2 columns with frosted glass effect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Card 1 - International Travelers */}
              <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow duration-300 border border-white/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-sans text-lg md:text-xl font-semibold text-foreground mb-3">
                  {lang === 'he' ? 'מטיילים שמחפשים יותר ממלון' : 'Travelers looking for more than a hotel'}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {lang === 'he' 
                    ? 'לאנשים שרוצים שהשהות שלהם תהיה משמעותית. זוגות, משפחות, מטיילים יחידים ואנשי מקצוע שמחפשים אווירה, משמעות ואיכות ולא חבילות מלונאיות סטנדרטיות.'
                    : 'For people who want their stay to feel intentional. Couples, families, solo travelers, and professionals who care about atmosphere, meaning, and quality rather than standard hotel packages.'
                  }
                </p>
              </div>
              
              {/* Card 2 - Israelis */}
              <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow duration-300 border border-white/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-sans text-lg md:text-xl font-semibold text-foreground mb-3">
                  {lang === 'he' ? 'ישראלים שמגלים מחדש את הארץ' : 'Israelis rediscovering their own country'}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {lang === 'he'
                    ? 'למקומיים שמחפשים דרך קלה להזמין סטייקיישנים מעוררי השראה, בריחות באמצע השבוע או הפסקות קצרות שמרגישות אחרת לגמרי מהצעות המלון הרגילות.'
                    : 'For locals looking for an easy way to book inspiring staycations, midweek escapes, or short breaks that feel genuinely different from typical hotel offers.'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gift Card Section */}
        <section className="container py-12 md:py-16 px-4">
          <div className={`grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto ${isRTL ? 'md:grid-flow-col-dense' : ''}`}>
            {/* Image */}
            <div className={`relative overflow-hidden rounded-2xl ${isRTL ? 'md:order-2' : ''}`}>
              <img 
                src={giftCardHero} 
                alt="Gift Card" 
                className="w-full h-64 md:h-80 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            {/* Content */}
            <div className={`space-y-4 ${isRTL ? 'text-right md:order-1' : ''}`}>
              <div className={`inline-flex items-center gap-2 text-primary ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="h-5 w-5" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t(lang, 'giftCardSectionTag')}
                </span>
              </div>
              <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-[-0.02em]">
                {t(lang, 'giftCardSectionTitle')}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {t(lang, 'giftCardSectionDesc')}
              </p>
              <Button asChild className="group">
                <Link to={getLocalizedPath('/gift-card')}>
                  {t(lang, 'giftCardSectionCTA')}
                  <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'mr-2 rotate-180 group-hover:-translate-x-1' : 'ml-2'}`} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Latest Experiences Section */}
        <section className="container py-8 sm:py-12 md:py-16 lg:py-20 px-4">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold tracking-[-0.02em]">
              {t(lang, 'latestExperiences')}
            </h2>
            <Button variant="link" className="text-foreground underline underline-offset-4 text-xs sm:text-sm p-0 h-auto">
              {t(lang, 'viewAllExperiencesLink')}
            </Button>
          </div>

          {isLoadingExperiences ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <div className="overflow-hidden -mx-4 px-0">
              <div 
                className="flex gap-3 animate-latest-scroll hover:[animation-play-state:paused]"
                style={{ 
                  width: 'max-content',
                  animationDuration: `${(latestExperiences?.length || 4) * 20}s`
                }}
              >
                {[...(latestExperiences || []), ...(latestExperiences || [])].map((experience, index) => (
                  <div key={`${experience.id}-${index}`} className="flex-shrink-0 w-[75vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw]">
                    <ExperienceCard
                      experience={experience}
                      badge="NEW"
                      rating={8.5 + Math.random() * 0.5}
                      reviewCount={50 + Math.floor(Math.random() * 950)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>


        {/* Journal Section */}
        <JournalSection lang={lang} />

        {/* AI Experience Assistant */}
        <AIExperienceAssistant />

        {/* Desert Kiosk Hero Section */}
        <section className="relative min-h-[280px] sm:h-[320px] md:h-[380px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${desertKioskHero})` }}
          />
          <div className="absolute inset-0 bg-black/30" />
          
          <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto">
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase text-slate-50 lg:text-4xl">
              {t(lang, 'becomePartner')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 max-w-xl mx-auto">
              {t(lang, 'partnerDescription')}
            </p>
            <Button
              size="default"
              className="bg-white hover:bg-primary text-foreground hover:text-white uppercase tracking-wide font-medium rounded-none animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 text-xs sm:text-sm h-auto py-2.5 sm:py-3 px-5 sm:px-6"
              onClick={() => navigate('/category/beyond-nature')}
            >
              {t(lang, 'joinClub')}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <StickyAIButton />
      <ContactDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} />
    </div>
  );
};

export default Index;
