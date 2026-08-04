import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import type { RevolutCheckoutCardField, ValidationError } from "@revolut/checkout";

interface RevolutPaymentWidgetProps {
  /** Order publicId returned by create-order. */
  publicId: string;
  /** Kept for compatibility with callers that still receive the Merchant Public Key. */
  merchantPublicKey?: string;
  currency?: string;
  lang?: "en" | "he" | "fr";
  environment?: "production" | "dev";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerBirthDate?: string;
  /** Adresse de facturation du client, transmise au formulaire carte Revolut. */
  billingAddress?: {
    countryCode: string;
    postcode: string;
    city?: string;
    streetLine1?: string;
    streetLine2?: string;
    region?: string;
  };
  onPaymentSuccess: (orderId?: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel?: () => void;
}

export default function RevolutPaymentWidget({
  publicId,
  lang = "en",
  environment,
  customerName,
  customerEmail,
  customerPhone,
  customerBirthDate,
  billingAddress,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}: RevolutPaymentWidgetProps) {
  const cardFieldTargetRef = useRef<HTMLDivElement>(null);
  const cardFieldRef = useRef<RevolutCheckoutCardField | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const resolvedEnv = environment ?? (import.meta.env.VITE_REVOLUT_ENV === "production" ? "production" : "dev");
  const mode: "prod" | "sandbox" = resolvedEnv === "production" ? "prod" : "sandbox";
  const locale = lang === "he" ? "en" : lang;

  const getBillingAddressForRevolut = useCallback(() => (
    billingAddress?.countryCode
      ? {
          countryCode: billingAddress.countryCode,
          postcode: billingAddress.postcode,
          city: billingAddress.city,
          streetLine1: billingAddress.streetLine1,
          streetLine2: billingAddress.streetLine2,
          region: billingAddress.region,
        }
      : undefined
  ), [billingAddress]);

  const getDateOfBirthForRevolut = useCallback(() => {
    if (!customerBirthDate || !/^\d{4}-\d{2}-\d{2}$/.test(customerBirthDate)) return undefined;
    const [year, month, day] = customerBirthDate.split("-").map(Number);
    return { day, month, year };
  }, [customerBirthDate]);

  useEffect(() => {
    if (!publicId || !cardFieldTargetRef.current) return;

    let mounted = true;
    setIsLoading(true);
    setPaymentError(null);

    async function initCardField() {
      try {
        const { default: RevolutCheckout } = await import("@revolut/checkout");
        if (!mounted || !cardFieldTargetRef.current) return;

        const checkout = await RevolutCheckout(publicId, mode);
        const cardField = checkout.createCardField({
          target: cardFieldTargetRef.current,
          locale,
          name: customerName || undefined,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
          dateOfBirth: getDateOfBirthForRevolut(),
          billingAddress: getBillingAddressForRevolut() as Parameters<typeof checkout.createCardField>[0]["billingAddress"],
          onSuccess: () => {
            onPaymentSuccess();
          },
          onError: (error) => {
            const msg = error?.message || error?.type || "Payment failed";
            setIsSubmitting(false);
            setPaymentError(msg);
            onPaymentError(msg);
          },
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
        setIsLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error("Revolut card field init error:", err);
        const msg = err instanceof Error ? err.message : "Failed to load card payment";
        setPaymentError(msg);
        setIsLoading(false);
      }
    }

    initCardField();

    return () => {
      mounted = false;
      try {
        cardFieldRef.current?.destroy();
      } catch (err) {
        console.warn("Revolut card field cleanup failed:", err);
      }
      cardFieldRef.current = null;
    };
  }, [publicId, mode, locale, customerName, customerEmail, customerPhone, getDateOfBirthForRevolut, getBillingAddressForRevolut, onPaymentSuccess, onPaymentError, onPaymentCancel]);

  const handleSubmit = () => {
    if (!cardFieldRef.current || isSubmitting) return;
    setPaymentError(null);
    setIsSubmitting(true);
    cardFieldRef.current.submit({
      name: customerName || undefined,
      email: customerEmail || undefined,
      phone: customerPhone || undefined,
      dateOfBirth: getDateOfBirthForRevolut(),
      billingAddress: getBillingAddressForRevolut() as Parameters<RevolutCheckoutCardField["submit"]>[0]["billingAddress"],
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
