-- Ajout du prix enfant public (calculé depuis supplier_price_child + markup)
-- et du détail adultes/enfants dans les réservations standalone

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS base_price_child NUMERIC(10,2) DEFAULT 0;

-- Détail du groupe par type de participant (nullable pour compatibilité avec les anciennes réservations)
ALTER TABLE public.standalone_bookings
  ADD COLUMN IF NOT EXISTS adults_count INTEGER,
  ADD COLUMN IF NOT EXISTS children_count INTEGER;
