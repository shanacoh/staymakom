-- Remet la promo "CATAMARAN" (Herzliya, prestataire MARK) à -10%, à la
-- demande de Shana le 2026-08-14. Prix plein 3600₪ conservé dans
-- original_price, base_price recalculé à -10%.

UPDATE public.standalone_experiences
SET original_price = base_price,
    base_price = ROUND(base_price * 0.90, 2)
WHERE slug = 'catamaran-38-herzliya';
