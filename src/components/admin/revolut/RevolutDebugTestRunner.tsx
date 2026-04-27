import { useRevolutDebug } from '@/hooks/admin/useRevolutDebug';
import { RevolutDebugResultBanner } from './RevolutDebugResultBanner';
import { RevolutDebugTestCard } from './RevolutDebugTestCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Download, FlaskConical, ShieldCheck } from 'lucide-react';
import { useRevolutAdminEnvironment } from '@/hooks/admin/useAdminEnvironment';

export function RevolutDebugTestRunner() {
  const [environment, setEnvironment] = useRevolutAdminEnvironment();
  const { results, running, runAll, verdict, lastRun, totalDuration } = useRevolutDebug(environment);

  const handleExport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      environment,
      totalDuration,
      verdict,
      steps: results,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revolut-debug-${environment}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isProd = environment === 'prod';

  return (
    <div className="space-y-4">
      {/* Toggle Sandbox / Prod */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          {isProd ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <FlaskConical className="h-5 w-5 text-amber-600" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">Environnement Revolut pour les tests</p>
            <p className="text-xs text-muted-foreground">
              {isProd
                ? 'Les tests utiliseront ta clé Revolut PRODUCTION (vraie API marchande).'
                : 'Les tests utiliseront ta clé Revolut SANDBOX (cartes de test, sans débit réel).'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label
            htmlFor="revolut-env-toggle"
            className={`text-sm font-medium cursor-pointer ${!isProd ? 'text-amber-700' : 'text-muted-foreground'}`}
          >
            SANDBOX
          </Label>
          <Switch
            id="revolut-env-toggle"
            checked={isProd}
            onCheckedChange={(checked) => setEnvironment(checked ? 'prod' : 'dev')}
            disabled={running}
            aria-label="Basculer entre Sandbox et Prod"
          />
          <Label
            htmlFor="revolut-env-toggle"
            className={`text-sm font-medium cursor-pointer ${isProd ? 'text-emerald-700' : 'text-muted-foreground'}`}
          >
            PROD
          </Label>
          <Badge
            variant={isProd ? 'default' : 'secondary'}
            className={
              isProd
                ? 'bg-emerald-600 hover:bg-emerald-700 ml-2'
                : 'bg-amber-500 hover:bg-amber-600 text-white ml-2'
            }
          >
            {isProd ? 'PROD' : 'SANDBOX'}
          </Badge>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {lastRun && <span>Dernière exécution: <span className="font-mono text-foreground">{lastRun}</span></span>}
            {totalDuration > 0 && <span>Durée totale: <span className="font-mono text-foreground">{(totalDuration / 1000).toFixed(1)}s</span></span>}
          </div>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
          <Button onClick={runAll} disabled={running} size="sm">
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exécution...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />Lancer tous les tests ({isProd ? 'PROD' : 'SANDBOX'})</>
            )}
          </Button>
        </div>
      </div>

      {/* Verdict */}
      <RevolutDebugResultBanner verdict={verdict} />

      {/* Steps */}
      <div className="space-y-2">
        {results.map((step) => (
          <RevolutDebugTestCard key={step.stepIndex} step={step} running={running} />
        ))}
      </div>
    </div>
  );
}
