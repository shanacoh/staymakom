-- Distingue les réservations créées en ligne (paiement Revolut) de celles
-- saisies manuellement par l'admin pour des clients contactés en direct
-- (téléphone, WhatsApp, email), déjà réglées hors système.

ALTER TABLE public.standalone_bookings
  ADD COLUMN source TEXT NOT NULL DEFAULT 'online'
  CHECK (source IN ('online', 'manual_admin'));
