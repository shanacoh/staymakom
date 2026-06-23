-- Lien de réservation fournisseur (admin-only) pour les expériences standalone
-- "dropshippées" : Shana réserve elle-même chez le prestataire externe via ce lien.
-- Jamais exposé publiquement (cf. liste explicite de colonnes dans la page publique
-- StandaloneExperience.tsx, qui n'inclut volontairement pas cette colonne).

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS supplier_booking_url TEXT;
