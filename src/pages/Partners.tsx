import { useEffect } from "react";
import { trackPartnersPageViewed } from "@/lib/analytics";
import { useQuery } from "@tanstack/react-query";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import partnersHero from "@/assets/partners-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { PartnerFormFlow } from "@/components/partners/PartnerFormFlow";

const Partners = () => {
  const { lang } = useLanguage();
  const isRTL = lang === 'he';
  const { navigateLocalized } = useLocalizedNavigation();

  useEffect(() => { trackPartnersPageViewed(); }, []);

  const { data: settings } = useQuery({
    queryKey: ["global-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("key", "site_config")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <LaunchHeader forceScrolled={true} />

      {/* Hero Section */}
      <section className="relative h-[38vh] md:h-[54vh] min-h-[240px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${partnersHero})` }}
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <span className="block font-sans font-bold tracking-[-0.04em] uppercase text-xs text-white mb-4 opacity-0 animate-hero-fade-up">
            {lang === 'he' ? 'שותפים' : lang === 'fr' ? 'PARTENAIRES' : 'PARTNERS'}
          </span>
          <h1 className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] mb-3 opacity-0 animate-hero-fade-up text-white text-center">
            {t(lang, 'partnersHeroTitle')}
          </h1>
          <p
            className="font-sans not-italic text-white max-w-xl mx-auto opacity-0 animate-hero-fade-up text-xs sm:text-base md:text-lg"
            style={{ animationDelay: "250ms" }}
          >
            {t(lang, 'partnersHeroSubtitle')}
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Why Join Section */}
        <section className="mb-16">
          <h2 className="font-sans text-2xl md:text-3xl text-center mb-10">
            {t(lang, 'partnersWhyJoin')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-sans text-lg mb-3">{t(lang, 'partnersCuratedVisibility')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(lang, 'partnersCuratedVisibilityDesc')}
              </p>
            </div>
            <div>
              <h3 className="font-sans text-lg mb-3">{t(lang, 'partnersExperienceFirst')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(lang, 'partnersExperienceFirstDesc')}
              </p>
            </div>
            <div>
              <h3 className="font-sans text-lg mb-3">{t(lang, 'partnersNoRisk')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(lang, 'partnersNoRiskDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="mb-16 bg-white rounded-lg p-8">
          <h2 className="font-sans text-2xl md:text-3xl text-center mb-6">
            {t(lang, 'partnersWhatWeOffer')}
          </h2>
          <p className="text-sm text-center mb-8 max-w-2xl mx-auto text-muted-foreground">
            {t(lang, 'partnersWhatWeOfferDesc')}
          </p>
          <ul className="space-y-3 max-w-md mx-auto text-sm">
            <li className="flex items-start gap-3">
              <span className="text-[#ad1414] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ad1414] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ad1414] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem3')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ad1414] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem4')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ad1414] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem5')}</span>
            </li>
          </ul>
        </section>

        {/* Partner Form Section */}
        <section id="partner-form" className="max-w-lg mx-auto">
          <h2 className="font-sans text-2xl md:text-3xl text-center mb-8">
            {t(lang, 'partnersBecomePartner')}
          </h2>
          <PartnerFormFlow lang={lang} />
        </section>

        {/* Direct Contact Section */}
        {settings?.partners_email && (
          <section className="text-center border-t pt-8 mt-8">
            <h3 className="font-sans text-lg mb-4">{t(lang, 'partnersDirectContact')}</h3>
            <a href={`mailto:${settings.partners_email}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#ad1414] transition-colors">
              <Mail className="w-4 h-4" />
              {settings.partners_email}
            </a>
          </section>
        )}
      </main>

      <LaunchFooter />
    </div>
  );
};

export default Partners;
