import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ExperienceCard from "@/components/ExperienceCard";

interface OtherExperiences2Props {
  currentExperienceId: string;
  categoryId?: string | null;
  lang?: string;
}

const OtherExperiences2 = ({ currentExperienceId, categoryId, lang = "en" }: OtherExperiences2Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: experiences } = useQuery({
    queryKey: ["other-experiences-by-category", currentExperienceId, categoryId],
    queryFn: async () => {
      const MAX = 6;
      let results: any[] = [];

      // 1. Same category first
      if (categoryId) {
        const { data } = await supabase
          .from("experiences2")
          .select(`
            id, title, title_he, slug, hero_image, thumbnail_image, base_price, base_price_type, currency, hotel_id,
            experience2_hotels(
              position,
              hotel:hotels2(id, name, name_he, city, city_he, region:city, region_he:city_he, hero_image)
            )
          `)
          .eq("status", "published")
          .eq("category_id", categoryId)
          .neq("id", currentExperienceId)
          .limit(MAX);

        results = data || [];
      }

      // 2. Fill with other categories if needed
      if (results.length < MAX) {
        const excludeIds = [currentExperienceId, ...results.map((e) => e.id)];
        let query = supabase
          .from("experiences2")
          .select(`
            id, title, title_he, slug, hero_image, thumbnail_image, base_price, base_price_type, currency, hotel_id,
            experience2_hotels(
              position,
              hotel:hotels2(id, name, name_he, city, city_he, region:city, region_he:city_he, hero_image)
            )
          `)
          .eq("status", "published")
          .not("id", "in", `(${excludeIds.join(",")})`)
          .limit(MAX - results.length);

        if (categoryId) {
          query = query.neq("category_id", categoryId);
        }

        const { data: extra } = await query;
        results = [...results, ...(extra || [])];
      }

      return results.map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return { ...exp, hotels: primaryHotel || null };
      });
    },
  });

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.offsetWidth / 2;
    scrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  if (!experiences || experiences.length === 0) return null;

  const title = lang === "he" ? "חוויות נוספות" : lang === "fr" ? "Autres expériences" : "Other experiences";

  return (
    <section className="py-6 min-w-0 overflow-x-hidden w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg md:text-2xl font-medium text-foreground">{title}</h2>
        {experiences.length > 2 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-border/60 hover:bg-muted transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-border/60 hover:bg-muted transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 min-w-0 max-w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="snap-start shrink-0 w-[calc(50%-8px)]"
          >
            <ExperienceCard
              experience={exp}
              linkPrefix="/experience2"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default OtherExperiences2;
