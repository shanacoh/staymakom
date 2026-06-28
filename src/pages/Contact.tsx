import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Instagram } from "lucide-react";
import contactHero from "@/assets/contact-hero-new.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.enum(["general", "experience", "corporate", "partnership", "other"]),
  message: z.string().trim().min(1, "Message is required").max(1000)
});

type FormData = z.infer<typeof formSchema>;

const Contact = () => {
  const { lang } = useLanguage();
  const isRTL = lang === 'he';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "general",
      message: ""
    }
  });
  
  const { data: settings } = useQuery({
    queryKey: ["global-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("global_settings").select("*").eq("key", "site_config").maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const subjectLabels = t(lang, 'contactSubjectLabels') as Record<string, string>;

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        source: "contact",
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message
      });
      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-contact-request", {
        body: {
          name: data.name,
          email: data.email,
          subject: subjectLabels[data.subject],
          message: data.message,
          language: lang
        }
      });
      

      setShowSuccess(true);
      form.reset();
      toast.success(lang === 'he' ? "ההודעה נשלחה בהצלחה!" : "Message sent successfully!");
    } catch (error) {
      
      toast.error(lang === 'he' ? "משהו השתבש. אנא נסו שוב." : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <V3Header />

      {/* Hero Section */}
      <section className="relative h-[38vh] md:h-[54vh] min-h-[240px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${contactHero})` }}
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <span className="block font-sans font-bold tracking-[-0.04em] uppercase text-xs text-white mb-4 opacity-0 animate-hero-fade-up">
            CONTACT
          </span>
          <h1 className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] mb-3 opacity-0 animate-hero-fade-up text-white text-center">
            {lang === 'he' ? 'בואו נדבר.' : lang === 'fr' ? 'PARLONS-EN.' : "LET'S TALK."}
          </h1>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-6 py-16" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Contact Text */}
        <section className="text-center mb-12">
          <p className="text-base text-foreground/70 leading-[1.8] max-w-[680px] mx-auto">
            {t(lang, 'contactIntro1')}
          </p>
          <p className="text-base text-foreground/70 leading-[1.8] max-w-[680px] mx-auto mt-4">
            {t(lang, 'contactIntro2')}
          </p>
        </section>

        {/* Contact Form */}
        <section className="max-w-[560px] mx-auto mb-16">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-center mb-8">GET IN TOUCH</p>
          {showSuccess ? (
            <div className="bg-muted p-8 text-center border border-border">
              <div className="mb-4 text-foreground">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-sans text-2xl mb-3">{t(lang, 'contactThankYou')}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t(lang, 'contactThankYouDesc')}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSuccess(false)}
                className="border-foreground text-foreground hover:bg-foreground hover:text-background"
              >
                {t(lang, 'contactSendAnother')}
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-[0.1em] text-foreground/70 mb-1.5 block">{t(lang, 'contactYourName')} *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={lang === 'he' ? "ישראל ישראלי" : "John Doe"} 
                        {...field}
                        className="bg-muted border-border rounded-none py-3.5 px-4 text-sm focus:border-foreground focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-[0.1em] text-foreground/70 mb-1.5 block">{t(lang, 'contactEmail')} *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
                        {...field}
                        className="bg-muted border-border rounded-none py-3.5 px-4 text-sm focus:border-foreground focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-[0.1em] text-foreground/70 mb-1.5 block">{t(lang, 'contactSubject')} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted border-border rounded-none py-3.5 px-4 text-sm focus:border-foreground focus:ring-0">
                          <SelectValue placeholder={lang === 'he' ? "בחרו נושא" : "Select a subject"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(subjectLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-[0.1em] text-foreground/70 mb-1.5 block">{t(lang, 'contactMessage')} *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t(lang, 'contactMessagePlaceholder')} 
                        className="min-h-[100px] bg-muted border-border rounded-none py-3.5 px-4 text-sm focus:border-foreground focus:ring-0 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-foreground hover:bg-foreground/90 text-background text-[13px] uppercase tracking-[0.15em] py-4 px-12 rounded-xl h-auto"
                >
                  {isSubmitting ? t(lang, 'contactSending') : t(lang, 'contactSendMessage')}
                </Button>
              </form>
            </Form>
          )}
        </section>

        {/* Direct Contact Info */}
        <section className="text-center border-t border-border pt-10">
          <h3 className="font-sans text-xl mb-6">{t(lang, 'contactDirectTitle')}</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground text-sm">
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
                {settings.contact_email}
              </a>
            )}
            <a href="https://www.instagram.com/staymakom/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Instagram className="w-4 h-4" />
              @staymakom
            </a>
          </div>
        </section>
      </main>

      <LaunchFooter />
    </div>
  );
};

export default Contact;
