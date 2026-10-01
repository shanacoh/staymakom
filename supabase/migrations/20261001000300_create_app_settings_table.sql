-- Table app_settings
-- Petite table clé/valeur pour les réglages généraux du site (ex : phrase de réassurance sous le CTA).
-- Il n'existait aucune table de ce type jusqu'ici.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key           TEXT PRIMARY KEY,
  value         JSONB NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_app_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_app_settings_updated_at();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique : réglages non sensibles, affichés sur le site public.
CREATE POLICY "app_settings_public_read"
  ON public.app_settings
  FOR SELECT
  USING (TRUE);

-- Admin : seul à pouvoir modifier.
CREATE POLICY "app_settings_admin_write"
  ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Réglage de la phrase de réassurance sous le bouton de réservation.
INSERT INTO public.app_settings (key, value)
VALUES (
  'reassurance_response_time',
  jsonb_build_object(
    'enabled', true,
    'text', jsonb_build_object(
      'fr', 'Réponse de notre équipe sur WhatsApp en moins de 2h',
      'en', 'Our team replies on WhatsApp in under 2 hours',
      'he', 'הצוות שלנו מגיב בוואטסאפ תוך פחות משעתיים'
    )
  )
)
ON CONFLICT (key) DO NOTHING;
