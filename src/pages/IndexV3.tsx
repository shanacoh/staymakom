import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
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
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import ExperienceCardSkeleton from "@/components/ExperienceCardSkeleton";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Heart, Users, Sparkles, Leaf, Wine, Zap, Laptop, Brain,
  Mountain, Utensils, Coffee, Sun, Moon, Star, Compass, Globe,
  Briefcase, Flame, Droplet, Wind, TreePine, Flower2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackGiftCardClicked, trackViewAllExperiencesClicked } from "@/lib/analytics";
import heroImage from "@/assets/hero-road-desert.jpg";
import handpickedHero from "@/assets/handpicked-hero.jpg";
import giftCardHero from "@/assets/gift-card-hero.jpg";
import featuredPhoto from "@/assets/desert-hotel-pool.jpg";

/* ─── Icon map (identique à /home) ──────────────────────────────────────── */
const iconMap: Record<string, LucideIcon> = {
  heart: Heart, users: Users, sparkles: Sparkles, leaf: Leaf, wine: Wine,
  zap: Zap, laptop: Laptop, brain: Brain, mountain: Mountain,
  utensils: Utensils, coffee: Coffee, sun: Sun, moon: Moon, star: Star,
  compass: Compass, globe: Globe, briefcase: Briefcase, flame: Flame,
  droplet: Droplet, wind: Wind, "tree-pine": TreePine, flower: Flower2,
};


/* ─── Catégories V3 — ordre et labels fixes ─────────────────────────────── */
const V3_CATEGORIES = [
  { id: "romantic-escape", en: "Romantic Escape",  fr: "Escapade Romantique",  he: "בריחה רומנטית",    slugHints: ["romantic"],                   icon: "heart",   img: "/icons/icon-romantic.png"  },
  { id: "family-fun",      en: "Family Fun",        fr: "Fun Famille",          he: "כיף משפחתי",       slugHints: ["family"],                     icon: "users",   img: "/icons/icon-family.png"    },
  { id: "foody-discovery", en: "Foody Discovery",   fr: "Découverte Culinaire", he: "גילוי קולינרי",    slugHints: ["taste", "food", "culinar"],   icon: "wine",    img: "/icons/icon-foody.png"     },
  { id: "land-of-stories", en: "Land of Stories",  fr: "Terre de Récits",      he: "ארץ הסיפורים",     slugHints: ["land", "stories"],            icon: "compass", img: "/icons/icon-stories.png"   },
  { id: "sporty-break",    en: "Sporty Break",      fr: "Pause Sportive",       he: "הפסקה ספורטיבית",  slugHints: ["active", "sport"],            icon: "zap",     img: "/icons/icon-sporty.png"    },
  { id: "nature-outdoor",  en: "Nature & Outdoor",  fr: "Nature & Plein Air",   he: "טבע ושטח",         slugHints: ["nature", "beyond", "outdoor"],icon: "leaf",    img: "/icons/icon-nature.png"    },
  { id: "mindful-reset",   en: "Mindful Reset",     fr: "Pause Bien-être",      he: "איפוס מודע",       slugHints: ["mindful", "reset"],           icon: "brain",   img: "/icons/icon-mindful.png"   },
  { id: "lone-traveler",   en: "Lone Traveler",     fr: "Voyageur Solo",        he: "טיול יחיד",        slugHints: ["solo", "lone", "single"],     icon: "globe",   img: "/icons/icon-solo.png"      },
];

/* ─── Helper hotel principal ─────────────────────────────────────────────── */
function primaryHotel(exp: any) {
  return (
    exp.experience2_hotels
      ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]
      ?.hotel ?? null
  );
}

