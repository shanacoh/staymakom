-- Simplification des options tarifaires : chaque option est désormais un libellé libre + un prix,
-- indépendant des créneaux horaires (has_time_slots). La colonne time_slot n'est plus obligatoire.
ALTER TABLE public.standalone_rate_options
  ALTER COLUMN time_slot DROP NOT NULL;
