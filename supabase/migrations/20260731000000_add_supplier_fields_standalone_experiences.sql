-- Ajoute deux champs internes (jamais affichés côté client) pour distinguer :
-- - la société prestataire (ex. BALAGUNA, MARK)
-- - le nom d'origine du produit/bateau chez ce prestataire
-- du titre affiché au client (title/title_fr/title_he), qui peut être différent.
-- Utilisé initialement pour le module "Bateaux".

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_boat_name TEXT;
