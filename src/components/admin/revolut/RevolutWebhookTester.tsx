import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Webhook, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SignatureAttempt {
  label: string;
  status: number;
  response: string;
}

interface WebhookTestResult {
  webhookUrl: string;
  timestamp: string;
  officialSignature: SignatureAttempt;
  bodyOnlySignature: SignatureAttempt;
  verdict: 'broken' | 'ok' | 'ambiguous';
  diagnosis: string;
}

interface InspectedWebhook {
  id: string;
  url: string;
  events: string[];
  pointsToOurEndpoint: boolean;
  secretStatus: 'match' | 'mismatch' | 'unverifiable';
  revolutSecretPreview: string;
  missingCriticalEvents: string[];
  missingRecommendedEvents: string[];
}

interface WebhookConfigResult {
  environment: string;
  expectedUrl: string;
  localSecretPreview: string;
  webhookCount: number;
  webhooks: InspectedWebhook[];
  verdict: 'ok' | 'ok_secret_unverified' | 'no_webhook' | 'wrong_secret' | 'missing_events';
  diagnosis: string;
}

/**
 * Test de la validation de signature du webhook Revolut.
 *
 * Envoie deux faux webhooks à notre propre endpoint : l'un signé selon la règle
 * officielle Revolut, l'autre selon la méthode actuelle du code. En comparant les
 * deux réponses, on sait immédiatement si notre vérification de signature est correcte.
 *
 * Sans effet de bord : l'événement envoyé n'est géré par aucun cas du webhook,
 * donc aucune réservation n'est lue ni modifiée.
 */
