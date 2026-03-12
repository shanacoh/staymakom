import { DiagnosticBloc as BlocType } from '@/hooks/admin/useDiagnostic';
import { DiagnosticTest } from './DiagnosticTest';
import { Button } from '@/components/ui/button';
import { Play, Loader2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DiagnosticBlocProps {
  bloc: BlocType;
  onRun: () => void;
}

export const DiagnosticBloc = ({ bloc, onRun }: DiagnosticBlocProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const passed = bloc.tests.filter(t => t.pass === true).length;
  const failed = bloc.tests.filter(t => t.pass === false).length;
  const warnings = bloc.tests.filter(t => t.warning).length;
  const total = bloc.tests.length;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-4 bg-muted/30">
          <CollapsibleTrigger className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            <div className="text-left">
              <h3 className="font-semibold text-base">
                BLOC {bloc.id} — {bloc.name}
              </h3>
              {total > 0 && (
                <div className="flex gap-3 mt-1 text-xs">
                  {passed > 0 && <span className="text-emerald-600">✅ {passed}</span>}
                  {failed > 0 && <span className="text-red-600">❌ {failed}</span>}
                  {warnings > 0 && <span className="text-yellow-600">⚠️ {warnings}</span>}
                </div>
              )}
            </div>
          </CollapsibleTrigger>
          
          <Button
            onClick={onRun}
            disabled={bloc.running}
            size="sm"
            variant="outline"
            className="ml-4"
          >
            {bloc.running ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run
              </>
            )}
          </Button>
        </div>

        <CollapsibleContent>
          {bloc.tests.length > 0 ? (
            <div className="p-2 space-y-1">
              {bloc.tests.map(test => (
                <DiagnosticTest key={test.id} test={test} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Click "Run" to execute tests
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};