import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import { Loader2, Compass, Heart } from "lucide-react";

const FILTER_ADVENTURE = "adventure";
const FILTER_ROMANTIC = "romantic";

const LaunchExperiences = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const filterParam = searchParams.get("filter") || FILTER_ADVENTURE;
  const [activeFilter, setActiveFilter] = useState(filterParam);

  const toggleBtn1Ref = useRef<HTMLButtonElement>(null);
  const toggleBtn2Ref = useRef<HTMLButtonElement>(null);
  const [toggleUnderline, setToggleUnderline] = useState({ left: 0, width: 0 });

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

  const { data: experiences2, isLoading } = useQuery({
    queryKey: ["launch-experiences2-listing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
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
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredExperiences =
    activeFilter === FILTER_ROMANTIC
      ? experiences2?.filter((exp: any) => exp.categories?.slug === "romantic")
      : experiences2?.filter((exp: any) => exp.categories?.slug !== "romantic");

  const pageTitle =
    activeFilter === FILTER_ROMANTIC
      ? isRTL ? "בריחה רומנטית" : "Romantic Escape"
      : isRTL ? "הרפתקה" : "Feeling Adventurous";

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <LoadingScreen isLoading={isLoading} />
      <SEOHead
        title={`${pageTitle} — STAYMAKOM`}
        description={isRTL ? "גלה חוויות מלון ייחודיות בישראל" : "Discover unique hotel experiences in Israel"}
      />

      <LaunchHeader />


      <main className="flex-1 pt-[88px] md:pt-20 pb-[80px] md:pb-0">
        <section className="container py-10 px-4">
          <div className="text-center mb-8">
            <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[-0.02em] mb-2">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {isRTL
                ? "מלונות שנבחרו בקפידה. חוויות בלתי נשכחות."
                : "Handpicked Hotels. Unforgettable Experiences."}
            </p>

            {/* Toggle */}
            <div className="relative inline-flex items-center gap-6" dir="ltr">
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

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : filteredExperiences && filteredExperiences.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredExperiences.map((experience: any) => {
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
                    linkSuffix="?context=launch"
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {isRTL ? "אין חוויות בקטגוריה זו עדיין" : "No experiences in this category yet."}
              </p>
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
