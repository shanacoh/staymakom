-- Colonnes Open Graph manquantes dans standalone_experiences

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS og_title_en       TEXT,
  ADD COLUMN IF NOT EXISTS og_title_fr       TEXT,
  ADD COLUMN IF NOT EXISTS og_title_he       TEXT,
  ADD COLUMN IF NOT EXISTS og_description_en TEXT,
  ADD COLUMN IF NOT EXISTS og_description_fr TEXT,
  ADD COLUMN IF NOT EXISTS og_description_he TEXT;
