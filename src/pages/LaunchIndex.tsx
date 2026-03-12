import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MOBILE_HEADER_HEIGHT } from "@/constants/layout";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { t } from "@/lib/translations";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";
import MarqueeBanner from "@/components/MarqueeBanner";
import TailoredRequestSection from "@/components/TailoredRequestSection";
import HowItWorksBanner from "@/components/HowItWorksBanner";
import CategoryCard from "@/components/CategoryCard";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
"@/components/ui/dialog";
import { Loader2, ArrowRight, Gift, CheckCircle, Compass, Heart } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import { trackFindEscapeClicked, trackVibeTabClicked, trackWaitlistEmailSubmitted, trackGiftCardClicked, trackCategoryTileClicked } from "@/lib/analytics";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image-new.jpg";
import handpickedHero from "@/assets/handpicked-hero.jpg";
import giftCardHero from "@/assets/gift-card-hero.jpg";
import romanticImg from "@/assets/romantic-category.jpg";
import activeImg from "@/assets/active-category.jpg";

/* ─── Filter button slugs ─── */
const FILTER_ADVENTURE = "adventure";
const FILTER_ROMANTIC = "romantic";
const LaunchIndex = () => {
  const { lang } = useLanguage();
  const { getLocalizedPath } = useLocalizedNavigation();
  const isRTL = lang === "he";

  // Analytics
  useScrollDepth("launch");

  // Lead capture state
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(FILTER_ADVENTURE);

  // Toggle underline refs
  const toggleBtn1Ref = useRef<HTMLButtonElement>(null);
  const toggleBtn2Ref = useRef<HTMLButtonElement>(null);
  const toggleBarRef = useRef<HTMLDivElement>(null);
  const [toggleUnderline, setToggleUnderline] = useState({ left: 0, width: 0 });
  const [tabsSticky, setTabsSticky] = useState(false);

  const recalcUnderline = () => {
    const activeRef = activeFilter === FILTER_ADVENTURE ? toggleBtn1Ref : toggleBtn2Ref;
    if (activeRef.current) {
      const { offsetLeft, offsetWidth } = activeRef.current;
      setToggleUnderline({ left: offsetLeft, width: offsetWidth });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(recalcUnderline, 50);
    return () => clearTimeout(timeout);
  }, [activeFilter, lang]);

  // Recalculate underline when sticky state changes (layout shift)
  useEffect(() => {
    const timeout = setTimeout(recalcUnderline, 60);
    return () => clearTimeout(timeout);
  }, [tabsSticky]);

  // Sticky tabs observer: stick when sentinel scrolls past the mobile header
  useEffect(() => {
    const el = toggleBarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTabsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: `-${MOBILE_HEADER_HEIGHT}px 0px 0px 0px` }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Waitlist popup state
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState<string>("");
  const [waitlistCategoryId, setWaitlistCategoryId] = useState<string>("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["launch-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("categories").
      select("*").
      eq("status", "published").
      eq("show_on_launch", true).
      order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch published experiences2 with hotels
  const { data: experiences2, isLoading: isLoadingExp } = useQuery({
    queryKey: ["launch-experiences2"],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("experiences2").
      select(`
          *,
          categories(slug),
          experience2_hotels(
            position,
            nights,
            hotel:hotels2(
              id, name, name_he, city, city_he, region, region_he, hero_image, hyperguest_property_id
            )
          ),
          experience2_highlight_tags(
            highlight_tags(
              id, slug, label_en, label_he
            )
          ),
          experience2_addons(type, value, is_active)
        `).
      eq("status", "published").
      order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Resolve category id from slug
  const getCategoryIdFromSlug = (slug: string) =>
  categories?.find((c) => c.slug === slug)?.id;

  // Filtered experiences
  const filteredExperiences = activeFilter === FILTER_ROMANTIC ?
  experiences2?.filter((exp: any) => exp.categories?.slug === "romantic") :
  activeFilter === FILTER_ADVENTURE ?
  experiences2?.filter((exp: any) => exp.categories?.slug !== "romantic") :
  experiences2;

  // Lead capture handler
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("collect-lead", {
        body: { email, source: "coming_soon" }
      });
      if (error) throw error;
      setSubmitted(true);
      setEmail("");
      trackWaitlistEmailSubmitted(email.split("@")[1] || "unknown");
      toast.success(isRTL ? "נרשמת בהצלחה!" : "You're on the list!");
    } catch {
      toast.error(isRTL ? "שגיאה, נסה שנית" : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Waitlist handler
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || waitlistSubmitting) return;
    setWaitlistSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("collect-lead", {
        body: {
          email: waitlistEmail,
          source: "category_waitlist",
          cta_id: waitlistCategoryId,
          metadata: { category_name: waitlistCategory }
        }
      });
      if (error) throw error;
      setWaitlistSubmitted(true);
      setWaitlistEmail("");
      toast.success(isRTL ? "נרשמת בהצלחה!" : "You're on the list!");
    } catch {
      toast.error(isRTL ? "שגיאה, נסה שנית" : "Something went wrong.");
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  // Handle category card click → open waitlist popup
  const handleCategoryClick = (category: any) => {
    const name = getLocalizedField(category, "name", lang) as string;
    trackCategoryTileClicked(name);
    setWaitlistCategory(name);
    setWaitlistCategoryId(category.id);
    setWaitlistSubmitted(false);
    setWaitlistEmail("");
    setWaitlistOpen(true);
  };

  // Handle filter button click — scroll to grid when in sticky mode
  const handleFilterClick = (slug: string) => {
    trackVibeTabClicked(slug);
    setActiveFilter((prev) => prev === slug ? null : slug);
    const grid = document.getElementById("launch-experiences");
    if (grid && tabsSticky) {
      grid.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isPageLoading = isLoadingCategories || isLoadingExp;

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip" dir={isRTL ? "rtl" : "ltr"}>
      <LoadingScreen isLoading={isPageLoading} />
      <SEOHead
        title={isRTL ? "STAYMAKOM — מלונות וחוויות נבחרים בישראל" : "STAYMAKOM — Handpicked Hotels & Experiences in Israel"}
        description={isRTL ? "אנחנו אוצרים את המלונות הבוטיק הטובים בישראל ומשלבים אותם עם חוויות מקומיות ייחודיות." : "We curate Israel's best boutique hotels and pair them with unique local experiences."} />

      <LaunchHeader />

      <main className="flex-1 md:pt-0 pt-0 pb-[80px] md:pb-0">
        {/* ─── 1. HERO ─── */}
        <section className="relative h-[62vh] md:h-[70vh] min-h-[320px] md:min-h-[480px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }} />

          <div className="absolute inset-0 bg-black/45" />

          <div className="relative z-10 text-center text-white px-6 max-w-3xl mx-auto pt-6 sm:pt-0">
            <h1
              className="font-sans text-[26px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] mb-2.5 sm:mb-4 opacity-0 animate-hero-fade-up text-white"
              style={{ animationDelay: '0ms' }}>
              {isRTL ? (
                <><span className="whitespace-nowrap">אל תבחר עיר,</span><br /><span className="whitespace-nowrap">בחר את הבריחה שלך</span></>
              ) : (
                <><span className="whitespace-nowrap">Don't choose a city,</span><br /><span className="whitespace-nowrap">choose your escape</span></>
              )}
            </h1>
            <p
              className="font-sans italic text-white/90 mb-5 sm:mb-7 max-w-xl mx-auto opacity-0 animate-hero-fade-up text-sm sm:text-lg md:text-xl"
              style={{ animationDelay: '250ms' }}>
              {isRTL ? "הישראל שרוב האנשים לא מוצאים." : "The Israel most people never find."}
            </p>
            <button
              onClick={() => {
                trackFindEscapeClicked();
                const el = document.getElementById("launch-experiences");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-10 py-2.5 sm:py-4 bg-white text-foreground font-semibold uppercase tracking-wide text-sm rounded-md shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:brightness-110 transition-all duration-300 opacity-0 animate-hero-fade-up cursor-pointer"
              style={{ animationDelay: '500ms' }}>
              {isRTL ? "מצא את הבריחה שלך" : "Find your escape"}
            </button>
          </div>
        </section>

        {/* ─── 1b. HOW IT WORKS BANNER ─── */}
        <HowItWorksBanner />

        {/* ─── 2. HANDPICKED + TOGGLE + GRID ─── */}
        <section id="launch-experiences" className="container py-[26px] px-4 scroll-mt-24">
          {/* Title block — static, not the sticky parent */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.02em] mb-1.5 leading-tight">
              {isRTL ? (<>מלונות שנבחרו בקפידה.<br />חוויות בלתי נשכחות.</>) : (<>Handpicked Hotels.<br />Unforgettable Experiences.</>)}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mb-5">
              {isRTL ? "ל-24 שעות, 48 שעות, או חוויות מותאמות אישית." : "For 24 hours, 48 hours, or tailor-made experiences."}
            </p>
          </div>

          {/* Sentinel for IntersectionObserver — sits right before sticky bar */}
          <div ref={toggleBarRef} />

          {/* Premium segmented toggle — fixed under logo after crossing sentinel on mobile */}
          {tabsSticky && <div className="h-10 md:hidden" aria-hidden="true" />}
          <div
            className={cn(
              "transition-all duration-300 md:static md:mx-0 md:px-0",
              tabsSticky
                ? "fixed left-0 right-0 z-40 px-4 bg-mobile-header border-b border-mobile-border"
                : "sticky z-30 -mx-4 px-4"
            )}
            style={{ top: MOBILE_HEADER_HEIGHT }}
          >
            <div className="relative mx-auto flex w-full max-w-[430px] items-center justify-center gap-3 py-2" dir="ltr">
              <button
                ref={toggleBtn1Ref}
                onClick={() => handleFilterClick(FILTER_ADVENTURE)}
                className={cn(
                  "flex-1 min-w-0 uppercase tracking-[0.08em] sm:tracking-[0.12em] text-[11px] transition-all duration-300 pb-2",
                  activeFilter === FILTER_ADVENTURE
                    ? "font-medium text-mobile-active"
                    : "font-light text-mobile-inactive hover:text-mobile-active/70"
                )}
              >
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Compass size={12} strokeWidth={1.5} />
                  {isRTL ? "הרפתקה" : "Feel adventurous"}
                </span>
              </button>
              <div className="w-px h-4 bg-mobile-border" />
              <button
                ref={toggleBtn2Ref}
                onClick={() => handleFilterClick(FILTER_ROMANTIC)}
                className={cn(
                  "flex-1 min-w-0 uppercase tracking-[0.08em] sm:tracking-[0.12em] text-[11px] transition-all duration-300 pb-2",
                  activeFilter === FILTER_ROMANTIC
                    ? "font-medium text-mobile-active"
                    : "font-light text-mobile-inactive hover:text-mobile-active/70"
                )}
              >
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Heart size={12} strokeWidth={1.5} />
                  {isRTL ? "בריחה רומנטית" : "Romantic Escape"}
                </span>
              </button>
              <div
                className="absolute bottom-0 h-px bg-mobile-active transition-all duration-300 ease-in-out"
                style={{ left: toggleUnderline.left, width: toggleUnderline.width }}
              />
            </div>
          </div>

          {isLoadingExp ?
          <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div> :
          filteredExperiences && filteredExperiences.length > 0 ?
          <div className="mt-4 md:mt-3 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 transition-all duration-500">
              {filteredExperiences.map((experience: any, idx: number) => {
              const primaryHotelLink = experience.experience2_hotels
                ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;

                return (
              <Experience2CardWithPrice
                  key={experience.id}
                  experience={experience}
                  primaryHotel={primaryHotelLink}
                  hyperguestPropertyId={primaryHotelLink?.hyperguest_property_id}
                  addons={(experience as any).experience2_addons}
                  linkPrefix="/experience"
                  linkSuffix="context=launch"
                  index={idx} />);


            })}
            </div> :

          <div className="text-center py-16">
              <p className="text-muted-foreground">
                {isRTL ?
              "אין חוויות בקטגוריה זו עדיין" :
              "No experiences in this category yet."}
              </p>
              <button
              onClick={() => setActiveFilter(null)}
              className="mt-4 text-sm underline underline-offset-4 text-primary hover:text-primary/80">

                {isRTL ? "הצג הכל" : "Show all experiences"}
              </button>
            </div>
          }
        </section>

        {/* ─── 4. MARQUEE BANNER ─── */}
        <MarqueeBanner />

        {/* ─── 5. BRAND STATEMENT IMAGE BLOCK ─── */}
        <section className="relative py-8 sm:py-14 md:py-18 overflow-hidden">
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

        {/* ─── 6. MORE EXPERIENCES + CATEGORIES (unified) ─── */}
        <section className="py-8 sm:py-16 bg-muted/50">
          <div className="container px-4 mx-auto">
            <div className="max-w-2xl mx-auto text-center mb-3">
              <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] uppercase">
                {isRTL ? "עוד בריחות בדרך" : "More escapes are on the way."}
              </h2>
            </div>

            <div className="max-w-sm sm:max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-10">
              <p className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                {isRTL ? "היו הראשונים." : "Be the first in."}
              </p>

              {submitted ?
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <CheckCircle className="h-4 w-4" />
                  {isRTL ? "נרשמת בהצלחה!" : "You're on the list!"}
                </div> :

              <form onSubmit={handleLeadSubmit} className="flex gap-2 w-full sm:w-auto">
                  <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRTL ? "כתובת האימייל שלך" : "Your email address"}
                  className="flex-1 sm:w-56 h-9 text-sm" />

                  <Button type="submit" disabled={isSubmitting} size="sm" className="h-9 text-xs px-4 bg-[#1A1814] text-white hover:bg-[#1A1814]/90">
                    {isRTL ? "הצטרפו לרשימה" : "Join the list"}
                  </Button>
                </form>
              }
            </div>

            {!isLoadingCategories && categories && categories.length > 0 &&
            <div className="max-w-4xl mx-auto">
                {/* All screens: 4-col grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {categories.map((category) => {
                    const catTitle = getLocalizedField(category, "name", lang) as string;
                    const image = category.hero_image || "";

                    const desc = getLocalizedField(category, "launch_description", lang) as string | null;

                    return (
                    <button
                        key={`waitlist-${category.slug}`}
                        onClick={() => handleCategoryClick(category)}
                        className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-strong transition-all duration-300 text-left cursor-pointer">
                          <div className="aspect-[4/3] md:aspect-square relative">
                            <img src={image} alt={catTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/55 transition-all duration-300" />
                            {/* Title - centered */}
                            <div className="absolute inset-0 flex items-center justify-center p-3 md:p-4 group-hover:opacity-0 transition-opacity duration-300">
                              <h3 className="font-sans text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white uppercase tracking-tight leading-tight text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                                {(() => {
                                  const words = catTitle.split(' ');
                                  const mid = Math.ceil(words.length / 2);
                                  const l1 = words.slice(0, mid).join(' ');
                                  const l2 = words.slice(mid).join(' ');
                                  return <>{l1}{l2 && <><br />{l2}</>}</>;
                                })()}
                              </h3>
                            </div>
                            {/* Description - shown on hover */}
                            {desc && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <h4 className="font-sans text-xs sm:text-sm font-bold text-white uppercase tracking-tight mb-1.5 text-center">{catTitle}</h4>
                                <p className="font-sans text-[11px] sm:text-xs md:text-sm text-white/95 text-center leading-snug line-clamp-6 sm:line-clamp-8">
                                  {desc}
                                </p>
                              </div>
                            )}
                          </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            }
          </div>
        </section>

        {/* ─── 7. TAILORED REQUEST ─── */}
        <TailoredRequestSection categories={categories || []} />

        {/* ─── 8. GIFT CARD ─── */}
        <section className="container py-8 md:py-14 px-4">
          <div className={`grid md:grid-cols-2 gap-5 md:gap-8 items-center max-w-4xl mx-auto ${isRTL ? "md:grid-flow-col-dense" : ""}`}>

            <div
              className={`relative overflow-hidden rounded-2xl ${
              isRTL ? "md:order-2" : ""}`
              }>

              <img
                src={giftCardHero}
                alt="Gift Card"
                className="w-full h-56 md:h-72 object-cover hover:scale-105 transition-transform duration-500" />

            </div>

            <div className={`space-y-4 ${isRTL ? "text-right md:order-1" : ""}`}>
              <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-tight">
                {isRTL ? (<>מתנה מושלמת.<br />מתנת הבריחה.</>) : (<>Perfect gift.<br />The gift of escape.</>)}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md">
                {t(lang, "giftCardSectionDesc")}
              </p>
              <Button asChild className="group" onClick={() => trackGiftCardClicked('launch_page')}>
                <Link to={getLocalizedPath("/gift-card")}>
                  {t(lang, "giftCardSectionCTA")}
                  <ArrowRight
                    className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                    isRTL ?
                    "mr-2 rotate-180 group-hover:-translate-x-1" :
                    "ml-2"}`
                    } />

                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      {/* ─── WAITLIST POPUP ─── */}
      <Dialog
        open={waitlistOpen}
        onOpenChange={(open) => {
          setWaitlistOpen(open);
          if (!open) setWaitlistSubmitted(false);
        }}>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-bold tracking-[-0.02em]">
              {isRTL ?
              "החוויה הזו בדרך" :
              "This experience is coming soon."}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isRTL ?
              `הצטרף לרשימת ההמתנה של "${waitlistCategory}" והיה הראשון לדעת.` :
              `Join the waitlist for "${waitlistCategory}" and be the first to access it.`}
            </DialogDescription>
          </DialogHeader>

          {waitlistSubmitted ?
          <div className="flex items-center justify-center gap-2 text-primary font-medium py-6">
              <CheckCircle className="h-5 w-5" />
              {isRTL ? "נרשמת בהצלחה!" : "You're on the list!"}
            </div> :

          <form
            onSubmit={handleWaitlistSubmit}
            className="flex flex-col gap-3 pt-2">

              <Input
              type="email"
              required
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              placeholder={
              isRTL ? "כתובת האימייל שלך" : "Your email address"
              } />

              <Button type="submit" disabled={waitlistSubmitting} className="w-full">
                {waitlistSubmitting ?
              <Loader2 className="h-4 w-4 animate-spin" /> :
              isRTL ?
              "עדכנו אותי" :

              "Notify me"
              }
              </Button>
            </form>
          }
        </DialogContent>
      </Dialog>
      
    </div>);

};

export default LaunchIndex;