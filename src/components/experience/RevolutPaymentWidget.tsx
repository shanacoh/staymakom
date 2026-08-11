import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRY_OPTIONS } from "@/components/experience/LeadGuestForm";
import { AlertTriangle, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import type { Address, CountryCode, PaymentRequestInstance, RevolutCheckoutCardField, RevolutCheckoutInstance, RevolutPaymentsModuleInstance, ValidationError } from "@revolut/checkout";

type BillingAddressForm = {
  countryCode: string;
  streetLine1: string;
  city: string;
  postcode: string;
};

type BillingAddressField = keyof BillingAddressForm;

const EMPTY_BILLING_ADDRESS: BillingAddressForm = {
  countryCode: "",
  streetLine1: "",
  city: "",
  postcode: "",
};

const ALL_BILLING_FIELDS: BillingAddressField[] = ["countryCode", "streetLine1", "city", "postcode"];

const billingTranslations = {
  en: {
    billingTitle: "Billing address",
    billingHint: "Required by the bank for card payment verification.",
    country: "Country",
    address: "Address",
    city: "City",
    postcode: "Postcode",
    selectCountry: "Select a country",
    required: "Required",
    billingRequiredError: "Please fill in the required billing address fields.",
    cardLoadTimeout: "Payment is taking too long to load. Please try again or contact us.",
  },
  he: {
    billingTitle: "כתובת לחיוב",
    billingHint: "נדרש על ידי הבנק לאימות התשלום בכרטיס.",
    country: "מדינה",
    address: "כתובת",
    city: "עיר",
    postcode: "מיקוד",
    selectCountry: "בחר מדינה",
    required: "שדה חובה",
    billingRequiredError: "יש למלא את שדות כתובת החיוב החובה.",
    cardLoadTimeout: "טעינת התשלום נמשכת זמן רב מדי. נסו שוב או צרו איתנו קשר.",
  },
  fr: {
    billingTitle: "Adresse de facturation",
    billingHint: "Demandée par la banque pour vérifier le paiement par carte.",
    country: "Pays",
    address: "Adresse",
    city: "Ville",
    postcode: "Code postal",
    selectCountry: "Choisir un pays",
    required: "Requis",
    billingRequiredError: "Merci de remplir les champs obligatoires de facturation.",
    cardLoadTimeout: "Le paiement met trop de temps à se charger. Merci de réessayer ou de nous contacter.",
  },
};

/** Délai max avant d'abandonner l'initialisation du champ carte Revolut et d'afficher
 *  une erreur visible, plutôt que de laisser un spinner tourner indéfiniment (cause
 *  identifiée de réservations bloquées : le SDK ou un service tiers comme le contrôle
 *  anti-fraude peut ne jamais répondre, sans jamais rejeter la promesse). */
const CARD_FIELD_INIT_TIMEOUT_MS = 12000;

function isBillingAddressComplete(address: BillingAddressForm): boolean {
  return ALL_BILLING_FIELDS.every((field) => address[field].trim() !== "");
}

function buildBillingAddressForRevolut(address: BillingAddressForm): Address | undefined {
  if (!isBillingAddressComplete(address)) return undefined;
  return {
    countryCode: address.countryCode.trim().toUpperCase() as CountryCode,
    streetLine1: address.streetLine1.trim(),
    city: address.city.trim(),
    postcode: address.postcode.trim(),
  };
}

interface RevolutPaymentWidgetProps {
  /** Order publicId returned by create-order. */
  publicId: string;
  /** Merchant Public Key used to mount the Revolut Pay button. */
  merchantPublicKey?: string;
  amount?: number;
  currency?: string;
  lang?: "en" | "he" | "fr";
  environment?: "production" | "dev";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerBirthDate?: string;
  onPaymentSuccess: (orderId?: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel?: () => void;
}

export default function RevolutPaymentWidget({
  publicId,
  merchantPublicKey,
  amount,
  currency,
  lang = "en",
  environment,
  customerName,
  customerEmail,
  customerPhone,
  customerBirthDate,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}: RevolutPaymentWidgetProps) {
  const cardFieldTargetRef = useRef<HTMLDivElement>(null);
  const revolutPayTargetRef = useRef<HTMLDivElement>(null);
  const googlePayTargetRef = useRef<HTMLDivElement>(null);
  const cardFieldRef = useRef<RevolutCheckoutCardField | null>(null);
  const checkoutRef = useRef<RevolutCheckoutInstance | null>(null);
  const paymentsModuleRef = useRef<RevolutPaymentsModuleInstance | null>(null);
  const paymentRequestRef = useRef<PaymentRequestInstance | null>(null);
  const billingAddressRef = useRef<BillingAddressForm>(EMPTY_BILLING_ADDRESS);
  /** Passe à true dès que l'initialisation se termine (succès ou erreur), pour que le
   *  timeout ci-dessous sache s'il doit encore intervenir. */
  const cardFieldSettledRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevolutPayAvailable, setIsRevolutPayAvailable] = useState(false);
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<BillingAddressForm>(EMPTY_BILLING_ADDRESS);
  const [billingTouched, setBillingTouched] = useState<Record<BillingAddressField, boolean>>({
    countryCode: false,
    streetLine1: false,
    city: false,
    postcode: false,
  });
  const [showBillingErrors, setShowBillingErrors] = useState(false);

  const resolvedEnv = environment ?? (import.meta.env.VITE_REVOLUT_ENV === "production" ? "production" : "dev");
  const mode: "prod" | "sandbox" = resolvedEnv === "production" ? "prod" : "sandbox";
  const locale = lang === "he" ? "en" : lang;
  const t = billingTranslations[lang];

  useEffect(() => {
    billingAddressRef.current = billingAddress;
  }, [billingAddress]);

  useEffect(() => {
    if (!isBillingAddressComplete(billingAddress)) return;
    setPaymentError(prev => prev === t.billingRequiredError ? null : prev);
  }, [billingAddress, t.billingRequiredError]);

  const billingErrors = useMemo(() => {
    const shouldShow = showBillingErrors;
    return ALL_BILLING_FIELDS.reduce((acc, field) => {
      acc[field] = (shouldShow || billingTouched[field]) && !billingAddress[field].trim()
        ? t.required
        : null;
      return acc;
    }, {} as Record<BillingAddressField, string | null>);
  }, [billingAddress, billingTouched, showBillingErrors, t.required]);

  const markBillingTouched = (field: BillingAddressField) => {
    setBillingTouched(prev => ({ ...prev, [field]: true }));
  };

  const markAllBillingTouched = () => {
    setBillingTouched({
      countryCode: true,
      streetLine1: true,
      city: true,
      postcode: true,
    });
  };

  const updateBillingAddress = (field: BillingAddressField, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateBillingAddress = useCallback(() => {
    const complete = isBillingAddressComplete(billingAddressRef.current);
    if (!complete) {
      setShowBillingErrors(true);
      markAllBillingTouched();
      setPaymentError(t.billingRequiredError);
    }
    return complete;
  }, [t.billingRequiredError]);

  const getDateOfBirthForRevolut = useCallback(() => {
    if (!customerBirthDate || !/^\d{4}-\d{2}-\d{2}$/.test(customerBirthDate)) return undefined;
    const [year, month, day] = customerBirthDate.split("-").map(Number);
    return { day, month, year };
  }, [customerBirthDate]);

  const handleRevolutError = useCallback((error: { message?: string; type?: string }) => {
    const msg = error?.message || error?.type || "Payment failed";
    setIsSubmitting(false);
    setPaymentError(msg);
    onPaymentError(msg);
  }, [onPaymentError]);

  useEffect(() => {
    if (!publicId || !cardFieldTargetRef.current) return;

    let mounted = true;
    cardFieldSettledRef.current = false;
    setIsLoading(true);
    setIsRevolutPayAvailable(false);
    setIsGooglePayAvailable(false);
    setPaymentError(null);

    const initTimeoutId = window.setTimeout(() => {
      if (!mounted || cardFieldSettledRef.current) return;
      cardFieldSettledRef.current = true;
      setIsLoading(false);
      setPaymentError(t.cardLoadTimeout);
    }, CARD_FIELD_INIT_TIMEOUT_MS);

    async function initCardField() {
      try {
        const { default: RevolutCheckout } = await import("@revolut/checkout");
        if (!mounted || !cardFieldTargetRef.current) return;

        const checkout = await RevolutCheckout(publicId, mode);
        checkoutRef.current = checkout;
        const cardField = checkout.createCardField({
          target: cardFieldTargetRef.current,
          locale,
          name: customerName || undefined,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
          dateOfBirth: getDateOfBirthForRevolut(),
          hidePostcodeField: true,
          onSuccess: () => {
            onPaymentSuccess();
          },
          onError: handleRevolutError,
          onCancel: () => {
            setIsSubmitting(false);
            onPaymentCancel?.();
          },
          onValidation: (errors: ValidationError[]) => {
            if (errors.length > 0) setIsSubmitting(false);
          },
        });

        if (!mounted) {
          try {
            cardField.destroy();
          } catch (err) {
            console.warn("Revolut card field destroy failed:", err);
          }
          return;
        }

        cardFieldRef.current = cardField;
        cardFieldSettledRef.current = true;
        window.clearTimeout(initTimeoutId);
        setIsLoading(false);
        setPaymentError(null);

        try {
          if (merchantPublicKey && amount && amount > 0 && currency && revolutPayTargetRef.current) {
            const paymentsModule = await RevolutCheckout.payments({
              publicToken: merchantPublicKey,
              locale,
              mode,
            });
            paymentsModuleRef.current = paymentsModule;
            paymentsModule.revolutPay.mount(revolutPayTargetRef.current, {
              currency: currency.toUpperCase(),
              totalAmount: Math.round(amount * 100),
              createOrder: async () => ({ publicId }),
              billingAddress: buildBillingAddressForRevolut(billingAddressRef.current),
              validate: () => validateBillingAddress(),
              customer: {
                name: customerName || undefined,
                email: customerEmail || undefined,
                phone: customerPhone || undefined,
                dateOfBirth: getDateOfBirthForRevolut(),
              },
              buttonStyle: {
                height: "48px",
                radius: "large",
                variant: "dark",
              },
            });
            paymentsModule.revolutPay.on("click", () => {
              setPaymentError(null);
            });
            paymentsModule.revolutPay.on("payment", (payload) => {
              setIsSubmitting(false);
              if (payload.type === "success") {
                onPaymentSuccess(payload.orderId);
                return;
              }
              if (payload.type === "error") {
                handleRevolutError(payload.error);
                return;
              }
              onPaymentCancel?.();
            });
            if (mounted) setIsRevolutPayAvailable(true);
          }
        } catch (err) {
          console.warn("Revolut Pay button init failed:", err);
        }

        try {
          if (googlePayTargetRef.current) {
            const paymentRequest = checkout.paymentRequest({
              target: googlePayTargetRef.current,
              locale,
              requestPayerName: true,
              requestPayerEmail: true,
              requestPayerPhone: false,
              disableBasicCard: true,
              buttonStyle: {
                height: "48px",
                radius: "large",
                variant: "dark",
              },
              onSuccess: () => {
                setIsSubmitting(false);
                onPaymentSuccess();
              },
              onError: handleRevolutError,
              onCancel: () => {
                setIsSubmitting(false);
                onPaymentCancel?.();
              },
            });

            paymentRequestRef.current = paymentRequest;
            const method = await paymentRequest.canMakePayment();
            if (mounted && method === "googlePay") {
              setIsGooglePayAvailable(true);
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              if (mounted) await paymentRequest.render();
            } else {
              paymentRequest.destroy();
              paymentRequestRef.current = null;
            }
          }
        } catch (err) {
          console.warn("Google Pay button init failed:", err);
          try {
            paymentRequestRef.current?.destroy();
          } catch (destroyErr) {
            console.warn("Google Pay cleanup failed:", destroyErr);
          } finally {
            paymentRequestRef.current = null;
            setIsGooglePayAvailable(false);
          }
        }
      } catch (err: unknown) {
        window.clearTimeout(initTimeoutId);
        if (!mounted) return;
        cardFieldSettledRef.current = true;
        console.error("Revolut card field init error:", err);
        const msg = err instanceof Error ? err.message : "Failed to load card payment";
        setPaymentError(msg);
        setIsLoading(false);
      }
    }

    initCardField();

    return () => {
      mounted = false;
      window.clearTimeout(initTimeoutId);
      try {
        paymentRequestRef.current?.destroy();
      } catch (err) {
        console.warn("Revolut payment request cleanup failed:", err);
      }
      try {
        cardFieldRef.current?.destroy();
      } catch (err) {
        console.warn("Revolut card field cleanup failed:", err);
      }
      try {
        checkoutRef.current?.destroy();
      } catch (err) {
        console.warn("Revolut checkout cleanup failed:", err);
      }
      try {
        paymentsModuleRef.current?.destroy();
      } catch (err) {
        console.warn("Revolut payments module cleanup failed:", err);
      }
      paymentRequestRef.current = null;
      cardFieldRef.current = null;
      checkoutRef.current = null;
      paymentsModuleRef.current = null;
    };
  }, [publicId, merchantPublicKey, amount, currency, mode, locale, customerName, customerEmail, customerPhone, getDateOfBirthForRevolut, validateBillingAddress, onPaymentSuccess, handleRevolutError, onPaymentCancel, t.cardLoadTimeout]);

  const handleSubmit = () => {
    if (!cardFieldRef.current || isSubmitting) return;
    setPaymentError(null);
    if (!validateBillingAddress()) return;
    const billingAddressForRevolut = buildBillingAddressForRevolut(billingAddressRef.current);
    setIsSubmitting(true);
    cardFieldRef.current.submit({
      name: customerName || undefined,
      email: customerEmail || undefined,
      phone: customerPhone || undefined,
      dateOfBirth: getDateOfBirthForRevolut(),
      billingAddress: billingAddressForRevolut,
    });
  };

  const cardLabel = lang === "he"
    ? "תשלום בכרטיס"
    : lang === "fr"
      ? "Payer par carte"
      : "Pay by card";

  const securedLabel = lang === "he"
    ? "תשלום מאובטח באמצעות Revolut"
    : lang === "fr"
      ? "Paiement sécurisé par Revolut"
      : "Secured by Revolut";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div ref={revolutPayTargetRef} className={merchantPublicKey && amount && amount > 0 && currency ? "min-h-[48px]" : "hidden"} />
        <div ref={googlePayTargetRef} className={isGooglePayAvailable ? "min-h-[48px]" : "hidden"} />
      </div>

      <div className={isRevolutPayAvailable || isGooglePayAvailable ? "flex items-center gap-3" : "hidden"}>
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          {lang === "he" ? "או" : lang === "fr" ? "ou" : "or"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3 rounded-md border border-border bg-muted/25 p-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{t.billingTitle}</p>
          <p className="text-xs text-muted-foreground">{t.billingHint}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t.country} *</Label>
            <Select
              value={billingAddress.countryCode || undefined}
              onValueChange={(value) => {
                updateBillingAddress("countryCode", value);
                markBillingTouched("countryCode");
              }}
            >
              <SelectTrigger className={`h-10 bg-background ${billingErrors.countryCode ? "border-destructive" : ""}`}>
                <SelectValue placeholder={t.selectCountry} />
              </SelectTrigger>
              <SelectContent className="z-[80]">
                {COUNTRY_OPTIONS.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {billingErrors.countryCode && <p className="text-xs text-destructive">{billingErrors.countryCode}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor="revolut-billing-postcode">{t.postcode} *</Label>
            <Input
              id="revolut-billing-postcode"
              value={billingAddress.postcode}
              onChange={(event) => updateBillingAddress("postcode", event.target.value)}
              onBlur={() => markBillingTouched("postcode")}
              className={`h-10 bg-background ${billingErrors.postcode ? "border-destructive" : ""}`}
              required
            />
            {billingErrors.postcode && <p className="text-xs text-destructive">{billingErrors.postcode}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="revolut-billing-address">{t.address} *</Label>
          <Input
            id="revolut-billing-address"
            value={billingAddress.streetLine1}
            onChange={(event) => updateBillingAddress("streetLine1", event.target.value)}
            onBlur={() => markBillingTouched("streetLine1")}
            className={`h-10 bg-background ${billingErrors.streetLine1 ? "border-destructive" : ""}`}
            required
          />
          {billingErrors.streetLine1 && <p className="text-xs text-destructive">{billingErrors.streetLine1}</p>}
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="revolut-billing-city">{t.city} *</Label>
          <Input
            id="revolut-billing-city"
            value={billingAddress.city}
            onChange={(event) => updateBillingAddress("city", event.target.value)}
            onBlur={() => markBillingTouched("city")}
            className={`h-10 bg-background ${billingErrors.city ? "border-destructive" : ""}`}
            required
          />
          {billingErrors.city && <p className="text-xs text-destructive">{billingErrors.city}</p>}
        </div>
      </div>

      <div
        ref={cardFieldTargetRef}
        className="min-h-[54px] rounded-md border border-input bg-background px-3 py-3"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <Button
        type="button"
        className="w-full bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
        style={{ minHeight: "56px", borderRadius: "10px" }}
        onClick={handleSubmit}
        disabled={isLoading || isSubmitting || !publicId}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {cardLabel}
      </Button>

      {paymentError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>{securedLabel}</span>
      </div>
    </div>
  );
}
