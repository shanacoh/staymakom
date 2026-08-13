-- Ajoute la notion de "promo" (vraie réduction) sur une fiche standalone,
-- réutilisée pour le module Bateaux. Un seul nouveau champ, volontairement :
-- original_price garde le prix plein d'avant promo, uniquement pour l'affichage
-- barré + le calcul du badge "-X%" côté client. base_price reste la seule
-- source de vérité pour le prix réellement appliqué (carte, fiche détail,
-- demande) : pas de colonne "discount_percent" séparée pour éviter d'avoir
-- deux valeurs à garder synchronisées (le % est recalculé depuis
-- original_price / base_price).
-- NULL = pas de promo en cours, comportement inchangé.

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);

-- Active une promo de 15% sur "CATAMARAN" (Herzliya, prestataire MARK), à la
-- demande de Shana le 2026-08-13 : vraie réduction, le prix payé baisse.
-- Prix plein 3600₪ conservé dans original_price, base_price recalculé à -15%.
UPDATE public.standalone_experiences
SET original_price = base_price,
    base_price = ROUND(base_price * 0.85, 2)
WHERE slug = 'catamaran-38-herzliya';
