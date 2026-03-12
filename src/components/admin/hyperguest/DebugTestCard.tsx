import { type DebugStepResult } from '@/hooks/admin/useHyperGuestDebug';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, CheckCircle2, XCircle, Loader2, SkipForward, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  step: DebugStepResult;
  running: boolean;
}

export function DebugTestCard({ step, running }: Props) {
  const [open, setOpen] = useState(step.pass === false);

  const statusIcon = () => {
    if (running && !step.skipped && step.pass === null) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (step.skipped) return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    if (step.pass === true) return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (step.pass === false) return <XCircle className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  const statusLabel = () => {
    if (step.skipped) return <span className="text-xs text-muted-foreground font-mono">⏸️ Skipped</span>;
    if (step.pass === true) return <span className="text-xs text-emerald-600 font-mono">✅ OK</span>;
    if (step.pass === false) return <span className="text-xs text-red-600 font-mono">❌ FAIL</span>;
    if (running) return <span className="text-xs text-muted-foreground font-mono">⏳</span>;
    return null;
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          {statusIcon()}
          <span className="text-sm font-medium text-foreground">
            ÉTAPE {step.stepIndex + 1} — {step.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {statusLabel()}
          {step.duration > 0 && (
            <span className="text-xs text-muted-foreground font-mono">[{(step.duration / 1000).toFixed(1)}s]</span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 ml-7 p-3 rounded-lg border border-border bg-muted/30 space-y-2">
          {step.tests?.map(t => (
            <div key={t.id} className="flex items-start gap-2 text-sm">
              {t.pass === true && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />}
              {t.pass === false && <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />}
              {t.pass === null && <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />}
              <span className="text-foreground/80">{t.id} {t.name}</span>
              <span className="text-muted-foreground ml-auto font-mono text-xs">→ {t.detail}</span>
            </div>
          ))}
          {!step.tests?.length && (
            <p className="text-sm text-muted-foreground">{step.detail}</p>
          )}
          {step.warning && (
            <div className="flex items-start gap-2 mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">{step.warning}</p>
            </div>
          )}
          {step.diagnosis && (
            <div className="mt-2 p-2 rounded bg-muted border border-border">
              <p className="text-xs text-foreground/70 font-mono whitespace-pre-wrap">💡 {step.diagnosis}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
