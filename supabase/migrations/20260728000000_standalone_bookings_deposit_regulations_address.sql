-- Sépare la création d'une réservation manuelle de la confirmation du paiement
-- et de l'envoi de l'email : Shana crée d'abord la réservation, puis décide
-- plus tard de marquer le paiement (intégral ou acompte) et d'envoyer l'email.
ALTER TABLE public.standalone_bookings
  DROP CONSTRAINT standalone_bookings_payment_status_check;

ALTER TABLE public.standalone_bookings
  ADD CONSTRAINT standalone_bookings_payment_status_check
  CHECK (payment_status = ANY (ARRAY['pending'::text, 'deposit_paid'::text, 'paid'::text, 'refund_pending'::text, 'refunded'::text, 'failed'::text]));

ALTER TABLE public.standalone_bookings
  ADD COLUMN deposit_amount NUMERIC(10, 2);

-- Horodatage du dernier envoi de l'email de confirmation, pour afficher
-- "Envoyer" vs "Renvoyer" dans le back office et savoir si le client a déjà
-- reçu sa confirmation.
ALTER TABLE public.standalone_bookings
  ADD COLUMN confirmation_email_sent_at TIMESTAMPTZ;

-- Champs libres pour une réservation manuelle : des conditions particulières
-- à communiquer au client, et une adresse/itinéraire spécifique (utile en
-- particulier pour les expériences hors catalogue, qui n'ont pas d'adresse).
-- Visibles du client (email + page de confirmation) uniquement s'ils sont
-- renseignés.
ALTER TABLE public.standalone_bookings
  ADD COLUMN custom_regulations TEXT;

ALTER TABLE public.standalone_bookings
  ADD COLUMN custom_address TEXT;
