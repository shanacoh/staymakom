import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { t } from "@/lib/translations";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";
import MarqueeBanner from "@/components/MarqueeBanner";
import TailoredRequestSection from "@/components/TailoredRequestSection";
import FAQSection from "@/components/FAQSection";
import HowItWorksBanner from "@/components/HowItWorksBanner";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import ExperienceCardSkeleton from "@/components/ExperienceCardSkeleton";
import NewsletterPopup from "@/components/NewsletterPopup";
import { Button } from "@/components/ui/button";
import { ArrowRight, Moon, Sun, Sparkles, ShieldCheck, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  trackVibeTabClicked,
  trackGiftCardClicked,
  trackViewAllExperiencesClicked,
} from "@/lib/analytics";
import heroImage from "@/assets/hero-road-desert.jpg";
import handpickedHero from "@/assets/handpicked-hero.jpg";
import giftCardHero from "@/assets/gift-card-hero.jpg";

const IndexV2 = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { getLocalizedPath } = useLocalizedNavigation();
  const isRTL = lang === "he";
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"stay" | "live">("stay");
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);

  // Realtime refresh when admin updates experiences
  useEffect(() => {
    const channel = supabase
      .channel("v2-index-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "experiences2" }, () => {
        queryClient.invalidateQueries({ queryKey: ["launch-experiences2"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Categories (mood cards)
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["launch-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("status", "published")
        .eq("show_on_launch", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Experiences with hotels + tags
  const { data: experiences2, isLoading: isLoadingExp } = useQuery({
    queryKey: ["launch-experiences2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
          id,
          slug,
          title,
          title_he,
          hero_image,
          photos,
          status,
          display_order,
          featured_on_home,
          preferred_board_type,
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
              id, slug, label_en, label_he, display_order, is_common, icon
            )
          )
        `)
        .eq("status", "published")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  // Batch availability rules for Experience2CardWithPrice
  const experienceIds = useMemo(
    () => (experiences2 ?? []).map((e: any) => e.id as string),
    [experiences2],
  );

  const { data: allAvailabilityRules = [] } = useQuery({
    queryKey: ["availability_rules_batch", experienceIds],
    queryFn: async () => {
      if (experienceIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from("experience2_availability_rules")
        .select("id, experience_id, rule_type, days_of_week, date_from, date_to, specific_dates")
        .in("experience_id", experienceIds)
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: experienceIds.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const rulesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const rule of allAvailabilityRules) {
      if (!map[rule.experience_id]) map[rule.experience_id] = [];
      map[rule.experience_id].push(rule);
    }
    return map;
  }, [allAvailabilityRules]);

  // SEO
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
    },
  });

  // Featured experience for "En ce moment"
  const featuredExp = useMemo(() => {
    if (!experiences2 || experiences2.length === 0) return null;
    return (experiences2 as any[]).find((e) => e.featured_on_home) ?? experiences2[0];
  }, [experiences2]);

  const featuredHotel = useMemo(() => {
    if (!featuredExp) return null;
    return (featuredExp as any).experience2_hotels
      ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel ?? null;
  }, [featuredExp]);

  // Thematic rows — from is_common highlight_tags
  const tagGroups = useMemo(() => {
    if (!experiences2) return [];
    const groups = new Map<string, { tag: any; exps: any[] }>();
    for (const exp of experiences2 as any[]) {
      for (const tj of exp.experience2_highlight_tags ?? []) {
        const tag = tj.highlight_tags;
        if (!tag?.is_common) continue;
        if (!groups.has(tag.id)) groups.set(tag.id, { tag, exps: [] });
        groups.get(tag.id)!.exps.push(exp);
      }
    }
    return Array.from(groups.values())
      .filter((g) => g.exps.length >= 1)
      .sort((a, b) => (a.tag.display_order ?? 999) - (b.tag.display_order ?? 999))
      .map((g) => ({ id: g.tag.id, labelEn: g.tag.label_en, labelHe: g.tag.label_he, icon: g.tag.icon, exps: g.exps }));
  }, [experiences2]);

  // Fallback rows — one per show_on_launch category (used when no is_common tags configured)
  const categoryRows = useMemo(() => {
    if (!experiences2 || !categories) return [];
    return (categories as any[])
      .map((cat) => ({
        id: cat.id,
        labelEn: cat.name as string,
        labelHe: cat.name_he as string | null,
        icon: null,
        exps: (experiences2 as any[]).filter((e) => e.categories?.slug === cat.slug),
      }))
      .filter((row) => row.exps.length >= 1);
  }, [experiences2, categories]);

  const activeRows = tagGroups.length > 0 ? tagGroups : categoryRows;

  // Derived state
  const selectedMood = categories?.find((cat) => cat.id === selectedMoodId);

  const filteredExperiences = selectedMoodId && selectedMood
    ? experiences2?.filter((exp: any) => exp.categories?.slug === selectedMood.slug)
    : experiences2;

  const handleSurpriseMe = () => {
    const pool = filteredExperiences ?? experiences2;
    if (!pool || pool.length === 0) return;
    const random = pool[Math.floor(Math.random() * pool.length)];
    navigate(getLocalizedPath(`/experience/${(random as any).slug}`));
  };

  const handleMoodClick = (category: any) => {
    trackVibeTabClicked(category.slug);
    setSelectedMoodId((prev) => (prev === category.id ? null : category.id));
    setTimeout(() => {
      document.getElementById("v2-experience-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip" dir={isRTL ? "rtl" : "ltr"}>
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

      <LaunchHeader />

      <main className="flex-1 pb-[80px] md:pb-0">

        {/* ── 1. HERO ── */}
        <section className="relative h-[62vh] md:h-[70vh] min-h-[380px] md:min-h-[480px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/35" />

          <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto pt-6 sm:pt-0 flex flex-col items-center w-full">

            {/* H1 */}
            <h1
              className="font-sans text-[26px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] mb-2.5 sm:mb-3 opacity-0 animate-hero-fade-up text-white"
              style={{ animationDelay: "0ms" }}
            >
              {isRTL ? (
                <><span className="whitespace-nowrap">אל תבחר עיר,</span><br /><span className="whitespace-nowrap">בחר את הבריחה שלך</span></>
              ) : (
                <><span className="whitespace-nowrap">Don't choose a city,</span><br /><span className="whitespace-nowrap">choose your escape</span></>
              )}
            </h1>

            {/* Italic tagline */}
            <p
              className="font-sans italic text-white/90 mb-5 sm:mb-6 max-w-xl mx-auto opacity-0 animate-hero-fade-up text-sm sm:text-lg"
              style={{ animationDelay: "200ms" }}
            >
              {isRTL ? "הישראל שרוב האנשים לא מוצאים." : "The Israel most people never find."}
            </p>

            {/* ── STAY / LIVE MODE CARDS ── */}
            <div
              className="opacity-0 animate-hero-fade-up w-full max-w-sm sm:max-w-md mb-5 sm:mb-6"
              style={{ animationDelay: "350ms" }}
              dir="ltr"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* STAY card */}
                <button
                  onClick={() => { setMode("stay"); }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-4 py-3.5 transition-all duration-300 border",
                    mode === "stay"
                      ? "bg-white text-foreground border-white shadow-lg"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                  )}
                >
                  <Moon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="font-bold text-xs sm:text-sm uppercase tracking-widest">STAY</span>
                  <span className={cn("text-[10px] sm:text-xs leading-tight text-center", mode === "stay" ? "text-foreground/70" : "text-white/70")}>
                    {isRTL ? "מלון + חוויה" : "Hotel + experience"}
                  </span>
                </button>

                {/* LIVE card */}
                <button
                  onClick={() => { setMode("live"); }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-4 py-3.5 transition-all duration-300 border",
                    mode === "live"
                      ? "bg-white text-foreground border-white shadow-lg"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                  )}
                >
                  <Sun className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="font-bold text-xs sm:text-sm uppercase tracking-widest">LIVE</span>
                  <span className={cn("text-[10px] sm:text-xs leading-tight text-center", mode === "live" ? "text-foreground/70" : "text-white/70")}>
                    {isRTL ? "חוויות בלבד" : "Experiences only"}
                  </span>
                </button>
              </div>
            </div>

            {/* Trust strip */}
            <div
              className="opacity-0 animate-hero-fade-up mt-5 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wide"
              style={{ animationDelay: "500ms" }}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <span className="flex items-center gap-1.5">
                <Ban className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                {isRTL ? "ביטול חינם" : "Free cancellation"}
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                {isRTL ? "חוויה אמיתית" : "Authentic experience"}
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                {isRTL ? "תשלום מאובטח" : "Secure payment"}
              </span>
            </div>
          </div>
        </section>

        {/* ── 2. HOW IT WORKS ── */}
        <HowItWorksBanner />

        {/* ── 3. MOOD CARDS — horizontal scroll row ── */}
        <section id="v2-moods" className="py-6 sm:py-10 scroll-mt-14">
          <div className="container px-4 mx-auto">
            <div className={cn("flex items-baseline justify-between mb-4", isRTL && "flex-row-reverse")}>
              <h2 className="font-sans text-lg sm:text-xl font-bold tracking-[-0.02em] uppercase">
                {isRTL ? "בחרו את האווירה שלכם" : "Choose your vibe"}
              </h2>
              {selectedMoodId && (
                <button
                  onClick={() => setSelectedMoodId(null)}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  {isRTL ? "× נקה בחירה" : "× clear"}
                </button>
              )}
            </div>

            {/* Horizontal scrollable row */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className={cn("flex gap-3 pb-2", isRTL && "flex-row-reverse")}>
                {!isLoadingCategories && categories?.map((category) => {
                  const catTitle = getLocalizedField(category, "name", lang) as string;
                  const image = category.hero_image || "";
                  const isSelected = selectedMoodId === category.id;

                  return (
                    <button
                      key={category.slug}
                      onClick={() => handleMoodClick(category)}
                      className={cn(
                        "group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 cursor-pointer",
                        "w-[140px] h-[100px] sm:w-[170px] sm:h-[120px] md:w-[190px] md:h-[135px]",
                        isSelected
                          ? "ring-2 ring-primary shadow-lg"
                          : "shadow-soft hover:shadow-strong"
                      )}
                    >
                      {/* Background image */}
                      <img
                        src={image}
                        alt={catTitle}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Overlay */}
                      <div
                        className={cn(
                          "absolute inset-0 transition-all duration-300",
                          isSelected ? "bg-black/55" : "bg-black/30 group-hover:bg-black/50"
                        )}
                      />

                      {/* Title */}
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <h3 className="font-sans text-xs sm:text-sm font-bold text-white uppercase tracking-tight leading-tight text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                          {catTitle}
                        </h3>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <span className="h-2 w-2 rounded-full bg-white block shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. EXPERIENCE FEED ── */}
        <div id="v2-experience-grid" className="scroll-mt-16">

          {selectedMoodId && selectedMood ? (
            /* ── Filtered flat grid when mood is selected ── */
            <section className="container py-4 sm:py-8 px-4">
              <div className={cn("flex items-center justify-between mb-4 sm:mb-6 gap-4", isRTL && "flex-row-reverse")}>
                <div>
                  <h2 className="font-sans text-lg sm:text-xl md:text-2xl font-bold tracking-[-0.02em] uppercase">
                    {`${getLocalizedField(selectedMood, "name", lang)} — ${isRTL ? "הבחירות שלנו" : "our selection"}`}
                  </h2>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {isRTL ? "בחרנו בקפידה את הכי טובים" : "Curated by our team, just for you"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMoodId(null)}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors flex-shrink-0"
                >
                  {isRTL ? "× נקה" : "× clear"}
                </button>
              </div>

              {isLoadingExp ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
                </div>
              ) : filteredExperiences && filteredExperiences.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 transition-all duration-500">
                  {filteredExperiences.map((experience: any, idx: number) => {
                    const primaryHotel = experience.experience2_hotels
                      ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
                    return (
                      <Experience2CardWithPrice
                        key={experience.id}
                        experience={experience}
                        primaryHotel={primaryHotel}
                        hyperguestPropertyId={primaryHotel?.hyperguest_property_id}
                        availabilityRules={rulesMap[experience.id] ?? []}
                        linkPrefix="/experience"
                        linkSuffix="context=v2"
                        index={idx}
                        badge={mode === "live" ? "LIVE" : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-sm mb-4">
                    {isRTL ? "אין חוויות בקטגוריה זו עדיין." : "No experiences in this mood yet."}
                  </p>
                  <button
                    onClick={() => setSelectedMoodId(null)}
                    className="text-sm underline underline-offset-4 text-primary hover:text-primary/80"
                  >
                    {isRTL ? "הצג הכל" : "Show all experiences"}
                  </button>
                </div>
              )}
            </section>

          ) : (
            /* ── Editorial feed: En ce moment + thematic rows ── */
            <>
              {/* En ce moment — featured editorial card */}
              {featuredExp && (
                <section className="container px-4 pt-6 pb-2 sm:pt-10 sm:pb-4">
                  <div className={cn("flex items-baseline justify-between mb-3 sm:mb-4", isRTL && "flex-row-reverse")}>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                        {isRTL ? "✦ עכשיו" : "✦ Right now"}
                      </p>
                      <h2 className="font-sans text-lg sm:text-xl font-bold tracking-[-0.02em] uppercase">
                        {isRTL ? "הבלעדי שלנו" : "En ce moment"}
                      </h2>
                    </div>
                  </div>

                  <Link
                    to={getLocalizedPath(`/experience/${(featuredExp as any).slug}`)}
                    className="group relative block w-full overflow-hidden rounded-2xl shadow-strong"
                  >
                    <div className="aspect-[2/1] sm:aspect-[3/1] relative">
                      <img
                        src={(featuredExp as any).hero_image}
                        alt={(featuredExp as any).title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                      <div className={cn("absolute top-4 sm:top-6", isRTL ? "right-4 sm:right-6" : "left-4 sm:left-6")}>
                        <span className="bg-white text-foreground text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
                          {isRTL ? "הבחירה שלנו" : "Featured"}
                        </span>
                      </div>

                      <div className={cn(
                        "absolute bottom-4 sm:bottom-6 flex items-end justify-between gap-4 w-full px-4 sm:px-6",
                        isRTL && "flex-row-reverse"
                      )}>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <h3 className="font-sans text-white font-bold text-xl sm:text-3xl md:text-4xl leading-tight drop-shadow-sm">
                            {isRTL && (featuredExp as any).title_he
                              ? (featuredExp as any).title_he
                              : (featuredExp as any).title}
                          </h3>
                          {featuredHotel && (
                            <p className="text-white/75 text-sm mt-1">
                              {getLocalizedField(featuredHotel, "city", lang) || getLocalizedField(featuredHotel, "region", lang)}
                            </p>
                          )}
                        </div>
                        <span className="flex-shrink-0 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full group-hover:bg-white group-hover:text-foreground transition-all duration-300">
                          {isRTL ? "← גלו" : "Discover →"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {/* Thematic rows */}
              {isLoadingExp ? (
                <section className="container px-4 py-6">
                  <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-[200px]"><ExperienceCardSkeleton /></div>
                    ))}
                  </div>
                </section>
              ) : activeRows.map((row) => (
                <section key={row.id} className="py-4 sm:py-6">
                  <div className="container px-4">
                    <div className={cn("flex items-baseline justify-between mb-3", isRTL && "flex-row-reverse")}>
                      <h2 className="font-sans text-base sm:text-lg font-bold tracking-[-0.02em] uppercase">
                        {isRTL && row.labelHe ? row.labelHe : row.labelEn}
                      </h2>
                      <button
                        onClick={() => { trackViewAllExperiencesClicked("v2_thematic"); navigate(getLocalizedPath("/experiences")); }}
                        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors flex-shrink-0"
                      >
                        {isRTL ? "לכל החוויות ›" : "View all ›"}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className={cn("flex gap-3 sm:gap-4 pb-2 px-4", isRTL && "flex-row-reverse")}>
                      {row.exps.map((experience: any, idx: number) => {
                        const primaryHotel = experience.experience2_hotels
                          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
                        return (
                          <div key={experience.id} className="flex-shrink-0 w-[200px] sm:w-[240px]">
                            <Experience2CardWithPrice
                              experience={experience}
                              primaryHotel={primaryHotel}
                              hyperguestPropertyId={primaryHotel?.hyperguest_property_id}
                              availabilityRules={rulesMap[experience.id] ?? []}
                              linkPrefix="/experience"
                              linkSuffix="context=v2"
                              index={idx}
                              badge={mode === "live" ? "LIVE" : undefined}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ))}

              {/* View all */}
              <div className="container px-4 py-4 sm:py-6 text-center">
                <button
                  onClick={() => { trackViewAllExperiencesClicked("v2_homepage"); navigate(getLocalizedPath("/experiences")); }}
                  className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors"
                >
                  {isRTL ? "← לכל החוויות" : "View all experiences →"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── 5. SURPRISE ME — standalone section ── */}
        <section className="py-10 sm:py-14 bg-stone-50 mt-8 sm:mt-12">
          <div className="container px-4 mx-auto text-center max-w-lg">
            <Sparkles className="h-6 w-6 mx-auto mb-3 text-primary" strokeWidth={1.5} />
            <h2 className="font-sans text-lg sm:text-xl md:text-2xl font-bold tracking-[-0.02em] mb-2">
              {isRTL ? "לא יודעים להתחיל?" : "Not sure where to start?"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isRTL
                ? "תנו לנו לבחור עבורכם את הבריחה המושלמת"
                : "Let us pick the perfect escape for you"}
            </p>
            <Button
              size="lg"
              className="rounded-full px-10 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleSurpriseMe}
            >
              {selectedMoodId && selectedMood
                ? isRTL
                  ? `הפתע אותי — ${getLocalizedField(selectedMood, "name", lang)}`
                  : `Surprise me — ${getLocalizedField(selectedMood, "name", lang)}`
                : isRTL
                ? "הפתיעו אותי"
                : "Surprise me"}
            </Button>
            {selectedMoodId && (
              <p className="text-[11px] text-muted-foreground mt-3">
                {isRTL ? `מסנן לפי: ${getLocalizedField(selectedMood, "name", lang)}` : `Filtering by: ${getLocalizedField(selectedMood, "name", lang)}`}
              </p>
            )}
          </div>
        </section>

        {/* ── 6. MARQUEE ── */}
        <MarqueeBanner />

        {/* ── 7. BRAND STATEMENT ── */}
        <section className="relative py-8 sm:py-14 overflow-hidden">
          <div className="absolute inset-0">
            <img src={handpickedHero} alt="Israeli countryside road" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container max-w-3xl relative z-10 px-4 text-center">
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] mb-3 text-white">
              {t(lang, "handpickedTitle1")}<br />{t(lang, "handpickedTitle2")}
            </h2>
            <div className="text-[11px] sm:text-xs md:text-sm leading-relaxed text-white/95 max-w-2xl mx-auto space-y-2">
              <p>{t(lang, "handpickedP1")}</p>
              <p>{t(lang, "handpickedP2")}</p>
              <p>{t(lang, "handpickedP3")}</p>
            </div>
          </div>
        </section>

        {/* ── 8. GIFT CARD (between brand statement and tailored) ── */}
        <section className="container py-8 md:py-14 px-4">
          <div className={cn("grid md:grid-cols-2 gap-5 md:gap-8 items-center max-w-4xl mx-auto", isRTL && "md:grid-flow-col-dense")}>
            <div className={cn("relative overflow-hidden rounded-2xl", isRTL && "md:order-2")}>
              <img
                src={giftCardHero}
                alt="Gift Card"
                className="w-full h-56 md:h-72 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className={cn("space-y-4", isRTL && "text-right md:order-1")}>
              <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-tight">
                {isRTL
                  ? <><span>מתנה מושלמת.</span><br /><span>מתנת הבריחה.</span></>
                  : <><span>Perfect gift.</span><br /><span>The gift of escape.</span></>}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md">
                {t(lang, "giftCardSectionDesc")}
              </p>
              <Button asChild className="group" onClick={() => trackGiftCardClicked("v2_page")}>
                <Link to={getLocalizedPath("/gift-card")}>
                  {t(lang, "giftCardSectionCTA")}
                  <ArrowRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", isRTL ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2")} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── 9. TAILORED REQUEST ── */}
        <TailoredRequestSection categories={categories || []} />

        {/* ── 10. FAQ ── */}
        <FAQSection />

      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      <NewsletterPopup />
    </div>
  );
};

export default IndexV2;
