import { useRef, useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import MultiPinMap from "@/components/experience/MultiPinMap";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import { Loader2, Compass, Heart, ArrowRight } from "lucide-react";

const FILTER_ADVENTURE = "adventure";
const FILTER_ROMANTIC = "romantic";

const FEATURED_AFTER = 4; // insert featured card after this many regular cards

const LaunchExperiences = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const filterParam = searchParams.get("filter") || FILTER_ADVENTURE;
  const [activeFilter, setActiveFilter] = useState(filterParam);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleBtn1Ref = useRef<HTMLButtonElement>(null);
  const toggleBtn2Ref = useRef<HTMLButtonElement>(null);
  const [toggleUnderline, setToggleUnderline] = useState({ left: 0, width: 0 });

  // Reset filters when category changes
  useEffect(() => {
    setSelectedRegion(null);
    setSelectedTags([]);
  }, [activeFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const activeRef = activeFilter === FILTER_ADVENTURE ? toggleBtn1Ref : toggleBtn2Ref;
      if (activeRef.current) {
        const { offsetLeft, offsetWidth } = activeRef.current;
        setToggleUnderline({ left: offsetLeft, width: offsetWidth });
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [activeFilter, lang]);

  const handleFilterClick = (slug: string) => {
    setActiveFilter(slug);
    setSearchParams({ filter: slug, context: "launch" });
  };

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

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
              hyperguest_property_id, latitude, longitude
            )
          ),
          experience2_highlight_tags(
            highlight_tags(
              id, slug, label_en, label_he
            )
          ),
          experience2_addons(type, value, is_active)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Filter by category
  const categoryExperiences = useMemo(() =>
    activeFilter === FILTER_ROMANTIC
      ? experiences2?.filter((exp: any) => exp.categories?.slug === "romantic")
      : experiences2?.filter((exp: any) => exp.categories?.slug !== "romantic"),
    [experiences2, activeFilter]
  );

  // Category meta (description)
  const categoryMeta = useMemo(() => {
    const first = categoryExperiences?.[0];
    return first?.categories ?? null;
  }, [categoryExperiences]);

  // Extract unique regions
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

  // Extract unique tags
  const allTags = useMemo(() => {
    const map = new Map<string, { slug: string; label: string }>();
    categoryExperiences?.forEach((exp: any) => {
      exp.experience2_highlight_tags?.forEach((t: any) => {
        const tag = t.highlight_tags;
        if (tag && !map.has(tag.slug)) {
          map.set(tag.slug, {
            slug: tag.slug,
            label: isRTL ? tag.label_he : tag.label_en,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [categoryExperiences, isRTL]);

  // Apply region + tag filters
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

  // Featured experience (excluded from main grid)
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

  // Map pins
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

  const isAdventure = activeFilter === FILTER_ADVENTURE;
  const pageTitle = isAdventure
    ? isRTL ? "הרפתקה" : "Feeling Adventurous"
    : isRTL ? "בריחה רומנטית" : "Romantic Escape";

  const defaultDescription = isAdventure
    ? isRTL
      ? "שהייה שלוקחת אותך מעבר לצפוי. חקור, הרגש, וחווה משהו שתדבר עליו הרבה אחרי שתחזור."
      : "A stay that takes you beyond the expected.\nExplore, feel, and live something you'll talk about long after you return."

    : isRTL
      ? "בריחה אינטימית ורכה, מתוכננת לשניים. רגעים עדינים, מסגרות יפות, וזכרונות שלעולם לא תרצה לעזוב."
      : "A slow, intimate escape designed for two.\nSoft moments, beautiful settings, and memories you'll never want to leave behind.";

  const heroDescription = defaultDescription;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <LoadingScreen isLoading={isLoading} />
      <SEOHead
        title={`${pageTitle} — STAYMAKOM`}
        description={heroDescription || (isRTL ? "גלה חוויות מלון ייחודיות בישראל" : "Discover unique hotel experiences in Israel")}
      />

      <LaunchHeader forceScrolled={true} />

      <main className="flex-1 pt-[56px] md:pt-[56px] pb-[80px] md:pb-0">

        {/* Hero bandeau */}
        <section className="w-full border-b border-border/40 py-12 px-6">
          <div className="container max-w-6xl mx-auto flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted text-foreground">
              {isAdventure
                ? <Compass className="w-6 h-6" />
                : <Heart className="w-6 h-6" />
              }
            </div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground">
              {pageTitle}
            </h1>
            {heroDescription && (
              <p className="text-muted-foreground text-sm max-w-xl whitespace-pre-line">
                {heroDescription}
              </p>
            )}

            {/* Toggle catégorie */}
            <div className="relative inline-flex items-center gap-6 mt-2" dir="ltr">
              <button
                ref={toggleBtn1Ref}
                onClick={() => handleFilterClick(FILTER_ADVENTURE)}
                className={cn(
                  "uppercase tracking-[0.15em] text-xs transition-all duration-300 pb-2",
                  activeFilter === FILTER_ADVENTURE
                    ? "font-medium text-foreground"
                    : "font-light text-foreground/40 hover:text-foreground/70"
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Compass size={13} strokeWidth={1.5} />
                  {isRTL ? "הרפתקה" : "Feeling Adventurous"}
                </span>
              </button>
              <div className="w-px h-4 bg-foreground/20" />
              <button
                ref={toggleBtn2Ref}
                onClick={() => handleFilterClick(FILTER_ROMANTIC)}
                className={cn(
                  "uppercase tracking-[0.15em] text-xs transition-all duration-300 pb-2",
                  activeFilter === FILTER_ROMANTIC
                    ? "font-medium text-foreground"
                    : "font-light text-foreground/40 hover:text-foreground/70"
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Heart size={13} strokeWidth={1.5} />
                  {isRTL ? "בריחה רומנטית" : "Romantic Escape"}
                </span>
              </button>
              <div
                className="absolute bottom-0 h-px bg-foreground transition-all duration-300 ease-in-out"
                style={{ left: toggleUnderline.left, width: toggleUnderline.width }}
              />
            </div>
          </div>
        </section>

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
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <div className="flex flex-col md:grid md:grid-cols-[1fr_340px] gap-6 items-start">

              {/* Colonne gauche : grille + featured */}
              <div>
                {regularExperiences && regularExperiences.length > 0 ? (
                  <>
                    {/* Cards avant le featured */}
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

                    {/* Cards après le featured */}
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
                  </div>
                )}
              </div>

              {/* Colonne droite : map sticky (desktop uniquement) */}
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
