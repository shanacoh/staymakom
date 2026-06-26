/**
 * StandaloneCheckout — Steps 2 (Guest Info) & 3 (Review & Confirm)
 * Mirrors Checkout.tsx for hotel+experience, adapted for standalone experiences.
 * Receives booking data from StandaloneExperience via router state.
 */

import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RevolutPaymentWidget from "@/components/experience/RevolutPaymentWidget";
import LaunchHeader from "@/components/LaunchHeader";
import { LeadGuestForm, LeadGuestData, EMPTY_LEAD_GUEST, saveProfileFields } from "@/components/experience/LeadGuestForm";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StandaloneCheckoutState {
  experienceId: string;
  experienceSlug: string;
  experienceTitle: string;
  experienceTitleFr?: string | null;
  experienceTitleHe?: string | null;
  heroImage?: string | null;
  selectedDate: string;
  selectedSlot?: string | null;
  adults: number;
  children: number;
  basePrice: number;
  basePriceChild?: number | null;
  hasChildPrice?: boolean | null;
  basePriceType: string;
  currency: string;
  lang: "en" | "he" | "fr";
  totalPrice: number;
}

type CheckoutStep = 2 | 3;
type PaymentStatus = "idle" | "creating" | "paid" | "failed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = { ILS: "₪", USD: "$", EUR: "€", GBP: "£" };
  return map[currency?.toUpperCase()] ?? currency;
}

// ---------------------------------------------------------------------------
// Entry point — validates router state
// ---------------------------------------------------------------------------

