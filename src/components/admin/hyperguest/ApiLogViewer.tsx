import { useHyperGuestLogs } from '@/hooks/admin/useHyperGuestLogs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function ApiLogViewer() {
  const { logs, loading, filter, setFilter, refresh } = useHyperGuestLogs();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'fail', 'warn'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {f === 'all' ? 'Tous' : f === 'fail' ? '❌ Fails' : '⚠️ Warnings'}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </div>

      {logs.length === 0 && !loading && (
        <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">Aucun run trouvé.</CardContent></Card>
      )}

      <div className="space-y-2">
        {logs.map(log => (
          <Collapsible key={log.id}>
            <CollapsibleTrigger className="w-full">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {log.failed_tests > 0 ? <XCircle className="h-4 w-4 text-red-600" /> :
                     log.warning_tests > 0 ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
                     <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    <span className="text-sm font-mono text-foreground">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono text-xs">
                      ✅ {log.passed_tests} | ❌ {log.failed_tests} | ⚠️ {log.warning_tests}
                    </Badge>
                    {log.duration_ms && (
                      <span className="text-xs text-muted-foreground font-mono">{(log.duration_ms / 1000).toFixed(1)}s</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-1 p-3 rounded border border-border bg-muted/30">
                <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(log.results, null, 2)}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
