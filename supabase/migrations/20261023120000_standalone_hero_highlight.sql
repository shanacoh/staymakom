-- Case de gauche du haut de fiche standalone (à côté de « Annulation ») :
-- null = choix automatique selon la catégorie, sinon le type choisi dans le back-office.
ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS hero_highlight text DEFAULT NULL;

ALTER TABLE public.standalone_experiences
  DROP CONSTRAINT IF EXISTS standalone_experiences_hero_highlight_check;

ALTER TABLE public.standalone_experiences
  ADD CONSTRAINT standalone_experiences_hero_highlight_check
  CHECK (hero_highlight IS NULL OR hero_highlight IN ('duration', 'ages', 'group', 'kosher', 'languages', 'private'));

COMMENT ON COLUMN public.standalone_experiences.hero_highlight IS
  'Info clé du haut de fiche : null = auto selon la catégorie ; duration | ages | group | kosher | languages | private.';