export function RevolutWebhookTester() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WebhookTestResult | null>(null);
  const [checkingConfig, setCheckingConfig] = useState(false);
  const [config, setConfig] = useState<WebhookConfigResult | null>(null);

  const runTest = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('revolut-payment', {
        body: { action: 'test-webhook' },
      });
      if (error) throw new Error(error.message || 'Appel impossible');
      if (!data?.success) throw new Error(data?.error || 'Test impossible');
      setResult(data.data as WebhookTestResult);
      toast.success('Test terminé');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Test impossible : ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const runConfigCheck = async () => {
    setCheckingConfig(true);
    setConfig(null);
    try {
      const { data, error } = await supabase.functions.invoke('revolut-payment', {
        body: { action: 'check-webhook-config' },
      });
      if (error) throw new Error(error.message || 'Appel impossible');
      if (!data?.success) throw new Error(data?.error || 'Vérification impossible');
      setConfig(data.data as WebhookConfigResult);
      toast.success('Configuration récupérée');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Vérification impossible : ${msg}`);
    } finally {
      setCheckingConfig(false);
    }
  };

  const StatusBadge = ({ status }: { status: number }) => {
    if (status === 0) return <Badge variant="destructive">injoignable</Badge>;
    if (status === 401) return <Badge variant="destructive">401 — rejeté</Badge>;
    if (status >= 200 && status < 300) return <Badge className="bg-emerald-600">{status} — accepté</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Webhook className="h-5 w-5 text-indigo-500" />
          Test de la signature du webhook
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Vérifie si notre serveur accepte bien les notifications de paiement envoyées par
          Revolut. C'est ce mécanisme qui valide automatiquement les réservations
          « expérience only » après paiement — s'il est cassé, l'argent arrive mais la
          réservation reste « en attente ».
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Test <strong>sans effet de bord</strong> : on envoie un événement fictif que le
            webhook ne traite pas. Aucune réservation n'est créée, lue ou modifiée, et
            aucun paiement n'est déclenché.
          </AlertDescription>
        </Alert>

        <Button onClick={runTest} disabled={running} className="w-full" size="lg">
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <Webhook className="h-4 w-4 mr-2" />
              Lancer le test du webhook
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            <Alert
              className={
                result.verdict === 'broken'
                  ? 'border-destructive/50'
                  : result.verdict === 'ok'
                    ? 'border-emerald-500/50'
                    : 'border-amber-500/50'
              }
            >
              {result.verdict === 'broken' && <XCircle className="h-4 w-4 text-destructive" />}
              {result.verdict === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {result.verdict === 'ambiguous' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
              <AlertDescription>
                <p className="font-semibold mb-1">
                  {result.verdict === 'broken'
                    ? '❌ Vérification de signature défaillante'
                    : result.verdict === 'ok'
                      ? '✅ Vérification de signature correcte'
                      : '⚠️ Résultat ambigu'}
                </p>
                <p className="text-xs leading-relaxed">{result.diagnosis}</p>
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-3 text-xs">
              <p className="font-bold text-sm">Détail des deux essais</p>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {result.officialSignature.label}
                  </span>
                  <StatusBadge status={result.officialSignature.status} />
                </div>
                <p className="text-muted-foreground text-[11px]">
                  C'est la façon dont Revolut signe réellement ses messages. Ce résultat doit
                  être « accepté ».
                </p>
              </div>

              <div className="space-y-1 border-t pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {result.bodyOnlySignature.label}
                  </span>
                  <StatusBadge status={result.bodyOnlySignature.status} />
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Format que notre code attend aujourd'hui. S'il est « accepté » alors que
                  celui du dessus est « rejeté », c'est la preuve de l'erreur.
                </p>
              </div>

              <div className="border-t pt-3 font-mono text-[10px] text-muted-foreground break-all">
                Endpoint testé : {result.webhookUrl}
              </div>
            </div>
          </div>
        )}

        {/* ── Vérification de la configuration réelle côté Revolut ───────────────
            Le test de signature ci-dessus signe avec NOTRE secret puis le vérifie
            avec NOTRE secret : il ne prouve pas que ce secret est celui déclaré chez
            Revolut. Cette seconde vérification interroge Revolut directement. */}
        <div className="border-t pt-4 space-y-3">
          <div>
            <p className="text-sm font-semibold">Configuration déclarée chez Revolut</p>
            <p className="text-xs text-muted-foreground">
              Interroge Revolut pour savoir vers quelle URL le webhook pointe réellement,
              si son secret de signature correspond au tien, et s'il écoute les bons
              événements. C'est ce qui lève le doute que le test ci-dessus ne peut pas lever.
            </p>
          </div>

          <Button
            onClick={runConfigCheck}
            disabled={checkingConfig}
            variant="outline"
            className="w-full"
          >
            {checkingConfig ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Vérifier la configuration côté Revolut
              </>
            )}
          </Button>

          {config && (
            <div className="space-y-3">
              <Alert
                className={
                  config.verdict === 'ok'
                    ? 'border-emerald-500/50'
                    : config.verdict === 'ok_secret_unverified'
                      ? 'border-amber-500/50'
                      : 'border-destructive/50'
                }
              >
                {config.verdict === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {config.verdict === 'ok_secret_unverified' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                {config.verdict !== 'ok' && config.verdict !== 'ok_secret_unverified' && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription>
                  <p className="font-semibold mb-1">
                    {config.verdict === 'ok'
                      ? '✅ Webhook correctement paramétré'
                      : config.verdict === 'ok_secret_unverified'
                        ? '🟡 Paramétrage correct — secret non vérifiable'
                        : '❌ Problème de paramétrage'}
                  </p>
                  <p className="text-xs leading-relaxed">{config.diagnosis}</p>
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Environnement</span>
                  <Badge variant="secondary">{config.environment}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Webhooks déclarés</span>
                  <Badge variant="secondary">{config.webhookCount}</Badge>
                </div>
                <div className="text-muted-foreground text-[10px] font-mono break-all">
                  Notre endpoint attendu : {config.expectedUrl}
                </div>

                {config.webhooks.map((w) => (
                  <div key={w.id || w.url} className="border-t pt-2 space-y-1">
                    <div className="font-mono text-[10px] break-all">{w.url}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Pointe vers notre endpoint</span>
                      {w.pointsToOurEndpoint
                        ? <Badge className="bg-emerald-600">oui</Badge>
                        : <Badge variant="destructive">non</Badge>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Secret identique au nôtre</span>
                      {w.secretStatus === 'match' && <Badge className="bg-emerald-600">oui</Badge>}
                      {w.secretStatus === 'mismatch' && <Badge variant="destructive">non</Badge>}
                      {w.secretStatus === 'unverifiable' && <Badge variant="secondary">non vérifiable</Badge>}
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      Secret Revolut : {w.revolutSecretPreview} · Secret Supabase : {config.localSecretPreview}
                    </div>
                    {w.secretStatus === 'unverifiable' && (
                      <p className="text-muted-foreground text-[10px] italic">
                        Revolut ne communique le signing secret qu'à la création du webhook et
                        lors d'une rotation — jamais en lecture. « Non vérifiable » n'est donc
                        pas un défaut de configuration.
                      </p>
                    )}
                    <div className="text-muted-foreground text-[10px]">
                      Événements écoutés : {w.events.length > 0 ? w.events.join(', ') : 'aucun'}
                    </div>
                    {w.missingCriticalEvents.length > 0 && (
                      <p className="text-destructive text-[10px] font-semibold">
                        Manque (critique) : {w.missingCriticalEvents.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
