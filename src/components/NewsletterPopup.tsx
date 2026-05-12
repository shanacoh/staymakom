import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Gift } from "lucide-react";
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

/**
 * Helper pour ouvrir la popup newsletter depuis n'importe où dans l'app.
 * Usage : `<button onClick={openNewsletterPopup}>Subscribe</button>`
 */
export function openNewsletterPopup() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NEWSLETTER_OPEN_EVENT));
}

const STORAGE_KEY = "staymakom_newsletter_popup_seen";
const DEFAULT_DELAY_MS = 20_000;

interface NewsletterPopupProps {
  delayMs?: number;
  promoCode?: string; // par défaut WELCOME10
  discountPct?: number; // par défaut 10
}

const translations = {
  en: {
    title: "Get 10% off your first stay",
    description: "Subscribe to our newsletter and we'll send you a discount code right now.",
    emailPlaceholder: "Your email",
    submit: "Get my code",
    submitting: "Subscribing…",
    successTitle: "Welcome to STAYMAKOM",
    successDescription: "Use this code at checkout for 10% off your first stay:",
    copy: "Copy",
    copied: "Copied!",
    close: "Maybe later",
    invalidEmail: "Please enter a valid email",
    error: "Something went wrong. Please try again.",
  },
  fr: {
    title: "10 % de réduction sur ton premier séjour",
    description: "Inscris-toi à la newsletter et reçois ton code de réduction tout de suite.",
    emailPlaceholder: "Ton email",
    submit: "Recevoir mon code",
    submitting: "Inscription…",
    successTitle: "Bienvenue chez STAYMAKOM",
    successDescription: "Utilise ce code au paiement pour avoir 10 % sur ton premier séjour :",
    copy: "Copier",
    copied: "Copié !",
    close: "Plus tard",
    invalidEmail: "Email invalide",
    error: "Une erreur est survenue. Réessaye.",
  },
  he: {
    title: "10% הנחה על השהייה הראשונה שלך",
    description: "הירשם/י לניוזלטר וקבל/י את קוד ההנחה מיד.",
    emailPlaceholder: "האימייל שלך",
    submit: "קבל/י את הקוד",
    submitting: "רישום...",
    successTitle: "ברוך/ה הבא/ה ל-STAYMAKOM",
    successDescription: "השתמש/י בקוד הזה בקופה לקבלת 10% הנחה על השהייה הראשונה:",
    copy: "העתק",
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
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-ouverture après délai (une seule fois par appareil, géré par localStorage)
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // localStorage indisponible (mode privé Safari etc.) → on continue quand même
    }
    const timer = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  // Ouverture manuelle via événement global (bouton "Get 10% off" dans le footer, etc.)
  // Ignore le flag localStorage : si tu veux ouvrir la popup, on l'ouvre.
  useEffect(() => {
    const handler = () => {
      // Réinitialise le formulaire pour permettre une nouvelle saisie
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
    if (!next) {
      // L'utilisateur ferme : on note qu'il a vu la popup, on ne le harcèle pas
      markSeen();
    }
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
      // Enregistrement du lead (non bloquant — si ça échoue on affiche le code quand même)
      await supabase.functions
        .invoke("collect-lead", {
          body: {
            email: email.trim(),
            source: "newsletter_popup",
            metadata: { promo_code: promoCode, discount_pct: discountPct },
          },
        })
        .catch((err) => {
          // Log silencieux — on ne bloque pas la promesse au visiteur
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-sans text-xl font-bold tracking-[-0.02em]">
            {submitted ? t.successTitle : t.title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {submitted ? t.successDescription : t.description}
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <Input
              type="email"
              required
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t.submitting : t.submit}
            </Button>
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.close}
            </button>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 text-center">
              <p className="font-mono text-2xl font-bold tracking-wider text-primary">
                {promoCode}
              </p>
            </div>
            <Button
              type="button"
              onClick={handleCopy}
              variant="outline"
              className="w-full gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t.copied}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t.copy}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewsletterPopup;
