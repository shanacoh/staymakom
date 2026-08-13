-- Retire la promo "CATAMARAN" (Herzliya, prestataire MARK), à la demande de
-- Shana le 2026-08-13 : plus de réduction affichée, retour au prix plein.
-- base_price reprend la valeur de original_price (3600₪), original_price
-- repasse à NULL (= pas de promo en cours).

UPDATE public.standalone_experiences
SET base_price = original_price,
    original_price = NULL
WHERE slug = 'catamaran-38-herzliya';
