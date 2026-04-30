import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RevolutCheckoutInstance } from "@revolut/checkout";

export interface RevolutPaymentWidgetHandle {
  /** Ouvre la popup Revolut. À appeler depuis le bouton "Confirm Booking" du parent. */
  pay: () => void;
  /** True si la popup peut être ouverte (instance Revolut chargée). */
  isReady: boolean;
}

interface RevolutPaymentWidgetProps {
  publicId: string;
  lang?: "en" | "he" | "fr";
  /**
   * Environnement Revolut, transmis par la réponse du serveur (create-order).
   * Si non fourni, fallback sur VITE_REVOLUT_ENV pour rétro-compatibilité.
   */
  environment?: "production" | "dev";
  customerEmail?: string;
  customerPhone?: string;
  onPaymentSuccess: (paymentId?: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel?: () => void;
}

/**
 * Widget Revolut "headless" : ne rend qu'un mini badge de sécurité visible et expose
 * une méthode `pay()` via ref. Le bouton de paiement est dans le parent (en l'occurrence
 * "Confirm Booking" dans Checkout.tsx) — ce composant ne fait que charger l'instance
 * Revolut en arrière-plan et ouvre la popup quand le parent l'appelle.
 *
 * On ne pré-remplit PAS le nom du porteur de carte : Revolut affiche son propre champ
 * "Cardholder name" dans la popup, ce qui évite de demander deux fois la même info.
 */
const RevolutPaymentWidget = forwardRef<RevolutPaymentWidgetHandle, RevolutPaymentWidgetProps>(
  function RevolutPaymentWidget(
    {
      publicId,
      lang = "en",
      environment,
      customerEmail,
      customerPhone,
      onPaymentSuccess,
      onPaymentError,
      onPaymentCancel,
    },
    ref,
  ) {
    const instanceRef = useRef<RevolutCheckoutInstance | null>(null);
    const [loading, setLoading] = useState(true);
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

    useImperativeHandle(
      ref,
      () => ({
        pay: () => {
          if (!instanceRef.current) {
            onPaymentError(
              lang === "he"
                ? "התשלום לא מוכן עדיין, אנא המתן..."
                : lang === "fr"
                  ? "Le paiement n'est pas encore prêt, veuillez patienter..."
                  : "Payment is not ready yet, please wait...",
            );
            return;
          }
          // On ne passe ni name ni email à payWithPopup : Revolut affiche ainsi
          // ses propres champs "Cardholder name" + "Email" dans la popup.
          // Le téléphone est passé pour pré-remplir si dispo.
          instanceRef.current.payWithPopup({
            email: customerEmail || undefined,
            phone: customerPhone || undefined,
            locale: lang === "he" ? "en" : lang,
            onSuccess: () => {
              onPaymentSuccess();
            },
            onError: (error) => {
              const msg = error?.message || "Payment failed";
              onPaymentError(msg);
            },
            onCancel: () => {
              onPaymentCancel?.();
            },
          });
        },
        isReady: !loading && !widgetError && !!instanceRef.current,
      }),
      [loading, widgetError, customerEmail, customerPhone, lang, onPaymentSuccess, onPaymentError, onPaymentCancel],
    );

    if (widgetError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{widgetError}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>
              {lang === "he"
                ? "טוען תשלום מאובטח..."
                : lang === "fr"
                  ? "Chargement du paiement sécurisé..."
                  : "Loading secure payment..."}
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {lang === "he"
                ? "תשלום מאובטח באמצעות Revolut · פרטי הכרטיס יוזנו בחלון מאובטח כאשר תאשר את ההזמנה"
                : lang === "fr"
                  ? "Paiement sécurisé par Revolut · La carte sera saisie dans une fenêtre sécurisée à la confirmation"
                  : "Secured by Revolut · Card details entered in secure popup on booking confirmation"}
            </span>
          </>
        )}
      </div>
    );
  },
);

export default RevolutPaymentWidget;
