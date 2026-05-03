import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ShieldCheck, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmbeddedCheckoutInstance } from "@revolut/checkout";

interface RevolutDebugInfo {
  mode: string;
  publicTokenPreview: string;
  orderIdPreview: string;
  hostname: string;
  isHttps: boolean;
  isLocalhost: boolean;
  userAgent: string;
  browser: string;
  applePayWindowExists: boolean;
  applePayCanMakePayments: boolean | null;
  paymentRequestSupported: boolean;
  errorMessages: string[];
}

/** Détecte le navigateur principal — utile pour savoir si Apple Pay (Safari) ou
 *  Google Pay (Chrome) peuvent même apparaître. */
function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/CriOS|Chrome/i.test(ua)) return "Chrome";
  if (/EdgiOS|Edg/i.test(ua)) return "Edge";
  if (/Firefox|FxiOS/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg/i.test(ua)) return "Safari";
  return "other";
}

/** Vérifie si le navigateur supporte Apple Pay et si l'utilisateur peut effectivement
 *  payer (a une carte enregistrée dans Wallet, etc.). */
function checkApplePay(): { exists: boolean; canPay: boolean | null } {
  if (typeof window === "undefined") return { exists: false, canPay: null };
  const ApplePaySession = (window as unknown as { ApplePaySession?: { canMakePayments?: () => boolean } }).ApplePaySession;
  if (!ApplePaySession) return { exists: false, canPay: null };
  try {
    return { exists: true, canPay: ApplePaySession.canMakePayments?.() ?? null };
  } catch {
    return { exists: true, canPay: null };
  }
}

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
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<RevolutDebugInfo | null>(null);

  const resolvedEnv = environment ?? (import.meta.env.VITE_REVOLUT_ENV === "production" ? "production" : "dev");
  const mode: "prod" | "sandbox" = resolvedEnv === "production" ? "prod" : "sandbox";

  // Collecte des infos debug à chaque render pour faciliter le diagnostic des
  // méthodes de paiement manquantes (Apple Pay, Revolut Pay).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apple = checkApplePay();
    const browser = detectBrowser();
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
    const info: RevolutDebugInfo = {
      mode,
      publicTokenPreview: merchantPublicKey
        ? `${merchantPublicKey.substring(0, 5)}...${merchantPublicKey.substring(merchantPublicKey.length - 4)}`
        : "MISSING",
      orderIdPreview: publicId ? `${publicId.substring(0, 8)}...` : "MISSING",
      hostname,
      isHttps: window.location.protocol === "https:",
      isLocalhost,
      userAgent: navigator.userAgent,
      browser,
      applePayWindowExists: apple.exists,
      applePayCanMakePayments: apple.canPay,
      paymentRequestSupported: typeof window.PaymentRequest !== "undefined",
      errorMessages: [],
    };
    setDebugInfo(info);
    // Logs verbeux en console pour qu'on puisse voir directement pourquoi telle
    // ou telle méthode n'apparaît pas.
    console.group("🔍 Revolut Widget Debug");
    console.log("Mode:", info.mode);
    console.log("Merchant public key:", info.publicTokenPreview);
    console.log("Order publicId:", info.orderIdPreview);
    console.log("Hostname:", info.hostname);
    console.log("HTTPS:", info.isHttps);
    console.log("Localhost:", info.isLocalhost, isLocalhost ? "⚠️ Apple Pay et Revolut Pay sont souvent bloqués sur localhost" : "");
    console.log("Browser:", info.browser);
    console.log("Apple Pay (window.ApplePaySession):", info.applePayWindowExists);
    console.log("Apple Pay canMakePayments():", info.applePayCanMakePayments, info.applePayCanMakePayments === false ? "⚠️ Pas de carte dans Wallet ou domaine non validé" : "");
    console.log("PaymentRequest API (Google Pay):", info.paymentRequestSupported);
    console.groupEnd();
  }, [mode, merchantPublicKey, publicId]);

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
        console.log("🔍 Revolut SDK loaded, calling embeddedCheckout with mode:", mode);

        const instance = await RevolutCheckout.embeddedCheckout({
          mode,
          publicToken: merchantPublicKey!,
          target: containerRef.current,
          locale: lang === "he" ? "en" : lang,
          email: customerEmail || undefined,
          // createOrder est appelé par Revolut quand le client clique sur un moyen
          // de paiement. On retourne le publicId de l'ordre déjà créé en amont.
          createOrder: async () => {
            console.log("🔍 [Revolut] createOrder callback triggered, returning publicId:", publicId.substring(0, 12) + "...");
            return { publicId };
          },
          onSuccess: (payload) => {
            console.log("✅ [Revolut] onSuccess fired with payload:", payload);
            onPaymentSuccess(payload?.orderId);
          },
          onError: (payload) => {
            console.error("❌ [Revolut] onError fired with payload:", payload);
            const msg = payload?.error?.message || "Payment failed";
            onPaymentError(msg);
          },
          onCancel: (payload) => {
            console.warn("⚠️ [Revolut] onCancel fired with payload:", payload);
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
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {/* Container où Revolut rend son widget complet (Revolut Pay, Carte, Google Pay…).
          Pas de max-height : on laisse Revolut occuper la hauteur naturelle de ses
          méthodes. Le scroll est géré par la Dialog parent si besoin. */}
      <div
        ref={containerRef}
        className={loading ? "hidden" : "w-full"}
        style={loading ? undefined : { minHeight: "500px" }}
      />
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            {lang === "he"
              ? "תשלום מאובטח באמצעות Revolut"
              : lang === "fr"
                ? "Paiement sécurisé par Revolut"
                : "Secured by Revolut"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowDebug((s) => !s)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          title="Afficher les infos de debug"
        >
          <Bug className="h-3 w-3" />
          {showDebug ? "Hide debug" : "Debug"}
        </button>
      </div>
      {showDebug && debugInfo && (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs font-mono space-y-1 max-h-[200px] overflow-y-auto">
          <p className="font-bold text-sm mb-2">🔍 Diagnostic widget Revolut</p>
          <div><span className="text-muted-foreground">Mode :</span> <span className={debugInfo.mode === "prod" ? "text-emerald-600" : "text-amber-600"}>{debugInfo.mode}</span></div>
          <div><span className="text-muted-foreground">Merchant public key :</span> {debugInfo.publicTokenPreview === "MISSING" ? <span className="text-red-600">MISSING ❌</span> : <span className="text-emerald-600">{debugInfo.publicTokenPreview}</span>}</div>
          <div><span className="text-muted-foreground">Order publicId :</span> {debugInfo.orderIdPreview}</div>
          <div><span className="text-muted-foreground">Hostname :</span> {debugInfo.hostname}{debugInfo.isLocalhost && <span className="text-amber-600 ml-2">⚠️ localhost</span>}</div>
          <div><span className="text-muted-foreground">HTTPS :</span> {debugInfo.isHttps ? "✅" : <span className="text-amber-600">❌ HTTP only</span>}</div>
          <div><span className="text-muted-foreground">Browser :</span> {debugInfo.browser}</div>
          <div className="border-t mt-2 pt-2">
            <p className="font-bold mb-1">🍎 Apple Pay</p>
            <div className="pl-2"><span className="text-muted-foreground">window.ApplePaySession :</span> {debugInfo.applePayWindowExists ? "✅" : <span className="text-red-600">❌ Browser ne supporte pas (besoin de Safari)</span>}</div>
            <div className="pl-2"><span className="text-muted-foreground">canMakePayments() :</span> {debugInfo.applePayCanMakePayments === null ? "n/a" : debugInfo.applePayCanMakePayments ? "✅" : <span className="text-amber-600">❌ Pas de Wallet card OU domaine non validé Apple</span>}</div>
            {debugInfo.isLocalhost && <p className="pl-2 text-amber-700">⚠️ Sur localhost, Apple Pay est généralement bloqué (besoin domaine HTTPS validé Apple)</p>}
          </div>
          <div className="border-t mt-2 pt-2">
            <p className="font-bold mb-1">💳 Revolut Pay / Google Pay</p>
            <div className="pl-2"><span className="text-muted-foreground">PaymentRequest API :</span> {debugInfo.paymentRequestSupported ? "✅" : "❌"}</div>
            <p className="pl-2 text-muted-foreground">Si Revolut Pay n'apparaît pas malgré la configuration sandbox, c'est probablement parce que :</p>
            <ul className="pl-4 text-muted-foreground list-disc">
              <li>Le merchant sandbox n'a pas Revolut Pay activé</li>
              <li>Le domaine localhost n'est pas autorisé pour Revolut Pay</li>
              <li>Le compte sandbox a une limitation</li>
            </ul>
          </div>
          <div className="border-t mt-2 pt-2">
            <p className="text-muted-foreground">📚 Doc Revolut : <a href="https://developer.revolut.com/docs/accept-payments/payment-methods/cards" target="_blank" rel="noopener noreferrer" className="text-primary underline">developer.revolut.com</a></p>
          </div>
        </div>
      )}
    </div>
  );
}