export default function StandaloneCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as StandaloneCheckoutState | null;

  React.useEffect(() => {
    if (!state?.experienceId) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state?.experienceId) return null;

  return <StandaloneCheckoutContent state={state} />;
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function StandaloneCheckoutContent({ state }: { state: StandaloneCheckoutState }) {
  const navigate = useNavigate();
  const lang = state.lang;

  const t = {
    en: {
      step2Title: "Guest information",
      step3Title: "Review & confirm",
      back: "Back",
      next: "Continue",
      pay: "CONFIRM & PAY",
      guestInfo: "Guest information",
      bookingDetails: "Booking details",
      guestDetails: "Guest details",
      date: "Date",
      timeSlot: "Time slot",
      participants: "Participants",
      total: "Total",
      firstName: "First name *",
      lastName: "Last name *",
      email: "Email *",
      phone: "Phone *",
      specialRequests: "Special requests",
      specialRequestsPlaceholder: "Write any special requests here (optional)...",
      giftCard: "Have a gift card?",
      giftCardPlaceholder: "MK–XXXX–XXXX",
      promoCode: "Have a promo code?",
      promoCodePlaceholder: "Enter your code",
      apply: "APPLY",
      backToSelection: "Back to selection",
      secureCheckout: "Secure checkout",
      paymentFailed: "Payment failed",
      paymentFailedMsg: "The payment did not go through. Please try again.",
      paymentConfirmed: "Payment confirmed. Your booking is being created...",
      securePayment: "Secure payment",
      securePaymentDesc: "Choose a payment method and complete your booking. Secured by Revolut.",
      preparingPayment: "Preparing payment...",
      selection: "Selection",
    },
    he: {
      step2Title: "פרטי אורח",
      step3Title: "סיכום ואישור",
      back: "חזרה",
      next: "המשך",
      pay: "שלם והזמן",
      guestInfo: "פרטי לקוח",
      bookingDetails: "פרטי ההזמנה",
      guestDetails: "פרטי לקוח",
      date: "תאריך",
      timeSlot: "שעה",
      participants: "משתתפים",
      total: "סה\"כ",
      firstName: "שם פרטי *",
      lastName: "שם משפחה *",
      email: "אימייל *",
      phone: "טלפון *",
      specialRequests: "בקשות מיוחדות",
      specialRequestsPlaceholder: "כתוב כאן בקשות מיוחדות (אופציונלי)...",
      giftCard: "יש לך כרטיס מתנה?",
      giftCardPlaceholder: "MK–XXXX–XXXX",
      promoCode: "יש לך קוד פרומו?",
      promoCodePlaceholder: "הכנס את הקוד שלך",
      apply: "החל",
      backToSelection: "חזרה לבחירה",
      secureCheckout: "הזמנה מאובטחת",
      paymentFailed: "התשלום נכשל",
      paymentFailedMsg: "התשלום לא הושלם. אנא נסה שוב.",
      paymentConfirmed: "התשלום אושר. ההזמנה שלך נוצרת...",
      securePayment: "תשלום מאובטח",
      securePaymentDesc: "בחר אמצעי תשלום והשלם את ההזמנה. התשלום מתבצע באמצעות Revolut.",
      preparingPayment: "מכין תשלום...",
      selection: "בחירה",
    },
    fr: {
      step2Title: "Informations client",
      step3Title: "Vérification & confirmation",
      back: "Retour",
      next: "Continuer",
      pay: "PAYER & RÉSERVER",
      guestInfo: "Informations client",
      bookingDetails: "Détails de la réservation",
      guestDetails: "Informations client",
      date: "Date",
      timeSlot: "Créneau",
      participants: "Participants",
      total: "Total",
      firstName: "Prénom *",
      lastName: "Nom *",
      email: "Email *",
      phone: "Téléphone *",
      specialRequests: "Demandes spéciales",
      specialRequestsPlaceholder: "Écrivez vos demandes spéciales ici (optionnel)...",
      giftCard: "Vous avez une carte cadeau ?",
      giftCardPlaceholder: "MK–XXXX–XXXX",
      promoCode: "Vous avez un code promo ?",
      promoCodePlaceholder: "Entrez votre code",
      apply: "APPLIQUER",
      backToSelection: "Retour à la sélection",
      secureCheckout: "Réservation sécurisée",
      paymentFailed: "Le paiement a échoué",
      paymentFailedMsg: "Le paiement n'a pas été finalisé. Réessayez.",
      paymentConfirmed: "Paiement confirmé. Votre réservation est en cours de création...",
      securePayment: "Paiement sécurisé",
      securePaymentDesc: "Choisissez un moyen de paiement et finalisez votre réservation. Paiement sécurisé par Revolut.",
      preparingPayment: "Préparation du paiement...",
      selection: "Sélection",
    },
  }[lang];

  // ── Auth & States ────────────────────────────────────────────────────────
  const { user } = useAuth();
  const [step, setStep] = useState<CheckoutStep>(2);
  const [leadGuest, setLeadGuest] = useState<LeadGuestData>(EMPTY_LEAD_GUEST);
  const [authDialog, setAuthDialog] = useState<{
    open: boolean; tab: "login" | "signup"; context: "favorites" | "account" | "signup";
  }>({ open: false, tab: "login", context: "account" });
  const [guestSpecialRequests, setGuestSpecialRequests] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    id: string; code: string; totalAmount: number;
    amountUsed: number; availableBalance: number; currency: string;
  } | null>(null);
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [promoCodeValue, setPromoCodeValue] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; code: string; discountPct: number } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [showGuestErrors, setShowGuestErrors] = useState(false);

  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [revolutPublicId, setRevolutPublicId] = useState<string | null>(null);
  const [revolutPublicKey, setRevolutPublicKey] = useState<string | undefined>(undefined);
  const [revolutEnvironment, setRevolutEnvironment] = useState<"production" | "dev">("dev");
  const [bookingToken, setBookingToken] = useState<string | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────
  const currencySymbol = getCurrencySymbol(state.currency);
  const isGuestValid = !!leadGuest.firstName.trim() && !!leadGuest.lastName.trim() && !!leadGuest.email.trim() && !!leadGuest.phone.trim();
  const promoDiscount = appliedPromo ? Math.round((state.totalPrice * appliedPromo.discountPct) / 100) : 0;
  const afterPromo = Math.max(0, state.totalPrice - promoDiscount);
  const giftCardApplied = appliedGiftCard ? Math.min(appliedGiftCard.availableBalance, afterPromo) : 0;
  const finalTotal = Math.max(0, afterPromo - giftCardApplied);

  const expTitle =
    lang === "he" ? (state.experienceTitleHe || state.experienceTitle) :
    lang === "fr" ? (state.experienceTitleFr || state.experienceTitle) :
    state.experienceTitle;

  const dateLabel = state.selectedDate
    ? new Date(state.selectedDate + "T12:00:00").toLocaleDateString(
        lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" },
      )
    : "";

  const adultsLabel =
    lang === "he" ? `${state.adults} מבוגר${state.adults > 1 ? "ים" : ""}` :
    lang === "fr" ? `${state.adults} adulte${state.adults > 1 ? "s" : ""}` :
    `${state.adults} adult${state.adults > 1 ? "s" : ""}`;

  const childrenLabel =
    state.children > 0
      ? lang === "he" ? `، ${state.children} ילד${state.children > 1 ? "ים" : ""}` :
        lang === "fr" ? `, ${state.children} enfant${state.children > 1 ? "s" : ""}` :
        `, ${state.children} child${state.children > 1 ? "ren" : ""}`
      : "";

  const stepLabels = [t.step2Title, t.step3Title];

  const inputStyle = {
    backgroundColor: "#F5F0E8",
    border: "1px solid #E8E0D4",
    borderRadius: "0px",
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleContinueToStep3 = useCallback(() => {
    if (!isGuestValid) { setShowGuestErrors(true); return; }
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isGuestValid]);

  const handleApplyGiftCard = useCallback(async () => {
    if (!giftCardCode.trim()) return;
    setIsValidatingGiftCard(true);
    setGiftCardError(null);
    try {
      const { data, error } = await (supabase.rpc as any)("validate_gift_card", {
        p_code: giftCardCode.trim().toUpperCase(),
      });
      if (error || !data) {
        setGiftCardError(lang === "he" ? "לא ניתן לאמת את הכרטיס. נסה שוב." : lang === "fr" ? "Impossible de valider la carte. Réessayez." : "Unable to validate the card. Please try again.");
        return;
      }
      type GiftCardResult = { valid: boolean; error?: string; id?: string; code?: string; amount?: number; amount_used?: number; available_balance?: number; currency?: string };
      const result = data as GiftCardResult;
      if (!result.valid) {
        const msgs: Record<string, Record<string, string>> = {
          not_found: { en: "Gift card not found. Check the code and try again.", he: "כרטיס מתנה לא נמצא. בדוק את הקוד ונסה שוב.", fr: "Carte cadeau introuvable. Vérifiez le code." },
          invalid_status: { en: "This gift card cannot be used.", he: "לא ניתן להשתמש בכרטיס מתנה זה.", fr: "Cette carte cadeau n'est pas utilisable." },
          expired: { en: "This gift card has expired.", he: "כרטיס המתנה פג תוקפו.", fr: "Cette carte cadeau a expiré." },
          no_balance: { en: "This gift card has no remaining balance.", he: "אין יתרה בכרטיס מתנה זה.", fr: "Cette carte cadeau n'a plus de solde." },
        };
        const key = result.error || "not_found";
        setGiftCardError(msgs[key]?.[lang] || msgs.not_found.en);
        return;
      }
      setAppliedGiftCard({
        id: result.id!, code: result.code!,
        totalAmount: result.amount!, amountUsed: result.amount_used!,
        availableBalance: result.available_balance!, currency: result.currency!,
      });
      setGiftCardCode("");
    } catch {
      setGiftCardError(lang === "he" ? "שגיאה בבדיקת הכרטיס." : lang === "fr" ? "Erreur lors de la vérification." : "Error validating card.");
    } finally {
      setIsValidatingGiftCard(false);
    }
  }, [giftCardCode, lang]);

  const handleApplyPromo = useCallback(async () => {
    if (!promoCodeValue.trim()) return;
    if (!leadGuest.email.trim()) {
      setPromoError(lang === "he" ? "הזן/י קודם את האימייל שלך" : lang === "fr" ? "Renseigne d'abord ton email" : "Enter your email first");
      return;
    }
    setIsValidatingPromo(true);
    setPromoError(null);
    try {
      const { data, error } = await (supabase.rpc as any)("validate_promo_code", {
        p_code: promoCodeValue.trim().toUpperCase(),
        p_email: leadGuest.email.trim(),
      });
      if (error || !data) {
        setPromoError(lang === "he" ? "לא ניתן לאמת את הקוד. נסה שוב." : lang === "fr" ? "Impossible de valider le code. Réessayez." : "Unable to validate the code. Please try again.");
        return;
      }
      type PromoResult = { valid: boolean; error?: string; id?: string; code?: string; discount_pct?: number };
      const result = data as PromoResult;
      if (!result.valid) {
        const msgs: Record<string, Record<string, string>> = {
          not_found: { en: "Promo code not found.", he: "קוד הנחה לא נמצא.", fr: "Code promo introuvable." },
          inactive: { en: "This code is no longer active.", he: "קוד זה לא פעיל יותר.", fr: "Ce code n'est plus actif." },
          not_yet_valid: { en: "This code is not valid yet.", he: "הקוד עדיין לא תקף.", fr: "Code pas encore valide." },
          expired: { en: "This code has expired.", he: "תוקף הקוד פג.", fr: "Ce code a expiré." },
          max_uses_reached: { en: "This code has reached its maximum number of uses.", he: "הקוד הגיע למספר השימושים המרבי.", fr: "Code arrivé au nombre maximum d'utilisations." },
          already_used_by_email: { en: "You've already used this code.", he: "כבר השתמשת בקוד זה.", fr: "Tu as déjà utilisé ce code." },
          invalid_input: { en: "Invalid code or email.", he: "קוד או אימייל לא תקינים.", fr: "Code ou email invalide." },
        };
        const key = result.error || "not_found";
        setPromoError(msgs[key]?.[lang] || msgs.not_found.en);
        return;
      }
      setAppliedPromo({ id: result.id!, code: result.code!, discountPct: Number(result.discount_pct ?? 0) });
      setPromoCodeValue("");
    } catch {
      setPromoError(lang === "he" ? "שגיאה באימות הקוד." : lang === "fr" ? "Erreur lors de la vérification." : "Error validating code.");
    } finally {
      setIsValidatingPromo(false);
    }
  }, [promoCodeValue, leadGuest.email, lang]);

  const handleBook = useCallback(async () => {
    setIsBookingLoading(true);
    setPaymentStatus("creating");
    try {
      const { data, error } = await supabase.functions.invoke("process-standalone-payment", {
        body: {
          experience_id: state.experienceId,
          booking_date: state.selectedDate,
          time_slot: state.selectedSlot || null,
          adults: state.adults,
          children: state.children,
          customer_name: `${leadGuest.firstName.trim()} ${leadGuest.lastName.trim()}`,
          customer_email: leadGuest.email.trim(),
          customer_phone: leadGuest.phone.trim() || null,
          promo_code: appliedPromo ? {
            id: appliedPromo.id,
            code: appliedPromo.code,
            discount_pct: appliedPromo.discountPct,
            amount_discounted: promoDiscount,
          } : null,
          gift_card: appliedGiftCard && giftCardApplied > 0 ? {
            id: appliedGiftCard.id,
            code: appliedGiftCard.code,
            amount_to_apply: giftCardApplied,
            new_amount_used: appliedGiftCard.amountUsed + giftCardApplied,
            is_fully_redeemed: appliedGiftCard.amountUsed + giftCardApplied >= appliedGiftCard.totalAmount,
          } : null,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Impossible de créer la réservation.");
      // Cas carte cadeau couvre 100% : pas de widget Revolut, on va directement à la confirmation
      if (user) saveProfileFields(user.id, leadGuest).catch(() => {/* non-bloquant */});
      if (data.no_payment_required) {
        setBookingToken(data.confirmation_token);
        setPaymentStatus("paid");
        try {
          await supabase.functions.invoke("send-standalone-booking-confirmation", {
            body: { confirmation_token: data.confirmation_token },
          });
        } catch { /* non-bloquant */ }
        navigate(`/standalone-booking/confirmation/${data.confirmation_token}`);
        return;
      }
      setRevolutPublicId(data.revolut_public_id);
      setRevolutPublicKey(data.merchant_public_key);
      setRevolutEnvironment(data.environment ?? "dev");
      setBookingToken(data.confirmation_token);
      setPaymentStatus("idle");
      setPaymentDialogOpen(true);
    } catch (err: any) {
      setPaymentStatus("failed");
      setPaymentErrorMessage(err.message || "Impossible de créer la réservation.");
      toast.error(err.message || "Impossible de créer la réservation. Réessayez.");
    } finally {
      setIsBookingLoading(false);
    }
  }, [state, leadGuest, user, appliedPromo, promoDiscount, appliedGiftCard, giftCardApplied]);

  const handlePaymentSuccess = useCallback(async () => {
    setPaymentDialogOpen(false);
    setPaymentStatus("paid");
    if (!bookingToken) return;
    try {
      await supabase.functions.invoke("send-standalone-booking-confirmation", {
        body: { confirmation_token: bookingToken },
      });
    } catch {
      // non-blocking
    }
    toast.success(
      lang === "he" ? "התשלום התקבל! יוצר את ההזמנה..." :
      lang === "fr" ? "Paiement reçu ! Création de la réservation..." :
      "Payment received! Creating your booking...",
    );
    navigate(`/standalone-booking/confirmation/${bookingToken}`);
  }, [bookingToken, navigate, lang]);

  const handlePaymentError = useCallback((errorMessage: string) => {
    setPaymentDialogOpen(false);
    setPaymentStatus("failed");
    setPaymentErrorMessage(errorMessage || "Le paiement a échoué.");
    toast.error(errorMessage);
  }, []);

  const handlePaymentCancel = useCallback(() => {
    setPaymentDialogOpen(false);
    toast.info(
      lang === "he" ? "התשלום בוטל" :
      lang === "fr" ? "Paiement annulé" :
      "Payment cancelled",
    );
  }, [lang]);

  // ── Sidebar summary (réutilisé dans step 2 et step 3) ─────────────────
  const BookingSummaryCard = () => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3 mb-3">
        {state.heroImage && (
          <img
            src={state.heroImage}
            alt={expTitle}
            className="w-16 h-16 object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{expTitle}</p>
        </div>
      </div>
      <Separator className="mb-3" />
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.date}</span>
          <span className="font-medium text-right capitalize">{dateLabel}</span>
        </div>
        {state.selectedSlot && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.timeSlot}</span>
            <span className="font-medium">{state.selectedSlot}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.participants}</span>
          <span className="font-medium">{adultsLabel}{childrenLabel}</span>
        </div>
      </div>
      <Separator className="my-3" />
      {(promoDiscount > 0 || giftCardApplied > 0) && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {promoDiscount > 0 && (
            <div className="flex justify-between">
              <span>{appliedPromo?.code} (-{appliedPromo?.discountPct}%)</span>
              <span>-{currencySymbol}{promoDiscount}</span>
            </div>
          )}
          {giftCardApplied > 0 && (
            <div className="flex justify-between">
              <span>{appliedGiftCard?.code}</span>
              <span>-{currencySymbol}{giftCardApplied}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="font-bold" style={{ color: "#1A1814", fontSize: "18px" }}>{t.total}</span>
        <div className="text-right">
          {(promoDiscount > 0 || giftCardApplied > 0) && (
            <span className="text-sm text-muted-foreground line-through mr-2">
              {currencySymbol}{state.totalPrice.toFixed(0)}
            </span>
          )}
          <span className="font-bold" style={{ color: "#1A1814", fontSize: "18px" }}>
            {currencySymbol}{finalTotal.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background" dir={lang === "he" ? "rtl" : "ltr"}>
      <LaunchHeader forceScrolled />

      <main className="flex-1 w-full">

        {/* Barre supérieure avec progression — identique à Checkout.tsx */}
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate(`/standalone-experience/${state.experienceSlug}?context=launch`)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.backToSelection}
              </button>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                {t.secureCheckout}
              </div>
            </div>

            {/* Progress bar */}
            <div className={cn("flex items-center gap-2", lang === "he" && "flex-row-reverse")}>
              {[1, 2, 3].map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors",
                      s < step ? "bg-primary text-primary-foreground" :
                      s === step ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {s < step ? <Check className="h-4 w-4" /> : s}
                    </div>
                    <span className={cn(
                      "text-xs whitespace-nowrap",
                      s === step ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {[t.selection, ...stepLabels][i]}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={cn(
                      "flex-1 h-1 rounded-full transition-colors mt-[-1.25rem]",
                      s < step ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">

          {/* ═══ ÉTAPE 2 : Infos client ═══ */}
          {step === 2 && (
            <div className="grid md:grid-cols-[1fr_320px] gap-6">

              {/* Colonne gauche */}
              <div className="space-y-6">

                {/* Récap mobile */}
                <div className="md:hidden">
                  <BookingSummaryCard />
                </div>

                {/* Carte connexion — visible uniquement si non connecté */}
                {!user && (
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-3.5 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium leading-snug">
                          {lang === "fr" ? "Remplissez vos infos en un clic" : lang === "he" ? "מלא את הפרטים בלחיצה אחת" : "Fill in your details instantly"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lang === "fr" ? "Connectez-vous ou créez un compte pour gagner du temps à chaque réservation." : lang === "he" ? "התחבר או צור חשבון כדי לחסוך זמן בכל הזמנה." : "Sign in or create an account to save time on every booking."}
                        </p>
                      </div>
                    </div>
                    <div className={cn("flex gap-2", lang === "he" && "flex-row-reverse")}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        style={{ borderRadius: "0px", border: "1px solid #1A1814" }}
                        onClick={() => setAuthDialog({ open: true, tab: "login", context: "account" })}
                      >
                        {lang === "fr" ? "Se connecter" : lang === "he" ? "התחבר" : "Sign in"}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
                        style={{ borderRadius: "0px" }}
                        onClick={() => setAuthDialog({ open: true, tab: "signup", context: "signup" })}
                      >
                        {lang === "fr" ? "Créer un compte" : lang === "he" ? "צור חשבון" : "Create account"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Formulaire client */}
                <LeadGuestForm
                  value={leadGuest}
                  onChange={setLeadGuest}
                  lang={lang}
                  showErrors={showGuestErrors}
                />

                {/* Demandes spéciales */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t.specialRequests}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={guestSpecialRequests}
                      onChange={(e) => setGuestSpecialRequests(e.target.value)}
                      placeholder={t.specialRequestsPlaceholder}
                      rows={3}
                      style={{ ...inputStyle, resize: "none" }}
                    />
                  </CardContent>
                </Card>

                {/* Carte cadeau */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t.giftCard}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {appliedGiftCard ? (
                      <div className="flex items-center justify-between rounded px-3 py-2 bg-emerald-50 border border-emerald-200">
                        <span className="text-sm text-emerald-800 font-medium">
                          {appliedGiftCard.code} — -{currencySymbol}{giftCardApplied}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline ml-3"
                          onClick={() => setAppliedGiftCard(null)}
                        >
                          {lang === "fr" ? "Retirer" : lang === "he" ? "הסר" : "Remove"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            value={giftCardCode}
                            onChange={(e) => { setGiftCardCode(e.target.value); setGiftCardError(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyGiftCard()}
                            placeholder={t.giftCardPlaceholder}
                            style={inputStyle}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            style={{ borderRadius: "0px", border: "1px solid #1A1814" }}
                            disabled={isValidatingGiftCard || !giftCardCode.trim()}
                            onClick={handleApplyGiftCard}
                          >
                            {isValidatingGiftCard ? <Loader2 className="h-4 w-4 animate-spin" /> : t.apply}
                          </Button>
                        </div>
                        {giftCardError && <p className="text-sm text-destructive">{giftCardError}</p>}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Code promo */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t.promoCode}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between rounded px-3 py-2 bg-emerald-50 border border-emerald-200">
                        <span className="text-sm text-emerald-800 font-medium">
                          {appliedPromo.code} — -{appliedPromo.discountPct}%
                          {" "}(-{currencySymbol}{promoDiscount})
                        </span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline ml-3"
                          onClick={() => setAppliedPromo(null)}
                        >
                          {lang === "fr" ? "Retirer" : lang === "he" ? "הסר" : "Remove"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            value={promoCodeValue}
                            onChange={(e) => { setPromoCodeValue(e.target.value); setPromoError(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                            placeholder={t.promoCodePlaceholder}
                            style={inputStyle}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            style={{ borderRadius: "0px", border: "1px solid #1A1814" }}
                            disabled={isValidatingPromo || !promoCodeValue.trim()}
                            onClick={handleApplyPromo}
                          >
                            {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : t.apply}
                          </Button>
                        </div>
                        {promoError && <p className="text-sm text-destructive">{promoError}</p>}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Separator />

                {/* Navigation */}
                <div className={cn("flex gap-3 pt-2", lang === "he" && "flex-row-reverse")}>
                  <Button
                    variant="outline"
                    className="shrink-0"
                    style={{ height: "52px", borderRadius: "0px", border: "1px solid #1A1814" }}
                    onClick={() => navigate(`/standalone-experience/${state.experienceSlug}?context=launch`)}
                  >
                    {lang === "he" ? <ChevronRight className="h-4 w-4 ml-1" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
                    {t.back}
                  </Button>
                  <Button
                    className={cn(
                      "flex-1 uppercase tracking-[0.12em] text-[13px] transition-all duration-200",
                      isGuestValid
                        ? "bg-[#1A1814] text-white hover:bg-[#1A1814]/90 hover:scale-[1.01] cursor-pointer"
                        : "bg-[#C8C0B4] text-white cursor-not-allowed hover:bg-[#C8C0B4]"
                    )}
                    style={{ height: "52px", borderRadius: "0px" }}
                    disabled={!isGuestValid}
                    onClick={handleContinueToStep3}
                  >
                    {t.next}
                    {lang === "he" ? <ChevronLeft className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </div>

              {/* Colonne droite — sidebar sticky */}
              <div className="hidden md:block">
                <div className="sticky" style={{ top: "80px" }}>
                  <BookingSummaryCard />
                </div>
              </div>
            </div>
          )}

          {/* ═══ ÉTAPE 3 : Résumé & confirmation ═══ */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">

              {/* Détails de la réservation */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold">{t.bookingDetails}</p>
                <p className="text-sm font-medium">{expTitle}</p>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t.date}</span>
                    <p className="font-medium mt-0.5 capitalize">{dateLabel}</p>
                  </div>
                  {state.selectedSlot && (
                    <div>
                      <span className="text-muted-foreground">{t.timeSlot}</span>
                      <p className="font-medium mt-0.5">{state.selectedSlot}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t.participants}</span>
                    <p className="font-medium mt-0.5">{adultsLabel}{childrenLabel}</p>
                  </div>
                </div>
              </div>

              {/* Informations client */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold">{t.guestDetails}</p>
                <div className="text-xs space-y-1">
                  <p className="font-medium">{leadGuest.firstName} {leadGuest.lastName}</p>
                  <p className="text-muted-foreground">{leadGuest.email}</p>
                  {leadGuest.phone && <p className="text-muted-foreground">{leadGuest.phone}</p>}
                  {guestSpecialRequests.trim() && <p className="text-muted-foreground italic">{guestSpecialRequests.trim()}</p>}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                {(promoDiscount > 0 || giftCardApplied > 0) && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {promoDiscount > 0 && (
                      <div className="flex justify-between">
                        <span>{appliedPromo?.code} (-{appliedPromo?.discountPct}%)</span>
                        <span>-{currencySymbol}{promoDiscount}</span>
                      </div>
                    )}
                    {giftCardApplied > 0 && (
                      <div className="flex justify-between">
                        <span>{appliedGiftCard?.code}</span>
                        <span>-{currencySymbol}{giftCardApplied}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: "#1A1814", fontSize: "18px" }}>{t.total}</span>
                  <div className="text-right">
                    {(promoDiscount > 0 || giftCardApplied > 0) && (
                      <span className="text-sm text-muted-foreground line-through mr-2">
                        {currencySymbol}{state.totalPrice.toFixed(0)}
                      </span>
                    )}
                    <span className="font-bold" style={{ color: "#1A1814", fontSize: "18px" }}>
                      {currencySymbol}{finalTotal.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Erreur paiement */}
              {paymentStatus === "failed" && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <div>
                      <p className="font-semibold">{t.paymentFailed}</p>
                      <p className="text-sm mt-1">{paymentErrorMessage || t.paymentFailedMsg}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setPaymentStatus("idle"); setPaymentErrorMessage(null); }}
                    >
                      {lang === "he" ? "נסה שוב" : lang === "fr" ? "Réessayer" : "Try again"}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirmation paiement */}
              {paymentStatus === "paid" && (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    {t.paymentConfirmed}
                  </AlertDescription>
                </Alert>
              )}

              {/* Navigation — desktop */}
              <div className="pt-2 pb-8">
                <div className={cn("hidden md:flex gap-3", lang === "he" && "flex-row-reverse")}>
                  <Button
                    variant="outline"
                    className="shrink-0 uppercase tracking-[0.12em] text-[13px]"
                    style={{ height: "52px", borderRadius: "0px", border: "1px solid #1A1814", color: "#1A1814" }}
                    onClick={() => { setStep(2); setPaymentStatus("idle"); setPaymentErrorMessage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    {lang === "he" ? <ChevronRight className="h-4 w-4 ml-1" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
                    {t.back}
                  </Button>
                  <Button
                    className="flex-1 uppercase tracking-[0.12em] text-[13px] bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
                    style={{ height: "52px", borderRadius: "0px" }}
                    disabled={isBookingLoading || paymentStatus === "creating" || paymentStatus === "failed"}
                    onClick={handleBook}
                  >
                    {isBookingLoading || paymentStatus === "creating" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.preparingPayment}
                      </span>
                    ) : t.pay}
                  </Button>
                </div>

                {/* Navigation — mobile */}
                <div className="md:hidden space-y-3">
                  <Button
                    className="w-full uppercase tracking-[0.12em] text-[13px] bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
                    style={{ height: "52px", borderRadius: "0px" }}
                    disabled={isBookingLoading || paymentStatus === "creating" || paymentStatus === "failed"}
                    onClick={handleBook}
                  >
                    {isBookingLoading || paymentStatus === "creating" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.preparingPayment}
                      </span>
                    ) : t.pay}
                  </Button>
                  <button
                    className="w-full text-center text-[13px] py-2"
                    style={{ color: "#8C7B6B" }}
                    onClick={() => { setStep(2); setPaymentStatus("idle"); setPaymentErrorMessage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    ← {t.back}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer sécurité */}
      <div className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          🔒 {lang === "he" ? "הזמנה מאובטחת · לא תחויבו עד לאישור" : lang === "fr" ? "Réservation sécurisée · Aucun débit avant confirmation" : "Secure booking · No charge until confirmed"}
        </p>
      </div>

      {/* Dialog paiement Revolut — identique à Checkout.tsx */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent
          className="max-w-3xl w-[95vw] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t.securePayment}</DialogTitle>
            <DialogDescription>{t.securePaymentDesc}</DialogDescription>
          </DialogHeader>
          {revolutPublicId && (
            <RevolutPaymentWidget
              publicId={revolutPublicId}
              merchantPublicKey={revolutPublicKey}
              currency={state.currency}
              lang={lang}
              environment={revolutEnvironment}
              customerEmail={leadGuest.email}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onPaymentCancel={handlePaymentCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      <AuthPromptDialog
        open={authDialog.open}
        onOpenChange={(open) => setAuthDialog(prev => ({ ...prev, open }))}
        lang={lang}
        defaultTab={authDialog.tab}
        context={authDialog.context}
      />
    </div>
  );
}
