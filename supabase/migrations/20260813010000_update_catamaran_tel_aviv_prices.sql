-- Ajustement des prix client de la fiche "Catamaran Tel Aviv" (B.OZ), à la
-- demande de Shana le 2026-08-13 : prix arrondis fixés directement à 2850₪
-- (forfait 2h, au lieu de 2730₪ calculé à 30% de marge) et 1150₪ (extra
-- "prolonger à 3h", au lieu de 1040₪). Le prix fournisseur (supplier_price_adult)
-- n'est pas modifié, seuls les prix client le sont.

UPDATE public.standalone_experiences
SET base_price = 2850.00
WHERE slug = 'catamaran-tel-aviv';

UPDATE public.standalone_extras
SET price = 1150
WHERE experience_id = (SELECT id FROM public.standalone_experiences WHERE slug = 'catamaran-tel-aviv')
  AND title = 'Extend to 3 hours total';
