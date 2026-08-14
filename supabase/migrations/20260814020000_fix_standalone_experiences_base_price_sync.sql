-- Corrige base_price (prix affiché aux clients) pour 6 expériences standalone
-- non-bateaux dont le prix était resté figé sur une ancienne valeur alors que
-- le prix fournisseur et/ou la marge avaient été changés dans le back office.
-- Cause racine : pour les expériences non-bateaux, le formulaire ne recopiait
-- jamais "fournisseur + marge" dans base_price (corrigé côté code dans le même
-- commit : src/components/forms/StandaloneExperienceForm.tsx).
UPDATE standalone_experiences
SET base_price = ROUND(supplier_price_adult * (1 + markup_percent / 100))
WHERE id IN (
  '965edbdb-88a0-4654-881e-f19bc2d49d4d', -- zip-line Survol de la Vieille Ville
  '86dae5d6-6751-4654-8de0-ea529422fb9a', -- Walking the Pilgrims' Footsteps
  'cd415c8b-e74a-4c2c-b47b-96812cd6aa52', -- The Tunnel Kings Once Walked
  'c9ebb9ef-6298-481a-b269-21c3b6ac91fd', -- Jerusalem Lit Up After Dark
  '7e2e61ef-1071-4118-8b33-c16133802211', -- Israel From Above
  'a4ee8457-5c45-4b46-971d-8eeeabd3bc55'  -- Wine and Cheese by Feel Alone
);
