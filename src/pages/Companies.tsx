import { useState, useEffect, useMemo } from "react";
import { trackCompaniesPageViewed } from "@/lib/analytics";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Gift, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import corporateHero from "@/assets/corporate-hero.jpg";
import { useLanguage } from "@/hooks/useLanguage";
import { tPage } from "@/lib/translations";
import { Link } from "react-router-dom";

// Messages d'erreur dans la langue de la page : le schéma est construit dans le composant.
const buildFormSchema = () => z.object({
  fullName: z.string().trim().min(2, tPage("companiesErrName")).max(100, tPage("companiesErrTooLong")(100)),
  companyName: z.string().trim().min(1, tPage("companiesErrCompany")).max(100, tPage("companiesErrTooLong")(100)),
  email: z.string().trim().email(tPage("companiesErrEmail")).max(255, tPage("companiesErrTooLong")(255)),
  phone: z.string().trim().min(1, tPage("companiesErrPhone")).max(50, tPage("companiesErrTooLong")(50)),
  requestType: z.enum(["corporate_retreat", "team_building", "employee_reward", "corporate_gift_cards", "customized_incentive", "not_sure"]),
  mainObjective: z.enum(["team_bonding", "celebration", "motivation", "leadership", "client_partner", "other"]),
  groupSize: z.enum(["5-10", "10-25", "25-50", "50+"]),
  preferredDates: z.string().trim().max(200, tPage("companiesErrTooLong")(200)).optional(),
  message: z.string().trim().max(1000, tPage("companiesErrTooLong")(1000)).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: tPage("companiesErrConsent") }) })
});

type FormData = z.infer<ReturnType<typeof buildFormSchema>>;

