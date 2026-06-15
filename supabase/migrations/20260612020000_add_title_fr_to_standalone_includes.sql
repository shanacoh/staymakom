-- Ajout de la colonne title_fr manquante dans standalone_experience_includes
-- Les trois langues supportées sont : anglais (title), français (title_fr), hébreu (title_he)

ALTER TABLE public.standalone_experience_includes
  ADD COLUMN IF NOT EXISTS title_fr TEXT;
