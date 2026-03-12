import { useState, useEffect } from "react";
import { trackPartnersPageViewed, trackPartnerFormSubmitted } from "@/lib/analytics";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import partnersHero from "@/assets/partners-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  hotel_name: z.string().trim().min(1, "Hotel name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  message: z.string().trim().min(1, "Message is required").max(1000)
});

type FormData = z.infer<typeof formSchema>;

const Partners = () => {
  const { lang } = useLanguage();
  const isRTL = lang === 'he';
  const { navigateLocalized } = useLocalizedNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { trackPartnersPageViewed(); }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      hotel_name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("leads")
        .insert({
          source: "partners",
          name: data.name,
          email: data.email,
          phone: data.phone,
          property_name: data.hotel_name,
          message: data.message,
          is_b2b: true,
        });

      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-partner-request", {
        body: {
          name: data.name,
          hotel_name: data.hotel_name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          language: lang
        }
      });
      

      trackPartnerFormSubmitted();
      setShowSuccess(true);
      form.reset();
      toast.success(lang === 'he' ? "תודה על ההתעניינות!" : "Thank you for your interest!");
    } catch (error) {
      
      toast.error(lang === 'he' ? "משהו השתבש. אנא נסו שוב." : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {showSuccess ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="mb-4 text-[#D72638]">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl mb-3">{t(lang, 'partnersThankYou')}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t(lang, 'partnersThankYouDesc')}
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowSuccess(false)}>
                {t(lang, 'partnersSubmitAnother')}
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg p-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t(lang, 'partnersName')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={lang === 'he' ? "השם שלכם" : "Your name"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hotel_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t(lang, 'partnersHotelName')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={lang === 'he' ? "שם המלון שלכם" : "Your hotel name"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t(lang, 'partnersEmail')} *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t(lang, 'partnersPhone')} *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+972 XX XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t(lang, 'partnersPropertyDesc')} *</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t(lang, 'partnersPropertyPlaceholder')} className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#D72638] hover:bg-[#D72638]/90">
                  {isSubmitting ? t(lang, 'partnersSending') : t(lang, 'partnersSendRequest')}
                </Button>
              </form>
            </Form>
          )}
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
