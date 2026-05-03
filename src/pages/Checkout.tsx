/**
 * Checkout page — Steps 2 (Guest Info) & 3 (Summary & Confirm)
 * Receives booking selections from BookingPanel2 via router state
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  trackCheckoutStep2Viewed,
  trackCheckoutStep3Viewed,
  trackBookingCompleted,
  trackPaymentFailed,
  trackBookingAbandoned,
  trackFormFieldInteracted,
  trackCheckoutContinueClicked,
  trackCheckoutBackClicked,
  trackAdditionalInfoExpanded,
  trackSpecialRequestTyped,
  trackPaymentInitiated,
} from "@/lib/analytics";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Info, Check, Clock, Loader2, MessageSquare, Sparkles, ShieldCheck, Gift, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DualPrice } from "@/components/ui/DualPrice";
import { PriceBreakdownV2 } from "@/components/experience/PriceBreakdownV2";
import { LeadGuestForm, EMPTY_LEAD_GUEST, sanitizeLeadGuest, saveProfileFields, type LeadGuestData } from "@/components/experience/LeadGuestForm";
import { BookingConfirmationDialog, type BookingConfirmationData } from "@/components/experience/BookingConfirmationDialog";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useExperience2Price } from "@/hooks/useExperience2Price";
import { preBook, createBooking } from "@/services/hyperguest";
import { createRevolutOrder, refundRevolutOrder } from "@/services/revolut";
import RevolutPaymentWidget from "@/components/experience/RevolutPaymentWidget";
import { extractTaxBreakdown } from "@/utils/taxesDisplay";
import { analyzeCancellationPolicies } from "@/utils/cancellationPolicy";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import LaunchHeader from "@/components/LaunchHeader";
import { useQuery } from "@tanstack/react-query";

interface SelectedExtra {
  id: string;
  name: string;
  name_he: string | null;
  price: number;
  currency: string;
  pricing_type: string;
  quantity?: number;
}

export interface CheckoutState {
  experienceId: string;
  experienceTitle: string;
  hotelId: string;
  hotelName: string;
  hyperguestPropertyId: string;
  currency: string;
  lang: "en" | "he" | "fr";
  adults: number;
  childrenAges: number[];
  dateRange: { from: string; to: string };
  nights: number;
  selectedRoomId: number;
  selectedRatePlanId: number;
  selectedRoomName: string;
  selectedRatePlan: any;
  propertyRemarks: string[];
  selectedExtras: SelectedExtra[];
  searchParams: any;
  experienceSlug: string;
}

const hgErrorMessages: Record<string, Record<string, string>> = {
  'BN.402': {
    en: "The price has changed since your search. Please search again.",
    he: "המחיר השתנה מאז החיפוש שלך. אנא חפש שוב.",
    fr: "Le prix a changé depuis votre recherche. Veuillez relancer une recherche.",
  },
  'BN.502': {
    en: "This room is no longer available. Please choose another option.",
    he: "החדר אינו זמין עוד. אנא בחר אפשרות אחרת.",
    fr: "Cette chambre n'est plus disponible. Veuillez choisir une autre option.",
  },
  'BN.506': {
    en: "Processing error. Please try again or contact support.",
    he: "שגיאת עיבוד. אנא נסה שוב או פנה לתמיכה.",
    fr: "Erreur de traitement. Veuillez réessayer ou contacter le support.",
  },
  'BN.507': {
    en: "Payment could not be processed. Please check your card details.",
    he: "התשלום לא בוצע. אנא בדק את פרטי הכרטיס.",
    fr: "Le paiement n'a pas pu être traité. Vérifiez vos informations de carte.",
  },
};

type CheckoutStep = 2 | 3;

const CART_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const routerState = location.state as CheckoutState | null;

  const state = React.useMemo(() => {
    if (routerState) return routerState;
    try {
      const saved = localStorage.getItem("staymakom_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : 0;
        if (Date.now() - savedAt > CART_TTL_MS) {
          localStorage.removeItem("staymakom_cart");
          toast.info("Your saved escape has expired. Please start a new search.");
          return null;
        }
        return parsed as CheckoutState;
      }
    } catch {}
    return null;
  }, [routerState]);

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  return <CheckoutContent state={state} />;
}

function CheckoutContent({ state }: { state: CheckoutState }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const lang = state.lang;

  const t = {
    en: {
      step2Title: "Guest information",
      step3Title: "Review & confirm",
      back: "Back",
      next: "Continue",
      book: "CONFIRM BOOKING",
      summary: "Booking summary",
      guestDetails: "Guest details",
      stayDetails: "Stay details",
      dates: "Dates",
      room: "Room",
      nightsLabel: "Nights",
      guestsLabel: "Guests",
      total: "Total",
      specialRequests: "Special requests",
      importantNotices: "Important notices",
      fillGuestInfo: "Please fill in guest information (name, email, phone)",
      bookingError: "Booking failed. Your information has been saved — please try again.",
      onRequestWarning: "This booking is subject to hotel confirmation. You will be notified of the status.",
      verifying: "Preparing your booking...",
      booking: "Booking...",
      bookingLong: "Confirmation in progress, please wait...",
      bookingVeryLong: "Taking longer than expected. Do not close this page...",
      priceChanged: "Price has changed",
      backToSelection: "Back to selection",
      secureCheckout: "Secure checkout",
      giftCard: "Have a gift card?",
      giftCardApply: "Apply",
      giftCardApplied: "Gift card applied",
      giftCardCoveredFull: "Your gift card covers the full amount — no payment required.",
      giftCardDiscount: "Gift card",
    },
    he: {
      step2Title: "פרטי אורח",
      step3Title: "סיכום ואישור",
      back: "חזרה",
      next: "המשך",
      book: "אשר הזמנה",
      summary: "סיכום הזמנה",
      guestDetails: "פרטי אורח",
      stayDetails: "פרטי שהייה",
      dates: "תאריכים",
      room: "חדר",
      nightsLabel: "לילות",
      guestsLabel: "אורחים",
      total: "סה\"כ",
      specialRequests: "בקשות מיוחדות",
      importantNotices: "הערות חשובות",
      fillGuestInfo: "אנא מלא פרטי אורח (שם, אימייל, טלפון)",
      bookingError: "ההזמנה נכשלה. הפרטים שלך נשמרו — אנא נסה שוב.",
      onRequestWarning: "הזמנה זו כפופה לאישור המלון. תקבל/י עדכון על הסטטוס.",
      verifying: "...מכין את ההזמנה",
      booking: "...מזמין",
      bookingLong: "...אישור בתהליך, אנא המתן",
      bookingVeryLong: "...לוקח יותר זמן מהצפוי. אל תסגור את הדף",
      priceChanged: "המחיר השתנה",
      backToSelection: "חזרה לבחירה",
      secureCheckout: "הזמנה מאובטחת",
      giftCard: "יש לך כרטיס מתנה?",
      giftCardApply: "הפעל",
      giftCardApplied: "כרטיס מתנה הופעל",
      giftCardCoveredFull: "כרטיס המתנה שלך מכסה את כל הסכום — אין צורך בתשלום.",
      giftCardDiscount: "כרטיס מתנה",
    },
    fr: {
      step2Title: "Informations voyageur",
      step3Title: "Résumé & confirmation",
      back: "Retour",
      next: "Continuer",
      book: "CONFIRMER LA RÉSERVATION",
      summary: "Résumé de la réservation",
      guestDetails: "Détails voyageur",
      stayDetails: "Détails du séjour",
      dates: "Dates",
      room: "Chambre",
      nightsLabel: "Nuits",
      guestsLabel: "Voyageurs",
      total: "Total",
      specialRequests: "Demandes spéciales",
      importantNotices: "Remarques importantes",
      fillGuestInfo: "Veuillez remplir les informations voyageur (nom, email, téléphone)",
      bookingError: "La réservation a échoué. Vos informations ont été conservées — veuillez réessayer.",
      onRequestWarning: "Cette réservation est soumise à confirmation par l'hôtel. Vous serez notifié du statut.",
      verifying: "Préparation de votre réservation...",
      booking: "Réservation en cours...",
      bookingLong: "Confirmation en cours, veuillez patienter...",
      bookingVeryLong: "La réservation prend plus de temps que prévu. Ne fermez pas cette page...",
      priceChanged: "Le prix a changé",
      backToSelection: "Retour à la sélection",
      secureCheckout: "Paiement sécurisé",
      giftCard: "Vous avez une carte cadeau ?",
      giftCardApply: "Appliquer",
      giftCardApplied: "Carte cadeau appliquée",
      giftCardCoveredFull: "Votre carte cadeau couvre le montant total — aucun paiement requis.",
      giftCardDiscount: "Carte cadeau",
    },
  }[lang];

  const [step, setStep] = useState<CheckoutStep>(2);
  const [leadGuest, setLeadGuest] = useState<LeadGuestData>(() => {
    try {
      const saved = sessionStorage.getItem("staymakom_guest");
      if (saved) return JSON.parse(saved);
    } catch {}
    return EMPTY_LEAD_GUEST;
  });
  const [specialRequests, setSpecialRequests] = useState("");
  const [showGuestErrors, setShowGuestErrors] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState<"idle" | "prebook" | "booking">("idle");
  const [bookingElapsed, setBookingElapsed] = useState(0);
  const [confirmationData, setConfirmationData] = useState<BookingConfirmationData | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [revolutPublicId, setRevolutPublicId] = useState<string | null>(null);
  const [revolutOrderId, setRevolutOrderId] = useState<string | null>(null);
  const [revolutEnvironment, setRevolutEnvironment] = useState<"production" | "dev" | null>(null);
  const [revolutMerchantPublicKey, setRevolutMerchantPublicKey] = useState<string | null>(null);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "creating" | "ready" | "paid" | "failed">("idle");
  const [isPreBooking, setIsPreBooking] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    id: string;
    code: string;
    totalAmount: number;
    amountUsed: number;
    availableBalance: number;
    currency: string;
  } | null>(null);
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const pendingBookAfterAuth = useRef(false);
  const bookingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const specialRequestTrackedRef = useRef(false);
  // Garde-fou anti-double-déclenchement de l'auto-booking (l'effet ci-dessous se relance
  // si paymentStatus ou isBooking changent — on veut ne déclencher qu'UNE fois par paiement).
  const autoBookTriggeredRef = useRef(false);

  useEffect(() => {
    if (leadGuest.firstName || leadGuest.email) {
      sessionStorage.setItem("staymakom_guest", JSON.stringify(leadGuest));
    }
  }, [leadGuest]);

  const dateFrom = new Date(state.dateRange.from);
  const dateTo = new Date(state.dateRange.to);
  const totalPartySize = state.adults + state.childrenAges.length;

  const ratePlanPrices = state.selectedRatePlan?.prices || null;
  const priceBreakdown = useExperience2Price(state.experienceId, null, state.currency, state.nights, state.adults, ratePlanPrices);
  // Source de vérité de la devise : la devise du rate plan HyperGuest (extraite par
  // priceBreakdown). C'est elle qui est utilisée pour facturer côté Revolut et afficher
  // dans le widget — sinon mismatch entre le total affiché et le montant débité.
  const effectiveCurrency = priceBreakdown?.currency || state.currency || "ILS";

  const { data: experienceHeroImage } = useQuery({
    queryKey: ["experience2-hero", state.experienceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("experiences2")
        .select("hero_image")
        .eq("id", state.experienceId)
        .single();
      return data?.hero_image || null;
    },
  });

  const extrasTotal = useMemo(() => {
    return state.selectedExtras.reduce((sum, extra) => {
      return sum + extra.price * (extra.quantity || 1);
    }, 0);
  }, [state.selectedExtras]);

  const displayTotal = (priceBreakdown?.finalTotal ?? 0) + extrasTotal;
  const totalIsNaN = Number.isNaN(displayTotal);
  const isOnRequest = state.selectedRatePlan?.isImmediate === false;

  const giftCardApplied = appliedGiftCard
    ? Math.min(appliedGiftCard.availableBalance, displayTotal)
    : 0;
  const amountAfterGiftCard = Math.max(0, displayTotal - giftCardApplied);

  const isGuestValid = leadGuest.firstName.trim() !== "" &&
    leadGuest.lastName.trim() !== "" &&
    leadGuest.email.trim() !== "" &&
    leadGuest.phone.trim() !== "";

  // Progressive booking timer
  useEffect(() => {
    if (isBooking) {
      setBookingElapsed(0);
      bookingTimerRef.current = setInterval(() => {
        setBookingElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (bookingTimerRef.current) {
        clearInterval(bookingTimerRef.current);
        bookingTimerRef.current = null;
      }
      setBookingElapsed(0);
    }
    return () => {
      if (bookingTimerRef.current) clearInterval(bookingTimerRef.current);
    };
  }, [isBooking]);

  const getBookingMessage = () => {
    if (bookingStep === "prebook") return t.verifying;
    if (bookingElapsed > 30) return t.bookingVeryLong;
    if (bookingElapsed > 10) return t.bookingLong;
    return t.booking;
  };

  // Track step views
  useEffect(() => {
    if (step === 2) trackCheckoutStep2Viewed(state.experienceSlug, displayTotal);
    if (step === 3) trackCheckoutStep3Viewed(state.experienceSlug, displayTotal);
  }, [step]);

  // Track booking abandonment
  const bookingCompletedRef = useRef(false);
  useEffect(() => {
    const start = Date.now();
    return () => {
      if (!bookingCompletedRef.current) {
        const seconds = (Date.now() - start) / 1000;
        trackBookingAbandoned(
          state.experienceSlug,
          step === 3 ? "step3" : "step2",
          displayTotal,
          seconds
        );
      }
    };
  }, []);

  // Form field tracking
  const trackedFields = useRef(new Set<string>());
  const handleFieldFocus = (fieldName: string) => {
    if (!trackedFields.current.has(fieldName)) {
      trackedFields.current.add(fieldName);
      trackFormFieldInteracted(fieldName);
    }
  };

  const pendingContinueAfterAuth = useRef(false);
  const savedFormDataRef = useRef<{ leadGuest: LeadGuestData; specialRequests: string } | null>(null);

  // ATOMICITÉ : déclenche automatiquement la création de la résa HG dès que le
  // paiement Revolut passe à "paid". Utilise un useEffect (et pas un setTimeout dans
  // onPaymentSuccess) pour échapper aux problèmes de closure React qui figeraient
  // une ancienne version de handleBookInternal (avec paymentStatus="ready" closuré).
  useEffect(() => {
    if (paymentStatus !== "paid") {
      autoBookTriggeredRef.current = false;
      return;
    }
    if (autoBookTriggeredRef.current) return;
    if (isBooking) return;
    if (bookingCompletedRef.current) return;

    autoBookTriggeredRef.current = true;
    if (!user) {
      savedFormDataRef.current = { leadGuest, specialRequests };
      pendingBookAfterAuth.current = true;
      setShowAuthPrompt(true);
    } else {
      handleBookInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, isBooking, user]);

  useEffect(() => {
    if (!user) return;
    if (pendingBookAfterAuth.current) {
      pendingBookAfterAuth.current = false;
      setTimeout(() => handleBookInternal(), 500);
    }
    if (pendingContinueAfterAuth.current) {
      pendingContinueAfterAuth.current = false;
      if (savedFormDataRef.current) {
        setLeadGuest(savedFormDataRef.current.leadGuest);
        setSpecialRequests(savedFormDataRef.current.specialRequests);
      }
      setTimeout(() => handleContinueToStep3(), 500);
    }
  }, [user]);

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setIsValidatingGiftCard(true);
    setGiftCardError(null);
    try {
      const { data, error } = await supabase.rpc("validate_gift_card", {
        p_code: giftCardCode.trim().toUpperCase(),
      });
      if (error || !data) {
        setGiftCardError(
          lang === "he" ? "לא ניתן לאמת את הכרטיס. נסה שוב."
          : lang === "fr" ? "Impossible de valider la carte. Réessayez."
          : "Unable to validate the card. Please try again."
        );
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
        id: result.id!,
        code: result.code!,
        totalAmount: result.amount!,
        amountUsed: result.amount_used!,
        availableBalance: result.available_balance!,
        currency: result.currency!,
      });
      setGiftCardCode("");
    } catch {
      setGiftCardError(
        lang === "he" ? "שגיאה בבדיקת הכרטיס."
        : lang === "fr" ? "Erreur lors de la vérification."
        : "Error validating card."
      );
    } finally {
      setIsValidatingGiftCard(false);
    }
  };

  const handleBook = () => {
    // Avec l'embedded checkout, le widget Revolut a ses propres boutons "Pay" par
    // méthode (Revolut Pay, Carte, Google Pay). Ce bouton "Confirm Booking" ne sert
    // donc QUE pour les cas où aucun paiement n'est requis :
    //   - Gift card couvre 100% du montant → paymentStatus = "paid" directement
    //   - Edge case : paiement déjà validé mais auto-booking n'a pas été déclenché
    if (!user) {
      savedFormDataRef.current = { leadGuest, specialRequests };
      pendingBookAfterAuth.current = true;
      setShowAuthPrompt(true);
      return;
    }
    handleBookInternal();
  };

  const handleBookInternal = async () => {
    if (isBooking) return;
    if (paymentStatus !== "paid") {
      toast.error(lang === "he" ? "יש להשלים את התשלום תחילה" : "Please complete payment first");
      return;
    }

    trackPaymentInitiated(state.experienceSlug, displayTotal, state.currency);
    setIsBooking(true);
    setBookingStep("booking");

    try {
      const checkIn = state.dateRange.from;
      const checkOut = state.dateRange.to;

      const expectedAmount = state.selectedRatePlan.payment?.chargeAmount?.price
        ?? state.selectedRatePlan.prices?.sell?.price
        ?? state.selectedRatePlan.prices?.sell?.amount
        ?? 0;
      const expectedCurrency = state.selectedRatePlan.payment?.chargeAmount?.currency
        ?? state.selectedRatePlan.prices?.sell?.currency
        ?? "EUR";

      const staymakomRef = `SM-${state.experienceId.substring(0, 8).toUpperCase()}-${Date.now()}`;
      const safe = sanitizeLeadGuest(leadGuest);

      // Save profile fields on booking
      if (user) {
        saveProfileFields(user.id, leadGuest);
      }

      const adultGuests = [
        {
          birthDate: safe.birthDate,
          title: safe.title,
          name: { first: safe.firstName, last: safe.lastName },
        },
        ...Array.from({ length: Math.max(0, state.adults - 1) }, (_, i) => ({
          birthDate: "1990-01-01",
          title: "MR" as const,
          name: { first: `Guest`, last: `${i + 2}` },
        })),
      ];

      const childGuests = state.childrenAges.map((age, i) => ({
        birthDate: `${new Date().getFullYear() - age}-01-01`,
        title: "C" as const,
        name: { first: `Child`, last: `${i + 1}` },
      }));

      const bookingData = {
        dates: { from: checkIn, to: checkOut },
        propertyId: parseInt(state.hyperguestPropertyId),
        leadGuest: {
          birthDate: safe.birthDate,
          title: safe.title,
          name: { first: safe.firstName, last: safe.lastName },
          contact: {
            address: safe.address,
            city: safe.city,
            country: safe.country,
            email: safe.email,
            phone: safe.phone,
            state: "N/A",
            zip: "00000",
          },
        },
        reference: { agency: staymakomRef },
        rooms: [{
          roomId: state.selectedRoomId,
          ratePlanId: state.selectedRatePlanId,
          expectedPrice: { amount: expectedAmount, currency: expectedCurrency },
          specialRequests: specialRequests || undefined,
          guests: [...adultGuests, ...childGuests],
        }],
        idempotencyKey: idempotencyKeyRef.current,
      };

      const bookingResult = await createBooking(bookingData);
      const hgBookingId = bookingResult.id || bookingResult.bookingId || "";
      const hgStatus = bookingResult.status || "Confirmed";
      const sellPrice = bookingResult.totalPrice?.amount ?? expectedAmount;
      const bookingCurrency = bookingResult.totalPrice?.currency ?? expectedCurrency;

      const currentSession = await supabase.auth.getSession();
      const currentUserId = currentSession.data.session?.user?.id || null;
      const confirmationToken = crypto.randomUUID();

      const { error: dbError } = await supabase.from("bookings_hg").insert({
        hg_booking_id: hgBookingId,
        hotel_id: state.hotelId,
        experience_id: state.experienceId,
        checkin: checkIn,
        checkout: checkOut,
        nights: state.nights,
        party_size: totalPartySize,
        sell_price: sellPrice,
        net_price: 0,
        commission_amount: priceBreakdown?.totalCommissions ?? 0,
        currency: bookingCurrency,
        status: hgStatus.toLowerCase(),
        hg_status: hgStatus,
        board_type: state.selectedRatePlan?.board || "RO",
        room_code: String(state.selectedRoomId),
        room_name: state.selectedRoomName,
        rate_plan: String(state.selectedRatePlanId),
        customer_name: `${leadGuest.firstName} ${leadGuest.lastName}`,
        customer_email: leadGuest.email,
        hg_raw_data: bookingResult,
        user_id: currentUserId,
        confirmation_token: confirmationToken,
        idempotency_key: idempotencyKeyRef.current,
        revolut_order_id: revolutOrderId,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      } as any);

      if (appliedGiftCard && giftCardApplied > 0) {
        try {
          const newAmountUsed = appliedGiftCard.amountUsed + giftCardApplied;
          const isFullyRedeemed = newAmountUsed >= appliedGiftCard.totalAmount;
          await supabase.from("gift_cards").update({
            amount_used: newAmountUsed,
            status: isFullyRedeemed ? "redeemed" : "sent",
            ...(isFullyRedeemed ? { redeemed_at: new Date().toISOString() } : {}),
          }).eq("id", appliedGiftCard.id);
        } catch {
          // Non-bloquant : la réservation est confirmée même si la mise à jour échoue
        }
      }

      const certCancelInfo = analyzeCancellationPolicies(
        state.selectedRatePlan?.cancellationPolicies,
        checkIn
      );
      const refundLabel = certCancelInfo?.isNonRefundable
        ? 'Non-refundable'
        : `Fully refundable${certCancelInfo?.effectiveDeadline ? ` (free cancellation until ${certCancelInfo.effectiveDeadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})` : ''}`;

      const taxBreakdown = extractTaxBreakdown(state.selectedRatePlan);
      const allRemarks = [
        ...state.propertyRemarks,
        ...(state.selectedRatePlan?.remarks || []),
      ].filter((r: string) => !/general message that should be shown/i.test(r));

      setConfirmationData({
        hgBookingId,
        status: hgStatus,
        hotelName: state.hotelName || "Hotel",
        roomName: state.selectedRoomName,
        boardType: state.selectedRatePlan?.board || "RO",
        checkIn,
        checkOut,
        nights: state.nights,
        partySize: totalPartySize,
        sellPrice,
        currency: bookingCurrency,
        remarks: allRemarks,
        specialRequests,
        experienceTitle: state.experienceTitle || "Experience",
        staymakomRef,
        displayTaxesTotal: taxBreakdown.totalDisplayAmount,
        isOnRequest: state.selectedRatePlan?.isImmediate === false,
        confirmationToken,
      });
      setShowConfirmation(true);
      bookingCompletedRef.current = true;

      trackBookingCompleted(staymakomRef, state.experienceSlug, sellPrice, bookingCurrency, state.nights, totalPartySize, 0, state.experienceTitle || '', state.selectedRoomName || '');

      try { localStorage.removeItem("staymakom_cart"); sessionStorage.removeItem("staymakom_guest"); } catch {}

      try {
        const emailCancellation = analyzeCancellationPolicies(
          state.selectedRatePlan?.cancellationPolicies,
          checkIn,
          lang,
        );
        await supabase.functions.invoke("send-booking-confirmation", {
          body: {
            to: leadGuest.email,
            guestName: `${leadGuest.firstName} ${leadGuest.lastName}`,
            experienceTitle: state.experienceTitle,
            hotelName: state.hotelName,
            roomName: state.selectedRoomName,
            boardType: state.selectedRatePlan?.board || "RO",
            checkIn,
            checkOut,
            nights: state.nights,
            partySize: totalPartySize,
            totalPrice: sellPrice,
            currency: bookingCurrency,
            bookingRef: staymakomRef,
            hgBookingId,
            remarks: allRemarks,
            specialRequests,
            lang,
            displayTaxesTotal: taxBreakdown.totalDisplayAmount,
            confirmationToken,
            cancellationPolicy: {
              summaryText: emailCancellation.summaryText,
              isNonRefundable: emailCancellation.isNonRefundable,
              deadline: emailCancellation.effectiveDeadline?.toISOString() || null,
            },
          },
        });
      } catch (emailError) {
        // Error handled silently
      }
    } catch (error: any) {
      const detail = error?.message || "";
      const codeMatch = detail.match(/BN\.\d+/);
      const errorCode = codeMatch?.[0] || "";
      const friendlyMsg = hgErrorMessages[errorCode]?.[lang];

      const errorType = errorCode.startsWith("BN.5") ? "hg_error" : errorCode === "BN.402" ? "payment_declined" : "network";
      trackPaymentFailed(state.experienceSlug, errorType, detail.substring(0, 200), displayTotal);

      if (revolutOrderId && paymentStatus === "paid") {
        try {
          await refundRevolutOrder(revolutOrderId);
          toast.error(lang === "he" ? "ההזמנה נכשלה. התשלום יוחזר אליך." : "Booking failed. Your payment will be refunded.", { duration: 10000 });
        } catch {
          toast.error(lang === "he" ? `ההזמנה נכשלה. צור קשר לקבלת החזר. Ref: ${revolutOrderId}` : `Booking failed. Contact support for refund. Ref: ${revolutOrderId}`, { duration: 15000 });
        }
      } else {
        toast.error(t.bookingError, {
          description: friendlyMsg || (detail.length > 120 ? detail.substring(0, 120) + "…" : detail || undefined),
          duration: 8000,
        });
      }
    } finally {
      setIsBooking(false);
      setBookingStep("idle");
    }
  };

  const goBackToExperience = () => {
    navigate(`/experience2/${state.experienceSlug}?lang=${lang}&context=launch`);
  };

  // Crée un nouvel ordre Revolut quand un paiement précédent a échoué.
  // L'ordre Revolut précédent est probablement dans un état terminal (failed/declined),
  // donc on en crée un neuf avec le même montant + devise.
  const handleRetryPayment = async () => {
    if (isRetryingPayment) return;
    if (amountAfterGiftCard === 0) return; // Pas de paiement à refaire si déjà couvert
    setIsRetryingPayment(true);
    setPaymentErrorMessage(null);
    setPaymentStatus("creating");
    setRevolutPublicId(null);
    setRevolutOrderId(null);
    setRevolutEnvironment(null);
    setRevolutMerchantPublicKey(null);
    try {
      const order = await createRevolutOrder({
        amount: amountAfterGiftCard,
        currency: effectiveCurrency,
        description: `StayMakom — ${state.experienceTitle}`,
        customerEmail: leadGuest.email,
        customerName: `${leadGuest.firstName} ${leadGuest.lastName}`,
      });
      setRevolutPublicId(order.publicId);
      setRevolutOrderId(order.orderId);
      setRevolutEnvironment(order.environment);
      setRevolutMerchantPublicKey(order.merchantPublicKey || null);
      setPaymentStatus("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create new payment order";
      setPaymentErrorMessage(msg);
      setPaymentStatus("failed");
      toast.error(msg);
    } finally {
      setIsRetryingPayment(false);
    }
  };

  const handleContinueToStep3 = async () => {
    if (!isGuestValid) {
      setShowGuestErrors(true);
      toast.error(t.fillGuestInfo);
      return;
    }
    if (!user) {
      savedFormDataRef.current = { leadGuest, specialRequests };
      pendingContinueAfterAuth.current = true;
      setShowAuthPrompt(true);
      return;
    }
    if (user) {
      saveProfileFields(user.id, leadGuest);
    }
    trackCheckoutContinueClicked(state.experienceSlug, displayTotal);

    setIsPreBooking(true);
    setPaymentStatus("creating");

    try {
      const checkIn = state.dateRange.from;
      const checkOut = state.dateRange.to;
      const expectedAmount = state.selectedRatePlan.payment?.chargeAmount?.price
        ?? state.selectedRatePlan.prices?.sell?.price
        ?? state.selectedRatePlan.prices?.sell?.amount
        ?? 0;
      const expectedCurrency = state.selectedRatePlan.payment?.chargeAmount?.currency
        ?? state.selectedRatePlan.prices?.sell?.currency
        ?? "EUR";

      const preBookData = {
        search: {
          dates: { from: checkIn, to: checkOut },
          propertyId: parseInt(state.hyperguestPropertyId),
          nationality: leadGuest.country || "IL",
          pax: [{ adults: state.adults, children: state.childrenAges }],
        },
        rooms: [{
          roomId: state.selectedRoomId,
          ratePlanId: state.selectedRatePlanId,
          expectedPrice: { amount: expectedAmount, currency: expectedCurrency },
        }],
      };

      const preBookResult = await preBook(preBookData);
      const roomResult = preBookResult.rooms?.[0];
      if (roomResult?.priceChange) {
        const { fromAmount, toAmount } = roomResult.priceChange;
        const priceDiff = toAmount.amount - fromAmount.amount;
        const priceDiffPercent = Math.round((priceDiff / fromAmount.amount) * 100);
        toast.warning(
          `${t.priceChanged}: ${fromAmount.amount} ${fromAmount.currency} → ${toAmount.amount} ${toAmount.currency} (${priceDiff > 0 ? '+' : ''}${priceDiffPercent}%)`,
          { duration: 8000 }
        );
        setIsPreBooking(false);
        setPaymentStatus("idle");
        return;
      }

      if (amountAfterGiftCard === 0) {
        setRevolutPublicId(null);
        setRevolutOrderId(null);
        setRevolutEnvironment(null);
        setRevolutMerchantPublicKey(null);
        setPaymentStatus("paid");
      } else {
        const order = await createRevolutOrder({
          amount: amountAfterGiftCard,
          currency: effectiveCurrency,
          description: `StayMakom — ${state.experienceTitle}`,
          customerEmail: leadGuest.email,
          customerName: `${leadGuest.firstName} ${leadGuest.lastName}`,
        });
        setRevolutPublicId(order.publicId);
        setRevolutOrderId(order.orderId);
        setRevolutEnvironment(order.environment);
        setRevolutMerchantPublicKey(order.merchantPublicKey || null);
        setPaymentStatus("ready");
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast.error(err.message || "Failed to prepare payment");
      setPaymentStatus("idle");
    } finally {
      setIsPreBooking(false);
    }
  };

  const stepLabels = [t.step2Title, t.step3Title];

  // Booking summary card component — reused in step 2 sidebar and step 3
  const BookingSummaryCard = ({ compact = false }: { compact?: boolean }) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3 mb-3">
        {experienceHeroImage && (
          <img
            src={experienceHeroImage}
            alt={state.experienceTitle}
            className="w-16 h-16 object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{state.experienceTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{state.hotelName}</p>
        </div>
      </div>
      {/* Full breakdown */}
      <PriceBreakdownV2
        breakdown={priceBreakdown}
        isLoading={false}
        lang={lang}
        ratePlanPrices={ratePlanPrices}
        selectedExtras={state.selectedExtras.length > 0 ? state.selectedExtras : undefined}
        extrasTotal={extrasTotal}
        adults={state.adults}
        nights={state.nights}
        showFullBreakdown
        hotelName={state.hotelName}
        roomName={state.selectedRoomName}
        dateLabel={`${format(dateFrom, "dd MMM")} → ${format(dateTo, "dd MMM yyyy")} · ${state.nights} ${state.nights === 1 ? (lang === "he" ? "לילה" : "night") : (lang === "he" ? "לילות" : "nights")}`}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <LaunchHeader forceScrolled />

      <main className="flex-1 w-full">
        {/* Top bar with secure checkout + progress */}
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goBackToExperience}
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
            <div className={cn("flex items-center gap-2", lang === 'he' && "flex-row-reverse")}>
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
                      {[lang === 'he' ? 'בחירה' : 'Selection', ...stepLabels][i]}
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

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">

          {/* ═══ STEP 2: Guest Info ═══ */}
          {step === 2 && (
            <div className="grid md:grid-cols-[1fr_320px] gap-6">
              {/* Left — form */}
              <div className="space-y-6">
                {/* Mobile recap */}
                <div className="md:hidden">
                  <BookingSummaryCard compact />
                </div>

                {/* Guest form */}
                <LeadGuestForm value={leadGuest} onChange={setLeadGuest} lang={lang} showErrors={showGuestErrors} />

                <Separator />

                {/* Special requests */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4" />
                    {t.specialRequests}
                  </div>
                  <Textarea
                    placeholder={lang === "he" ? "כתבו כאן בקשות מיוחדות (אופציונלי)..." : lang === "fr" ? "Écrivez vos demandes spéciales ici (optionnel)..." : "Write any special requests here (optional)..."}
                    value={specialRequests}
                    onChange={(e) => {
                      setSpecialRequests(e.target.value);
                      if (!specialRequestTrackedRef.current && e.target.value.length > 0) {
                        specialRequestTrackedRef.current = true;
                        trackSpecialRequestTyped(state.experienceSlug);
                      }
                    }}
                    className="min-h-[60px] text-sm resize-none"
                    style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D4', borderRadius: '0px' }}
                    rows={2}
                  />
                </div>

                {/* Gift card */}
                <div className="space-y-2 pt-1">
                  {!appliedGiftCard ? (
                    <>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer" onClick={() => setGiftCardError(null)}>
                        <Gift className="h-4 w-4" />
                        {t.giftCard}
                      </p>
                      <div className={cn("flex gap-2", lang === 'he' && "flex-row-reverse")}>
                        <Input
                          placeholder="MK-XXXX-XXXX"
                          value={giftCardCode}
                          onChange={(e) => { setGiftCardCode(e.target.value.toUpperCase()); setGiftCardError(null); }}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyGiftCard()}
                          className="font-mono tracking-wider text-sm"
                          style={{ borderRadius: '0px', backgroundColor: '#F5F0E8', border: '1px solid #E8E0D4' }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          style={{ borderRadius: '0px', border: '1px solid #1A1814' }}
                          onClick={handleApplyGiftCard}
                          disabled={isValidatingGiftCard || !giftCardCode.trim()}
                        >
                          {isValidatingGiftCard ? <Loader2 className="h-4 w-4 animate-spin" /> : t.giftCardApply}
                        </Button>
                      </div>
                      {giftCardError && <p className="text-sm text-destructive">{giftCardError}</p>}
                    </>
                  ) : (
                    <div className="flex items-center justify-between rounded-none border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <div className="flex items-center gap-2 text-emerald-700 text-sm">
                        <Gift className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{t.giftCardApplied}</span>
                        <span className="font-mono text-xs">{appliedGiftCard.code}</span>
                        <span className="font-semibold">
                          -{appliedGiftCard.currency === "USD" ? "$" : "₪"}{giftCardApplied.toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-emerald-600 hover:text-destructive ml-2"
                        onClick={() => { setAppliedGiftCard(null); setGiftCardError(null); }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className={cn("flex gap-3 pt-2", lang === 'he' && "flex-row-reverse")}>
                  <Button
                    variant="outline"
                    className="shrink-0"
                    style={{ height: '52px', borderRadius: '0px', border: '1px solid #1A1814' }}
                    onClick={() => { trackCheckoutBackClicked(state.experienceSlug, 'step2'); goBackToExperience(); }}
                  >
                    {lang === 'he' ? <ChevronRight className="h-4 w-4 ml-1" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
                    {t.back}
                  </Button>
                  <Button
                    className={cn(
                      "flex-1 uppercase tracking-[0.12em] text-[13px] transition-all duration-200",
                      isGuestValid
                        ? "bg-[#1A1814] text-white hover:bg-[#1A1814]/90 hover:scale-[1.01] cursor-pointer"
                        : "bg-[#C8C0B4] text-white cursor-not-allowed hover:bg-[#C8C0B4]"
                    )}
                    style={{ height: '52px', borderRadius: '0px' }}
                    disabled={!isGuestValid || isPreBooking}
                    onClick={handleContinueToStep3}
                  >
                    {isPreBooking ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {lang === "he" ? "...מכין את ההזמנה" : lang === "fr" ? "Préparation de votre réservation..." : "Preparing your booking..."}
                      </span>
                    ) : (
                      <>
                        {t.next}
                        {lang === 'he' ? <ChevronLeft className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right — sticky summary (desktop only) */}
              <div className="hidden md:block">
                <div className="sticky" style={{ top: '80px' }}>
                  <BookingSummaryCard />
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Summary & Confirm ═══ */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Stay details */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold">{t.stayDetails}</p>
                {state.experienceTitle && (
                  <p className="text-sm font-medium">{state.experienceTitle}</p>
                )}
                {state.hotelName && (
                  <p className="text-xs text-muted-foreground">{state.hotelName}</p>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t.dates}</span>
                    <p className="font-medium mt-0.5">
                      {format(dateFrom, "dd MMM")} → {format(dateTo, "dd MMM yyyy")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.nightsLabel}</span>
                    <p className="font-medium mt-0.5">{state.nights}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.guestsLabel}</span>
                    <p className="font-medium mt-0.5">{totalPartySize}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.room}</span>
                    <p className="font-medium mt-0.5 truncate">{state.selectedRoomName}</p>
                  </div>
                </div>
              </div>

              {/* Guest details */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold">{t.guestDetails}</p>
                <div className="text-xs space-y-1">
                  <p className="font-medium">{leadGuest.firstName} {leadGuest.lastName}</p>
                  <p className="text-muted-foreground">{leadGuest.email}</p>
                  <p className="text-muted-foreground">{leadGuest.phone}</p>
                </div>
                {specialRequests && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground italic">"{specialRequests}"</p>
                  </>
                )}
              </div>

              {/* Clean price breakdown */}
              <div className="rounded-xl border border-border bg-card p-4">
                <PriceBreakdownV2
                  breakdown={priceBreakdown}
                  isLoading={false}
                  lang={lang}
                  ratePlanPrices={ratePlanPrices}
                  selectedExtras={state.selectedExtras.length > 0 ? state.selectedExtras : undefined}
                  extrasTotal={extrasTotal}
                  adults={state.adults}
                  nights={state.nights}
                />
              </div>

              {/* Gift card discount */}
              {appliedGiftCard && giftCardApplied > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Gift className="h-4 w-4 shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{t.giftCardDiscount}</div>
                      <div className="text-xs font-mono text-emerald-600">{appliedGiftCard.code}</div>
                    </div>
                  </div>
                  <div className="text-emerald-700 font-semibold text-sm">
                    -{appliedGiftCard.currency === "USD" ? "$" : "₪"}{giftCardApplied.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Cancellation policy */}
              {state.selectedRatePlan?.cancellationPolicies && state.searchParams?.checkIn && (() => {
                const cancellation = analyzeCancellationPolicies(
                  state.selectedRatePlan.cancellationPolicies,
                  state.searchParams.checkIn,
                  lang,
                );
                if (!cancellation.badgeText) return null;
                if (cancellation.isFreeCancellation) {
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      <span>{cancellation.badgeText}</span>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>{cancellation.isNonRefundable ? cancellation.badgeText : cancellation.summaryText}</span>
                  </div>
                );
              })()}

              {/* On-request warning */}
              {isOnRequest && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    {t.onRequestWarning}
                  </AlertDescription>
                </Alert>
              )}

              {/* Bloc d'erreur paiement avec retry */}
              {paymentStatus === "failed" && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <div>
                      <p className="font-semibold">
                        {lang === "he"
                          ? "התשלום נכשל"
                          : lang === "fr"
                            ? "Le paiement a échoué"
                            : "Payment failed"}
                      </p>
                      <p className="text-sm mt-1">
                        {paymentErrorMessage ||
                          (lang === "he"
                            ? "התשלום לא הושלם. אנא נסה כרטיס אחר או חזור לבחור תקופה אחרת."
                            : lang === "fr"
                              ? "Le paiement n'a pas été finalisé. Réessayez avec une autre carte ou revenez à l'étape précédente."
                              : "The payment did not go through. Please try another card or go back to the previous step.")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleRetryPayment}
                        disabled={isRetryingPayment}
                      >
                        {isRetryingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {lang === "he"
                          ? "נסה שוב"
                          : lang === "fr"
                            ? "Réessayer le paiement"
                            : "Retry payment"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPaymentStatus("idle");
                          setPaymentErrorMessage(null);
                          setRevolutPublicId(null);
                          setRevolutOrderId(null);
                          setRevolutEnvironment(null);
                          setStep(2);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        {lang === "he"
                          ? "חזור"
                          : lang === "fr"
                            ? "Retour à l'étape précédente"
                            : "Back to previous step"}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Embedded Checkout Revolut — rend toutes les méthodes de paiement
                  configurées (Revolut Pay, Carte, Google Pay) directement dans la page.
                  Le client clique sur sa méthode préférée et paie sans quitter le site.
                  Plus besoin de bouton "Pay" externe : le widget gère tout. */}
              {revolutPublicId && paymentStatus !== "paid" && paymentStatus !== "failed" && (
                <div className="py-2">
                  <RevolutPaymentWidget
                    publicId={revolutPublicId}
                    merchantPublicKey={revolutMerchantPublicKey ?? undefined}
                    lang={lang as "en" | "he" | "fr"}
                    environment={revolutEnvironment ?? undefined}
                    customerEmail={leadGuest.email || undefined}
                    onPaymentSuccess={() => {
                      setPaymentStatus("paid");
                      setPaymentErrorMessage(null);
                      toast.success(lang === "he" ? "התשלום התקבל! יוצר את ההזמנה..." : lang === "fr" ? "Paiement reçu ! Création de la réservation..." : "Payment received! Creating your booking...");
                      // L'auto-trigger de handleBookInternal est géré par le useEffect
                      // qui surveille paymentStatus.
                    }}
                    onPaymentError={(err) => {
                      setPaymentStatus("failed");
                      setPaymentErrorMessage(err);
                      toast.error(err);
                    }}
                    onPaymentCancel={() => {
                      toast.info(
                        lang === "he"
                          ? "התשלום בוטל"
                          : lang === "fr"
                            ? "Paiement annulé"
                            : "Payment cancelled",
                      );
                    }}
                  />
                </div>
              )}

              {paymentStatus === "paid" && (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    {amountAfterGiftCard === 0 && appliedGiftCard
                      ? t.giftCardCoveredFull
                      : isBooking
                      ? lang === "he" ? "התשלום אושר. יוצר את ההזמנה אצל בית המלון..."
                        : lang === "fr" ? "Paiement confirmé. Création de votre réservation chez l'hôtel..."
                        : "Payment confirmed. Creating your booking with the hotel..."
                      : lang === "he" ? "התשלום אושר. ההזמנה תיווצר אוטומטית."
                        : lang === "fr" ? "Paiement confirmé. Votre réservation va être créée automatiquement."
                        : "Payment confirmed. Your booking will be created automatically."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Navigation — desktop: side by side, mobile: stacked */}
              <div className="pt-2 pb-8">
                {/* Desktop */}
                <div className={cn("hidden md:flex gap-3", lang === 'he' && "flex-row-reverse")}>
                  <Button
                    variant="outline"
                    className="shrink-0 uppercase tracking-[0.12em] text-[13px]"
                    style={{ height: '52px', borderRadius: '0px', border: '1px solid #1A1814', color: '#1A1814' }}
                    onClick={() => { trackCheckoutBackClicked(state.experienceSlug, 'step3'); setStep(2); setPaymentStatus("idle"); setRevolutPublicId(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    {lang === 'he' ? <ChevronRight className="h-4 w-4 ml-1" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
                    {t.back}
                  </Button>
                  {/* Bouton "Confirm Booking" externe : caché quand un paiement est requis
                      via le widget embedded (le widget a ses propres boutons Pay par méthode).
                      Visible UNIQUEMENT si gift card couvre 100% OU si paiement déjà validé
                      mais résa à finaliser manuellement (edge case). */}
                  {(amountAfterGiftCard === 0 || paymentStatus === "paid" || isBooking) && (
                    <Button
                      className="flex-1 uppercase tracking-[0.12em] text-[13px] bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
                      style={{ height: '52px', borderRadius: '0px' }}
                      disabled={totalIsNaN || isBooking}
                      onClick={handleBook}
                    >
                      {isBooking ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {getBookingMessage()}
                        </span>
                      ) : (
                        lang === "he" ? "אשר הזמנה" : lang === "fr" ? "CONFIRMER LA RÉSERVATION" : "CONFIRM BOOKING"
                      )}
                    </Button>
                  )}
                </div>

                {/* Mobile: stacked */}
                <div className="md:hidden space-y-3">
                  {(amountAfterGiftCard === 0 || paymentStatus === "paid" || isBooking) && (
                    <Button
                      className="w-full uppercase tracking-[0.12em] text-[13px] bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
                      style={{ height: '52px', borderRadius: '0px' }}
                      disabled={totalIsNaN || isBooking}
                      onClick={handleBook}
                    >
                      {isBooking ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {getBookingMessage()}
                        </span>
                      ) : (
                        lang === "he" ? "אשר הזמנה" : lang === "fr" ? "CONFIRMER LA RÉSERVATION" : "CONFIRM BOOKING"
                      )}
                    </Button>
                  )}
                  <button
                    className="w-full text-center text-[13px] py-2"
                    style={{ color: '#8C7B6B' }}
                    onClick={() => { trackCheckoutBackClicked(state.experienceSlug, 'step3'); setStep(2); setPaymentStatus("idle"); setRevolutPublicId(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    ← {t.back}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Minimal trust footer */}
      <div className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          🔒 {lang === "he" ? "הזמנה מאובטחת · לא תחויבו עד לאישור" : lang === "fr" ? "Réservation sécurisée · Aucun débit avant confirmation" : "Secure booking · No charge until confirmed"}
        </p>
      </div>

      {/* Confirmation dialog */}
      <BookingConfirmationDialog
        open={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          navigate(`/experience2/${state.experienceSlug}?lang=${lang}&context=launch`);
        }}
        data={confirmationData}
        lang={lang}
      />

      {/* Auth prompt */}
      <AuthPromptDialog
        open={showAuthPrompt}
        onOpenChange={(open) => {
          setShowAuthPrompt(open);
          if (!open && !user) {
            pendingBookAfterAuth.current = false;
            pendingContinueAfterAuth.current = false;
          }
        }}
        lang={lang}
        defaultTab="login"
        context="account"
      />
    </div>
  );
}
