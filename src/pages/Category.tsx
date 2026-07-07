import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Users, Wine, Compass, Leaf, Sparkles, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import ExperienceCard from "@/components/ExperienceCard";
import StandaloneExperienceCard from "@/components/StandaloneExperienceCard";
import CategoryFilters, { FilterState } from "@/components/category/CategoryFilters";
import ExperienceMap from "@/components/category/ExperienceMap";
import { useState, useMemo, useEffect } from "react";
import { trackCategoryPageViewed } from "@/lib/analytics";
import { SEOHead } from "@/components/SEOHead";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumbJsonLd";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/* ─── Catégories V3 — ordre et labels fixes ─────────────────────────────── */
const V3_CATEGORIES = [
  { id: "romantic-escape", en: "Romantic Escape",  fr: "Escapade Romantique",  he: "בריחה רומנטית",    slugHints: ["romantic"],                   icon: "heart",   img: "/icons/icon-romantic.png"  },
  { id: "family-fun",      en: "Family Fun",        fr: "Fun Famille",          he: "כיף משפחתי",       slugHints: ["family"],                     icon: "users",   img: "/icons/icon-family.png"    },
  { id: "foody-discovery", en: "Foody Discovery",   fr: "Découverte Culinaire", he: "גילוי קולינרי",    slugHints: ["taste", "food", "culinar"],   icon: "wine",    img: "/icons/icon-foody.png"     },
  { id: "land-of-stories", en: "Land of Stories",  fr: "Terre de Récits",      he: "ארץ הסיפורים",     slugHints: ["land", "stories"],            icon: "compass", img: "/icons/icon-stories.png"   },
  { id: "nature-outdoor",  en: "Nature & Outdoor",  fr: "Nature & Plein Air",   he: "טבע ושטח",         slugHints: ["nature", "beyond", "outdoor"],icon: "leaf",    img: "/icons/icon-nature.png"    },
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

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as "stay" | "live") || "stay";
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const [showMap, setShowMap] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "recommended",
    priceRange: [0, 10000],
    partySize: 1
  });

  const handleSetMode = (newMode: "stay" | "live") => {
    navigate(`/category/${slug}?mode=${newMode}`);
  };

  useEffect(() => { if (slug) trackCategoryPageViewed(slug); }, [slug]);

  /* ── Toutes les catégories publiées (pour matcher les chips) ── */
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

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, name_he, name_fr, hero_image, seo_title_en, seo_title_he, meta_description_en, meta_description_he, og_title_en, og_title_he, og_description_en, og_description_he, og_image, presentation_title, presentation_title_he, presentation_title_fr, intro_rich_text, intro_rich_text_he, intro_rich_text_fr")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["category-experiences2", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
          *,
          experience2_hotels(
            position,
            nights,
            hotel:hotels2(
              id,
              name,
              name_he,
              city,
              city_he,
              region,
              region_he,
              latitude,
              longitude,
              hero_image
            )
          ),
          experience2_highlight_tags (
            highlight_tags (
              id,
              slug,
              label_en,
              label_he
            )
          )
        `)
        .eq("category_id", category?.id)
        .eq("status", "published");
      if (error) throw error;
      return (data || []).map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return {
          ...exp,
          hotels: primaryHotel || null,
          experience_highlight_tags: exp.experience2_highlight_tags?.map((t: any) => ({
            highlight_tags: t.highlight_tags,
          })) || [],
        };
      });
    },
    enabled: !!category?.id
  });

  const { data: standaloneExperiences, isLoading: standaloneLoading } = useQuery({
    queryKey: ["category-standalone-experiences", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select(`
          id, slug, title, title_he, title_fr,
          hero_image, photos,
          base_price, base_price_type, currency,
          min_party, max_party, has_child_price, has_time_slots,
          city, city_he, region, region_he, practical_info,
          standalone_experience_highlight_tags(
            tag_id, position,
            highlight_tags(id, slug, label_en, label_he, label_fr)
          )
        `)
        .eq("category_id", category?.id)
        .eq("status", "published")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!category?.id && mode === "live",
  });

  const filteredExperiences = useMemo(() => {
    if (!experiences) return [];
    let filtered = [...experiences];

    if (filters.priceRange[1] < 10000) {
      filtered = filtered.filter(exp => {
        const price = Number(exp.base_price);
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    if (filters.partySize > 1) {
      filtered = filtered.filter(exp => {
        return exp.min_party <= filters.partySize && exp.max_party >= filters.partySize;
      });
    }

    switch (filters.sortBy) {
      case "price_asc":
        filtered.sort((a, b) => Number(a.base_price) - Number(b.base_price));
        break;
      case "price_desc":
        filtered.sort((a, b) => Number(b.base_price) - Number(a.base_price));
        break;
    }
    return filtered;
  }, [experiences, filters]);

  const filteredStandalone = useMemo(() => {
    if (!standaloneExperiences) return [];
    let filtered = [...standaloneExperiences] as any[];

    if (filters.priceRange[1] < 10000) {
      filtered = filtered.filter(exp => {
        const price = Number(exp.base_price);
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    if (filters.partySize > 1) {
      filtered = filtered.filter(exp =>
        exp.min_party <= filters.partySize && exp.max_party >= filters.partySize
      );
    }

    switch (filters.sortBy) {
      case "price_asc":
        filtered.sort((a, b) => Number(a.base_price) - Number(b.base_price));
        break;
      case "price_desc":
        filtered.sort((a, b) => Number(b.base_price) - Number(a.base_price));
        break;
    }
    return filtered;
  }, [standaloneExperiences, filters]);

  /* ── Matching catégorie active avec V3_CATEGORIES ── */
  const currentV3Cat = V3_CATEGORIES.find(v3cat =>
    v3cat.slugHints.some(hint => slug?.includes(hint))
  );

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <V3Header />
        <div className="container pt-16 pb-6">
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="text-center px-4 pb-5 space-y-3">
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </div>
        <div className="container pb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <V3Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t(lang, 'categoryNotFound')}</p>
            <Button asChild>
              <Link to="/">{t(lang, 'backToHome')}</Link>
            </Button>
          </div>
        </main>
        <LaunchFooter />
      </div>
    );
  }

  const categoryName = getLocalizedField(category, 'name', lang) as string || category.name;
  const presentationTitle = getLocalizedField(category, 'presentation_title', lang) as string || categoryName;
  const introText = getLocalizedField(category, 'intro_rich_text', lang) as string || '';

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead
        titleEn={category.seo_title_en}
        titleHe={category.seo_title_he}
        descriptionEn={category.meta_description_en}
        descriptionHe={category.meta_description_he}
        ogTitleEn={category.og_title_en}
        ogTitleHe={category.og_title_he}
        ogDescriptionEn={category.og_description_en}
        ogDescriptionHe={category.og_description_he}
        ogImage={category.og_image || category.hero_image}
        fallbackTitle={`${categoryName} - Staymakom`}
        fallbackDescription={introText}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", url: "https://staymakom.com/" },
              { name: mode === 'stay' ? "With Hotel" : "Experience Only", url: `https://staymakom.com/category/${slug}?mode=${mode}` },
              { name: categoryName, url: `https://staymakom.com/category/${slug}?mode=${mode}` },
            ])
          ),
        }}
      />
      <V3Header showModeToggle mode={mode} setMode={handleSetMode} />

      <main className="flex-1">
        <div className="container pt-16">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">{lang === 'he' ? 'בית' : lang === 'fr' ? 'Accueil' : 'Home'}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/category/${slug}?mode=${mode}`}>
                    {mode === 'stay'
                      ? (lang === 'he' ? 'עם מלון' : lang === 'fr' ? 'Avec Hôtel' : 'With Hotel')
                      : (lang === 'he' ? 'חוויה בלבד' : lang === 'fr' ? 'Expérience Seule' : 'Experience Only')}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{categoryName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ──── Hero : icône + titre ──── */}
        <section className="bg-white pt-10 pb-5 text-center px-4">
          {currentV3Cat?.img && (
            <div
              className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20"
              style={{
                backgroundColor: "#ad1414",
                WebkitMaskImage: `url(${currentV3Cat.img})`,
                maskImage: `url(${currentV3Cat.img})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          )}
          <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[0.02em] text-[#ad1414]">
            {presentationTitle}
          </h1>
          {introText && (
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {introText}
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
              const dbCat = (allCategories as any[])?.find((cat) =>
                v3cat.slugHints.some((hint) => cat.slug.includes(hint))
              );
              const dbSlug = dbCat?.slug ?? null;
              const isActive = !!dbSlug && slug === dbSlug;
              const isDimmed = !!slug && !isActive;
              const name = lang === "he"
                ? (dbCat?.name_he || v3cat.he)
                : lang === "fr"
                ? (dbCat?.name_fr || v3cat.fr)
                : (dbCat?.name || v3cat.en);
              const IconComponent: LucideIcon = iconMap[v3cat.icon] ?? Sparkles;

              const words = name.split(" ");
              const mid = Math.ceil(words.length / 2);
              const line1 = words.slice(0, mid).join(" ");
              const line2 = words.slice(mid).join(" ");

              return (
                <button
                  key={v3cat.id}
                  onClick={() => { if (dbSlug && !isActive) navigate(`/category/${dbSlug}?mode=${mode}`); }}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 flex-shrink-0 w-16 sm:w-[82px] py-2.5 px-1 rounded-2xl transition-all duration-200",
                    isDimmed ? "opacity-35" : "hover:-translate-y-0.5",
                    isActive ? "cursor-default" : "cursor-pointer"
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

        {/* ──── Filtres ──── */}
        <CategoryFilters
          onFilterChange={setFilters}
          onShowMapToggle={setShowMap}
          showMap={showMap}
          className="my-0"
        />

        {/* ──── Grille d'expériences ──── */}
        <section className="container py-6">
          <div className={`grid ${showMap ? 'lg:grid-cols-[1fr_500px]' : 'grid-cols-1'} gap-6`}>
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">
                  {t(lang, 'experiencesAvailable')(mode === "stay" ? filteredExperiences.length : filteredStandalone.length)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(lang, 'discoverExtraordinaryStays')}
                </p>
              </div>

              {(mode === "stay" ? experiencesLoading : standaloneLoading) ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ad1414] mx-auto" />
                </div>
              ) : (mode === "stay" ? filteredExperiences : filteredStandalone).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">{t(lang, 'noExperiencesMatch')}</p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      sortBy: "recommended",
                      priceRange: [0, 10000],
                      partySize: 1
                    })}
                  >
                    {t(lang, 'resetFilters')}
                  </Button>
                </div>
              ) : mode === "stay" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExperiences.map(experience => {
                    const originalPrice = Number(experience.base_price);
                    const discountPercent = Math.floor(Math.random() * 30) + 10;
                    return (
                      <ExperienceCard
                        key={experience.id}
                        experience={experience}
                        originalPrice={originalPrice}
                        discountPercent={discountPercent}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStandalone.map((experience, idx) => (
                    <StandaloneExperienceCard
                      key={experience.id}
                      experience={experience}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </div>

            {showMap && (
              <div className="hidden lg:block">
                <ExperienceMap experiences={mode === "stay" ? filteredExperiences : filteredStandalone} />
              </div>
            )}
          </div>
        </section>
      </main>

      <LaunchFooter />
    </div>
  );
};

export default Category;