export default function Companies() {
  const { lang, locale } = useLanguage();
  const isRTL = lang === 'he';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { trackCompaniesPageViewed(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const formSchema = useMemo(() => buildFormSchema(), [locale]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestType: "corporate_retreat"
    }
  });
  
  const requestType = watch("requestType");
  
  const scrollToForm = (type?: string) => {
    if (type) {
      setValue("requestType", type as any);
    }
    const element = document.getElementById("contact-form");
    element?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error: leadsError } = await supabase.from("leads").insert({
        source: "corporate",
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        company_name: data.companyName,
        request_type: data.requestType,
        group_size: data.groupSize,
        preferred_dates: data.preferredDates || null,
        message: data.message || null,
        is_b2b: true,
        marketing_opt_in: data.consent,
        metadata: {
          main_objective: data.mainObjective
        }
      });
      if (leadsError) throw leadsError;

      await supabase.functions.invoke("send-corporate-request", {
        body: {
          ...data,
          mainObjective: data.mainObjective
        }
      });
      setShowSuccess(true);
      reset();
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      
      toast.error(tPage("companiesSendFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestTypeLabels = tPage('companiesRequestTypeLabels') as Record<string, string>;
  const mainObjectiveOptions = tPage('companiesMainObjectiveOptions') as Record<string, string>;
  const groupSizeOptions = tPage('companiesGroupSizeOptions') as Record<string, string>;

  return (
    <div className="min-h-screen bg-white">
      <V3Header />
      
      {/* Hero Section */}
      <section className="relative h-[380px] overflow-hidden">
        <img src={corporateHero} alt={tPage("companiesHeroAlt")} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="max-w-3xl space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-white/70">STAYMAKOM</p>
            <h1 className="font-sans text-lg sm:text-2xl md:text-[28px] font-bold text-white uppercase tracking-tight leading-[1.15]">
              {tPage('companiesHeroTitle')}
            </h1>
            <p className="text-sm md:text-base text-white/80 font-light max-w-2xl mx-auto">
              {tPage('companiesHeroSubtitle')}
            </p>
            
            <div className="pt-4">
              <button 
                onClick={() => scrollToForm()} 
                className="bg-[#ad1414] text-white font-sans text-[13px] font-semibold uppercase tracking-wide px-6 py-2.5 rounded-full hover:bg-[#ad1414]/90 transition-colors"
              >
                {tPage('companiesSendRequest')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 space-y-16" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* What We Offer Section */}
        <section>
          <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-center mb-3">STAYMAKOM</p>
          <h2 className="font-sans text-sm sm:text-base font-bold text-center mb-6 uppercase text-foreground tracking-[0.03em]">{tPage('companiesWhatWeOffer')}</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg bg-transparent p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Gift className="h-5 w-5 text-[#ad1414]" />
              </div>
              <h3 className="font-sans text-lg font-bold text-foreground">{tPage('companiesCorporateGiftTitle')}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {tPage('companiesCorporateGiftDesc')}
              </p>
              <ul className="space-y-1.5 text-sm text-foreground/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#ad1414] mt-0.5">•</span>
                  <span>{tPage('companiesCorporateGiftItem1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ad1414] mt-0.5">•</span>
                  <span>{tPage('companiesCorporateGiftItem2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ad1414] mt-0.5">•</span>
                  <span>{tPage('companiesCorporateGiftItem3')}</span>
                </li>
              </ul>
            </div>

            <div className="border border-border rounded-lg bg-transparent p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-[#ad1414]" />
              </div>
              <h3 className="font-sans text-lg font-bold text-foreground">{tPage('companiesTeamBuildingTitle')}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {tPage('companiesTeamBuildingDesc1')}
              </p>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {tPage('companiesTeamBuildingDesc2')}
              </p>
            </div>

            <div className="border border-border rounded-lg bg-transparent p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="h-5 w-5 text-[#ad1414]" />
              </div>
              <h3 className="font-sans text-lg font-bold text-foreground">{tPage('companiesIncentivesTitle')}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {tPage('companiesIncentivesDesc1')}
              </p>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {tPage('companiesIncentivesDesc2')}
              </p>
            </div>
          </div>
        </section>

        {/* Why MAKOM Section */}
        <section className="bg-muted rounded-lg p-8">
          <h2 className="font-sans text-sm sm:text-base font-bold text-center mb-5 uppercase text-foreground tracking-[0.03em]">{tPage('companiesWhyStaymakom')}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-[#ad1414]" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">{tPage('companiesUnique')}</h3>
              <p className="text-xs text-muted-foreground">
                {tPage('companiesUniqueDesc')}
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-[#ad1414]" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">{tPage('companiesFlexible')}</h3>
              <p className="text-xs text-muted-foreground">
                {tPage('companiesFlexibleDesc')}
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-[#ad1414]" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">{tPage('companiesSeamless')}</h3>
              <p className="text-xs text-muted-foreground">
                {tPage('companiesSeamlessDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section>
          <h2 className="font-sans text-sm sm:text-base font-bold text-center mb-5 uppercase text-foreground tracking-[0.03em]">{tPage('companiesHowItWorks')}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="font-semibold text-sm text-foreground">{tPage('companiesStep1')}</h3>
              <p className="text-xs text-muted-foreground">
                {tPage('companiesStep1Desc')}
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="font-semibold text-sm text-foreground">{tPage('companiesStep2')}</h3>
              <p className="text-xs text-muted-foreground">
                {tPage('companiesStep2Desc')}
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="font-semibold text-sm text-foreground">{tPage('companiesStep3')}</h3>
              <p className="text-xs text-muted-foreground">
                {tPage('companiesStep3Desc')}
              </p>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => scrollToForm("corporate_gift_cards")}
              className="bg-transparent border border-border text-foreground font-sans text-[13px] font-semibold uppercase tracking-wide px-6 py-2.5 rounded-full hover:bg-muted transition-colors"
            >
              {tPage('companiesRequestGiftCards')}
            </button>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact-form" className="scroll-mt-20">
          <div className="max-w-lg mx-auto">
            <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-center mb-3">STAYMAKOM</p>
            <h2 className="font-sans text-sm sm:text-base font-bold text-center mb-3 uppercase text-foreground tracking-[0.03em]">
              {tPage('companiesFormTitle')}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-8">
              {tPage('companiesFormSubtitle')}
            </p>

            {showSuccess ? (
              <div className="border border-border rounded-lg bg-[#FDFCFA] p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-[#ad1414]" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{tPage('companiesThankYou')}</h3>
                <p className="text-sm text-muted-foreground">
                  {tPage('companiesThankYouDesc')}
                </p>
                <button 
                  onClick={() => setShowSuccess(false)} 
                  className="bg-transparent border border-border text-foreground font-sans text-[13px] font-semibold uppercase tracking-wide px-6 py-2.5 rounded-full hover:bg-muted transition-colors"
                >
                  {tPage('companiesSendAnother')}
                </button>
              </div>
            ) : (
              <div className="border border-border rounded-lg bg-[#FDFCFA] p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="fullName" className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesFullName')} *</label>
                      <input id="fullName" {...register("fullName")} placeholder={tPage('companiesFullNamePlaceholder') as string} className="w-full bg-muted border border-border rounded-sm px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors" />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="companyName" className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesCompanyName')} *</label>
                      <input id="companyName" {...register("companyName")} placeholder={tPage('companiesCompanyNamePlaceholder') as string} className="w-full bg-muted border border-border rounded-sm px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors" />
                      {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesWorkEmail')} *</label>
                      <input id="email" type="email" {...register("email")} placeholder={tPage('companiesEmailPlaceholder') as string} className="w-full bg-muted border border-border rounded-sm px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesPhone')} *</label>
                      <input id="phone" {...register("phone")} placeholder="+972 XX XXX XXXX" className="w-full bg-muted border border-border rounded-sm px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors" />
                      <p className="text-xs text-muted-foreground">{tPage('companiesPhoneHelper')}</p>
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesRequestType')} *</label>
                    <RadioGroup value={requestType} onValueChange={value => setValue("requestType", value as any)} className="space-y-1">
                      {Object.entries(requestTypeLabels).map(([value, label]) => (
                        <div key={value} className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                          <RadioGroupItem value={value} id={value} />
                          <label htmlFor={value} className="font-normal cursor-pointer text-sm text-foreground">
                            {label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                    {errors.requestType && <p className="text-xs text-destructive">{errors.requestType.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesMainObjective')} *</label>
                    <Controller
                      name="mainObjective"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-muted border-border rounded-sm h-12 text-sm">
                            <SelectValue placeholder={tPage('companiesMainObjectivePlaceholder') as string} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(mainObjectiveOptions).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.mainObjective && <p className="text-xs text-destructive">{errors.mainObjective.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesGroupSize')} *</label>
                      <Controller
                        name="groupSize"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-muted border-border rounded-sm h-12 text-sm">
                              <SelectValue placeholder={tPage('companiesGroupSizePlaceholder') as string} />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(groupSizeOptions).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.groupSize && <p className="text-xs text-destructive">{errors.groupSize.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="preferredDates" className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesPreferredDates')}</label>
                      <input id="preferredDates" {...register("preferredDates")} placeholder={tPage('companiesPreferredDatesPlaceholder') as string} className="w-full bg-muted border border-border rounded-sm px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors" />
                      {errors.preferredDates && <p className="text-xs text-destructive">{errors.preferredDates.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="font-sans text-[12px] uppercase tracking-[0.1em] text-foreground/70 block mb-1.5">{tPage('companiesAdditionalInfo')}</label>
                    <textarea id="message" {...register("message")} placeholder={tPage('companiesAdditionalInfoPlaceholder') as string} className="w-full min-h-[80px] bg-muted border border-border rounded-sm px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors" />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                      <Controller
                        name="consent"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="consent"
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        )}
                      />
                      <label htmlFor="consent" className="font-normal text-sm leading-snug cursor-pointer text-foreground">
                        {tPage('companiesConsent')}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tPage('companiesConsentHelper')}{' '}
                      <Link to={`/privacy${locale !== 'en' ? `?lang=${locale}` : ''}`} className="underline hover:text-foreground">
                        {tPage('footerPrivacy')}
                      </Link>
                    </p>
                    {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <button 
                      type="submit" 
                      className="w-full bg-[#ad1414] text-white font-sans text-[13px] font-semibold uppercase tracking-wide py-3 rounded-full hover:bg-[#ad1414]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? tPage('companiesSending') : tPage('companiesSubmitButton')}
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                      {tPage('companiesSubmitHelper')}
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>

      <LaunchFooter />
    </div>
  );
}
