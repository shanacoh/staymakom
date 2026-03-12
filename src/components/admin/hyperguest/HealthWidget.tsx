/**
 * Health Widget for Config Page
 * Shows last health check status and 24h history
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HealthCheck {
  id: string;
  status: 'healthy' | 'unhealthy';
  results: any;
  created_at: string;
}

export function HealthWidget() {
  const { data: healthChecks = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['health-checks-24h'],
    queryFn: async () => {
      const since = new Date();
      since.setHours(since.getHours() - 24);
      
      const { data, error } = await supabase
        .from('health_checks')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(24);
      
      if (error) throw error;
      return data as HealthCheck[];
    },
    refetchInterval: 60000,
  });

  const { data: alertCount = 0 } = useQuery({
    queryKey: ['alerts-unresolved-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const latest = healthChecks[0];
  const isHealthy = latest?.status === 'healthy';

  // Take last 24 checks for the graph (one per hour ideally)
  const graphData = healthChecks.slice(0, 24).reverse();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Monitoring HyperGuest</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Last check status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
            ) : isHealthy ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                Dernier health check: {latest ? (
                  <Badge variant={isHealthy ? 'default' : 'destructive'} className="ml-2">
                    {latest.status}
                  </Badge>
                ) : 'Aucun'}
              </p>
              {latest && (
                <p className="text-xs text-muted-foreground">
                  {new Date(latest.created_at).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active alerts */}
        {alertCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {alertCount} alerte{alertCount > 1 ? 's' : ''} non résolue{alertCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* 24h graph (GitHub contribution style) */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Dernières 24h</p>
          <div className="flex gap-1 flex-wrap">
            {graphData.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Aucune donnée</p>
            ) : (
              graphData.map((check) => (
                <div
                  key={check.id}
                  className={`w-4 h-4 rounded-sm ${
                    check.status === 'healthy'
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                  }`}
                  title={`${new Date(check.created_at).toLocaleString('fr-FR')} — ${check.status}`}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default HealthWidget;
