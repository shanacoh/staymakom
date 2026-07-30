/**
 * Page catalogue "Bateaux" — grille de cartes au même style que le reste du
 * site (réutilise StandaloneExperienceCard/ExperienceCard). Accessible
 * uniquement via lien direct (/boat) : aucune entrée de menu pour l'instant.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import StandaloneExperienceCard from "@/components/StandaloneExperienceCard";
import ExperienceCardSkeleton from "@/components/ExperienceCardSkeleton";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/hooks/useLanguage";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";
import BoatDetailModal from "@/components/boats/BoatDetailModal";

const Boats = () => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(null);

  const pageTitle = isRTL ? "סירות" : lang === "fr" ? "Bateaux" : "Boats";
  const pageDescription = isRTL
    ? "קטלוג הסירות שלנו בישראל."
    : lang === "fr"
      ? "Notre sélection de bateaux en Israël."
      : "Our curated selection of boats in Israel.";

  const { data: boats, isLoading } = useQuery({
    queryKey: ["boats-catalog"],
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
        .eq("category_id", BOATS_CATEGORY_ID)
        .eq("status", "published")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead title={`${pageTitle} — STAYMAKOM`} description={pageDescription} />

      <V3Header />

      <main className="flex-1 pt-[56px] pb-[80px] md:pb-0">
        <section className="bg-white pt-10 pb-5 text-center px-4">
          <h1 className="font-sans text-3xl sm:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto mt-2">{pageDescription}</p>
        </section>

        <section className="container max-w-6xl mx-auto py-8 px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
            </div>
          ) : boats && boats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {boats.map((boat: any, idx: number) => (
                <div
                  key={boat.id}
                  onClickCapture={(e) => { e.preventDefault(); setSelectedBoatId(boat.id); }}
                  role="button"
                  tabIndex={0}
                >
                  <StandaloneExperienceCard
                    experience={boat}
                    index={idx}
                    linkPrefix="/boat"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {isRTL ? "בקרוב" : lang === "fr" ? "Bientôt disponible." : "Coming soon."}
              </p>
            </div>
          )}
        </section>
      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      <BoatDetailModal boatId={selectedBoatId} onClose={() => setSelectedBoatId(null)} />
    </div>
  );
};

export default Boats;
