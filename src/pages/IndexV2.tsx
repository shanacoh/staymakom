import { useState, useMemo, useEffect } from "react";
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
import HowItWorksBanner from "@/components/HowItWorksBanner";
import TailoredRequestSection from "@/components/TailoredRequestSection";
import FAQSection from "@/components/FAQSection";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import ExperienceCardSkeleton from "@/components/ExperienceCardSkeleton";
import NewsletterPopup from "@/components/NewsletterPopup";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowRight, Moon, Sun, Sparkles, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackVibeTabClicked, trackGiftCardClicked, trackViewAllExperiencesClicked } from "@/lib/analytics";
import heroImage    from "@/assets/hero-road-desert.jpg";
import handpickedHero from "@/assets/handpicked-hero.jpg";
import giftCardHero   from "@/assets/gift-card-hero.jpg";

/* ─── 6 vibes actifs ─────────────────────────────────────────────────────── */
const VIBE_CHIPS = [
  { id: "for-two",          label: "For Two",          slugHints: ["romantic"] },
  { id: "little-explorers", label: "Little Explorers", slugHints: ["family", "little"] },
  { id: "taste-israel",     label: "Taste Israel",     slugHints: ["taste"] },
  { id: "get-active",       label: "Get Active",       slugHints: ["active"] },
  { id: "land-of-stories",  label: "Land of Stories",  slugHints: ["land", "stories", "nature", "beyond"] },
  { id: "reset",            label: "Reset",            slugHints: ["reset", "mindful"] },
];

/* ─── Geo helpers ─────────────────────────────────────────────────────────── */
function matchesZone(hotel: any, keywords: string[]): boolean {
  if (!hotel || keywords.length === 0) return false;
  const hay = `${hotel.region || ""} ${hotel.city || ""}`.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}
const DESERT_KEYS    = ["negev","eilat","dead sea","arava","néguev","mer morte"];
const SEA_KEYS       = ["kinneret","mediterranean","haifa","akko","sea of galilee","méditerranée","kinéret"];
const TLV_KEYS       = ["tel aviv","jaffa","yafo"];
const JERUSALEM_KEYS = ["jerusalem","jérusalem","yerushalayim"];

function primaryHotel(exp: any) {
  return exp.experience2_hotels
    ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel ?? null;
}

