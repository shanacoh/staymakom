-- Table reviews
-- Table unique des avis clients : expérience standalone (dont bateaux), hôtel+expérience, ou marque en général.
-- Remplace progressivement experience2_reviews (migration des données en 20261001000400).

CREATE TABLE IF NOT EXISTS public.reviews (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Attribution
  scope                       TEXT NOT NULL
    CHECK (scope IN ('standalone_experience', 'experience2', 'brand', 'unassigned')),
  standalone_experience_id    UUID REFERENCES public.standalone_experiences(id) ON DELETE SET NULL,
  experience2_id              UUID REFERENCES public.experiences2(id) ON DELETE SET NULL,
  provider_id                 UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  CONSTRAINT reviews_scope_consistency CHECK (
    (scope = 'standalone_experience' AND standalone_experience_id IS NOT NULL AND experience2_id IS NULL)
    OR (scope = 'experience2' AND experience2_id IS NOT NULL AND standalone_experience_id IS NULL)
    OR (scope IN ('brand', 'unassigned') AND standalone_experience_id IS NULL AND experience2_id IS NULL)
  ),

  -- Lien vers la réservation d'origine (parcours automatique uniquement ; sert au badge "Avis vérifié")
  booking_type                TEXT CHECK (booking_type IN ('standalone_bookings', 'bookings_hg')),
  booking_id                  UUID,
  CONSTRAINT reviews_booking_pair CHECK (
    (booking_type IS NULL AND booking_id IS NULL) OR (booking_type IS NOT NULL AND booking_id IS NOT NULL)
  ),

  -- Client
  customer_first_name         TEXT NOT NULL,
  customer_last_initial       TEXT,
  customer_email              TEXT,
  customer_phone              TEXT,
  customer_user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Contenu
  rating                      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment                     TEXT,
  lang                        TEXT CHECK (lang IN ('fr', 'en', 'he')),
  photo_url                   TEXT,

  -- Consentement et modération
  consent_to_publish          BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'published', 'hidden')),
  hidden_reason                TEXT,
  is_pinned                   BOOLEAN NOT NULL DEFAULT FALSE,
  staff_reply                 TEXT,
  staff_reply_at              TIMESTAMPTZ,

  -- Origine et traçabilité
  source                      TEXT NOT NULL
    CHECK (source IN ('auto_link', 'manual_whatsapp', 'manual_email', 'manual_google', 'manual_oral', 'legacy_placeholder')),
  review_date                 DATE,
  traces_awarded              BOOLEAN NOT NULL DEFAULT FALSE,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_reviews_updated_at();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique : uniquement les avis publiés (jamais les en attente ou masqués)
CREATE POLICY "reviews_public_read_published"
  ON public.reviews
  FOR SELECT
  USING (moderation_status = 'published');

-- Admin : accès complet (saisie manuelle, modération)
CREATE POLICY "reviews_admin_all"
  ON public.reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_reviews_standalone_experience ON public.reviews(standalone_experience_id);
CREATE INDEX IF NOT EXISTS idx_reviews_experience2 ON public.reviews(experience2_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON public.reviews(booking_type, booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON public.reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_scope ON public.reviews(scope);
