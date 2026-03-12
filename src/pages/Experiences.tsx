import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExperienceCard from "@/components/ExperienceCard";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { SEOHead } from "@/components/SEOHead";

const Experiences = () => {
  const { lang } = useLanguage();
  const isRTL = lang === 'he';

  const { data: experiences, isLoading } = useQuery({
    queryKey: ["all-experiences-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*, hotels(name, name_he, city, city_he, region, hero_image), experience_reviews(rating)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead
        titleEn="All Experiences | Staymakom"
        titleHe="כל החוויות | Staymakom"
        descriptionEn="Discover all our curated hotel experiences across Israel"
        descriptionHe="גלו את כל חוויות המלון האצורות שלנו ברחבי ישראל"
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted py-12 sm:py-16 md:py-20">
          <div className="container px-4 text-center">
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-4">
              {lang === 'he' ? 'כל החוויות' : 'All Experiences'}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              {lang === 'he' 
                ? 'גלו את מבחר החוויות האצורות שלנו במלונות הבוטיק הטובים ביותר בישראל' 
                : 'Discover our curated selection of experiences at the finest boutique hotels across Israel'
              }
            </p>
          </div>
        </section>

        {/* Experiences Grid */}
        <section className="container py-8 sm:py-12 md:py-16 px-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : experiences && experiences.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {experiences.map(experience => {
                const avgRating = experience.experience_reviews?.length
                  ? experience.experience_reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / experience.experience_reviews.length
                  : null;
                
                return (
                  <ExperienceCard
                    key={experience.id}
                    experience={experience}
                    rating={avgRating || undefined}
                    reviewCount={experience.experience_reviews?.length || 0}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {lang === 'he' ? 'אין חוויות זמינות כרגע' : 'No experiences available at the moment'}
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Experiences;
