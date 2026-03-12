import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { MapPin, Star } from "lucide-react";

interface OtherExperiencesProps {
  hotelId: string;
  currentExperienceId: string;
  hotelName: string;
}

const OtherExperiencesFromHotel = ({ hotelId, currentExperienceId, hotelName }: OtherExperiencesProps) => {
  const { lang } = useLanguage();

  const { data: experiences, isLoading } = useQuery({
    queryKey: ["hotel-other-experiences", hotelId, currentExperienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*, hotels(hero_image)")
        .eq("hotel_id", hotelId)
        .eq("status", "published")
        .neq("id", currentExperienceId)
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !experiences || experiences.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <h2 className="font-serif text-lg md:text-2xl font-medium text-foreground">
        {lang === 'he' 
          ? `חוויות נוספות מ-${hotelName}` 
          : `Other experiences from ${hotelName}`}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {experiences.map((exp) => {
          const title = getLocalizedField(exp, 'title', lang) as string;
          const heroImage = exp.hero_image || exp.photos?.[0] || (exp.hotels as any)?.hero_image || '/placeholder.svg';

          return (
            <a
              key={exp.id}
              href={`/experience/${exp.slug}?lang=${lang}`}
              className="group block space-y-1.5 sm:space-y-3"
            >
              {/* Image */}
              <div className="aspect-[4/3] bg-muted rounded-md sm:rounded-lg overflow-hidden">
                <img
                  src={heroImage}
                  alt={title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="font-semibold text-xs sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">
                    {getLocalizedField(exp, 'city', lang) || hotelName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-bold">
                    {exp.base_price}€
                    <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5 sm:ml-1">
                      / {exp.base_price_type === 'per_person' 
                        ? (lang === 'he' ? 'אדם' : 'pers.') 
                        : (lang === 'he' ? 'לילה' : 'night')}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default OtherExperiencesFromHotel;
