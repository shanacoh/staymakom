import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RevolutPaymentWidgetProps {
  publicId: string;
  amount: number;
  currency: string;
  lang?: "en" | "he" | "fr";
  onPaymentSuccess: (paymentId?: string) => void;
  onPaymentError: (error: string) => void;
}

export default function RevolutPaymentWidget({
  publicId,
  amount,
  currency,
  lang = "en",
  onPaymentSuccess,
  onPaymentError,
}: RevolutPaymentWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const instanceRef = useRef<any>(null);

  const mode = import.meta.env.VITE_REVOLUT_ENV === "production" ? "prod" : "sandbox";

  useEffect(() => {
    if (!publicId || !containerRef.current) return;

    let mounted = true;

    async function initWidget() {
      try {
        const { default: RevolutCheckout } = await import("@revolut/checkout");

        if (!mounted) return;

        const instance = await RevolutCheckout.payments({
          locale: lang === "he" ? "en" : lang,
          mode,
          publicToken: publicId,
        });

        if (!mounted) {
          instance.destroy();
          return;
        }

        instanceRef.current = instance;

        const card = instance.cardField;
        if (card && containerRef.current) {
          card.mount(containerRef.current, {
            onSuccess: () => {
              onPaymentSuccess();
            },
            onError: (error: any) => {
              const msg = typeof error === "string" ? error : error?.message || "Payment failed";
              onPaymentError(msg);
            },
          });
        }

        setLoading(false);
      } catch (err: any) {
        if (!mounted) return;
        console.error("Revolut widget init error:", err);
        setWidgetError(err.message || "Failed to load payment widget");
        setLoading(false);
      }
    }

    initWidget();

    return () => {
      mounted = false;
      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch {}
        instanceRef.current = null;
      }
    };
  }, [publicId, lang, mode]);

  const formattedAmount = new Intl.NumberFormat(lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency || "ILS",
  }).format(amount);

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
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={containerRef} className={loading ? "hidden" : ""} />
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
