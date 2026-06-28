import { useRef, useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MOBILE_HEADER_HEIGHT } from "@/constants/layout";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { t } from "@/lib/translations";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";
import MarqueeBanner from "@/components/MarqueeBanner";
import TailoredRequestSection from "@/components/TailoredRequestSection";
import FAQSection from "@/components/FAQSection";
import HowItWorksBanner from "@/components/HowItWorksBanner";
import CategoryCard from "@/components/CategoryCard";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import ExperienceCardSkeleton from "@/components/ExperienceCardSkeleton";
import NewsletterPopup from "@/components/NewsletterPopup";
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
import { cn } from "@/lib/utils";
import { trackFindEscapeClicked, trackVibeTabClicked, trackWaitlistEmailSubmitted, trackGiftCardClicked, trackCategoryTileClicked, trackViewAllExperiencesClicked } from "@/lib/analytics";
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
  const queryClient = useQueryClient();

  // Analytics
  useScrollDepth("launch");

  // [DEBUG] Vérification de la configuration Supabase au chargement de l'accueil
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      console.error("❌ Supabase MAL CONFIGURÉ — variables d'environnement manquantes", {
        VITE_SUPABASE_URL: url ? "présente" : "MANQUANTE",
        VITE_SUPABASE_PUBLISHABLE_KEY: key ? "présente" : "MANQUANTE",
      });
      return;
    }

    // La clé existe : on teste un vrai appel pour confirmer qu'elle est acceptée
    (async () => {
      const { error } = await supabase
        .from("experiences")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error("❌ Supabase joignable mais l'appel a échoué :", error.message, error);
      } else {
        console.log("✅ Supabase OK — variables présentes et clé API acceptée", {
          url,
          keyPreview: `${key.slice(0, 8)}…${key.slice(-4)}`,
        });
      }
    })();
  }, []);

  // Rafraîchissement automatique quand l'admin modifie l'ordre
  useEffect(() => {
    const channel = supabase
      .channel("launch-index-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "experiences2" }, () => {
        queryClient.invalidateQueries({ queryKey: ["launch-experiences2"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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
  // ⚡️ Optim 2026-05-07 : on ne sélectionne QUE les colonnes utilisées par la vignette
  // (titre, photo hero, slug, hôtel principal, tags). Les colonnes lourdes (long_copy,
  // long_copy_he, og_*, meta_*, faqs, etc.) ne sont jamais lues sur cette page → on
  // les laisse en base. Avant : ~144 Ko, 1,2 s. Après : ~50-60 Ko, ~0,4 s attendus.
  // Cache 60 s : les modifs admin apparaissent avec ~1 min de délai max, gain énorme
  // sur les visites suivantes (page instantanée).
  const { data: experiences2, isLoading: isLoadingExp } = useQuery({
    queryKey: ["launch-experiences2"],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("experiences2").
      select(`
          id,
          slug,
          title,
          title_he,
          title_fr,
          hero_image,
          photos,
          status,
          display_order,
          preferred_board_type,
          categories(slug),
          experience2_hotels(
            position,
            nights,
            hotel:hotels2(
              id, name, name_he, name_fr, city, city_he, city_fr, region, region_he, region_fr, hero_image, hyperguest_property_id,
              practical_info
            )
          ),
          experience2_highlight_tags(
            highlight_tags(
              id, slug, label_en, label_he, label_fr
            )
          )
        `).
      eq("status", "published").
      order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000, // 60 s — page instantanée pour les visites successives
    gcTime: 5 * 60_000, // 5 min en mémoire avant garbage-collect
  });

  // IDs de toutes les expériences chargées — sert à la requête batch ci-dessous
  const experienceIds = useMemo(
    () => (experiences2 ?? []).map((e: any) => e.id as string),
    [experiences2],
  );

  // Une seule requête pour TOUTES les règles de dispo → distribuée aux cartes via rulesMap
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

  // Requête batch : note moyenne + nombre d'avis pour toutes les expériences
  const { data: allReviewStats = [] } = useQuery({
    queryKey: ["reviews_stats_batch", experienceIds],
    queryFn: async () => {
      if (experienceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("experience2_reviews")
        .select("experience_id, rating")
        .in("experience_id", experienceIds)
        .eq("is_visible", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: experienceIds.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const reviewsMap = useMemo(() => {
    const map: Record<string, { count: number; avg: number }> = {};
    for (const r of allReviewStats) {
      const eid = (r as any).experience_id;
      if (!map[eid]) map[eid] = { count: 0, avg: 0 };
      map[eid].count += 1;
      map[eid].avg += (r as any).rating;
    }
    for (const eid of Object.keys(map)) {
      map[eid].avg = map[eid].avg / map[eid].count;
    }
    return map;
  }, [allReviewStats]);

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
      toast.success(lang === 'he' ? "נרשמת בהצלחה!" : lang === 'fr' ? "Vous êtes sur la liste !" : "You're on the list!");
    } catch {
      toast.error(lang === 'he' ? "שגיאה, נסה שנית" : lang === 'fr' ? "Une erreur est survenue. Réessayez." : "Something went wrong. Try again.");
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
      toast.success(lang === 'he' ? "נרשמת בהצלחה!" : lang === 'fr' ? "Vous êtes sur la liste !" : "You're on the list!");
    } catch {
      toast.error(lang === 'he' ? "שגיאה, נסה שנית" : lang === 'fr' ? "Une erreur est survenue." : "Something went wrong.");
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

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip preserve-heading-colors" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead
        title={lang === 'he' ? "STAYMAKOM — מלונות וחוויות נבחרים בישראל" : lang === 'fr' ? "STAYMAKOM — Hôtels & Expériences d'exception en Israël" : "STAYMAKOM — Handpicked Hotels & Experiences in Israel"}
        description={lang === 'he' ? "אנחנו אוצרים את המלונות הבוטיק הטובים בישראל ומשלבים אותם עם חוויות מקומיות ייחודיות." : lang === 'fr' ? "Nous sélectionnons les meilleurs hôtels boutique d'Israël et les associons à des expériences locales uniques." : "We curate Israel's best boutique hotels and pair them with unique local experiences."} />

      <V3Header />

      <main className="flex-1 md:pt-0 pt-0 pb-[80px] md:pb-0">
        {/* ─── 1. HERO ─── */}
        <section className="relative h-[62vh] md:h-[70vh] min-h-[320px] md:min-h-[480px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }} />

          <div className="absolute inset-0 bg-black/45" />

          <div className={`relative z-10 text-center text-white px-6 ${lang === 'fr' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto pt-6 sm:pt-0`}>
            <h1
              className="font-sans text-[26px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] mb-2.5 sm:mb-4 opacity-0 animate-hero-fade-up text-white text-center"
              style={{ animationDelay: '0ms' }}>
              {lang === 'he' ? (
                <><span className="whitespace-nowrap">אל תבחר עיר,</span><br /><span className="whitespace-nowrap">בחר את הבריחה שלך</span></>
              ) : lang === 'fr' ? (
                <>Plus qu'une destination.<br />Une émotion.</>
              ) : (
                <><span className="whitespace-nowrap">Don't choose a city,</span><br /><span className="whitespace-nowrap">choose your escape</span></>
              )}
            </h1>
            <p
              className="font-sans italic text-white/90 mb-5 sm:mb-7 max-w-xl mx-auto opacity-0 animate-hero-fade-up text-sm sm:text-lg md:text-xl"
              style={{ animationDelay: '250ms' }}>
              {lang === 'he' ? "הישראל שרוב האנשים לא מוצאים." : lang === 'fr' ? "Hôtels uniques et expériences immersives à travers Israël." : "The Israel most people never find."}
            </p>
            <button
              onClick={() => {
                trackFindEscapeClicked();
                const el = document.getElementById("launch-experiences");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-10 py-2.5 sm:py-4 bg-white text-foreground font-semibold uppercase tracking-wide text-sm rounded-md shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:brightness-110 transition-all duration-300 opacity-0 animate-hero-fade-up cursor-pointer"
              style={{ animationDelay: '500ms' }}>
              {lang === 'he' ? "מצא את הבריחה שלך" : lang === 'fr' ? "Explorer les expériences" : "Find your escape"}
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
              {lang === 'he' ? (<>מלונות שנבחרו בקפידה.<br />חוויות בלתי נשכחות.</>) : lang === 'fr' ? (<>Hôtels d'exception.<br />Expériences inoubliables.</>) : (<>Handpicked Hotels.<br />Unforgettable Experiences.</>)}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mb-5">
              {lang === 'he' ? "ל-24 שעות, 48 שעות, או חוויות מותאמות אישית." : lang === 'fr' ? "Pour 24h, 48h, ou des expériences sur mesure." : "For 24 hours, 48 hours, or tailor-made experiences."}
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
                  {lang === 'he' ? "הרפתקה" : lang === 'fr' ? "Esprit aventure" : "Feel adventurous"}
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
                  {lang === 'he' ? "בריחה רומנטית" : lang === 'fr' ? "Escapade romantique" : "Romantic Escape"}
                </span>
              </button>
              <div
                className="absolute bottom-0 h-px bg-mobile-active transition-all duration-300 ease-in-out"
                style={{ left: toggleUnderline.left, width: toggleUnderline.width }}
              />
            </div>
          </div>

          {isLoadingExp ?
          <div className="mt-4 md:mt-3 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
              {Array.from({ length: 8 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
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
                  availabilityRules={rulesMap[experience.id] ?? []}
                  reviewCount={reviewsMap[experience.id]?.count ?? 0}
                  rating={reviewsMap[experience.id]?.avg ?? null}
                  linkPrefix="/experience"
                  linkSuffix="context=launch"
                  index={idx} />);


            })}
            </div> :

          <div className="text-center py-16">
              <p className="text-muted-foreground">
                {lang === 'he' ? "אין חוויות בקטגוריה זו עדיין" : lang === 'fr' ? "Aucune expérience dans cette catégorie pour l'instant." : "No experiences in this category yet."}
              </p>
              <button
              onClick={() => { setActiveFilter(null); trackViewAllExperiencesClicked("homepage"); }}
              className="mt-4 text-sm underline underline-offset-4 text-primary hover:text-primary/80">

                {lang === 'he' ? "הצג הכל" : lang === 'fr' ? "Voir toutes les expériences" : "Show all experiences"}
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
                {lang === 'he' ? "עוד בריחות בדרך" : lang === 'fr' ? "D'autres escapades arrivent bientôt." : "More escapes are on the way."}
              </h2>
            </div>

            <div className="max-w-sm sm:max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-10">
              <p className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                {lang === 'he' ? "היו הראשונים." : lang === 'fr' ? "Soyez les premiers." : "Be the first in."}
              </p>

              {submitted ?
              // Après inscription : on affiche le code WELCOME10 avec un bouton Copy.
              // Cohérent avec la popup. Permet à ceux qui ont raté la popup de
              // récupérer le code via le formulaire inline.
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <CheckCircle className="h-4 w-4" />
                  {isRTL
                    ? "נרשמת! קוד 10% שלך:"
                    : lang === "fr"
                      ? "Inscrit·e ! Ton code 10 % :"
                      : "You're on the list! Your 10% code:"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("WELCOME10").catch(() => {});
                    toast.success(isRTL ? "הועתק!" : lang === "fr" ? "Copié !" : "Copied!");
                  }}
                  className="font-mono text-sm font-bold tracking-wider px-3 py-1 rounded-md border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  WELCOME10
                </button>
              </div> :

              <form onSubmit={handleLeadSubmit} className="flex gap-2 w-full sm:w-auto">
                  <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'he' ? "כתובת האימייל שלך" : lang === 'fr' ? "Votre adresse e-mail" : "Your email address"}
                  className="flex-1 sm:w-56 h-9 text-sm" />

                  <Button type="submit" disabled={isSubmitting} size="sm" className="h-9 text-xs px-4 bg-[#1A1814] text-white hover:bg-[#1A1814]/90">
                    {lang === 'he' ? "הצטרפו לרשימה" : lang === 'fr' ? "Je m'inscris" : "Join the list"}
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
                            <img src={image} alt={catTitle} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                {lang === 'he' ? (<>מתנה מושלמת.<br />מתנת הבריחה.</>) : lang === 'fr' ? (<>Le cadeau parfait.<br />Une évasion à offrir.</>) : (<>Perfect gift.<br />The gift of escape.</>)}
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

        {/* ─── 9. FAQ ─── */}
        <FAQSection />

      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      {/* ─── NEWSLETTER POPUP — apparaît après ~10s, une fois par appareil, donne WELCOME10 ─── */}
      <NewsletterPopup />

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
              {lang === 'he' ? "החוויה הזו בדרך" : lang === 'fr' ? "Cette expérience arrive bientôt." : "This experience is coming soon."}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {lang === 'he' ? `הצטרף לרשימת ההמתנה של "${waitlistCategory}" והיה הראשון לדעת.` : lang === 'fr' ? `Rejoignez la liste d'attente pour "${waitlistCategory}" et soyez les premiers informés.` : `Join the waitlist for "${waitlistCategory}" and be the first to access it.`}
            </DialogDescription>
          </DialogHeader>

          {waitlistSubmitted ?
          <div className="flex items-center justify-center gap-2 text-primary font-medium py-6">
              <CheckCircle className="h-5 w-5" />
              {lang === 'he' ? "נרשמת בהצלחה!" : lang === 'fr' ? "Vous êtes sur la liste !" : "You're on the list!"}
            </div> :

          <form
            onSubmit={handleWaitlistSubmit}
            className="flex flex-col gap-3 pt-2">

              <Input
              type="email"
              required
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              placeholder={lang === 'he' ? "כתובת האימייל שלך" : lang === 'fr' ? "Votre adresse e-mail" : "Your email address"} />

              <Button type="submit" disabled={waitlistSubmitting} className="w-full">
                {waitlistSubmitting ?
              <Loader2 className="h-4 w-4 animate-spin" /> :
              lang === 'he' ? "עדכנו אותי" : lang === 'fr' ? "M'avertir" : "Notify me"
              }
              </Button>
            </form>
          }
        </DialogContent>
      </Dialog>
      
    </div>);

};

export default LaunchIndex;