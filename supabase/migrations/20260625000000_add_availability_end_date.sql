-- Ajout d'une date de fin de disponibilité pour les expériences standalone
-- Par défaut : 6 mois à partir d'aujourd'hui

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS availability_end_date DATE;

-- Initialiser les expériences existantes à aujourd'hui + 6 mois
UPDATE public.standalone_experiences
SET availability_end_date = (CURRENT_DATE + INTERVAL '6 months')::DATE
WHERE availability_end_date IS NULL;
