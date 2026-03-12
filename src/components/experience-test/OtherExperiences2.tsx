import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedField, type Language } from "@/hooks/useLanguage";
import ExperienceCard from "@/components/ExperienceCard";

interface OtherExperiences2Props {
  hotelId: string;
  currentExperienceId: string;
  lang?: string;
}

const OtherExperiences2 = ({ hotelId, currentExperienceId, lang = "en" }: OtherExperiences2Props) => {
  const { data: experiences } = useQuery({
    queryKey: ["hotel2-other-experiences", hotelId, currentExperienceId],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("experience2_hotels")
        .select("experience_id")
        .eq("hotel_id", hotelId)
        .neq("experience_id", currentExperienceId);

      if (error) throw error;
      if (!links || links.length === 0) return [];

      const ids = [...new Set(links.map((l) => l.experience_id))];

      const { data: exps, error: expErr } = await supabase
        .from("experiences2")
        .select(`
          id, title, title_he, slug, hero_image, thumbnail_image, base_price, base_price_type, currency, hotel_id,
          experience2_hotels(
            position,
            hotel:hotels2(id, name, name_he, city, city_he, region:city, region_he:city_he, hero_image)
          )
        `)
        .in("id", ids)
        .eq("status", "published")
        .limit(4);

      if (expErr) throw expErr;

      return (exps || []).map((exp: any) => {
        const primaryHotel = exp.experience2_hotels
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          ?.[0]?.hotel;
        return { ...exp, hotels: primaryHotel || null };
      });
    },
  });

  if (!experiences || experiences.length === 0) return null;

  return (
    <section className="py-6">
      <h2 className="font-serif text-lg md:text-2xl font-medium text-foreground mb-4">
        {lang === "he" ? "חוויות נוספות" : lang === "fr" ? "Autres expériences" : "Other experiences"}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {experiences.map((exp) => (
          <ExperienceCard
            key={exp.id}
            experience={exp}
            linkPrefix="/experience2"
            rating={8.5 + Math.random() * 0.5}
            reviewCount={50 + Math.floor(Math.random() * 200)}
          />
        ))}
      </div>
    </section>
  );
};

export default OtherExperiences2;
