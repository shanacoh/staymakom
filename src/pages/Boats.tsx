/**
 * Page catalogue "Bateaux" — grille de cartes au même style que le reste du
 * site (réutilise StandaloneExperienceCard/ExperienceCard). Accessible
 * uniquement via lien direct (/boat) : aucune entrée de menu pour l'instant.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const pageTitle = isRTL ? "יוצאים לים" : lang === "fr" ? "Prendre le large" : "On the water";
  const pageDescription = isRTL
    ? "גלו את מבחר הסירות הנבחר שלנו ברחבי ישראל. המחירים מוצגים עבור שייט של שעתיים, אלא אם צוין אחרת."
    : lang === "fr"
      ? "Découvrez notre sélection de bateaux soigneusement choisis à travers Israël. Tous les prix sont indiqués pour une sortie de 2 heures, sauf mention contraire."
      : "Explore Israel from the sea with our handpicked collection of boats. All prices are based on a 2-hour experience, unless otherwise stated.";

  const { data: boats, isLoading } = useQuery({
    queryKey: ["boats-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select(`
          id, slug, title, title_he, title_fr,
          hero_image, photos,
          base_price, base_price_type, currency, original_price,
          min_party, max_party, has_child_price, has_time_slots,
          duration, duration_fr, duration_he,
          skipper_included, crew_included,
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
          <div className="flex flex-wrap gap-2 items-center justify-center mb-6">
            {[
              { value: "Tel Aviv", label: isRTL ? "תל אביב" : "Tel Aviv" },
              { value: "Herzliya", label: isRTL ? "הרצליה" : "Herzliya" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedCity(selectedCity === value ? null : value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm border transition-all",
                  selectedCity === value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
            </div>
          ) : boats && boats.filter((boat: any) => !selectedCity || boat.city === selectedCity).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {boats.filter((boat: any) => !selectedCity || boat.city === selectedCity).map((boat: any, idx: number) => (
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
                    showTotalPrice
                    isBoat
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
