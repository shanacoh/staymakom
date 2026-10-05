-- Sprint 5C : version française des inclus ("Le séjour comprend") des
-- expériences hôtel. Jusqu'ici la table n'avait que l'anglais (title,
-- description) et l'hébreu (title_he, description_he).
-- Colonnes optionnelles (nullable) : tant qu'elles sont vides, le site
-- continue d'afficher le texte anglais comme aujourd'hui. Aucune colonne
-- existante n'est modifiée.

ALTER TABLE public.experience2_includes
  ADD COLUMN IF NOT EXISTS title_fr text,
  ADD COLUMN IF NOT EXISTS description_fr text;
