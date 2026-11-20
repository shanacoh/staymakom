-- Bateaux : grilles de prix 2h / 3h / 4h (20/11/2026)
-- La page /boat ne montre un bateau sur « 3h » ou « 4h » que s'il a une ligne de prix
-- pour exactement cette durée. Chaque bateau n'en avait qu'une ; on saisit les grilles
-- complètes fournies par Shana pour 4 bateaux. Les extras « heure en plus » deviennent
-- inutiles (et risqués : heure ajoutée par-dessus une ligne 4h) : ils sont désactivés,
-- pas supprimés (récupérables en repassant is_available à true).
-- Prix d'achat des nouvelles lignes : non fournis, à saisir dans le back-office.

CREATE SCHEMA IF NOT EXISTS backup_20261120;

CREATE TABLE IF NOT EXISTS backup_20261120.boat_price_variants AS
  SELECT * FROM public.standalone_experience_price_variants
  WHERE experience_id IN (
    '8f138c01-5269-4fe6-94e2-7e67f287caf1', -- SAILING BOAT FROM TLV
    '31ae1431-c843-40c0-ae0f-71feeb7c6128', -- CATAMARAN TEL AVIV
    '57526932-1d4f-41c6-a2ef-afa55767570e', -- COZY SAILING HERZLIYA
    '4af60a4a-e510-4803-a8e4-43d4f0a3308f'  -- CATAMARAN HERZLIYA
  );

CREATE TABLE IF NOT EXISTS backup_20261120.boat_extras AS
  SELECT * FROM public.standalone_extras
  WHERE experience_id IN (
    '8f138c01-5269-4fe6-94e2-7e67f287caf1',
    '31ae1431-c843-40c0-ae0f-71feeb7c6128',
    '57526932-1d4f-41c6-a2ef-afa55767570e',
    '4af60a4a-e510-4803-a8e4-43d4f0a3308f'
  );


-- Prix 2h modifiés
UPDATE public.standalone_experience_price_variants SET sale_price = 1980, updated_at = now()
  WHERE id = '07e20847-3a0b-4184-9de6-ea5340bfbba7'; -- Cozy Sailing 2h (était 1990)
UPDATE public.standalone_experience_price_variants SET sale_price = 3400, updated_at = now()
  WHERE id = '309b2a07-ac28-4f57-a89c-bfa083a45938'; -- Catamaran Herzliya 2h (était 3240)

-- Lignes ajoutées
INSERT INTO public.standalone_experience_price_variants
  (experience_id, duration_label, duration_minutes, max_capacity, sale_price, currency, sort_order)
VALUES
  ('8f138c01-5269-4fe6-94e2-7e67f287caf1', '3 hours', 180, 10, 2650, 'ILS', 1),
  ('8f138c01-5269-4fe6-94e2-7e67f287caf1', '4 hours', 240, 10, 3590, 'ILS', 2),
  ('31ae1431-c843-40c0-ae0f-71feeb7c6128', '2 hours', 120, 14, 3100, 'ILS', 0),
  ('31ae1431-c843-40c0-ae0f-71feeb7c6128', '4 hours', 240, 14, 5100, 'ILS', 2),
  ('57526932-1d4f-41c6-a2ef-afa55767570e', '3 hours', 180, 13, 2500, 'ILS', 1),
  ('57526932-1d4f-41c6-a2ef-afa55767570e', '4 hours', 240, 13, 3390, 'ILS', 2),
  ('4af60a4a-e510-4803-a8e4-43d4f0a3308f', '3 hours', 180, 14, 4500, 'ILS', 1),
  ('4af60a4a-e510-4803-a8e4-43d4f0a3308f', '4 hours', 240, 14, 5500, 'ILS', 2);

-- Ligne 3h existante du Catamaran Tel Aviv passe après la nouvelle 2h
UPDATE public.standalone_experience_price_variants SET sort_order = 1, updated_at = now()
  WHERE id = '1d3e6eef-d791-4dc4-9604-8b9555e57654';

-- Extras « heure en plus » désactivés
UPDATE public.standalone_extras SET is_available = false
  WHERE id IN (
    '65454ebf-f500-4f3b-b6e3-31c956b3b27c', -- Sailing TLV : Extra hour 850
    '58fd2809-dfc8-4953-93d3-3fe3613e0029', -- Catamaran Herzliya : Extra hour 1100
    'a2180611-1be9-4dc8-8d7c-806319c83515', -- Cozy Sailing : Extend to 3 hours total 520
    '82538cd7-ed41-4f17-a5ed-94da9e652528'  -- Catamaran TLV : Extend to 3 hours total 1150
  );


-- Private Yacht et Private Yacht XXL (publiés, base 3h) : ligne 4h = 3h + 1 heure sup.
-- (Private Yacht 5070 + 1690 = 6760 ; XXL 10520 + 3300 = 13820), extras « Extra hour » désactivés.
CREATE TABLE IF NOT EXISTS backup_20261120.yacht_extras AS
  SELECT * FROM public.standalone_extras
  WHERE experience_id IN ('9c0b357f-3b6c-4b95-9db9-4930d5046492','38cc040e-fbfc-4755-bec8-c9761a97abf0');

INSERT INTO public.standalone_experience_price_variants
  (experience_id, duration_label, duration_minutes, max_capacity, sale_price, currency, sort_order)
VALUES
  ('9c0b357f-3b6c-4b95-9db9-4930d5046492', '4-hour package', 240, 13, 6760, 'ILS', 1),
  ('38cc040e-fbfc-4755-bec8-c9761a97abf0', '4-hour package, yacht + speed boat', 240, 24, 13820, 'ILS', 1);

UPDATE public.standalone_extras SET is_available = false
  WHERE id IN (
    'f109e7c1-fedd-475a-9f6c-b711160eb1a4', -- Private Yacht : Extra hour 1690
    '31f1cd6a-6e86-4c41-8be2-fc184f249e60'  -- Private Yacht XXL : Extra hour 3300
  );
