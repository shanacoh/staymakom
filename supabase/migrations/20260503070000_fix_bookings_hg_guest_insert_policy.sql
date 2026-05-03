-- Fix: la politique d'insertion actuelle bloque les réservations faites
-- par des utilisateurs non connectés (user_id IS NULL).
-- En SQL, NULL = NULL est NULL (pas TRUE), donc le WITH CHECK échoue.
-- On étend la politique pour autoriser les insertions avec user_id IS NULL
-- (réservations en mode invité, session expirée, etc.)

DROP POLICY IF EXISTS "Users can insert their own hg bookings" ON public.bookings_hg;

CREATE POLICY "Allow booking insert from checkout"
  ON public.bookings_hg
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id   -- utilisateur connecté insérant sa propre réservation
    OR user_id IS NULL      -- réservation invité ou session expirée
  );
