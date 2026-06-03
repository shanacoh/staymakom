-- Colonnes manquantes dans standalone_experiences,
-- nécessaires pour le formulaire admin.

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS cancellation_policy_fr  TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_image          TEXT,
  ADD COLUMN IF NOT EXISTS featured_on_home         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS home_display_order       INTEGER DEFAULT 0;
