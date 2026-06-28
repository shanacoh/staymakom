-- Ajoute le champ name_fr à la table categories
-- pour permettre de saisir le nom en français depuis le back office
-- et avoir une source unique de vérité pour chaque langue

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_fr text;
