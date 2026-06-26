import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ExperienceCard from "@/components/ExperienceCard";

interface OtherStandaloneExperiencesProps {
  currentExperienceId: string;
  categoryId?: string | null;
  lang?: string;
}

const OtherStandaloneExperiences = ({ currentExperienceId, categoryId, lang = "en" }: OtherStandaloneExperiencesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: experiences } = useQuery({
    queryKey: ["other-standalone-experiences", currentExperienceId, categoryId],
    queryFn: async () => {
      const MAX = 6;
      let results: any[] = [];

      const STANDALONE_SELECT = `
        id, title, title_he, title_fr, slug, hero_image, thumbnail_image, base_price, base_price_type, currency,
        standalone_experience_highlight_tags(
          highlight_tags(id, slug, label_en, label_he, label_fr)
        )
      `;

      // 1. Même catégorie en priorité
      if (categoryId) {
        const { data } = await supabase
          .from("standalone_experiences")
          .select(STANDALONE_SELECT)
          .eq("status", "published")
          .eq("category_id", categoryId)
          .neq("id", currentExperienceId)
          .limit(MAX);

        results = data || [];
      }

      // 2. Compléter avec d'autres catégories si besoin
      if (results.length < MAX) {
        const excludeIds = [currentExperienceId, ...results.map((e) => e.id)];
        let query = supabase
          .from("standalone_experiences")
          .select(STANDALONE_SELECT)
          .eq("status", "published")
          .not("id", "in", `(${excludeIds.join(",")})`)
          .limit(MAX - results.length);

        if (categoryId) {
          query = query.neq("category_id", categoryId);
        }

        const { data: extra } = await query;
        results = [...results, ...(extra || [])];
      }

      return results.map((exp: any) => ({
        ...exp,
        hotels: null,
        experience_highlight_tags: exp.standalone_experience_highlight_tags || [],
      }));
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
              linkPrefix="/standalone-experience"
              isStandaloneExperience
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default OtherStandaloneExperiences;
