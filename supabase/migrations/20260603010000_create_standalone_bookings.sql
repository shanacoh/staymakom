-- Table standalone_bookings
-- Réservations pour les expériences "Experience Only" (sans hôtel, sans HyperGuest).

CREATE TABLE IF NOT EXISTS public.standalone_bookings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standalone_experience_id    UUID NOT NULL REFERENCES public.standalone_experiences(id) ON DELETE RESTRICT,

  -- Informations client
  customer_name               TEXT NOT NULL,
  customer_email              TEXT NOT NULL,
  customer_phone              TEXT,
  user_id                     UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Détails de la réservation
  booking_date                DATE NOT NULL,
  time_slot                   TEXT,
  party_size                  INTEGER NOT NULL DEFAULT 1,

  -- Tarification
  sell_price                  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency                    TEXT NOT NULL DEFAULT 'USD',

  -- Statut de la réservation
  status                      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),

  -- Paiement Revolut
  payment_status              TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refund_pending', 'refunded', 'failed')),
  revolut_order_id            TEXT,
  revolut_public_id           TEXT,
  refund_amount               NUMERIC(10, 2),
  revolut_refund_id           TEXT,
  refunded_at                 TIMESTAMPTZ,

  -- Annulation
  is_cancelled                BOOLEAN DEFAULT FALSE,
  cancelled_at                TIMESTAMPTZ,

  -- Confirmation token (pour la page de confirmation)
  confirmation_token          TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Notes internes (admin)
  internal_notes              TEXT,

  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION public.update_standalone_bookings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_standalone_bookings_updated_at
  BEFORE UPDATE ON public.standalone_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_standalone_bookings_updated_at();

-- RLS
ALTER TABLE public.standalone_bookings ENABLE ROW LEVEL SECURITY;

-- Lecture publique via token de confirmation (pour la page de confirmation)
CREATE POLICY "standalone_bookings_public_read_by_token"
  ON public.standalone_bookings
  FOR SELECT
  USING (TRUE);

-- Insertion publique (checkout client, authentifié ou non)
CREATE POLICY "standalone_bookings_insert"
  ON public.standalone_bookings
  FOR INSERT
  WITH CHECK (TRUE);

-- Admin : accès complet
CREATE POLICY "standalone_bookings_admin_all"
  ON public.standalone_bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_standalone_bookings_experience
  ON public.standalone_bookings(standalone_experience_id);

CREATE INDEX IF NOT EXISTS idx_standalone_bookings_date
  ON public.standalone_bookings(booking_date);

CREATE INDEX IF NOT EXISTS idx_standalone_bookings_status
  ON public.standalone_bookings(status);

CREATE INDEX IF NOT EXISTS idx_standalone_bookings_token
  ON public.standalone_bookings(confirmation_token);
