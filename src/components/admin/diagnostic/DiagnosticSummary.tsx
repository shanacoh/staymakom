import { DiagnosticBloc } from '@/hooks/admin/useDiagnostic';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface DiagnosticSummaryProps {
  blocs: DiagnosticBloc[];
}

export const DiagnosticSummary = ({ blocs }: DiagnosticSummaryProps) => {
  const allTests = blocs.flatMap(b => b.tests);
  const passed = allTests.filter(t => t.pass === true).length;
  const failed = allTests.filter(t => t.pass === false).length;
  const warnings = allTests.filter(t => t.warning).length;
  const na = allTests.filter(t => t.pass === null && !t.warning).length;
  const total = allTests.length;

  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Global Summary</h2>
          <div className="text-2xl font-bold text-emerald-600">{percentage}%</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <div className="text-2xl font-bold">{passed}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-2xl font-bold">{failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold">{warnings}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{na}</div>
              <div className="text-xs text-muted-foreground">N/A</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {blocs.map(bloc => {
            const blocTests = bloc.tests;
            const blocPassed = blocTests.filter(t => t.pass === true).length;
            const blocTotal = blocTests.length;
            const blocPercentage = blocTotal > 0 ? Math.round((blocPassed / blocTotal) * 100) : 0;
            
            return (
              <div key={bloc.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-8">
                  Bloc {bloc.id}
                </span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${blocPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-12 text-right">
                  {blocPassed}/{blocTotal}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};