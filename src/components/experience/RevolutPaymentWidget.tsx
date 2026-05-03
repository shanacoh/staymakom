import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmbeddedCheckoutInstance } from "@revolut/checkout";

interface RevolutPaymentWidgetProps {
  /** Order publicId returned by create-order. Utilisé par createOrder callback du SDK. */
  publicId: string;
  /** Merchant Public Key Revolut (pk_...) — REQUISE pour l'embedded checkout.
   *  Renvoyée par le serveur dans la réponse de create-order (lue depuis les secrets
   *  Supabase REVOLUT_PUBLIC_KEY_PROD / REVOLUT_PUBLIC_KEY). */
  merchantPublicKey?: string;
  /** Devise (USD, EUR, ILS…) — pour info, le widget l'affiche selon l'ordre Revolut. */
  currency?: string;
  lang?: "en" | "he" | "fr";
  /** Environnement Revolut, transmis par la réponse du serveur (create-order). */
  environment?: "production" | "dev";
  customerEmail?: string;
  onPaymentSuccess: (orderId?: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel?: () => void;
}

/**
 * Widget de paiement Revolut en mode "Embedded Checkout" : rend directement dans la
 * page un formulaire complet avec les moyens de paiement configurés côté Revolut
 * (Revolut Pay, Carte, Google Pay…). Le client choisit son moyen et paie sans quitter
 * la page.
 *
 * À noter : la propriété `publicToken` du SDK accepte ici le `publicId` de l'ordre
 * Revolut (renvoyé par create-order). Aucune Merchant Public API Key séparée requise
 * dans cette intégration.
 */
export default function RevolutPaymentWidget({
  publicId,
  merchantPublicKey,
  lang = "en",
  environment,
  customerEmail,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}: RevolutPaymentWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<EmbeddedCheckoutInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const resolvedEnv = environment ?? (import.meta.env.VITE_REVOLUT_ENV === "production" ? "production" : "dev");
  const mode: "prod" | "sandbox" = resolvedEnv === "production" ? "prod" : "sandbox";

  useEffect(() => {
    if (!publicId || !containerRef.current) return;

    // La merchant public key est REQUISE par embeddedCheckout. Si le serveur n'a pas
    // pu la fournir (secret Supabase non configuré), on affiche un message clair.
    if (!merchantPublicKey) {
      setWidgetError(
        lang === "he"
          ? "מפתח Revolut לא מוגדר. צור קשר עם התמיכה."
          : lang === "fr"
            ? "Clé Revolut manquante côté serveur. Vérifier les secrets Supabase REVOLUT_PUBLIC_KEY_PROD / REVOLUT_PUBLIC_KEY."
            : "Revolut public key missing on server. Check Supabase secrets REVOLUT_PUBLIC_KEY_PROD / REVOLUT_PUBLIC_KEY.",
      );
      setLoading(false);
      return;
    }

    let mounted = true;

    async function initWidget() {
      try {
        const { default: RevolutCheckout } = await import("@revolut/checkout");
        if (!mounted || !containerRef.current) return;

        const instance = await RevolutCheckout.embeddedCheckout({
          mode,
          publicToken: merchantPublicKey!,
          target: containerRef.current,
          locale: lang === "he" ? "en" : lang,
          email: customerEmail || undefined,
          // createOrder est appelé par Revolut quand le client clique sur un moyen
          // de paiement. On retourne le publicId de l'ordre déjà créé en amont.
          createOrder: async () => ({ publicId }),
          onSuccess: ({ orderId }) => {
            onPaymentSuccess(orderId);
          },
          onError: ({ error }) => {
            const msg = error?.message || "Payment failed";
            onPaymentError(msg);
          },
          onCancel: () => {
            onPaymentCancel?.();
          },
        });

        if (!mounted) {
          try { instance.destroy(); } catch {}
          return;
        }

        instanceRef.current = instance;
        setLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error("Revolut embedded checkout init error:", err);
        const msg = err instanceof Error ? err.message : "Failed to load payment widget";
        setWidgetError(msg);
        setLoading(false);
      }
    }

    initWidget();

    return () => {
      mounted = false;
      try { instanceRef.current?.destroy(); } catch {}
      instanceRef.current = null;
    };
  }, [publicId, mode, merchantPublicKey, lang, customerEmail, onPaymentSuccess, onPaymentError, onPaymentCancel]);

  if (widgetError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p>{widgetError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setWidgetError(null); setLoading(true); }}
          >
            {lang === "he" ? "נסה שוב" : lang === "fr" ? "Réessayer" : "Retry"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* Container où Revolut rend son widget complet (Revolut Pay, Carte, Google Pay…) */}
        <div ref={containerRef} className={loading ? "hidden" : "min-h-[300px]"} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            {lang === "he"
              ? "תשלום מאובטח באמצעות Revolut"
              : lang === "fr"
                ? "Paiement sécurisé par Revolut"
                : "Secured by Revolut"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
