import { type DebugVerdict } from '@/hooks/admin/useHyperGuestDebug';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface Props {
  verdict: DebugVerdict;
}

export function DebugResultBanner({ verdict }: Props) {
  if (verdict.type === 'idle') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-muted-foreground">{verdict.message}</p>
          <p className="text-sm text-muted-foreground mt-1">{verdict.action}</p>
        </div>
      </div>
    );
  }

  const config = {
    success: { bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', icon: CheckCircle2, iconColor: 'text-emerald-600', label: '✅ Tout fonctionne' },
    error: { bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800', icon: XCircle, iconColor: 'text-red-600', label: `❌ Problème : ${verdict.source}` },
    warning: { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', icon: AlertTriangle, iconColor: 'text-amber-600', label: `⚠️ Problème : ${verdict.source}` },
  }[verdict.type] || { bg: '', icon: Info, iconColor: '', label: '' };

  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-3 ${config.bg}`}>
      <Icon className={`h-6 w-6 mt-0.5 shrink-0 ${config.iconColor}`} />
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{config.label}</p>
        <p className="text-sm text-foreground/80 mt-1">{verdict.message}</p>
        <p className="text-sm text-muted-foreground mt-1">→ {verdict.action}</p>
      </div>
    </div>
  );
}
