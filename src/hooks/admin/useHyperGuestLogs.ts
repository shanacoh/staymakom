import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticRunLog {
  id: string;
  created_at: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warning_tests: number;
  duration_ms: number | null;
  results: any;
}

type FilterStatus = 'all' | 'fail' | 'warn';

export function useHyperGuestLogs() {
  const [logs, setLogs] = useState<DiagnosticRunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedLog, setSelectedLog] = useState<DiagnosticRunLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('diagnostic_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;
    if (!error && data) {
      let filtered = data as DiagnosticRunLog[];
      if (filter === 'fail') filtered = filtered.filter(l => l.failed_tests > 0);
      if (filter === 'warn') filtered = filtered.filter(l => l.warning_tests > 0);
      setLogs(filtered);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { logs, loading, filter, setFilter, selectedLog, setSelectedLog, refresh: fetchLogs };
}
