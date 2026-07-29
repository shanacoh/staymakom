-- Permet de créer une réservation manuelle pour une expérience qui n'est pas
-- encore une fiche du catalogue (cas fréquent pour les réservations en direct) :
-- l'expérience devient optionnelle, avec un nom libre en repli.
ALTER TABLE public.standalone_bookings
  ALTER COLUMN standalone_experience_id DROP NOT NULL;

ALTER TABLE public.standalone_bookings
  ADD COLUMN custom_experience_title TEXT;

ALTER TABLE public.standalone_bookings
  ADD CONSTRAINT standalone_bookings_experience_or_custom
  CHECK (standalone_experience_id IS NOT NULL OR custom_experience_title IS NOT NULL);

-- Coût réel payé au prestataire sur une réservation négociée en direct.
-- Champ strictement interne : jamais renvoyé au client (ni email, ni page de
-- confirmation), pour permettre à Shana de suivre sa marge réelle.
ALTER TABLE public.standalone_bookings
  ADD COLUMN supplier_cost NUMERIC(10, 2);

-- Correction de sécurité : cette policy autorisait, malgré son nom, la lecture
-- de TOUTES les colonnes de TOUTES les réservations (nom, email, téléphone,
-- prix...) par n'importe qui possédant la clé publique du site, sans connexion.
-- La page de confirmation client passe désormais par l'edge function
-- get-standalone-booking-by-token, qui ne renvoie que les champs nécessaires.
DROP POLICY IF EXISTS standalone_bookings_public_read_by_token ON public.standalone_bookings;
