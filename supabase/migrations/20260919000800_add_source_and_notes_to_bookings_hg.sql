-- Distingue les réservations hôtel synchronisées automatiquement (HyperGuest)
-- des réservations hôtel saisies manuellement par un admin, sur le modèle
-- déjà en place pour standalone_bookings.source. DEFAULT non-nullable :
-- toutes les lignes existantes et toute future insertion par la synchro
-- HyperGuest (qui ne connaît pas cette colonne) reçoivent automatiquement
-- 'hyperguest_sync', sans aucune modification du code de synchro.
ALTER TABLE public.bookings_hg
  ADD COLUMN source TEXT NOT NULL DEFAULT 'hyperguest_sync'
  CHECK (source IN ('hyperguest_sync', 'manual_admin'));

COMMENT ON COLUMN public.bookings_hg.source IS
  'hyperguest_sync = créée automatiquement par la synchro HyperGuest (comportement historique, jamais modifié depuis l''admin) ; manual_admin = saisie manuellement par un admin via l''edge function create-hotel-manual-booking.';

CREATE INDEX IF NOT EXISTS idx_bookings_hg_source ON public.bookings_hg(source);

-- Notes internes de suivi, éditables dans le tableau des réservations quel
-- que soit le type de réservation (aligné avec standalone_bookings.internal_notes).
ALTER TABLE public.bookings_hg
  ADD COLUMN internal_notes TEXT;
