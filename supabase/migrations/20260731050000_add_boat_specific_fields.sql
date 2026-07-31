-- Ajoute les champs spécifiques au module "Bateaux" (onglet dédié dans
-- StandaloneExperienceForm, actif uniquement quand la catégorie sélectionnée
-- est BOATS_CATEGORY_ID). Tous nullable : aucun n'est obligatoire à la
-- création/édition, Shana les remplit au fil de l'eau.

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS supplier_contact TEXT,
  ADD COLUMN IF NOT EXISTS supplier_payment_method TEXT
    CHECK (supplier_payment_method IS NULL OR supplier_payment_method IN ('payment_link', 'bank_transfer', 'card')),
  ADD COLUMN IF NOT EXISTS skipper_included BOOLEAN,
  ADD COLUMN IF NOT EXISTS crew_included BOOLEAN,
  ADD COLUMN IF NOT EXISTS departure_location TEXT;
