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
    <div className="min-h-screen bg-[#FAF8F5]">
      <LaunchHeader forceScrolled={true} />

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[350px] sm:min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img src={partnersHero} alt="Boutique hotel" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 font-sans font-bold text-slate-50">
            {t(lang, 'partnersHeroTitle')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg mb-6 text-white/90">
            {t(lang, 'partnersHeroSubtitle')}
          </p>
          <Button onClick={() => navigateLocalized("/auth")} size="default" className="bg-slate-50 text-slate-950">
            {t(lang, 'partnersLoginBtn')}
          </Button>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Why Join Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl md:text-3xl text-center mb-10">
            {t(lang, 'partnersWhyJoin')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-lg mb-3">{t(lang, 'partnersCuratedVisibility')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(lang, 'partnersCuratedVisibilityDesc')}
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg mb-3">{t(lang, 'partnersExperienceFirst')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(lang, 'partnersExperienceFirstDesc')}
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg mb-3">{t(lang, 'partnersNoRisk')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(lang, 'partnersNoRiskDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="mb-16 bg-white rounded-lg p-8">
          <h2 className="font-serif text-2xl md:text-3xl text-center mb-6">
            {t(lang, 'partnersWhatWeOffer')}
          </h2>
          <p className="text-sm text-center mb-8 max-w-2xl mx-auto text-muted-foreground">
            {t(lang, 'partnersWhatWeOfferDesc')}
          </p>
          <ul className="space-y-3 max-w-md mx-auto text-sm">
            <li className="flex items-start gap-3">
              <span className="text-[#D72638] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D72638] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D72638] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem3')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D72638] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem4')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D72638] mt-0.5">•</span>
              <span>{t(lang, 'partnersOfferItem5')}</span>
            </li>
          </ul>
        </section>

        {/* Partner Form Section */}
        <section id="partner-form" className="max-w-lg mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-center mb-8">
            {t(lang, 'partnersBecomePartner')}
          </h2>
          <PartnerFormFlow lang={lang} />
        </section>

        {/* Direct Contact Section */}
        {settings?.partners_email && (
          <section className="text-center border-t pt-8 mt-8">
            <h3 className="font-serif text-lg mb-4">{t(lang, 'partnersDirectContact')}</h3>
            <a href={`mailto:${settings.partners_email}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#D72638] transition-colors">
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
