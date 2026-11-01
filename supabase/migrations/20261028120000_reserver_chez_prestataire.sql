-- Bouton « Réserver chez le prestataire » de la page Réservations.
-- Une réservation payée doit encore être réservée chez le prestataire : par WhatsApp au prestataire,
-- ou par l'agent de Shana sur le site du prestataire. On suit les deux temps (demande envoyée, résa faite)
-- sans toucher à provider_notified_at, qui sert à l'email automatique des prestataires partenaires.

-- 1. Les deux temps de la réservation chez le prestataire.
ALTER TABLE public.standalone_bookings
  ADD COLUMN IF NOT EXISTS supplier_booking_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier_booked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.standalone_bookings.supplier_booking_requested_at IS
  'Message WhatsApp de réservation envoyé (au prestataire ou à l''agent), en attente de confirmation.';
COMMENT ON COLUMN public.standalone_bookings.supplier_booked_at IS
  'Réservation confirmée chez le prestataire.';

-- 2. Consignes propres à chaque fiche pour aller au bout de la résa (billet à choisir, tarif enfant...).
ALTER TABLE public.standalone_experience_internal
  ADD COLUMN IF NOT EXISTS booking_instructions TEXT;

COMMENT ON COLUMN public.standalone_experience_internal.booking_instructions IS
  'Consignes pour finaliser la réservation chez le prestataire, reprises dans le message WhatsApp.';

-- 3. Réglages réservés aux admins (global_settings est lisible par tout le monde).
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings_admin_all" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_all"
  ON public.admin_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. La vue des réservations : la date d'envoi de la demande remplit sent_to_provider_at des
-- réservations (vide jusqu'ici), et une nouvelle colonne booked_with_provider_at est ajoutée en fin
-- de chaque partie. La vue est reprise telle qu'elle est en base pour ne rien changer d'autre.
DO $$
DECLARE
  v TEXT := pg_get_viewdef('public.admin_reservations'::regclass, true);
BEGIN
  v := regexp_replace(v, 'NULL::timestamp with time zone AS sent_to_provider_at',
                         'b.supplier_booking_requested_at AS sent_to_provider_at');
  v := replace(v, E'NULL::integer AS nights\n   FROM standalone_bookings',
                  E'NULL::integer AS nights,\n    b.supplier_booked_at AS booked_with_provider_at\n   FROM standalone_bookings');
  v := replace(v, E'NULL::integer AS nights\n   FROM',
                  E'NULL::integer AS nights,\n    NULL::timestamp with time zone AS booked_with_provider_at\n   FROM');
  v := replace(v, E'h.nights\n   FROM',
                  E'h.nights,\n    NULL::timestamp with time zone AS booked_with_provider_at\n   FROM');

  IF (length(v) - length(replace(v, 'AS booked_with_provider_at', ''))) / length('AS booked_with_provider_at') <> 5
     OR position('b.supplier_booking_requested_at AS sent_to_provider_at' IN v) = 0 THEN
    RAISE EXCEPTION 'admin_reservations : structure inattendue, vue non modifiée';
  END IF;

  EXECUTE 'CREATE OR REPLACE VIEW public.admin_reservations WITH (security_invoker = true) AS ' || v;
END $$;