/* ─── Composant ──────────────────────────────────────────────────────────── */
const IndexV2 = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { getLocalizedPath } = useLocalizedNavigation();
  const isRTL = lang === "he";
  const queryClient = useQueryClient();

  /* ── State ── */
  const [mode, setMode]                     = useState<"stay" | "live">("stay");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [isFabSheetOpen, setIsFabSheetOpen] = useState(false);
  const [fabDate, setFabDate]               = useState("");
  const [fabMood, setFabMood]               = useState("");
  const [fabGuests, setFabGuests]           = useState(2);

  /* ── Realtime refresh ── */
  useEffect(() => {
    const channel = supabase
      .channel("v2-index-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "experiences2" }, () => {
        queryClient.invalidateQueries({ queryKey: ["launch-experiences2-v2"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  /* ── Categories ── */
  const { data: categories } = useQuery({
    queryKey: ["launch-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories").select("*")
        .eq("status", "published").eq("show_on_launch", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  /* ── Experiences ── */
  const { data: experiences2, isLoading: isLoadingExp } = useQuery({
    queryKey: ["launch-experiences2-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
          id, slug, title, title_he, title_fr,
          hero_image, photos, status, display_order,
          featured_on_home, preferred_board_type,
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
  const experienceIds = useMemo(() => (experiences2 ?? []).map((e: any) => e.id as string), [experiences2]);
  const { data: allAvailabilityRules = [] } = useQuery({
    queryKey: ["availability_rules_batch", experienceIds],
    queryFn: async () => {
      if (experienceIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from("experience2_availability_rules")
        .select("id, experience_id, rule_type, days_of_week, date_from, date_to, specific_dates")
        .in("experience_id", experienceIds).eq("is_active", true);
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

  /* ── SEO ── */
  const { data: homepageSEO } = useQuery({
    queryKey: ["homepage-seo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings").select("*").eq("key", "homepage").single();
      if (error) throw error;
      return data;
    },
  });

  /* ── Derived ── */
  const categoryFilteredExperiences = useMemo(() => {
    if (!selectedVibe) return experiences2;
    const chip = VIBE_CHIPS.find((c) => c.id === selectedVibe);
    if (!chip) return experiences2;
    const matchedCat = categories?.find((cat) =>
      chip.slugHints.some((hint) => cat.slug.includes(hint))
    );
    if (!matchedCat) return experiences2;
    return experiences2?.filter((exp: any) => exp.categories?.slug === matchedCat.slug);
  }, [experiences2, selectedVibe, categories]);

  const desertExps    = useMemo(() => (experiences2 ?? []).filter((e: any) => matchesZone(primaryHotel(e), DESERT_KEYS)),    [experiences2]);
  const seaExps       = useMemo(() => (experiences2 ?? []).filter((e: any) => matchesZone(primaryHotel(e), SEA_KEYS)),       [experiences2]);
  const tlvExps       = useMemo(() => (experiences2 ?? []).filter((e: any) => matchesZone(primaryHotel(e), TLV_KEYS)),       [experiences2]);
  const jerusalemExps = useMemo(() => (experiences2 ?? []).filter((e: any) => matchesZone(primaryHotel(e), JERUSALEM_KEYS)), [experiences2]);

  /* ── Handlers ── */
  const handleSurpriseMe = () => {
    const pool = categoryFilteredExperiences ?? experiences2;
    if (!pool || pool.length === 0) return;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setIsFabSheetOpen(false);
    navigate(getLocalizedPath(`/experience/${(random as any).slug}`));
  };

  const handleVibeClick = (vibeId: string) => {
    trackVibeTabClicked(vibeId);
    setSelectedVibe((prev) => (prev === vibeId ? null : vibeId));
  };

  /* ── Card helper ── */
  const renderCard = (experience: any, idx: number) => {
    const hotel = primaryHotel(experience);
    return (
      <div key={experience.id} className="flex-shrink-0 w-[170px] sm:w-[210px]">
        <Experience2CardWithPrice
          experience={experience}
          primaryHotel={hotel}
          hyperguestPropertyId={hotel?.hyperguest_property_id}
          availabilityRules={rulesMap[experience.id] ?? []}
          linkPrefix="/experience"
          linkSuffix="context=v2"
          index={idx}
          badge={mode === "live" ? "JUST GO" : undefined}
        />
      </div>
    );
  };

  /* ────────────────────────────────────────────── RENDER ── */
  return (
    <div className="min-h-screen flex flex-col overflow-x-clip" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead
        titleEn={homepageSEO?.seo_title_en}       titleHe={homepageSEO?.seo_title_he}
        descriptionEn={homepageSEO?.meta_description_en} descriptionHe={homepageSEO?.meta_description_he}
        ogTitleEn={homepageSEO?.og_title_en}       ogTitleHe={homepageSEO?.og_title_he}
        ogDescriptionEn={homepageSEO?.og_description_en} ogDescriptionHe={homepageSEO?.og_description_he}
        ogImage={homepageSEO?.og_image}
      />

      <LaunchHeader />

      <main className="flex-1 pb-[80px] md:pb-0">

        {/* ──────── 1. HERO ── */}
        <section className="relative h-[62vh] md:h-[70vh] min-h-[380px] md:min-h-[480px] flex items-center justify-center">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="absolute inset-0 bg-black/35" />

          <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto pt-6 sm:pt-0 flex flex-col items-center w-full">

            <h1
              className="font-sans text-[26px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] mb-2.5 sm:mb-4 opacity-0 animate-hero-fade-up text-white text-center"
              style={{ animationDelay: "0ms" }}
            >
              {isRTL
                ? <><span className="whitespace-nowrap">אל תבחר עיר,</span><br /><span className="whitespace-nowrap">בחר את הבריחה שלך</span></>
                : lang === "fr"
                  ? <>Plus qu'une destination.<br />Une émotion.</>
                  : <><span className="whitespace-nowrap">Don't choose a city,</span><br /><span className="whitespace-nowrap">choose your escape</span></>}
            </h1>

            <p
              className="font-sans italic text-white/90 mb-5 sm:mb-7 max-w-xl mx-auto opacity-0 animate-hero-fade-up text-sm sm:text-lg md:text-xl"
              style={{ animationDelay: "250ms" }}
            >
              {isRTL ? "הישראל שרוב האנשים לא מוצאים." : lang === "fr" ? "Hôtels uniques et expériences immersives à travers Israël." : "The Israel most people never find."}
            </p>

            {/* Toggle Full Stay / Just Go — coins arrondis */}
            <div
              className="opacity-0 animate-hero-fade-up w-full max-w-[260px] sm:max-w-xs mb-4 sm:mb-5"
              style={{ animationDelay: "300ms" }}
              dir="ltr"
            >
              <div className="grid grid-cols-2 gap-2.5">
                {(["stay", "live"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all duration-300 border",
                      mode === m
                        ? "bg-white text-foreground border-white shadow-lg"
                        : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                    )}
                  >
                    {m === "stay"
                      ? <Moon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                      : <Sun  className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />}
                    <span className="font-bold text-[11px] uppercase tracking-widest">
                      {m === "stay" ? "FULL STAY" : "JUST GO"}
                    </span>
                    <span className={cn("text-[9px] leading-tight text-center", mode === m ? "text-foreground/65" : "text-white/65")}>
                      {m === "stay"
                        ? (isRTL ? "מלון + חוויה" : lang === "fr" ? "Hôtel + expérience" : "Hotel + experience")
                        : (isRTL ? "חוויות בלבד"  : lang === "fr" ? "Expériences seules"  : "Experiences only")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ──────── 2. HOW IT WORKS BANNER ── */}
        <HowItWorksBanner />

        {/* ──────── 3. YOUR MOOD — section unifiée ── */}
        <section id="v2-mood-section" className="bg-[#FAF8F4] py-10 sm:py-14 scroll-mt-14">
          <div className="container px-4 mx-auto">

            {/* Cartes de catégories — une ligne */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-8 sm:mb-10" dir="ltr">
              {VIBE_CHIPS.map((chip) => {
                const isSelected = selectedVibe === chip.id;
                const isDimmed = !!selectedVibe && !isSelected;
                const catImage = categories?.find((cat) =>
                  chip.slugHints.some((hint) => cat.slug.includes(hint))
                )?.hero_image ?? null;
                return (
                  <button
                    key={chip.id}
                    onClick={() => handleVibeClick(chip.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl transition-all duration-500",
                      "h-[70px] sm:h-[90px] md:h-[110px] lg:h-[130px]",
                      isSelected
                        ? "ring-2 ring-white shadow-xl scale-[1.03] z-10"
                        : isDimmed
                          ? "opacity-45 grayscale scale-[0.98]"
                          : "hover:shadow-md hover:scale-[1.02]"
                    )}
                  >
                    {catImage ? (
                      <img
                        src={catImage}
                        alt={chip.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-stone-300" />
                    )}
                    {/* Overlay : clair sur sélection, sombre sur les autres */}
                    <div className={cn(
                      "absolute inset-0 transition-all duration-500",
                      isSelected
                        ? "bg-black/20"
                        : isDimmed
                          ? "bg-black/40"
                          : "bg-black/35 group-hover:bg-black/25"
                    )} />
                    <div className="absolute inset-0 flex items-center justify-center p-1.5">
                      <span className="font-sans text-[9px] sm:text-[11px] md:text-xs lg:text-sm font-bold text-white uppercase tracking-tight text-center leading-tight drop-shadow-md">
                        {chip.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feed d'expériences */}
            {isLoadingExp ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
              </div>
            ) : !categoryFilteredExperiences || categoryFilteredExperiences.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm mb-3">
                  {isRTL ? "אין חוויות בקטגוריה זו עדיין." : lang === "fr" ? "Aucune expérience pour cette ambiance." : "No experiences for this mood yet."}
                </p>
                <button onClick={() => setSelectedCategoryId(null)} className="text-sm underline underline-offset-4 text-primary">
                  {isRTL ? "הצג הכל" : "Show all"}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 transition-all duration-500">
                  {(categoryFilteredExperiences as any[]).slice(0, 8).map((exp: any, idx: number) => {
                    const hotel = primaryHotel(exp);
                    return (
                      <Experience2CardWithPrice
                        key={exp.id}
                        experience={exp}
                        primaryHotel={hotel}
                        hyperguestPropertyId={hotel?.hyperguest_property_id}
                        availabilityRules={rulesMap[exp.id] ?? []}
                        linkPrefix="/experience"
                        linkSuffix="context=v2"
                        index={idx}
                        badge={mode === "live" ? "JUST GO" : undefined}
                      />
                    );
                  })}
                </div>

                {/* VIEW ALL button */}
                <div className="text-center mt-8">
                  <button
                    onClick={() => { trackViewAllExperiencesClicked("v2_mood"); navigate(getLocalizedPath("/experiences")); }}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-widest rounded-full hover:bg-foreground/90 transition-colors"
                  >
                    {isRTL ? "לכל החוויות" : lang === "fr" ? "VOIR TOUTES LES EXPÉRIENCES" : "VIEW ALL EXPERIENCES"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ──────── 4. YOUR TRIP YOUR RULES ── */}
        <TailoredRequestSection categories={categories || []} />

        {/* ──────── 6. GIFT CARD ── */}
        <section className="container py-8 md:py-14 px-4">
          <div className={`grid md:grid-cols-2 gap-5 md:gap-8 items-center max-w-4xl mx-auto ${isRTL ? "md:grid-flow-col-dense" : ""}`}>
            <div className={`relative overflow-hidden rounded-2xl ${isRTL ? "md:order-2" : ""}`}>
              <img src={giftCardHero} alt="Gift Card" className="w-full h-56 md:h-72 object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className={`space-y-4 ${isRTL ? "text-right md:order-1" : ""}`}>
              <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-tight">
                {isRTL ? <><span>מתנה מושלמת.</span><br /><span>מתנת הבריחה.</span></> : <><span>Perfect gift.</span><br /><span>The gift of escape.</span></>}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md">{t(lang, "giftCardSectionDesc")}</p>
              <Button asChild className="group" onClick={() => trackGiftCardClicked("v2_page")}>
                <Link to={getLocalizedPath("/gift-card")}>
                  {t(lang, "giftCardSectionCTA")}
                  <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2"}`} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ──────── 7. TEL AVIV ── */}
        {(isLoadingExp || tlvExps.length > 0) && (
          <section className="py-8 sm:py-12 border-t border-border/30">
            <div className="container px-4 mx-auto">
              <div className={cn("flex items-baseline justify-between mb-3", isRTL && "flex-row-reverse")}>
                <div>
                  <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-[-0.02em] uppercase">
                    🏙️ {isRTL ? "תל אביב, תמיד" : "Tel Aviv, Always"}
                  </h2>
                  <p className="text-xs text-muted-foreground italic mt-0.5">{isRTL ? "העיר שלעולם לא ממש נרדמת" : "The city that never really sleeps"}</p>
                </div>
                <button onClick={() => { trackViewAllExperiencesClicked("v2_tlv"); navigate(getLocalizedPath("/experiences")); }} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors flex-shrink-0">
                  {isRTL ? "לכל החוויות ›" : "View all ›"}
                </button>
              </div>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className={cn("flex gap-3 sm:gap-4 pb-2", isRTL && "flex-row-reverse")}>
                  {isLoadingExp
                    ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex-shrink-0 w-[210px]"><ExperienceCardSkeleton /></div>)
                    : tlvExps.slice(0, 6).map((e: any, i: number) => renderCard(e, i))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ──────── 8. JERUSALEM ── */}
        {(isLoadingExp || jerusalemExps.length > 0) && (
          <section className="py-8 sm:py-12 border-t border-border/30">
            <div className="container px-4 mx-auto">
              <div className={cn("flex items-baseline justify-between mb-3", isRTL && "flex-row-reverse")}>
                <div>
                  <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-[-0.02em] uppercase">
                    🕍 {isRTL ? "ירושלים, שוב" : "Jerusalem, Once More"}
                  </h2>
                  <p className="text-xs text-muted-foreground italic mt-0.5">{isRTL ? "כל ביקור מרגיש אחרת" : "Every visit hits differently"}</p>
                </div>
                <button onClick={() => { trackViewAllExperiencesClicked("v2_jerusalem"); navigate(getLocalizedPath("/experiences")); }} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors flex-shrink-0">
                  {isRTL ? "לכל החוויות ›" : "View all ›"}
                </button>
              </div>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className={cn("flex gap-3 sm:gap-4 pb-2", isRTL && "flex-row-reverse")}>
                  {isLoadingExp
                    ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex-shrink-0 w-[210px]"><ExperienceCardSkeleton /></div>)
                    : jerusalemExps.slice(0, 6).map((e: any, i: number) => renderCard(e, i))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ──────── 9. MARQUEE + THIS IS NOT TOURISM ── */}
        <MarqueeBanner />

        <section className="relative py-8 sm:py-14 md:py-18 overflow-hidden">
          <div className="absolute inset-0">
            <img src={handpickedHero} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container max-w-3xl relative z-10 px-4 text-center">
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] mb-3 text-white">
              {isRTL ? "זה לא תיירות." : lang === "fr" ? "Ce n'est pas du tourisme." : "This is not tourism."}
            </h2>
            <div className="text-[11px] sm:text-xs md:text-sm leading-relaxed text-white/95 max-w-2xl mx-auto space-y-2">
              <p>{t(lang, "handpickedP1")}</p>
              <p>{t(lang, "handpickedP2")}</p>
              <p>{t(lang, "handpickedP3")}</p>
            </div>
          </div>
        </section>

        {/* ──────── 10. Q&A ── */}
        <FAQSection />

      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      <NewsletterPopup />

      {/* ──────── FAB SURPRISE ME — arrondi ── */}
      <button
        onClick={() => setIsFabSheetOpen(true)}
        className="fixed bottom-[84px] right-4 md:bottom-8 z-50 bg-foreground text-background text-[11px] font-bold uppercase tracking-[0.08em] px-5 py-3 rounded-full shadow-xl hover:bg-foreground/90 active:scale-95 transition-all duration-200 flex items-center gap-2"
      >
        <Sparkles className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
        {isRTL ? "הפתיעו אותי" : lang === "fr" ? "Surprenez-moi" : "Surprise me"}
      </button>

      {/* ──────── FAB SHEET ── */}
      <Sheet open={isFabSheetOpen} onOpenChange={setIsFabSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="mb-5">
            <SheetTitle className="font-sans text-lg font-bold tracking-[-0.02em]">
              ✦ {isRTL ? "הפתיעו אותי" : lang === "fr" ? "Surprenez-moi" : "Surprise me"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{isRTL ? "מתי?" : "When?"}</label>
              <input type="date" value={fabDate} onChange={(e) => setFabDate(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{isRTL ? "אווירה" : "Mood"}</label>
              <select value={fabMood} onChange={(e) => setFabMood(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground">
                <option value="">{isRTL ? "כולם" : "Any"}</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{isRTL ? "כמה אנשים?" : "How many?"}</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setFabGuests((g) => Math.max(1, g - 1))} className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                <span className="text-lg font-semibold w-6 text-center">{fabGuests}</span>
                <button onClick={() => setFabGuests((g) => Math.min(12, g + 1))} className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"><Plus className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
          <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 py-6 text-sm font-bold uppercase tracking-widest" onClick={handleSurpriseMe}>
            {isRTL ? "← יאללה" : lang === "fr" ? "C'est parti →" : "Let's go →"}
          </Button>
        </SheetContent>
      </Sheet>

      <MobileBottomNav />
    </div>
  );
};

export default IndexV2;
