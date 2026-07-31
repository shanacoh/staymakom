-- Marge relevée à 30% (au lieu de 26%) sur les 11 fiches Bateaux, à la
-- demande de Shana. base_price recalculé avec la même formule que le
-- formulaire back office (supplier_price_adult * 1.30, arrondi à 2 décimales).

UPDATE public.standalone_experiences
SET markup_percent = 30,
    base_price = ROUND(supplier_price_adult * 1.30, 2)
WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'bateaux');
