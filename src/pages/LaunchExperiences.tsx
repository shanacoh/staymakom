import { useRef, useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import ExperienceCardSkeleton from "@/components/ExperienceCardSkeleton";
import MultiPinMap from "@/components/experience/MultiPinMap";
import { cn } from "@/lib/utils";
import { Compass, Heart, Leaf, Users, Wine, Sparkles, ArrowRight, type LucideIcon } from "lucide-react";

/* ─── Catégories V3 — ordre et labels fixes ─────────────────────────────── */
const V3_CATEGORIES = [
  { id: "romantic-escape", en: "Romantic Escape",  fr: "Escapade Romantique",  he: "בריחה רומנטית",   slugHints: ["romantic"],                   icon: "heart",   img: "/icons/icon-romantic.png",  descEn: "A slow, intimate escape designed for two.",                        descFr: "Une parenthèse rien que pour vous deux.",                         descHe: "כי לפעמים צריך רק את השניים."                   },
  { id: "family-fun",      en: "Family Fun",        fr: "Fun Famille",          he: "כיף משפחתי",      slugHints: ["family"],                     icon: "users",   img: "/icons/icon-family.png",    descEn: "Stays that bring the whole family together.",                      descFr: "Parce que les meilleurs souvenirs se font en famille.",            descHe: "חוויות שהילדים ידברו עליהן עוד שנים."           },
  { id: "foody-discovery", en: "Foody Discovery",   fr: "Découverte Culinaire", he: "גילוי קולינרי",   slugHints: ["taste", "food", "culinar"],   icon: "wine",    img: "/icons/icon-foody.png",     descEn: "Taste your way through Israel's best tables.",                     descFr: "La meilleure façon de connaître un endroit, c'est de le goûter.", descHe: "אוכל טוב זה לא פינוק, זו תרבות."               },
  { id: "land-of-stories", en: "Land of Stories",  fr: "Terre de Récits",      he: "ארץ הסיפורים",    slugHints: ["land", "stories"],            icon: "compass", img: "/icons/icon-stories.png",   descEn: "Experiences rooted in history, culture, and meaning.",             descFr: "Des endroits qui ont quelque chose à vous raconter.",             descHe: "ישראל מלאה בסיפורים שמחכים שמישהו יקשיב."     },
  { id: "nature-outdoor",  en: "Nature & Outdoor",  fr: "Nature & Plein Air",   he: "טבע ושטח",        slugHints: ["nature", "beyond", "outdoor"],icon: "leaf",    img: "/icons/icon-nature.png",    descEn: "Wide open landscapes and fresh air for those who need to breathe.", descFr: "Pour ceux qui ont besoin de grand air et d'espace.",              descHe: "כשהגוף שלך קורא לפתוח שטח."                    },
];

const iconMap: Record<string, LucideIcon> = {
  heart: Heart, users: Users, wine: Wine, compass: Compass, leaf: Leaf,
};

/* ─── Formes de surlignage « feutre » ───────────────────────────────────── */
const HIGHLIGHT_SHAPES = [
  "rotate-[-3deg] rounded-[60%_40%_75%_25%/35%_65%_45%_55%]",
  "rotate-[2deg] rounded-[35%_65%_40%_60%/65%_40%_70%_30%]",
  "rotate-[-5deg] rounded-[70%_30%_50%_50%/40%_60%_35%_65%]",
  "rotate-[4deg] rounded-[45%_55%_65%_35%/55%_35%_60%_40%]",
  "rotate-[-2deg] rounded-[55%_45%_30%_70%/45%_65%_55%_35%]",
];

const FEATURED_AFTER = 4;

const LaunchExperiences = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const queryClient = useQueryClient();

  /* ── Catégorie sélectionnée (id V3 ou null = toutes) ── */
  const filterParam = searchParams.get("filter");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    V3_CATEGORIES.find(c => c.id === filterParam)?.id ?? null
  );

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    setSelectedRegion(null);
    setSelectedTags([]);
  }, [selectedCatId]);

  /* ── Realtime ── */
  useEffect(() => {
    const channel = supabase
      .channel("launch-experiences-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "experiences2" }, () => {
        queryClient.invalidateQueries({ queryKey: ["launch-experiences2-listing"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  /* ── Toutes les catégories publiées (pour le matching de slug) ── */
  const { data: allCategories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  /* ── Expériences ── */
  const { data: experiences2, isLoading } = useQuery({
    queryKey: ["launch-experiences2-listing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
          *,
          categories(slug, launch_description, launch_description_he, icon, name, name_he),
          experience2_hotels(
            position,
            nights,
            hotel:hotels2(
              id, name, name_he, city, city_he, region, region_he, hero_image,
              hyperguest_property_id, latitude, longitude,
              practical_info
            )
          ),
          experience2_highlight_tags(
            highlight_tags(
              id, slug, label_en, label_he, label_fr
            )
          ),
          experience2_addons(type, value, is_active)
        `)
        .eq("status", "published")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

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

  /* ── Catégorie V3 active ── */
  const selectedV3Cat = V3_CATEGORIES.find(c => c.id === selectedCatId) ?? null;

  /* ── Filtrage par catégorie V3 ── */
  const categoryExperiences = useMemo(() => {
    if (!selectedV3Cat || !allCategories) return experiences2;
    const dbCat = (allCategories as any[]).find(cat =>
      selectedV3Cat.slugHints.some(hint => cat.slug.includes(hint))
    );
    if (!dbCat) return experiences2;
    return experiences2?.filter((exp: any) => exp.categories?.slug === dbCat.slug);
  }, [experiences2, selectedV3Cat, allCategories]);

  /* ── Meta catégorie (description depuis la DB) ── */
  const categoryMeta = useMemo(() => {
    const first = categoryExperiences?.[0];
    return first?.categories ?? null;
  }, [categoryExperiences]);

  /* ── Régions disponibles ── */
  const regions = useMemo(() => {
    const set = new Set<string>();
    categoryExperiences?.forEach((exp: any) => {
      const hotel = exp.experience2_hotels
        ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
      const region = isRTL ? hotel?.region_he : hotel?.region;
      if (region) set.add(region);
    });
    return Array.from(set).sort();
  }, [categoryExperiences, isRTL]);

  /* ── Tags disponibles ── */
  const allTags = useMemo(() => {
    const map = new Map<string, { slug: string; label: string }>();
    categoryExperiences?.forEach((exp: any) => {
      exp.experience2_highlight_tags?.forEach((t: any) => {
        const tag = t.highlight_tags;
        if (tag && !map.has(tag.slug)) {
          map.set(tag.slug, {
            slug: tag.slug,
            label: isRTL ? tag.label_he : lang === 'fr' && tag.label_fr ? tag.label_fr : tag.label_en,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [categoryExperiences, isRTL, lang]);

  /* ── Filtres région + tags ── */
  const filteredExperiences = useMemo(() => {
    return categoryExperiences?.filter((exp: any) => {
      const hotel = exp.experience2_hotels
        ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
      const region = isRTL ? hotel?.region_he : hotel?.region;
      if (selectedRegion && region !== selectedRegion) return false;
      if (selectedTags.length > 0) {
        const expTags = exp.experience2_highlight_tags?.map((t: any) => t.highlight_tags?.slug) ?? [];
        if (!selectedTags.some((s) => expTags.includes(s))) return false;
      }
      return true;
    });
  }, [categoryExperiences, selectedRegion, selectedTags, isRTL]);

  /* ── Featured ── */
  const featuredExp = useMemo(() => {
    return categoryExperiences
      ?.filter((exp: any) => exp.featured_on_home)
      ?.sort((a: any, b: any) => (a.home_display_order ?? 99) - (b.home_display_order ?? 99))
      ?.[0] ?? null;
  }, [categoryExperiences]);

  const regularExperiences = useMemo(() =>
    filteredExperiences?.filter((exp: any) => exp.id !== featuredExp?.id),
    [filteredExperiences, featuredExp]
  );

  /* ── Map pins ── */
  const mapPins = useMemo(() => {
    const seen = new Set<string>();
    const pins: any[] = [];
    filteredExperiences?.forEach((exp: any) => {
      const hotel = exp.experience2_hotels
        ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
      if (hotel?.latitude && hotel?.longitude && !seen.has(hotel.id)) {
        seen.add(hotel.id);
        pins.push({
          id: hotel.id,
          name: isRTL ? hotel.name_he || hotel.name : hotel.name,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          experienceSlug: exp.slug,
          experienceTitle: isRTL ? exp.title_he || exp.title : exp.title,
        });
      }
    });
    return pins;
  }, [filteredExperiences, isRTL]);

  /* ── Titre et description de la page ── */
  const pageTitle = selectedV3Cat
    ? (lang === "he" ? selectedV3Cat.he : lang === "fr" ? selectedV3Cat.fr : selectedV3Cat.en)
    : (isRTL ? "כל החוויות" : lang === "fr" ? "Toutes les expériences" : "All Experiences");

  const heroDescription = selectedV3Cat
    ? ((isRTL ? categoryMeta?.launch_description_he : lang === "fr" ? categoryMeta?.launch_description_fr : categoryMeta?.launch_description)
        || (lang === "he" ? selectedV3Cat.descHe : lang === "fr" ? selectedV3Cat.descFr : selectedV3Cat.descEn))
    : (isRTL
        ? "גלה את כל החוויות הייחודיות שלנו ברחבי ישראל."
        : lang === "fr"
          ? "Découvrez toutes nos expériences inoubliables en Israël."
          : "Discover all our handpicked experiences across Israel.");

  /* ── Clic sur une chip ── */
  const handleCatClick = (catId: string) => {
    if (selectedCatId === catId) {
      setSelectedCatId(null);
      setSearchParams({ context: "launch" });
    } else {
      setSelectedCatId(catId);
      setSearchParams({ filter: catId, context: "launch" });
    }
  };

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead
        title={`${pageTitle} — STAYMAKOM`}
        description={heroDescription || (isRTL ? "גלה חוויות מלון ייחודיות בישראל" : "Discover unique hotel experiences in Israel")}
      />

      <V3Header />

      <main className="flex-1 pt-[56px] pb-[80px] md:pb-0">

        {/* ──── Hero : grande icône + titre ──── */}
        <section className="bg-white pt-10 pb-5 text-center px-4">
          {selectedV3Cat?.img ? (
            <div
              className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300"
              style={{
                backgroundColor: "#ad1414",
                WebkitMaskImage: `url(${selectedV3Cat.img})`,
                maskImage: `url(${selectedV3Cat.img})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted text-foreground mx-auto mb-4">
              <Compass className="w-6 h-6" />
            </div>
          )}

          <h1
            className={cn(
              "font-sans text-3xl sm:text-4xl font-bold uppercase tracking-[-0.02em] transition-colors duration-300",
              selectedV3Cat ? "text-[#ad1414]" : "text-foreground"
            )}
          >
            {pageTitle}
          </h1>

          {heroDescription && (
            <p className="text-muted-foreground text-sm max-w-xl mx-auto mt-2 whitespace-pre-line">
              {heroDescription}
            </p>
          )}
        </section>

        {/* ──── Bandeau chips catégories ──── */}
        <div className="border-b border-stone-100">
          <div
            className={cn(
              "flex flex-nowrap justify-center gap-1 sm:gap-3",
              "overflow-x-auto overflow-y-visible py-3 px-4 sm:px-6 scrollbar-hide",
              isRTL && "flex-row-reverse"
            )}
          >
            {V3_CATEGORIES.map((v3cat, idx) => {
              const isActive = selectedCatId === v3cat.id;
              const isDimmed = !!selectedCatId && !isActive;
              const name = lang === "he" ? v3cat.he : lang === "fr" ? v3cat.fr : v3cat.en;
              const IconComponent: LucideIcon = iconMap[v3cat.icon] ?? Sparkles;

              const words = name.split(" ");
              const mid = Math.ceil(words.length / 2);
              const line1 = words.slice(0, mid).join(" ");
              const line2 = words.slice(mid).join(" ");

              return (
                <button
                  key={v3cat.id}
                  onClick={() => handleCatClick(v3cat.id)}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 flex-shrink-0 w-16 sm:w-[82px] py-2.5 px-1 rounded-2xl transition-all duration-200",
                    isDimmed ? "opacity-35" : "hover:-translate-y-0.5"
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0.5 top-0.5 bottom-0.5 bg-[#ad1414]/15",
                        HIGHLIGHT_SHAPES[idx % HIGHLIGHT_SHAPES.length]
                      )}
                    />
                  )}

                  {v3cat.img ? (
                    isActive ? (
                      <span
                        role="img"
                        aria-label={name}
                        className="block w-9 h-9 sm:w-12 sm:h-12"
                        style={{
                          backgroundColor: "#ad1414",
                          WebkitMaskImage: `url(${v3cat.img})`,
                          maskImage: `url(${v3cat.img})`,
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                        }}
                      />
                    ) : (
                      <img
                        src={v3cat.img}
                        alt={name}
                        className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
                      />
                    )
                  ) : (
                    <IconComponent
                      className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6",
                        isActive ? "text-[#ad1414]" : "text-stone-500"
                      )}
                      strokeWidth={1.5}
                    />
                  )}

                  <span
                    className={cn(
                      "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-center leading-[13px] transition-colors duration-200",
                      isActive ? "text-[#ad1414]" : "text-foreground group-hover:text-foreground/80"
                    )}
                  >
                    {line1}{line2 && <><br />{line2}</>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <section className="container max-w-6xl mx-auto py-8 px-4">

          {/* Filtres région + tags */}
          {!isLoading && (regions.length > 0 || allTags.length > 0) && (
            <div className="flex flex-col gap-3 mb-6">
              {regions.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide mr-1">
                    {isRTL ? "אזור" : "Region"}
                  </span>
                  {regions.map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
                        selectedRegion === region
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground/40"
                      )}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide mr-1">
                    {isRTL ? "סוג" : "Tags"}
                  </span>
                  {allTags.map((tag) => (
                    <button
                      key={tag.slug}
                      onClick={() => toggleTag(tag.slug)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
                        selectedTags.includes(tag.slug)
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground/40"
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="flex flex-col md:grid md:grid-cols-[1fr_340px] gap-6 items-start">

              {/* Colonne gauche : grille + featured */}
              <div>
                {regularExperiences && regularExperiences.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {regularExperiences.slice(0, FEATURED_AFTER).map((experience: any) => {
                        const primaryHotelLink = experience.experience2_hotels
                          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
                        return (
                          <Experience2CardWithPrice
                            key={experience.id}
                            experience={experience}
                            primaryHotel={primaryHotelLink}
                            hyperguestPropertyId={primaryHotelLink?.hyperguest_property_id}
                            addons={experience.experience2_addons}
                            availabilityRules={rulesMap[experience.id] ?? []}
                            linkPrefix="/experience"
                            linkSuffix="?context=launch"
                          />
                        );
                      })}
                    </div>

                    {/* Encart Coup de cœur */}
                    {featuredExp && !selectedRegion && selectedTags.length === 0 && (() => {
                      const hotel = featuredExp.experience2_hotels
                        ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
                      const image = featuredExp.hero_image || hotel?.hero_image;
                      const title = isRTL ? featuredExp.title_he || featuredExp.title : featuredExp.title;
                      const hotelName = isRTL ? hotel?.name_he || hotel?.name : hotel?.name;
                      const region = isRTL ? hotel?.region_he || hotel?.region : hotel?.region;
                      const desc = isRTL
                        ? featuredExp.short_description_he || featuredExp.short_description
                        : featuredExp.short_description;
                      return (
                        <Link
                          to={`/experience/${featuredExp.slug}?context=launch`}
                          className="group block rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 mb-3"
                        >
                          <div className="flex flex-col sm:flex-row">
                            {image && (
                              <div className="sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden">
                                <img
                                  src={image}
                                  alt={title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <div className="flex flex-col justify-between p-5 gap-3">
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="text-[10px] uppercase tracking-widest font-medium text-amber-600">
                                    {isRTL ? "⭐ המלצת העורכים" : "⭐ Editor's pick"}
                                  </span>
                                </div>
                                <h3 className="font-serif text-lg font-semibold text-foreground leading-snug mb-1">
                                  {title}
                                </h3>
                                {(hotelName || region) && (
                                  <p className="text-xs text-muted-foreground">
                                    {[hotelName, region].filter(Boolean).join(" · ")}
                                  </p>
                                )}
                                {desc && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{desc}</p>
                                )}
                              </div>
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
                                {isRTL ? "לחוויה" : "View experience"}
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })()}

                    {regularExperiences.length > FEATURED_AFTER && (
                      <div className="grid grid-cols-2 gap-3">
                        {regularExperiences.slice(FEATURED_AFTER).map((experience: any) => {
                          const primaryHotelLink = experience.experience2_hotels
                            ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]?.hotel;
                          return (
                            <Experience2CardWithPrice
                              key={experience.id}
                              experience={experience}
                              primaryHotel={primaryHotelLink}
                              hyperguestPropertyId={primaryHotelLink?.hyperguest_property_id}
                              addons={experience.experience2_addons}
                              linkPrefix="/experience"
                              linkSuffix="?context=launch"
                            />
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">
                      {isRTL ? "אין חוויות בקטגוריה זו עדיין" : "No experiences in this category yet."}
                    </p>
                    {selectedCatId && (
                      <button
                        onClick={() => { setSelectedCatId(null); setSearchParams({ context: "launch" }); }}
                        className="mt-3 text-sm underline underline-offset-4 text-[#ad1414]"
                      >
                        {isRTL ? "הצג הכל" : lang === "fr" ? "Voir tout" : "Show all"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Colonne droite : map sticky */}
              <div className="hidden md:block sticky top-20 h-[calc(100vh-120px)]">
                {mapPins.length > 0 ? (
                  <MultiPinMap pins={mapPins} lang={lang as "en" | "he" | "fr"} />
                ) : (
                  <div className="h-full min-h-[400px] rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
                    {isRTL ? "אין מיקומים זמינים" : "No locations available"}
                  </div>
                )}
              </div>

            </div>
          )}
        </section>
      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

    </div>
  );
};

export default LaunchExperiences;
