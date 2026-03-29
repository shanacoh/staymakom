/**
 * Admin Alert Banner
 * Displays active CRITICAL alerts at the top of the admin backoffice.
 * Info/warning alerts show as a small subtle toast-style indicator.
 * Only visible on /admin/* routes when there are unresolved critical alerts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, ExternalLink, CheckCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: any;
  created_at: string;
  resolved: boolean;
}

export function AlertBanner() {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['admin-alerts-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Alert[];
    },
    refetchInterval: 60000,
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts-active'] });
    },
  });

  if (isLoading || alerts.length === 0) return null;

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !dismissed.has(a.id));
  const nonCriticalAlerts = alerts.filter((a) => a.severity !== 'critical' && !dismissed.has(a.id));

  // Only show banner for critical alerts
  if (criticalAlerts.length === 0 && nonCriticalAlerts.length === 0) return null;

  return (
    <>
      {/* Critical alerts — compact amber banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm font-medium truncate">
              {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''}
              {' — '}
              {criticalAlerts[0].message.length > 80
                ? criticalAlerts[0].message.substring(0, 80) + '...'
                : criticalAlerts[0].message}
            </p>
            <span className="text-xs text-amber-500 shrink-0">{getTimeSince(criticalAlerts[0].created_at)}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            >
              <Link to="/admin/hyperguest/debug">
                <ExternalLink className="h-3 w-3 mr-1" />
                Détails
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              onClick={() => resolveAlert.mutate(criticalAlerts[0].id)}
              disabled={resolveAlert.isPending}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Résolu
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-amber-400 hover:text-amber-600 hover:bg-amber-100"
              onClick={() => setDismissed((prev) => new Set([...prev, criticalAlerts[0].id]))}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Non-critical alerts — tiny subtle indicator, only if no critical */}
      {criticalAlerts.length === 0 && nonCriticalAlerts.length > 0 && (
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">
              {nonCriticalAlerts.length} notification{nonCriticalAlerts.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-slate-300 hover:text-slate-500"
            onClick={() => setDismissed((prev) => {
              const next = new Set(prev);
              nonCriticalAlerts.forEach((a) => next.add(a.id));
              return next;
            })}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </>
  );
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `${diffMins}min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}j`;
}

export default AlertBanner;
