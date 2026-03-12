import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { Button } from "@/components/ui/button";
import aboutHero from "@/assets/about-hero-desert-new.png";
import founderPhoto from "@/assets/founder-shana.jpg";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { MapPin, Globe } from "lucide-react";

const About = () => {
  const { lang } = useLanguage();
  const isRTL = lang === 'he';
  const { getLocalizedPath } = useLocalizedNavigation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        titleEn="About STAYMAKOM | Curated Hotel Stays in Israel"
        titleHe="אודות STAYMAKOM | חוויות אירוח מובחרות בישראל"
        descriptionEn="Discover STAYMAKOM - a curated booking platform combining boutique hotels and immersive local experiences in Israel."
        descriptionHe="גלו את STAYMAKOM - פלטפורמת הזמנות מובחרת המשלבת מלונות בוטיק וחוויות מקומיות סוחפות בישראל." />

      <LaunchHeader forceScrolled={true} />

      {/* HERO */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={aboutHero} alt="Desert road journey" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <div className="relative z-10 text-center text-white px-6 max-w-3xl">
          <p className="font-sans text-xs sm:text-sm uppercase tracking-[0.2em] text-white/80 mb-4 animate-hero-fade-up [animation-delay:200ms]">
            STAYMAKOM
          </p>
          <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-[-0.02em] text-white animate-hero-fade-up [animation-delay:400ms]">
            {t(lang, 'aboutHeroTagline')}
          </h1>
        </div>
      </section>

      <main dir={isRTL ? 'rtl' : 'ltr'}>
        {/* WHY ISRAEL. WHY NOW. */}
        <section className="py-20 px-6 bg-background md:py-[52px]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
              {t(lang, 'aboutWhyIsraelLabel')}
            </p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-[-0.02em] text-foreground mb-10">
              {t(lang, 'aboutWhyIsraelTitle')}
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground mb-6">
              {t(lang, 'aboutWhyIsraelP1')}
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground mb-6">
              {t(lang, 'aboutWhyIsraelP2')}
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground">
              {t(lang, 'aboutWhyIsraelP3')}
            </p>
          </div>
        </section>

        {/* TWO AUDIENCES */}
        <section className="py-16 px-6 bg-[#FAF8F5] md:py-[52px]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div className="border-t border-border/40 pt-8">
                <h3 className="font-sans text-lg md:text-xl font-semibold uppercase tracking-[0.05em] text-foreground mb-4 flex items-center gap-2.5">
                  <MapPin size={18} strokeWidth={1.5} />
                  {t(lang, 'aboutAudienceIsraeliTitle')}
                </h3>
                <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground mb-3 italic">
                  {t(lang, 'aboutAudienceIsraeliP1')}
                </p>
                <p className="font-sans text-base leading-relaxed text-muted-foreground">
                  {t(lang, 'aboutAudienceIsraeliP2')}
                </p>
              </div>

              <div className="border-t border-border/40 pt-8">
                <h3 className="font-sans text-lg md:text-xl font-semibold uppercase tracking-[0.05em] text-foreground mb-4 flex items-center gap-2.5">
                  <Globe size={18} strokeWidth={1.5} />
                  {t(lang, 'aboutAudienceIntlTitle')}
                </h3>
                <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground mb-3 italic">
                  {t(lang, 'aboutAudienceIntlP1')}
                </p>
                <p className="font-sans text-base leading-relaxed text-muted-foreground">
                  {t(lang, 'aboutAudienceIntlP2')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT MAKES STAYMAKOM DIFFERENT */}
        <section className="py-20 px-6 bg-background md:py-[62px]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-sans text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.02em] mb-12 text-foreground">
              {t(lang, 'aboutDifferentTitle')}
            </h2>
            <div className="space-y-5 mb-12 text-left max-w-xl mx-auto">
              {[
              t(lang, 'aboutDifferent1'),
              t(lang, 'aboutDifferent2'),
              t(lang, 'aboutDifferent3'),
              t(lang, 'aboutDifferent4'),
              t(lang, 'aboutDifferent5')].
              map((item, index) =>
              <div key={index} className="flex items-start gap-4 text-base md:text-lg text-foreground/80">
                  <span className="text-muted-foreground/50 mt-0.5">—</span>
                  <span>{item}</span>
                </div>
              )}
            </div>
            <p className="font-sans text-base md:text-lg text-muted-foreground italic max-w-xl mx-auto">
              {t(lang, 'aboutDifferentQuote')}
            </p>
          </div>
        </section>

        {/* THE NAME */}
        <section className="py-20 px-6 bg-[#FAF8F5] md:py-[52px]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
              {t(lang, 'aboutNameTitle')}
            </p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-[-0.02em] text-foreground mb-8">
              STAYMAKOM
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground mb-6">
              {t(lang, 'aboutNameP1')}
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground">
              {t(lang, 'aboutNameP2')}
            </p>
          </div>
        </section>

        {/* FOUNDER */}
        <section className="py-16 px-6 bg-background md:py-[62px]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div className={`${isRTL ? 'md:order-2' : ''}`}>
                <img
                  src={founderPhoto}
                  alt="Shana, Founder of STAYMAKOM"
                  className="w-full max-w-md mx-auto aspect-[3/4] object-cover grayscale" />

              </div>
              <div className={`${isRTL ? 'md:order-1' : ''}`}>
                <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  {t(lang, 'aboutFounderLabel')}
                </p>
                <h3 className="font-sans text-3xl md:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground mb-1">
                  {t(lang, 'aboutFounderName')}
                </h3>
                <p className="font-sans text-sm text-muted-foreground mb-8">
                  {t(lang, 'aboutFounderRole')}
                </p>
                <p className="font-sans leading-relaxed text-muted-foreground mb-5 text-sm">
                  {t(lang, 'aboutFounderP1')}
                </p>
                <p className="font-sans leading-relaxed text-muted-foreground mb-5 text-sm">
                  {t(lang, 'aboutFounderP2')}
                </p>
                <p className="font-sans leading-relaxed text-muted-foreground mb-5 italic text-sm">
                  {t(lang, 'aboutFounderP3')}
                </p>
                <p className="font-sans leading-relaxed text-muted-foreground text-sm">
                  {t(lang, 'aboutFounderP4')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 px-6 bg-[#FAF8F5] md:py-[52px]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-[-0.02em] mb-10 text-foreground">
              {t(lang, 'aboutCTATitle')}
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-foreground hover:bg-foreground/90 text-white px-8">
                <Link to="/launch">{t(lang, 'aboutCTAExplore')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/5 px-8">
                <Link to={getLocalizedPath("/contact")}>{t(lang, 'aboutCTAList')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LaunchFooter />
    </div>);

};

export default About;