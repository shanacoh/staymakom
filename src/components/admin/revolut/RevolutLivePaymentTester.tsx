import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createRevolutOrder } from '@/services/revolut';
import RevolutPaymentWidget from '@/components/experience/RevolutPaymentWidget';
import { useRevolutAdminEnvironment } from '@/hooks/admin/useAdminEnvironment';

/**
 * Composant de test "live payment" : crée un vrai ordre Revolut de petit montant et
 * ouvre le widget pour tester Apple Pay / Google Pay / Carte / Revolut Pay sans
 * passer par le flow de réservation HyperGuest. Utile pour valider que les méthodes
 * de paiement s'affichent correctement et que la popup fonctionne.
 *
 * ⚠️ En PROD : le paiement débite vraiment ta carte. Tu rembourses ensuite via le
 * dashboard Revolut Business. En SANDBOX : aucun débit réel, utilise les cartes de test.
 */
export function RevolutLivePaymentTester() {
  const [environment] = useRevolutAdminEnvironment();
  const [amount, setAmount] = useState<number>(1);
  const [currency, setCurrency] = useState<string>("USD");
  const [creating, setCreating] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    publicId: string;
    state: string;
    environment: "production" | "dev";
    merchantPublicKey?: string;
  } | null>(null);
  const [paymentResult, setPaymentResult] = useState<{ status: "success" | "error" | "cancelled"; message: string; orderId?: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isProd = environment === "prod";

  const handleStartTest = async () => {
    if (amount <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }
    setCreating(true);
    setOrderResult(null);
    setPaymentResult(null);
    try {
      const order = await createRevolutOrder({
        amount,
        currency,
        description: `StayMakom — Live payment test (${isProd ? "PROD" : "SANDBOX"})`,
        customerEmail: "test@staymakom.com",
        customerName: "Test Customer",
      });
      setOrderResult({
        orderId: order.orderId,
        publicId: order.publicId,
        state: order.state,
        environment: order.environment,
        merchantPublicKey: order.merchantPublicKey,
      });
      setDialogOpen(true);
      toast.success(`Ordre Revolut créé (${order.orderId.substring(0, 12)}...)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Création d'ordre échouée : ${msg}`);
      setPaymentResult({ status: "error", message: msg });
    } finally {
      setCreating(false);
    }
  };

  const dashboardUrl = isProd
    ? "https://business.revolut.com/merchant/orders"
    : "https://sandbox-business.revolut.com/merchant/orders";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-amber-500" />
          Test paiement live
          <Badge variant={isProd ? "default" : "secondary"} className={isProd ? "bg-emerald-600" : "bg-amber-500 text-white"}>
            {isProd ? "PROD" : "SANDBOX"}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Crée un vrai ordre Revolut isolé du flow réservation HyperGuest. Te permet de
          tester Apple Pay, Google Pay, Carte et Revolut Pay sur ton site live, avec un
          montant minimal.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProd && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Mode production actif.</strong> Le paiement va réellement débiter
              la carte utilisée. Pense à rembourser via le{" "}
              <a href={dashboardUrl} target="_blank" rel="noopener noreferrer" className="underline">
                dashboard Revolut
              </a>{" "}
              après le test.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="test-amount">Montant</Label>
            <Input
              id="test-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              disabled={creating}
            />
          </div>
          <div>
            <Label htmlFor="test-currency">Devise</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={creating}>
              <SelectTrigger id="test-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="ILS">ILS (₪)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleStartTest}
          disabled={creating || amount <= 0}
          className="w-full"
          size="lg"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création de l'ordre Revolut...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Lancer un test paiement de {amount} {currency}
            </>
          )}
        </Button>

        {orderResult && (
          <div className="rounded-lg border bg-muted/30 p-3 text-xs font-mono space-y-1">
            <p className="font-bold text-sm mb-2">📋 Ordre Revolut créé</p>
            <div><span className="text-muted-foreground">Order ID :</span> {orderResult.orderId}</div>
            <div><span className="text-muted-foreground">Public ID :</span> {orderResult.publicId.substring(0, 30)}...</div>
            <div><span className="text-muted-foreground">État initial :</span> {orderResult.state}</div>
            <div><span className="text-muted-foreground">Environnement :</span> {orderResult.environment}</div>
            <div><span className="text-muted-foreground">Merchant key :</span> {orderResult.merchantPublicKey ? "✅" : "❌ MISSING"}</div>
            <a
              href={`${dashboardUrl}/${orderResult.orderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline flex items-center gap-1 mt-2"
            >
              <ExternalLink className="h-3 w-3" />
              Voir cet ordre dans le dashboard Revolut
            </a>
          </div>
        )}

        {paymentResult && (
          <Alert className={paymentResult.status === "success" ? "border-emerald-500/50" : paymentResult.status === "cancelled" ? "border-amber-500/50" : "border-destructive/50"}>
            {paymentResult.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            {paymentResult.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
            {paymentResult.status === "cancelled" && <AlertTriangle className="h-4 w-4 text-amber-600" />}
            <AlertDescription>
              <p className="font-semibold">
                {paymentResult.status === "success"
                  ? "✅ Paiement validé !"
                  : paymentResult.status === "cancelled"
                    ? "⚠️ Paiement annulé"
                    : "❌ Paiement échoué"}
              </p>
              <p className="text-xs mt-1">{paymentResult.message}</p>
              {paymentResult.status === "success" && paymentResult.orderId && (
                <p className="text-xs mt-2 font-mono">
                  N'oublie pas de rembourser cet ordre :{" "}
                  <a
                    href={`${dashboardUrl}/${paymentResult.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {paymentResult.orderId.substring(0, 16)}...
                  </a>
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Popup de paiement Revolut — réutilise le même widget que le checkout client.
          modal=false pour que la popup 3D Secure / Apple Pay puisse communiquer en retour. */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Test paiement {amount} {currency}</DialogTitle>
            <DialogDescription>
              Choisis une méthode de paiement et finalise.
              {isProd && " ⚠️ Mode production — vraie transaction !"}
            </DialogDescription>
          </DialogHeader>
          {orderResult && (
            <RevolutPaymentWidget
              publicId={orderResult.publicId}
              merchantPublicKey={orderResult.merchantPublicKey ?? undefined}
              environment={orderResult.environment}
              customerEmail="test@staymakom.com"
              onPaymentSuccess={(paymentId) => {
                setDialogOpen(false);
                setPaymentResult({
                  status: "success",
                  message: `Paiement de ${amount} ${currency} validé chez Revolut.`,
                  orderId: paymentId || orderResult.orderId,
                });
                toast.success("Paiement validé !");
              }}
              onPaymentError={(err) => {
                setDialogOpen(false);
                setPaymentResult({ status: "error", message: err });
                toast.error(err);
              }}
              onPaymentCancel={() => {
                setDialogOpen(false);
                setPaymentResult({ status: "cancelled", message: "Tu as fermé la popup avant de payer." });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
