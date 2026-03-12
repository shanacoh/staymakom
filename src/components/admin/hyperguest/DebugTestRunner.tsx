import { useHyperGuestDebug } from '@/hooks/admin/useHyperGuestDebug';
import { DebugResultBanner } from './DebugResultBanner';
import { DebugTestCard } from './DebugTestCard';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Download } from 'lucide-react';

export function DebugTestRunner() {
  const { results, running, runAll, verdict, lastRun, totalDuration } = useHyperGuestDebug();

  const handleExport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      verdict,
      steps: results,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hg-debug-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
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
              <><Play className="h-4 w-4 mr-2" />Lancer tous les tests</>
            )}
          </Button>
        </div>
      </div>

      {/* Verdict */}
      <DebugResultBanner verdict={verdict} />

      {/* Steps */}
      <div className="space-y-2">
        {results.map((step) => (
          <DebugTestCard key={step.stepIndex} step={step} running={running} />
        ))}
      </div>
    </div>
  );
}
