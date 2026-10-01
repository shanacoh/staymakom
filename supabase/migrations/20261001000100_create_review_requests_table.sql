-- Table review_requests
-- Suivi de la demande d'avis automatique (J+1 email, relance J+5, bouton WhatsApp 1-clic).
-- Même mécanique de token opaque que standalone_bookings.confirmation_token.

CREATE TABLE IF NOT EXISTS public.review_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_type      TEXT NOT NULL CHECK (booking_type IN ('standalone_bookings', 'bookings_hg')),
  booking_id        UUID NOT NULL,

  token             TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status            TEXT NOT NULL DEFAULT 'sent_j1'
    CHECK (status IN ('sent_j1', 'reminded_j5', 'submitted', 'expired')),
  channel           TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  lang              TEXT CHECK (lang IN ('fr', 'en', 'he')),

  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reminded_at       TIMESTAMPTZ,
  submitted_at      TIMESTAMPTZ,

  review_id         UUID REFERENCES public.reviews(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Accès direct réservé à l'admin et aux fonctions edge (clé service_role, qui contourne la RLS).
-- Le client public ne lit/écrit jamais cette table directement : il passe par les edge functions à token.
CREATE POLICY "review_requests_admin_all"
  ON public.review_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_review_requests_booking ON public.review_requests(booking_type, booking_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_token ON public.review_requests(token);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);
