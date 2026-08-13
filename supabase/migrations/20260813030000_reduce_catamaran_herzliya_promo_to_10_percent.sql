-- Ajustement de la promo "CATAMARAN" (Herzliya) : Shana a demandé de passer
-- de -15% à -10% le 2026-08-13. original_price (prix plein, 3600₪) inchangé,
-- seul base_price est recalculé.

UPDATE public.standalone_experiences
SET base_price = ROUND(original_price * 0.90, 2)
WHERE slug = 'catamaran-38-herzliya';
