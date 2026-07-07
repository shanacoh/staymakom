-- Corrige un bug : le code (commit "Catégories trilingues FR" du 2026-06-28)
-- lit presentation_title_fr et intro_rich_text_fr sur la table categories,
-- mais ces colonnes n'avaient jamais été créées, ce qui faisait échouer
-- toute lecture d'une fiche catégorie (page "Category not found").
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS presentation_title_fr TEXT,
ADD COLUMN IF NOT EXISTS intro_rich_text_fr TEXT;

COMMENT ON COLUMN public.categories.presentation_title_fr IS 'French translation of the presentation title';
COMMENT ON COLUMN public.categories.intro_rich_text_fr IS 'French translation of the intro rich text';
