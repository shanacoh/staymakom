import { useState, useEffect } from "react";
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
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import corporateHero from "@/assets/corporate-hero.jpg";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { Link } from "react-router-dom";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  companyName: z.string().trim().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(50, "Phone must be less than 50 characters"),
  requestType: z.enum(["corporate_retreat", "team_building", "employee_reward", "corporate_gift_cards", "customized_incentive", "not_sure"]),
  mainObjective: z.enum(["team_bonding", "celebration", "motivation", "leadership", "client_partner", "other"]),
  groupSize: z.enum(["5-10", "10-25", "25-50", "50+"]),
  preferredDates: z.string().trim().max(200, "Preferred dates must be less than 200 characters").optional(),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "You must agree to continue" }) })
});

type FormData = z.infer<typeof formSchema>;

export default function Companies() {
  const { lang } = useLanguage();
  const isRTL = lang === 'he';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { trackCompaniesPageViewed(); }, []);

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
      
      toast.error(lang === 'he' 
        ? "שליחת הבקשה נכשלה. אנא נסו שוב או צרו קשר ישירות hello@staymakom.com"
        : "Failed to send request. Please try again or contact us directly at hello@staymakom.com"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestTypeLabels = t(lang, 'companiesRequestTypeLabels') as Record<string, string>;
  const mainObjectiveOptions = t(lang, 'companiesMainObjectiveOptions') as Record<string, string>;
  const groupSizeOptions = t(lang, 'companiesGroupSizeOptions') as Record<string, string>;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <LaunchHeader forceScrolled={true} />
      
      {/* Hero Section */}
      <section className="relative h-[380px] overflow-hidden">
        <img src={corporateHero} alt="Team retreat moment" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="max-w-3xl space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-white/70">STAYMAKOM</p>
            <h1 className="font-sans text-4xl md:text-[64px] font-bold text-white uppercase tracking-tight leading-none">
              {t(lang, 'companiesHeroTitle')}
            </h1>
            <p className="text-sm md:text-base text-white/80 font-light max-w-2xl mx-auto">
              {t(lang, 'companiesHeroSubtitle')}
            </p>
            
            <div className="pt-4">
              <button 
                onClick={() => scrollToForm()} 
                className="bg-[#1A1814] text-white font-sans text-[13px] uppercase tracking-[0.15em] px-12 py-4 rounded-none hover:opacity-85 transition-opacity"
              >
                {t(lang, 'companiesSendRequest')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 space-y-16" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* What We Offer Section */}
        <section>
          <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-[#8C7B6B] text-center mb-3">STAYMAKOM</p>
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-center mb-10 uppercase text-[#1A1814]">{t(lang, 'companiesWhatWeOffer')}</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-[#E8E0D4] rounded-none bg-transparent p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F0EBE3] flex items-center justify-center mb-3">
                <Gift className="h-5 w-5 text-[#B8935A]" />
              </div>
              <h3 className="font-sans text-lg font-bold text-[#2C2520]">{t(lang, 'companiesCorporateGiftTitle')}</h3>
              <p className="text-sm text-[#5C4A3A] leading-relaxed">
                {t(lang, 'companiesCorporateGiftDesc')}
              </p>
              <ul className="space-y-1.5 text-sm text-[#5C4A3A]">
                <li className="flex items-start gap-2">
                  <span className="text-[#B8935A] mt-0.5">•</span>
                  <span>{t(lang, 'companiesCorporateGiftItem1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#B8935A] mt-0.5">•</span>
                  <span>{t(lang, 'companiesCorporateGiftItem2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#B8935A] mt-0.5">•</span>
                  <span>{t(lang, 'companiesCorporateGiftItem3')}</span>
                </li>
              </ul>
            </div>

            <div className="border border-[#E8E0D4] rounded-none bg-transparent p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F0EBE3] flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-[#B8935A]" />
              </div>
              <h3 className="font-sans text-lg font-bold text-[#2C2520]">{t(lang, 'companiesTeamBuildingTitle')}</h3>
              <p className="text-sm text-[#5C4A3A] leading-relaxed">
                {t(lang, 'companiesTeamBuildingDesc1')}
              </p>
              <p className="text-sm text-[#5C4A3A] leading-relaxed">
                {t(lang, 'companiesTeamBuildingDesc2')}
              </p>
            </div>

            <div className="border border-[#E8E0D4] rounded-none bg-transparent p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F0EBE3] flex items-center justify-center mb-3">
                <Sparkles className="h-5 w-5 text-[#B8935A]" />
              </div>
              <h3 className="font-sans text-lg font-bold text-[#2C2520]">{t(lang, 'companiesIncentivesTitle')}</h3>
              <p className="text-sm text-[#5C4A3A] leading-relaxed">
                {t(lang, 'companiesIncentivesDesc1')}
              </p>
              <p className="text-sm text-[#5C4A3A] leading-relaxed">
                {t(lang, 'companiesIncentivesDesc2')}
              </p>
            </div>
          </div>
        </section>

        {/* Why MAKOM Section */}
        <section className="bg-[#F0EBE3] rounded-none p-8">
          <h2 className="font-sans text-2xl font-bold text-center mb-8 uppercase text-[#1A1814]">{t(lang, 'companiesWhyStaymakom')}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-[#B8935A]" />
              </div>
              <h3 className="font-semibold text-sm text-[#2C2520]">{t(lang, 'companiesUnique')}</h3>
              <p className="text-xs text-[#8C7B6B]">
                {t(lang, 'companiesUniqueDesc')}
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-[#B8935A]" />
              </div>
              <h3 className="font-semibold text-sm text-[#2C2520]">{t(lang, 'companiesFlexible')}</h3>
              <p className="text-xs text-[#8C7B6B]">
                {t(lang, 'companiesFlexibleDesc')}
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-[#B8935A]" />
              </div>
              <h3 className="font-semibold text-sm text-[#2C2520]">{t(lang, 'companiesSeamless')}</h3>
              <p className="text-xs text-[#8C7B6B]">
                {t(lang, 'companiesSeamlessDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section>
          <h2 className="font-sans text-2xl font-bold text-center mb-8 uppercase text-[#1A1814]">{t(lang, 'companiesHowItWorks')}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1A1814] text-white flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="font-semibold text-sm text-[#2C2520]">{t(lang, 'companiesStep1')}</h3>
              <p className="text-xs text-[#8C7B6B]">
                {t(lang, 'companiesStep1Desc')}
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1A1814] text-white flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="font-semibold text-sm text-[#2C2520]">{t(lang, 'companiesStep2')}</h3>
              <p className="text-xs text-[#8C7B6B]">
                {t(lang, 'companiesStep2Desc')}
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1A1814] text-white flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="font-semibold text-sm text-[#2C2520]">{t(lang, 'companiesStep3')}</h3>
              <p className="text-xs text-[#8C7B6B]">
                {t(lang, 'companiesStep3Desc')}
              </p>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => scrollToForm("corporate_gift_cards")}
              className="bg-transparent border-[1.5px] border-[#1A1814] text-[#1A1814] font-sans text-[13px] uppercase tracking-[0.15em] px-12 py-4 rounded-none hover:bg-[#1A1814] hover:text-white transition-all"
            >
              {t(lang, 'companiesRequestGiftCards')}
            </button>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact-form" className="scroll-mt-20">
          <div className="max-w-lg mx-auto">
            <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-[#8C7B6B] text-center mb-3">STAYMAKOM</p>
            <h2 className="font-sans text-2xl font-bold text-center mb-3 uppercase text-[#1A1814]">
              {t(lang, 'companiesFormTitle')}
            </h2>
            <p className="text-center text-sm text-[#8C7B6B] mb-8">
              {t(lang, 'companiesFormSubtitle')}
            </p>

            {showSuccess ? (
              <div className="border border-[#E8E0D4] rounded-none bg-[#FDFCFA] p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F0EBE3] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-[#B8935A]" />
                </div>
                <h3 className="font-semibold text-lg text-[#2C2520]">{t(lang, 'companiesThankYou')}</h3>
                <p className="text-sm text-[#8C7B6B]">
                  {t(lang, 'companiesThankYouDesc')}
                </p>
                <button 
                  onClick={() => setShowSuccess(false)} 
                  className="bg-transparent border-[1.5px] border-[#1A1814] text-[#1A1814] font-sans text-[13px] uppercase tracking-[0.15em] px-8 py-3 rounded-none hover:bg-[#1A1814] hover:text-white transition-all"
                >
                  {t(lang, 'companiesSendAnother')}
                </button>
              </div>
            ) : (
              <div className="border border-[#E8E0D4] rounded-none bg-[#FDFCFA] p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="fullName" className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesFullName')} *</label>
                      <input id="fullName" {...register("fullName")} placeholder={t(lang, 'companiesFullNamePlaceholder') as string} className="w-full bg-[#F5F0E8] border border-[#E8E0D4] rounded-none px-4 py-3.5 font-sans text-sm text-[#2C2520] placeholder:text-[#8C7B6B] focus:border-[#1A1814] focus:outline-none transition-colors" />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="companyName" className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesCompanyName')} *</label>
                      <input id="companyName" {...register("companyName")} placeholder={t(lang, 'companiesCompanyNamePlaceholder') as string} className="w-full bg-[#F5F0E8] border border-[#E8E0D4] rounded-none px-4 py-3.5 font-sans text-sm text-[#2C2520] placeholder:text-[#8C7B6B] focus:border-[#1A1814] focus:outline-none transition-colors" />
                      {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesWorkEmail')} *</label>
                      <input id="email" type="email" {...register("email")} placeholder={t(lang, 'companiesEmailPlaceholder') as string} className="w-full bg-[#F5F0E8] border border-[#E8E0D4] rounded-none px-4 py-3.5 font-sans text-sm text-[#2C2520] placeholder:text-[#8C7B6B] focus:border-[#1A1814] focus:outline-none transition-colors" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesPhone')} *</label>
                      <input id="phone" {...register("phone")} placeholder="+972 XX XXX XXXX" className="w-full bg-[#F5F0E8] border border-[#E8E0D4] rounded-none px-4 py-3.5 font-sans text-sm text-[#2C2520] placeholder:text-[#8C7B6B] focus:border-[#1A1814] focus:outline-none transition-colors" />
                      <p className="text-xs text-[#8C7B6B]">{t(lang, 'companiesPhoneHelper')}</p>
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesRequestType')} *</label>
                    <RadioGroup value={requestType} onValueChange={value => setValue("requestType", value as any)} className="space-y-1">
                      {Object.entries(requestTypeLabels).map(([value, label]) => (
                        <div key={value} className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                          <RadioGroupItem value={value} id={value} />
                          <label htmlFor={value} className="font-normal cursor-pointer text-sm text-[#2C2520]">
                            {label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                    {errors.requestType && <p className="text-xs text-destructive">{errors.requestType.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesMainObjective')} *</label>
                    <Controller
                      name="mainObjective"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-[#F5F0E8] border-[#E8E0D4] rounded-none h-12 text-sm">
                            <SelectValue placeholder={t(lang, 'companiesMainObjectivePlaceholder') as string} />
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
                      <label className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesGroupSize')} *</label>
                      <Controller
                        name="groupSize"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-[#F5F0E8] border-[#E8E0D4] rounded-none h-12 text-sm">
                              <SelectValue placeholder={t(lang, 'companiesGroupSizePlaceholder') as string} />
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
                      <label htmlFor="preferredDates" className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesPreferredDates')}</label>
                      <input id="preferredDates" {...register("preferredDates")} placeholder={t(lang, 'companiesPreferredDatesPlaceholder') as string} className="w-full bg-[#F5F0E8] border border-[#E8E0D4] rounded-none px-4 py-3.5 font-sans text-sm text-[#2C2520] placeholder:text-[#8C7B6B] focus:border-[#1A1814] focus:outline-none transition-colors" />
                      {errors.preferredDates && <p className="text-xs text-destructive">{errors.preferredDates.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="font-sans text-[12px] uppercase tracking-[0.1em] text-[#5C4A3A] block mb-1.5">{t(lang, 'companiesAdditionalInfo')}</label>
                    <textarea id="message" {...register("message")} placeholder={t(lang, 'companiesAdditionalInfoPlaceholder') as string} className="w-full min-h-[80px] bg-[#F5F0E8] border border-[#E8E0D4] rounded-none px-4 py-3.5 font-sans text-sm text-[#2C2520] placeholder:text-[#8C7B6B] focus:border-[#1A1814] focus:outline-none transition-colors" />
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
                      <label htmlFor="consent" className="font-normal text-sm leading-snug cursor-pointer text-[#2C2520]">
                        {t(lang, 'companiesConsent')}
                      </label>
                    </div>
                    <p className="text-xs text-[#8C7B6B]">
                      {t(lang, 'companiesConsentHelper')}{' '}
                      <Link to={`/privacy${lang !== 'en' ? `?lang=${lang}` : ''}`} className="underline hover:text-[#2C2520]">
                        {t(lang, 'footerPrivacy')}
                      </Link>
                    </p>
                    {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <button 
                      type="submit" 
                      className="w-full bg-[#1A1814] text-white font-sans text-[13px] uppercase tracking-[0.15em] py-4 rounded-none hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t(lang, 'companiesSending') : t(lang, 'companiesSubmitButton')}
                    </button>
                    <p className="text-xs text-[#8C7B6B] text-center">
                      {t(lang, 'companiesSubmitHelper')}
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
