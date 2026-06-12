-- Disponibilités pour les expériences standalone
-- available_days : jours de semaine disponibles (1=Lundi … 7=Dimanche), défaut = tous les jours
-- blocked_dates  : dates spécifiques bloquées, stockées en ISO YYYY-MM-DD

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS available_days  JSONB DEFAULT '[1,2,3,4,5,6,7]'::jsonb,
  ADD COLUMN IF NOT EXISTS blocked_dates   JSONB DEFAULT '[]'::jsonb;
