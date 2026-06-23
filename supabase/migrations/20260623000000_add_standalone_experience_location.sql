-- Localisation structurée pour les expériences standalone (même modèle que hotels/hotels2)
-- Permet d'afficher ville/région/carte côté public, comme c'est déjà le cas pour les
-- expériences avec hôtel (localisation gérée jusqu'ici par la fiche hôtel).

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS city          TEXT,
  ADD COLUMN IF NOT EXISTS city_he       TEXT,
  ADD COLUMN IF NOT EXISTS city_fr       TEXT,
  ADD COLUMN IF NOT EXISTS region        TEXT,
  ADD COLUMN IF NOT EXISTS region_he     TEXT,
  ADD COLUMN IF NOT EXISTS region_fr     TEXT,
  ADD COLUMN IF NOT EXISTS latitude      NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude     NUMERIC,
  ADD COLUMN IF NOT EXISTS address_fr    TEXT;

-- Reprise non destructive de l'ancien champ libre "region_type" vers le nouveau champ
-- structuré "region". La colonne region_type est conservée mais n'est plus utilisée
-- par le code applicatif après cette migration.
UPDATE public.standalone_experiences
SET region = region_type
WHERE region_type IS NOT NULL AND region IS NULL;
