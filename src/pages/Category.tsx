import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import ExperienceCard from "@/components/ExperienceCard";
import CategoryFilters, { FilterState } from "@/components/category/CategoryFilters";
import ExperienceMap from "@/components/category/ExperienceMap";
import { useState, useMemo, useEffect } from "react";
import { trackCategoryPageViewed } from "@/lib/analytics";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const [showMap, setShowMap] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "recommended",
    priceRange: [0, 10000],
    partySize: 1
  });

  useEffect(() => { if (slug) trackCategoryPageViewed(slug); }, [slug]);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
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
      // Map to ExperienceCard-compatible shape
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

  const filteredExperiences = useMemo(() => {
    if (!experiences) return [];
    let filtered = [...experiences];

    // Filter by price only if not at max range
    if (filters.priceRange[1] < 10000) {
      filtered = filtered.filter(exp => {
        const price = Number(exp.base_price);
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    // Filter by party size only if greater than 1
    if (filters.partySize > 1) {
      filtered = filtered.filter(exp => {
        return exp.min_party <= filters.partySize && exp.max_party >= filters.partySize;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case "price_asc":
        filtered.sort((a, b) => Number(a.base_price) - Number(b.base_price));
        break;
      case "price_desc":
        filtered.sort((a, b) => Number(b.base_price) - Number(a.base_price));
        break;
      default:
        break;
    }
    return filtered;
  }, [experiences, filters]);

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t(lang, 'categoryNotFound')}</p>
            <Button asChild>
              <Link to="/">{t(lang, 'backToHome')}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get localized content
  const categoryName = getLocalizedField(category, 'name', lang) as string || category.name;
  const presentationTitle = getLocalizedField(category, 'presentation_title', lang) as string || categoryName;
  const introText = getLocalizedField(category, 'intro_rich_text', lang) as string || '';

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'he' ? 'rtl' : 'ltr'}>
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
        fallbackTitle={`${categoryName} - StayMakom`}
        fallbackDescription={introText}
      />
      <Header />
      
      <main className="flex-1">
        {/* Immersive Hero Section */}
        <section className="relative h-[55vh] min-h-[450px] flex items-end">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url(${category.hero_image || '/placeholder.svg'})` }} 
          />
          
          <div className="relative z-10 container text-white px-4 py-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-end max-w-6xl mx-auto">
              {/* Left side - Category name and Title */}
              <div className="space-y-3">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/90 font-bold">
                  {categoryName}
                </p>
                <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold leading-tight uppercase text-white">
                  {presentationTitle}
                </h1>
              </div>
              
              {/* Right side - Description only */}
              <div>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white">
                  {introText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <CategoryFilters 
          onFilterChange={setFilters} 
          onShowMapToggle={setShowMap} 
          showMap={showMap} 
          className="my-0" 
        />

        {/* Experiences List with Optional Map */}
        <section className="container py-6">
          <div className={`grid ${showMap ? 'lg:grid-cols-[1fr_500px]' : 'grid-cols-1'} gap-6`}>
            {/* Experiences List */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">
                  {t(lang, 'experiencesAvailable')(filteredExperiences.length)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(lang, 'discoverExtraordinaryStays')}
                </p>
              </div>

              {experiencesLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              ) : filteredExperiences.length === 0 ? (
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExperiences.map(experience => {
                    const originalPrice = Number(experience.base_price);
                    const discountPercent = Math.floor(Math.random() * 30) + 10;
                    const rating = Math.random() * 0.5 + 8.5;
                    const reviewCount = Math.floor(Math.random() * 1000) + 50;
                    return (
                      <ExperienceCard
                        key={experience.id}
                        experience={experience}
                        originalPrice={originalPrice}
                        discountPercent={discountPercent}
                        rating={rating}
                        reviewCount={reviewCount}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Map */}
            {showMap && (
              <div className="hidden lg:block">
                <ExperienceMap experiences={filteredExperiences} />
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Category;
