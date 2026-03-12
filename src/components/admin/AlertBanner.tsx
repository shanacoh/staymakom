/**
 * Admin Alert Banner
 * Displays active alerts at the top of the admin backoffice
 * Only visible on /admin/* routes when there are unresolved alerts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
    refetchInterval: 60000, // Refresh every minute
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

  const latestAlert = alerts[0];
  const timeSince = getTimeSince(latestAlert.created_at);

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm">
            ⚠️ {alerts.length} alerte{alerts.length > 1 ? 's' : ''} active{alerts.length > 1 ? 's' : ''}
            {' — '}
            {latestAlert.message.length > 60 
              ? latestAlert.message.substring(0, 60) + '...' 
              : latestAlert.message}
          </p>
          <p className="text-xs text-red-100">Dernière vérification: {timeSince}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white border-0"
        >
          <Link to="/admin/hyperguest/debug">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Voir détails
          </Link>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => resolveAlert.mutate(latestAlert.id)}
          disabled={resolveAlert.isPending}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Résolu
        </Button>
      </div>
    </div>
  );
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays}j`;
}

export default AlertBanner;