/* ─── Composant ──────────────────────────────────────────────────────────── */
const IndexV3 = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { getLocalizedPath } = useLocalizedNavigation();
  const isRTL = lang === "he";
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"stay" | "live">("stay");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /* ── Realtime ── */
  useEffect(() => {
    const channel = supabase
      .channel("v3-index-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "experiences2" }, () => {
        queryClient.invalidateQueries({ queryKey: ["v3-experiences2"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  /* ── Categories ── */
  const { data: categories } = useQuery({
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

  /* ── Experiences ── */
  const { data: experiences2, isLoading: isLoadingExp } = useQuery({
    queryKey: ["v3-experiences2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
          id, slug, title, title_he, title_fr,
          hero_image, photos, status, display_order,
          preferred_board_type,
          categories(slug),
          experience2_hotels(
            position, nights,
            hotel:hotels2(
              id, name, name_he, name_fr,
              city, city_he, city_fr,
              region, region_he, region_fr,
              hero_image, hyperguest_property_id
            )
          ),
          experience2_highlight_tags(
            highlight_tags(id, slug, label_en, label_he, label_fr, display_order, is_common, icon)
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

  /* ── Availability rules ── */
  const experienceIds = useMemo(
    () => (experiences2 ?? []).map((e: any) => e.id as string),
    [experiences2]
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

  /* ── Filtrage par catégorie ── */
  const filteredExperiences = useMemo(() => {
    if (!selectedCategory) return experiences2;
    return experiences2?.filter(
      (exp: any) => exp.categories?.slug === selectedCategory
    );
  }, [experiences2, selectedCategory]);

  /* ────────────────────────────────────────────── RENDER ── */
  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-white" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead
        titleEn="STAYMAKOM — Handpicked Hotels & Experiences in Israel"
        titleHe="STAYMAKOM — מלונות וחוויות נבחרים בישראל"
        descriptionEn="We curate Israel's best boutique hotels and pair them with unique local experiences."
        descriptionHe="אנחנו אוצרים את המלונות הבוטיק הטובים בישראל ומשלבים אותם עם חוויות מקומיות ייחודיות."
      />

      {/* ──── HEADER toujours blanc avec toggle centré ──── */}
      <V3Header mode={mode} setMode={setMode} />

      <main className="flex-1 pb-[80px] md:pb-0 pt-14">

        {/* ──── 1. HERO ──── */}
        <section className="relative h-[49vh] md:h-[54vh] min-h-[300px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/15" />

          <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto">
            <h1 className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] mb-3 opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg">
              {isRTL ? (
                <><span className="whitespace-nowrap">אל תבחר עיר,</span><br /><span className="whitespace-nowrap">בחר את הבריחה שלך</span></>
              ) : (
                <><span className="whitespace-nowrap">Don't choose a city,</span><br /><span className="whitespace-nowrap">choose your escape</span></>
              )}
            </h1>
            <p
              className="font-sans italic text-white/90 max-w-xl mx-auto opacity-0 animate-hero-fade-up text-sm sm:text-lg md:text-xl drop-shadow-md"
              style={{ animationDelay: "250ms" }}
            >
              {isRTL
                ? "הישראל שרוב האנשים לא מוצאים."
                : lang === "fr"
                  ? "L'Israël que la plupart des gens ne trouvent jamais."
                  : "The Israel most people never find."}
            </p>
          </div>
        </section>

        {/* ──── 2+3+4. Section unifiée : Handpicked + Catégories + Cartes ──── */}
        <section className="bg-[#FAF8F4] pt-7 pb-9 sm:pt-9 sm:pb-12">

          {/* Titre */}
          <div className="text-center px-4 mb-3">
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.02em] mb-1 leading-tight">
              {isRTL ? (
                <>מלונות שנבחרו בקפידה.<br />חוויות בלתי נשכחות.</>
              ) : lang === "fr" ? (
                <>Hôtels d'exception.<br />Expériences inoubliables.</>
              ) : (
                <>Handpicked Hotels.<br />Unforgettable Experiences.</>
              )}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isRTL
                ? "ל-24 שעות, 48 שעות, או חוויות מותאמות אישית."
                : lang === "fr"
                  ? "Pour 24h, 48h, ou des expériences sur mesure."
                  : "For 24 hours, 48 hours, or tailor-made experiences."}
            </p>
          </div>

          {/* Chips catégories */}
          {categories && categories.length > 0 && (
            <div
              className={cn(
                "flex flex-nowrap justify-start sm:justify-center gap-2 sm:gap-3",
                "overflow-x-auto overflow-y-visible py-2 px-4 sm:px-6 scrollbar-hide mb-4 sm:mb-6",
                isRTL && "flex-row-reverse"
              )}
            >
              {V3_CATEGORIES.map((v3cat) => {
                const dbCat = (categories as any[])?.find((cat) =>
                  v3cat.slugHints.some((hint) => cat.slug.includes(hint))
                );
                const dbSlug = dbCat?.slug ?? null;
                const isSelected = dbSlug !== null && selectedCategory === dbSlug;
                const isDimmed = !!selectedCategory && !isSelected;
                const name = lang === "he" ? v3cat.he : lang === "fr" ? v3cat.fr : v3cat.en;
                const IconComponent: LucideIcon =
                  (dbCat?.icon ? iconMap[dbCat.icon] : null) ?? iconMap[v3cat.icon] ?? Sparkles;

                const words = name.split(" ");
                const mid = Math.ceil(words.length / 2);
                const line1 = words.slice(0, mid).join(" ");
                const line2 = words.slice(mid).join(" ");

                return (
                  <button
                    key={v3cat.id}
                    onClick={() => setSelectedCategory((prev) => (prev === dbSlug ? null : dbSlug))}
                    className={cn(
                      "group flex flex-col items-center gap-2 flex-shrink-0 w-[72px] sm:w-[82px] py-2.5 px-1 rounded-2xl transition-all duration-200",
                      isSelected
                        ? "bg-white border border-teal-500/60 shadow-sm"
                        : isDimmed
                          ? "opacity-35"
                          : "hover:bg-[#EDE8DF]"
                    )}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center overflow-hidden bg-stone-100">
                      {v3cat.img ? (
                        <img
                          src={v3cat.img}
                          alt={name}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                          style={{ mixBlendMode: "multiply" }}
                        />
                      ) : (
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-stone-500" strokeWidth={1.5} />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-center leading-[13px] transition-colors duration-200",
                        isSelected ? "text-teal-600" : "text-foreground/55 group-hover:text-foreground/75"
                      )}
                    >
                      {line1}{line2 && <><br />{line2}</>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Grille de cartes */}
          <div className="container px-4 mx-auto">
            {isLoadingExp ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
              </div>
            ) : filteredExperiences && filteredExperiences.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 transition-all duration-500">
                  {(filteredExperiences as any[]).slice(0, 12).map((exp: any, idx: number) => {
                    const hotel = primaryHotel(exp);
                    return (
                      <Experience2CardWithPrice
                        key={exp.id}
                        experience={exp}
                        primaryHotel={hotel}
                        hyperguestPropertyId={hotel?.hyperguest_property_id}
                        availabilityRules={rulesMap[exp.id] ?? []}
                        linkPrefix="/experience"
                        linkSuffix="context=v3"
                        index={idx}
                        badge={mode === "live" ? "JUST GO" : undefined}
                      />
                    );
                  })}
                </div>
                <div className="text-center mt-8">
                  <button
                    onClick={() => { trackViewAllExperiencesClicked("v3_grid"); navigate(getLocalizedPath("/experiences")); }}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-widest rounded-full hover:bg-foreground/90 transition-colors"
                  >
                    {isRTL ? "לכל החוויות" : lang === "fr" ? "VOIR TOUTES LES EXPÉRIENCES" : "VIEW ALL EXPERIENCES"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground text-sm mb-3">
                  {isRTL ? "אין חוויות בקטגוריה זו עדיין." : lang === "fr" ? "Aucune expérience pour cette catégorie." : "No experiences for this category yet."}
                </p>
                <button onClick={() => setSelectedCategory(null)} className="text-sm underline underline-offset-4 text-primary">
                  {isRTL ? "הצג הכל" : lang === "fr" ? "Voir tout" : "Show all"}
                </button>
              </div>
            )}
          </div>

        </section>

        {/* ──── 5. YOUR TRIP, YOUR RULES ──── */}
        <TailoredRequestSection
          categories={categories || []}
          ctaClassName="bg-foreground text-background hover:bg-foreground/90"
        />

        {/* ──── 6. GIFT CARD ──── */}
        <section className="container py-8 md:py-14 px-4">
          <div className={`grid md:grid-cols-2 gap-5 md:gap-8 items-center max-w-4xl mx-auto ${isRTL ? "md:grid-flow-col-dense" : ""}`}>
            <div className={`relative overflow-hidden rounded-2xl ${isRTL ? "md:order-2" : ""}`}>
              <img
                src={giftCardHero}
                alt="Gift Card"
                className="w-full h-56 md:h-72 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className={`space-y-4 ${isRTL ? "text-right md:order-1" : ""}`}>
              <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-tight">
                {isRTL ? (
                  <><span>מתנה מושלמת.</span><br /><span>מתנת הבריחה.</span></>
                ) : lang === "fr" ? (
                  <><span>Le cadeau parfait.</span><br /><span>Une évasion à offrir.</span></>
                ) : (
                  <><span>Perfect gift.</span><br /><span>The gift of escape.</span></>
                )}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md">
                {t(lang, "giftCardSectionDesc")}
              </p>
              <Button asChild className="group bg-foreground text-background hover:bg-foreground/90" onClick={() => trackGiftCardClicked("v3_page")}>
                <Link to={getLocalizedPath("/gift-card")}>
                  {t(lang, "giftCardSectionCTA")}
                  <ArrowRight
                    className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2"}`}
                  />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ──── 7. BANDEAU DÉFILANT ──── */}
        <MarqueeBanner className="bg-[#FAF8F4]" />

        {/* ──── 8. THIS IS NOT TOURISM ──── */}
        <section className="relative py-8 sm:py-14 md:py-18 overflow-hidden">
          <div className="absolute inset-0">
            <img src={handpickedHero} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container max-w-3xl relative z-10 px-4 text-center">
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] mb-3 text-white">
              {isRTL
                ? <><span>זה לא תיירות.</span><br /><span>זה משהו אחר.</span></>
                : lang === "fr"
                  ? <><span>Ce n'est pas du tourisme.</span><br /><span>C'est autre chose.</span></>
                  : <><span>This is not tourism.</span><br /><span>This is something else.</span></>}
            </h2>
            <div className="text-[11px] sm:text-xs md:text-sm leading-relaxed text-white/95 max-w-2xl mx-auto space-y-2">
              <p>{t(lang, "handpickedP1")}</p>
              <p>{t(lang, "handpickedP2")}</p>
              <p>{t(lang, "handpickedP3")}</p>
            </div>
          </div>
        </section>

        {/* ──── 9. À LA UNE ──── */}
        <section className="py-10 sm:py-14">
          <div className="container px-4 mx-auto">
            <div className="grid md:grid-cols-[1fr_2fr] gap-0 rounded-2xl overflow-hidden shadow-xl max-w-5xl mx-auto">
              {/* Photo */}
              <div className="relative h-52 md:h-auto min-h-[220px] overflow-hidden">
                <img
                  src={featuredPhoto}
                  alt="À la une"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* Bandeau texte */}
              <div className="bg-[#1A1814] text-white flex flex-col justify-center p-8 sm:p-10 md:p-12">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-3">
                  {isRTL ? "אירוע" : lang === "fr" ? "Événement" : "Event"}
                </span>
                <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-3 text-white">
                  {isRTL
                    ? <>5 חוויות<br />בנכסים היפים ביותר</>
                    : lang === "fr"
                      ? <>5 expériences dans<br />les plus beaux domaines</>
                      : <>5 experiences in<br />the most beautiful estates</>}
                </h2>
                <p className="text-white/70 text-sm mb-6">
                  {isRTL
                    ? "בריכות מוסתרות וארוחות צהריים בשמש"
                    : lang === "fr"
                      ? "Piscines cachées et déjeuners au soleil"
                      : "Hidden pools and lunches under the sun"}
                </p>
                <div>
                  <Link
                    to={getLocalizedPath("/experiences")}
                    className="inline-flex items-center gap-2 bg-[#FAF8F4] text-[#1A1814] text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-white transition-colors"
                  >
                    {isRTL ? "צפה" : lang === "fr" ? "Voir l'événement" : "View event"}
                    <ArrowRight className={cn("h-3.5 w-3.5", isRTL && "rotate-180")} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──── 10. Q&A ──── */}
        <FAQSection />

      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default IndexV3;
