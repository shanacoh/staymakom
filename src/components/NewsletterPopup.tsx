import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

/**
 * Popup d'inscription newsletter avec promo code -10 % (validé Shana 2026-05-07).
 *
 * Comportement :
 *   - S'ouvre automatiquement après 10 secondes sur la page (configurable via `delayMs`).
 *   - Auto-affichage UNE SEULE FOIS par appareil — un flag dans localStorage empêche
 *     la ré-apparition automatique (clé `staymakom_newsletter_popup_seen`).
 *   - PEUT ÊTRE RÉ-OUVERTE MANUELLEMENT en dispatchant l'événement global
 *     `staymakom-open-newsletter` (ex. depuis un bouton "Get 10% off" dans le footer).
 *     L'ouverture manuelle ignore le flag localStorage et ré-affiche le formulaire.
 *   - Saisie email → enregistrement dans la table `leads` (source = "newsletter_popup")
 *     → affichage du code WELCOME10 directement avec un bouton "Copy".
 */

export const NEWSLETTER_OPEN_EVENT = "staymakom-open-newsletter";

export function openNewsletterPopup() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NEWSLETTER_OPEN_EVENT));
}

const STORAGE_KEY = "staymakom_newsletter_popup_seen";
const DEFAULT_DELAY_MS = 20_000;

interface NewsletterPopupProps {
  delayMs?: number;
  promoCode?: string;
  discountPct?: number;
}

const translations = {
  en: {
    kicker: "Exclusive offer",
    title: "Get 10% off your first stay",
    description: "Subscribe to our newsletter and we'll send you a discount code right now.",
    emailPlaceholder: "Your email",
    submit: "Get my code",
    submitting: "Subscribing…",
    successKicker: "Welcome to STAYMAKOM",
    successTitle: "Your code is ready",
    successDescription: "Use this code at checkout for 10% off your first stay:",
    copy: "Copy code",
    copied: "Copied!",
    close: "Maybe later",
    invalidEmail: "Please enter a valid email",
    error: "Something went wrong. Please try again.",
  },
  fr: {
    kicker: "Offre exclusive",
    title: "10 % de réduction sur ton premier séjour",
    description: "Inscris-toi à la newsletter et reçois ton code de réduction tout de suite.",
    emailPlaceholder: "Ton email",
    submit: "Recevoir mon code",
    submitting: "Inscription…",
    successKicker: "Bienvenue chez STAYMAKOM",
    successTitle: "Ton code est prêt",
    successDescription: "Utilise ce code au paiement pour avoir 10 % sur ton premier séjour :",
    copy: "Copier le code",
    copied: "Copié !",
    close: "Plus tard",
    invalidEmail: "Email invalide",
    error: "Une erreur est survenue. Réessaye.",
  },
  he: {
    kicker: "הצעה בלעדית",
    title: "10% הנחה על השהייה הראשונה שלך",
    description: "הירשם/י לניוזלטר וקבל/י את קוד ההנחה מיד.",
    emailPlaceholder: "האימייל שלך",
    submit: "קבל/י את הקוד",
    submitting: "רישום...",
    successKicker: "ברוך/ה הבא/ה ל-STAYMAKOM",
    successTitle: "הקוד שלך מוכן",
    successDescription: "השתמש/י בקוד הזה בקופה לקבלת 10% הנחה על השהייה הראשונה:",
    copy: "העתק קוד",
    copied: "הועתק!",
    close: "אולי מאוחר יותר",
    invalidEmail: "אימייל לא תקין",
    error: "משהו השתבש. נסה/י שוב.",
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterPopup({
  delayMs = DEFAULT_DELAY_MS,
  promoCode = "WELCOME10",
  discountPct = 10,
}: NewsletterPopupProps) {
  const { lang } = useLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const isRTL = lang === "he";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // localStorage indisponible (mode privé Safari etc.) → on continue quand même
    }
    const timer = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    const handler = () => {
      setEmail("");
      setSubmitted(false);
      setCopied(false);
      setOpen(true);
    };
    window.addEventListener(NEWSLETTER_OPEN_EVENT, handler);
    return () => window.removeEventListener(NEWSLETTER_OPEN_EVENT, handler);
  }, []);

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) markSeen();
    setOpen(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error(t.invalidEmail);
      return;
    }
    setSubmitting(true);
    try {
      await supabase.functions
        .invoke("collect-lead", {
          body: {
            email: email.trim(),
            source: "newsletter_popup",
            metadata: { promo_code: promoCode, discount_pct: discountPct },
          },
        })
        .catch((err) => {
          console.warn("Newsletter signup: collect-lead failed (non-blocking)", err);
        });
      setSubmitted(true);
      markSeen();
    } catch {
      toast.error(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-8"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {!submitted ? (
          /* ── État formulaire ── */
          <div className="space-y-6">
            {/* Kicker + Titre */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ad1414]/70">
                {t.kicker}
              </p>
              <h2 className="font-sans text-2xl font-bold uppercase tracking-[-0.02em] text-foreground leading-tight">
                {t.title}
              </h2>
              <p className="text-sm text-black/50 leading-relaxed">
                {t.description}
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                required
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className="rounded-xl border-black/10 bg-black/[0.03] focus-visible:ring-[#ad1414]/30 placeholder:text-black/30"
              />

              {/* CTA avec trait rouge irrégulier — même pattern que "Design My Stay" */}
              <div className="relative inline-block w-full">
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-1.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-xs py-5"
                >
                  {submitting ? t.submitting : (
                    <>
                      {t.submit}
                      <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>

              <button
                type="button"
                onClick={() => handleClose(false)}
                className="block w-full text-center text-xs text-black/25 hover:text-black/45 transition-colors"
              >
                {t.close}
              </button>
            </form>
          </div>
        ) : (
          /* ── État succès ── */
          <div className="space-y-6">
            {/* Kicker + Titre */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ad1414]/70">
                {t.successKicker}
              </p>
              <h2 className="font-sans text-2xl font-bold uppercase tracking-[-0.02em] text-foreground leading-tight">
                {t.successTitle}
              </h2>
              <p className="text-sm text-black/50 leading-relaxed">
                {t.successDescription}
              </p>
            </div>

            {/* Bloc code promo */}
            <div className="rounded-2xl bg-[#ad1414]/8 border border-[#ad1414]/20 p-5 text-center">
              <p className="font-mono text-3xl font-bold tracking-[0.15em] text-[#ad1414]">
                {promoCode}
              </p>
            </div>

            {/* Bouton copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-black/15 py-3 text-xs font-semibold uppercase tracking-widest text-black/60 hover:border-black/30 hover:text-black transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {t.copied}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {t.copy}
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewsletterPopup;
