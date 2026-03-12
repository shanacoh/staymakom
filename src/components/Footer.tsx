import { Link } from "react-router-dom";
import { Instagram, Mail, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { trackFooterCategoryClicked } from "@/lib/analytics";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { lang } = useLanguage();
  const isRTL = lang === 'he';

  const { data: categories } = useQuery({
    queryKey: ["categories-footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_he, slug")
        .eq("status", "published")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
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
    }
  });

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("leads").insert({
        source: "newsletter",
        email: email.trim()
      });
      if (error) throw error;
      toast.success(t(lang, 'footerSubscribed'));
      setEmail("");
    } catch (error) {
      
      toast.error("Something went wrong. Please try again.");
    }
  };

  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const langParam = lang === 'he' ? '?lang=he' : '';

  const navLinks = [
    { to: `/about${langParam}`, label: t(lang, 'footerAbout') },
    { to: `/partners${langParam}`, label: t(lang, 'footerImAHotel') },
    { to: `/companies${langParam}`, label: t(lang, 'footerCompanyGift') },
    { to: `/contact${langParam}`, label: t(lang, 'footerContactUs') },
    { to: `/partners${langParam}`, label: t(lang, 'footerBecomePartner') },
    { to: `/journal${langParam}`, label: t(lang, 'footerJournal') },
  ];

  const legalLinks = [
    { to: `/terms${langParam}`, label: t(lang, 'footerTerms') },
    { to: `/privacy${langParam}`, label: t(lang, 'footerPrivacy') },
    { to: `/cancellation-policy${langParam}`, label: t(lang, 'footerCancellation') },
    { to: `/cookies${langParam}`, label: t(lang, 'footerCookies') },
    { to: `/legal${langParam}`, label: t(lang, 'footerLegalNotice') },
  ];

  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="container py-8">
        {/* Desktop Layout - 5 columns all aligned */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-5">
          {/* Column 1: Brand */}
          <div>
            <h3 className="font-sans text-xl font-bold uppercase tracking-[-0.04em] mb-2 text-slate-50">
              STAYMAKOM
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">{t(lang, 'footerTagline')}</p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-slate-50">
              {t(lang, 'footerStaymakom')}
            </h4>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="text-sm text-white hover:text-primary transition-smooth">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li><span className="text-sm text-white/50">{t(lang, 'footerMoreToCome')}</span></li>
            </ul>
          </div>

          {/* Column 3: Experiences */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-slate-50">
              {t(lang, 'footerExperiences')}
            </h4>
            <ul className="space-y-2">
              {categories?.map(category => {
                const catName = getLocalizedField(category, 'name', lang) as string;
                return (
                  <li key={category.id}>
                    <Link to={`/category/${category.slug}${langParam}`} className="text-sm text-white hover:text-primary transition-smooth" onClick={() => trackFooterCategoryClicked(catName)}>
                      {catName}
                    </Link>
                  </li>
                );
              })}
              {(!categories || categories.length === 0) && (
                <li><span className="text-sm text-white/50">{t(lang, 'footerMoreToCome')}</span></li>
              )}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-slate-50">
              {t(lang, 'footerLegal')}
            </h4>
            <ul className="space-y-2">
              {legalLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white hover:text-primary transition-smooth">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-slate-50">
              {t(lang, 'footerNewsletter')}
            </h4>
            <form onSubmit={handleNewsletterSubmit} className="mb-6">
              <Input
                type="email"
                placeholder={t(lang, 'footerEmailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm placeholder:text-white/50 focus-visible:border-primary"
                required
              />
              <Button type="submit" variant="secondary" size="sm" className="mt-2 w-full">
                {t(lang, 'footerSubscribe')}
              </Button>
            </form>
            <div className="space-y-2">
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-sm text-white hover:text-primary transition-smooth">
                  <Mail className="h-4 w-4" />
                  {settings.contact_email}
                </a>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <a href="https://www.instagram.com/staymakom/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-smooth">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://tiktok.com/@staymakom" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-smooth">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a href="https://linkedin.com/company/staymakom" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-smooth">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Accordions */}
        <div className="lg:hidden space-y-0" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Brand - Mobile */}
          <div className="mb-6 pb-4 border-b border-white/20">
            <h3 className="font-sans text-2xl font-bold uppercase tracking-[-0.04em] mb-2 text-slate-50">
              STAYMAKOM
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              {t(lang, 'footerTagline')}
            </p>
          </div>

          {/* STAYMAKOM Accordion */}
          <Collapsible open={openSection === 'staymakom'} onOpenChange={() => toggleSection('staymakom')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-white/20">
              <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-slate-50">
                {t(lang, 'footerStaymakom')}
              </h4>
              <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${openSection === 'staymakom' ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="py-3 space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  className="block text-sm text-white/80 hover:text-primary transition-smooth py-1"
                >
                  {link.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* EXPERIENCES Accordion */}
          <Collapsible open={openSection === 'experiences'} onOpenChange={() => toggleSection('experiences')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-white/20">
              <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-slate-50">
                {t(lang, 'footerExperiences')}
              </h4>
              <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${openSection === 'experiences' ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="py-3 space-y-2">
              {categories?.map(category => {
                const catName = getLocalizedField(category, 'name', lang) as string;
                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}${langParam}`}
                    className="block text-sm text-white/80 hover:text-primary transition-smooth py-1"
                    onClick={() => trackFooterCategoryClicked(catName)}
                  >
                    {catName}
                  </Link>
                );
              })}
              {(!categories || categories.length === 0) && (
                <span className="text-sm text-white/50">{t(lang, 'footerMoreToCome')}</span>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* LEGAL Accordion */}
          <Collapsible open={openSection === 'legal'} onOpenChange={() => toggleSection('legal')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-white/20">
              <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-slate-50">
                {t(lang, 'footerLegal')}
              </h4>
              <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${openSection === 'legal' ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="py-3 space-y-2">
              {legalLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-sm text-white/80 hover:text-primary transition-smooth py-1"
                >
                  {link.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Newsletter Section - Below accordions on mobile */}
          <div className="pt-6 mt-4">
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-slate-50">
              {t(lang, 'footerNewsletter')}
            </h4>
            <form onSubmit={handleNewsletterSubmit} className="mb-6">
              <Input
                type="email"
                placeholder={t(lang, 'footerEmailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm placeholder:text-white/50 focus-visible:border-primary"
                required
              />
              <Button type="submit" variant="secondary" size="sm" className="mt-2 w-full">
                {t(lang, 'footerSubscribe')}
              </Button>
            </form>

            {/* Contact Info */}
            <div className="space-y-2">
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-sm text-white hover:text-primary transition-smooth">
                  <Mail className="h-4 w-4" />
                  {settings.contact_email}
                </a>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-4">
              <a href="https://www.instagram.com/staymakom/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-smooth">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://tiktok.com/@staymakom" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-smooth">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a href="https://linkedin.com/company/staymakom" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-smooth">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-5 border-t border-white/20 text-center">
          <p className="text-xs text-white">
            {t(lang, 'footerCopyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
