import { useDiagnostic } from '@/hooks/admin/useDiagnostic';
import { DiagnosticBloc } from '@/components/admin/diagnostic/DiagnosticBloc';
import { DiagnosticSummary } from '@/components/admin/diagnostic/DiagnosticSummary';
import { DiagnosticExport } from '@/components/admin/diagnostic/DiagnosticExport';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Loader2 } from 'lucide-react';
import { useState } from 'react';

const DiagnosticPage = () => {
  const { blocs, runBloc, runAll } = useDiagnostic();
  const [runningAll, setRunningAll] = useState(false);

  const handleRunAll = async () => {
    setRunningAll(true);
    await runAll();
    setRunningAll(false);
  };

  const environment = import.meta.env.VITE_SUPABASE_URL?.includes('localhost') ? 'DEV' : 'PROD';
  const allTests = blocs.flatMap(b => b.tests);
  const lastRun = allTests.length > 0 ? new Date().toLocaleString('fr-FR') : 'Never';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold">STAYMAKOM — System Diagnostic</h1>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>Environment: <span className="font-mono font-semibold text-foreground">{environment}</span></span>
                <span>Token: <span className="font-mono">...995b5f4</span></span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Last run: {lastRun}
              </div>
            </div>
            
            <div className="flex gap-2">
              <DiagnosticExport blocs={blocs} />
              <Button
                onClick={handleRunAll}
                disabled={runningAll}
                size="sm"
              >
                {runningAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running All...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run All
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {allTests.length > 0 && <DiagnosticSummary blocs={blocs} />}

      {/* Test Blocs */}
      <div className="space-y-4">
        {blocs.map(bloc => (
          <DiagnosticBloc
            key={bloc.id}
            bloc={bloc}
            onRun={() => runBloc(bloc.id)}
          />
        ))}
      </div>

      {/* Footer Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Note:</strong> Tests are executed against live HyperGuest API.</p>
            <p>Bloc C tests are dry-checks only (no real bookings created).</p>
            <p>Results are automatically saved to database for historical tracking.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticPage;