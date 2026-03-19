-- Fix: Drop policies created by our fix migration that will be recreated by 20260309020008
DROP POLICY IF EXISTS "Admins can view health checks" ON public.health_checks;
DROP POLICY IF EXISTS "Service can insert health checks" ON public.health_checks;
DROP POLICY IF EXISTS "Admins can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service can insert alerts" ON public.alerts;
