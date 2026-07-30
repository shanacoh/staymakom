-- Demandes de dates pour les expériences "Experience Only" non réservables en ligne.
-- Certaines expériences dépendent d'un prestataire externe et ne peuvent pas être
-- vendues instantanément : le visiteur laisse une demande (dates, nombre de
-- personnes, coordonnées) plutôt que de payer directement.

-- Bascule par expérience : réservable en ligne (comportement actuel) ou sur demande.
ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS is_bookable BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.standalone_experience_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id     UUID NOT NULL REFERENCES public.standalone_experiences(id) ON DELETE CASCADE,

  -- Informations client
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT,

  -- Ce que le client souhaite
  requested_date    DATE,
  adults            INTEGER NOT NULL DEFAULT 1,
  children          INTEGER NOT NULL DEFAULT 0,
  message           TEXT,

  -- Suivi côté back office
  status            TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  internal_notes    TEXT,
  notified_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_standalone_experience_requests_updated_at
  BEFORE UPDATE ON public.standalone_experience_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.standalone_experience_requests ENABLE ROW LEVEL SECURITY;

-- Le visiteur peut créer une demande, mais jamais la relire ni la modifier
-- (pas de page de confirmation côté client pour ces demandes).
CREATE POLICY "standalone_experience_requests_insert"
  ON public.standalone_experience_requests
  FOR INSERT
  WITH CHECK (TRUE);

-- Admin : accès complet (lecture, mise à jour du statut, notes internes).
CREATE POLICY "standalone_experience_requests_admin_all"
  ON public.standalone_experience_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_standalone_experience_requests_experience
  ON public.standalone_experience_requests(experience_id);

CREATE INDEX IF NOT EXISTS idx_standalone_experience_requests_status
  ON public.standalone_experience_requests(status);
