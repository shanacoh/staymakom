-- Ajout de la langue préférée du client sur les réservations.
-- Nécessaire pour que l'envoi automatique J+1 (déclenché par une tâche planifiée, sans client connecté)
-- sache dans quelle langue écrire. Le front-end connaît déjà cette langue au moment de la réservation
-- (elle est transmise explicitement aux emails de confirmation) : il suffit de la persister.

ALTER TABLE public.standalone_bookings
  ADD COLUMN IF NOT EXISTS preferred_lang TEXT CHECK (preferred_lang IN ('fr', 'en', 'he'));

ALTER TABLE public.bookings_hg
  ADD COLUMN IF NOT EXISTS preferred_lang TEXT CHECK (preferred_lang IN ('fr', 'en', 'he'));
