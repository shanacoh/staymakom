import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RevolutCheckoutInstance } from "@revolut/checkout";

interface RevolutPaymentWidgetProps {
  publicId: string;
  amount: number;
  currency: string;
  lang?: "en" | "he" | "fr";
  /**
   * Environnement Revolut, transmis par la réponse du serveur (create-order).
   * Si non fourni, fallback sur VITE_REVOLUT_ENV pour rétro-compatibilité.
   */
  environment?: "production" | "dev";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onPaymentSuccess: (paymentId?: string) => void;
  onPaymentError: (error: string) => void;
}

export default function RevolutPaymentWidget({
  publicId,
  amount,
  currency,
  lang = "en",
  environment,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
}: RevolutPaymentWidgetProps) {
  const instanceRef = useRef<RevolutCheckoutInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // Source de vérité unique : ce que dit le serveur. Fallback sur VITE_REVOLUT_ENV pour rétro-compat.
  const resolvedEnv = environment ?? (import.meta.env.VITE_REVOLUT_ENV === "production" ? "production" : "dev");
  const mode: "prod" | "sandbox" = resolvedEnv === "production" ? "prod" : "sandbox";

  useEffect(() => {
    if (!publicId) return;

    let mounted = true;

    async function initWidget() {
      try {
        const { default: RevolutCheckout } = await import("@revolut/checkout");
        if (!mounted) return;

        // RevolutCheckout(token, mode) renvoie une instance avec payWithPopup,
        // createCardField, revolutPay, etc. On utilise payWithPopup parce que c'est
        // le plus robuste : Revolut héberge la fenêtre de paiement, on évite les
        // problèmes d'iframe / CSS / dimensionnement.
        const instance = await RevolutCheckout(publicId, mode);
        if (!mounted) return;

        instanceRef.current = instance;
        setLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error("Revolut widget init error:", err);
        const msg = err instanceof Error ? err.message : "Failed to load payment widget";
        setWidgetError(msg);
        setLoading(false);
      }
    }

    initWidget();

    return () => {
      mounted = false;
      instanceRef.current = null;
    };
  }, [publicId, mode]);

  const handlePay = () => {
    if (!instanceRef.current || submitting) return;

    // Revolut exige un nom de porteur en au moins 2 mots — on coupe l'erreur en amont.
    const trimmedName = (customerName || "").trim();
    if (trimmedName.split(/\s+/).filter(Boolean).length < 2) {
      onPaymentError(
        lang === "he"
          ? "שם בעל הכרטיס חייב להכיל לפחות שתי מילים"
          : lang === "fr"
            ? "Le nom du porteur de carte doit contenir au moins deux mots"
            : "Cardholder name must be at least two words",
      );
      return;
    }

    setSubmitting(true);

    instanceRef.current.payWithPopup({
      name: trimmedName,
      email: customerEmail || undefined,
      phone: customerPhone || undefined,
      locale: lang === "he" ? "en" : lang,
      onSuccess: () => {
        setSubmitting(false);
        onPaymentSuccess();
      },
      onError: (error) => {
        setSubmitting(false);
        const msg = error?.message || "Payment failed";
        onPaymentError(msg);
      },
      onCancel: () => {
        setSubmitting(false);
      },
    });
  };

  const formattedAmount = new Intl.NumberFormat(lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);

  const payButtonLabel =
    lang === "he"
      ? submitting
        ? "מעבד..."
        : `שלם ${formattedAmount}`
      : lang === "fr"
        ? submitting
          ? "Traitement..."
          : `Payer ${formattedAmount}`
        : submitting
          ? "Processing..."
          : `Pay ${formattedAmount}`;

  if (widgetError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{widgetError}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => { setWidgetError(null); setLoading(true); }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          {lang === "he" ? "תשלום" : lang === "fr" ? "Paiement" : "Payment"}
          <span className="ml-auto font-semibold">{formattedAmount}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {lang === "he"
            ? "לחץ על הכפתור למטה כדי להזין את פרטי הכרטיס שלך בחלון מאובטח של Revolut."
            : lang === "fr"
              ? "Cliquez sur le bouton ci-dessous pour saisir vos informations de carte dans une fenêtre sécurisée Revolut."
              : "Click the button below to enter your card details in a secure Revolut window."}
        </p>
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handlePay}
          disabled={submitting || loading}
        >
          {(submitting || loading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {loading
            ? lang === "he"
              ? "טוען..."
              : lang === "fr"
                ? "Chargement..."
                : "Loading..."
            : payButtonLabel}
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          {lang === "he"
            ? "תשלום מאובטח באמצעות Revolut"
            : lang === "fr"
              ? "Paiement sécurisé par Revolut"
              : "Secured by Revolut"}
        </div>
      </CardContent>
    </Card>
  );
}
