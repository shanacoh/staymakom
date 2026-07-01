import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import Experience2CardWithPrice from "@/components/Experience2CardWithPrice";
import StandaloneExperienceCard from "@/components/StandaloneExperienceCard";
import ExperienceCardSkeleton from "@/components/ExperienceCardSkeleton";
import MobileBottomNav from "@/components/MobileBottomNav";

function primaryHotel(exp: any) {
  return (
    exp.experience2_hotels
      ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))?.[0]
      ?.hotel ?? null
  );
}

const Vitrine = () => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const [mode, setMode] = useState<"stay" | "live">("live");

  const { data: experiences2, isLoading: isLoadingExp } = useQuery({
    queryKey: ["vitrine-experiences2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(`
          id, slug, title, title_he, title_fr,
          hero_image, photos, status, display_order,
          preferred_board_type,
          categories(slug),
          experience2_hotels(
            position, nights,
            hotel:hotels2(
              id, name, name_he, name_fr,
              city, city_he, city_fr,
              region, region_he, region_fr,
              hero_image, hyperguest_property_id,
              practical_info
            )
          ),
          experience2_highlight_tags(
            highlight_tags(id, slug, label_en, label_he, label_fr, display_order, is_common, icon)
          )
        `)
        .eq("show_on_v3_only", true)
        .neq("status", "archived")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: mode === "stay",
    staleTime: 60_000,
  });

  const { data: standaloneExperiences, isLoading: isLoadingStandalone } = useQuery({
    queryKey: ["vitrine-standalone-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id, slug, title, title_he, title_fr, hero_image, photos, base_price, base_price_type, currency, min_party, max_party, has_child_price, has_time_slots, display_order, category_ids, city, city_he, region, region_he, practical_info, show_on_v3_only, category:categories(slug), standalone_experience_highlight_tags(tag_id, position, highlight_tags(id, slug, label_en, label_he, label_fr))")
        .eq("show_on_v3_only", true)
        .neq("status", "archived")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: true,
    staleTime: 60_000,
  });

  const experienceIds = useMemo(
    () => (experiences2 ?? []).map((e: any) => e.id as string),
    [experiences2]
  );
  const { data: allAvailabilityRules = [] } = useQuery({
    queryKey: ["availability_rules_batch_vitrine", experienceIds],
    queryFn: async () => {
      if (experienceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("availability_rules")
        .select("experience_id, rule_type, dates, day_of_week, start_date, end_date")
        .in("experience_id", experienceIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: experienceIds.length > 0,
    staleTime: 5 * 60_000,
  });
  const rulesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const rule of allAvailabilityRules) {
      if (!map[rule.experience_id]) map[rule.experience_id] = [];
      map[rule.experience_id].push(rule);
    }
    return map;
  }, [allAvailabilityRules]);

  const isEmpty = mode === "live"
    ? (!isLoadingStandalone && (!standaloneExperiences || standaloneExperiences.length === 0))
    : (!isLoadingExp && (!experiences2 || experiences2.length === 0));

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-white" dir={isRTL ? "rtl" : "ltr"}>
      <V3Header showModeToggle mode={mode} setMode={setMode} />

      <main className="flex-1 pb-[92px] md:pb-0 pt-14">
        {/* Bandeau de démonstration */}
        <div className="bg-[#ad1414]/10 border-b border-[#ad1414]/20 py-2.5 px-4 text-center">
          <p className="text-[11px] sm:text-xs text-[#ad1414] font-medium">
            {isRTL
              ? "דף הדגמה — דוגמאות לחוויות StayMakom"
              : lang === "fr"
                ? "Page de démonstration — exemples d'expériences StayMakom"
                : "Demo page — StayMakom experience samples"}
          </p>
        </div>

        <section className="bg-white pt-8 pb-10 sm:pt-10 sm:pb-14">
          <div className="text-center px-4 mb-6">
            <h1 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.02em] mb-1 leading-tight text-foreground">
              {isRTL
                ? "חוויות לדוגמה"
                : lang === "fr"
                  ? "Exemples d'expériences"
                  : "Sample experiences"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isRTL
                ? "חוויות שנבחרו להצגה לפני השקה רשמית"
                : lang === "fr"
                  ? "Une sélection d'expériences en avant-première."
                  : "A curated selection before official launch."}
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {mode === "live" ? (
              isLoadingStandalone ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
                </div>
              ) : isEmpty ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-sm">
                    {isRTL ? "אין חוויות להצגה עדיין." : lang === "fr" ? "Aucune expérience à afficher pour l'instant." : "No experiences to display yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {(standaloneExperiences ?? []).map((exp: any, idx: number) => (
                    <StandaloneExperienceCard key={exp.id} experience={exp} index={idx} />
                  ))}
                </div>
              )
            ) : (
              isLoadingExp ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <ExperienceCardSkeleton key={i} />)}
                </div>
              ) : isEmpty ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-sm">
                    {isRTL ? "אין חוויות להצגה עדיין." : lang === "fr" ? "Aucune expérience à afficher pour l'instant." : "No experiences to display yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {(experiences2 as any[]).map((exp: any, idx: number) => {
                    const hotel = primaryHotel(exp);
                    return (
                      <Experience2CardWithPrice
                        key={exp.id}
                        experience={exp}
                        primaryHotel={hotel}
                        hyperguestPropertyId={hotel?.hyperguest_property_id}
                        availabilityRules={rulesMap[exp.id] ?? []}
                        linkPrefix="/experience"
                        linkSuffix="context=vitrine"
                        index={idx}
                      />
                    );
                  })}
                </div>
              )
            )}
          </div>
        </section>
      </main>

      <LaunchFooter />
      <MobileBottomNav />
    </div>
  );
};

export default Vitrine;
