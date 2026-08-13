import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

/**
 * Popup d'inscription newsletter (plus de code promo — retiré le 2026-08-13).
 *
 * Comportement :
 *   - S'ouvre automatiquement après 10 secondes sur la page (configurable via `delayMs`).
 *   - Auto-affichage UNE SEULE FOIS par appareil — un flag dans localStorage empêche
 *     la ré-apparition automatique (clé `staymakom_newsletter_popup_seen`).
 *   - PEUT ÊTRE RÉ-OUVERTE MANUELLEMENT en dispatchant l'événement global
 *     `staymakom-open-newsletter` (ex. depuis un bouton dans le footer).
 *     L'ouverture manuelle ignore le flag localStorage et ré-affiche le formulaire.
 *   - Saisie email → enregistrement dans la table `leads` (source = "newsletter_popup")
 *     → simple message de remerciement, sans code promo.
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
}

const translations = {
  en: {
    kicker: "Newsletter",
    title: "Be the first to know",
    description: "Sign up to hear about news and surprises before anyone else.",
    emailPlaceholder: "Your email",
    submit: "Sign up",
    submitting: "Signing up…",
    successKicker: "Welcome to STAYMAKOM",
    successTitle: "You're in!",
    successDescription: "You'll be the first to hear about our news and surprises.",
    close: "Maybe later",
    invalidEmail: "Please enter a valid email",
    error: "Something went wrong. Please try again.",
  },
  fr: {
    kicker: "Newsletter",
    title: "Sois parmi les premiers informés",
    description: "Inscris-toi pour être informé en avant-première de nos actualités et de nos surprises.",
    emailPlaceholder: "Ton email",
    submit: "Je m'inscris",
    submitting: "Inscription…",
    successKicker: "Bienvenue chez STAYMAKOM",
    successTitle: "C'est fait !",
    successDescription: "Tu seras parmi les premiers informés de nos actualités et de nos surprises.",
    close: "Plus tard",
    invalidEmail: "Email invalide",
    error: "Une erreur est survenue. Réessaye.",
  },
  he: {
    kicker: "ניוזלטר",
    title: "היו הראשונים לדעת",
    description: "הירשם/י כדי לשמוע לפני כולם על חדשות והפתעות.",
    emailPlaceholder: "האימייל שלך",
    submit: "הרשמה",
    submitting: "נרשם/ת...",
    successKicker: "ברוך/ה הבא/ה ל-STAYMAKOM",
    successTitle: "נרשמת בהצלחה!",
    successDescription: "תהיו הראשונים לשמוע על החדשות וההפתעות שלנו.",
    close: "אולי מאוחר יותר",
    invalidEmail: "אימייל לא תקין",
    error: "משהו השתבש. נסה/י שוב.",
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterPopup({
  delayMs = DEFAULT_DELAY_MS,
}: NewsletterPopupProps) {
  const { lang } = useLanguage();
  const location = useLocation();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const isRTL = lang === "he";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  // Jamais dans le back-office, ni sur la page de swipe (expérience plein écran immersive :
  // une popup marketing par-dessus bloquerait littéralement le bouton "J'aime"/"Passer" du client),
  // ni sur les pages de paiement (checkout, standalone-checkout) : la popup s'affichait par-dessus
  // la pop-up de paiement Revolut et masquait complètement le bouton "Payer" — cause probable de
  // réservations bloquées, reproduite en local le 12/08.
  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/hotel-admin") ||
    location.pathname.startsWith("/swipe/") ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/standalone-checkout")
  ) {
    return null;
  }

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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewsletterPopup;
