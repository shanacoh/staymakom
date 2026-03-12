-- Create table for diagnostic runs history
CREATE TABLE IF NOT EXISTS public.diagnostic_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  total_tests integer NOT NULL,
  passed_tests integer NOT NULL,
  failed_tests integer NOT NULL,
  warning_tests integer NOT NULL,
  results jsonb NOT NULL,
  duration_ms integer
);

-- Enable RLS
ALTER TABLE public.diagnostic_runs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage diagnostic runs
CREATE POLICY "Admins can manage diagnostic runs"
ON public.diagnostic_runs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));