-- Options tarifaires par créneau horaire pour les expériences standalone
-- (ex : un restaurant avec plusieurs menus différents selon l'horaire choisi)
-- Fonctionnalité additive et optionnelle : n'affecte aucune expérience existante.

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS has_rate_options BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.standalone_rate_options (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id  UUID NOT NULL REFERENCES public.standalone_experiences(id) ON DELETE CASCADE,
  time_slot      TEXT NOT NULL,
  label          TEXT NOT NULL,
  label_fr       TEXT,
  label_he       TEXT,
  price_adult    NUMERIC(10,2) NOT NULL,
  price_child    NUMERIC(10,2),
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.standalone_rate_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standalone_rate_options_public_read"
  ON public.standalone_rate_options FOR SELECT USING (is_available = TRUE);

CREATE POLICY "standalone_rate_options_admin_all"
  ON public.standalone_rate_options FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Snapshot de l'option choisie au moment de la réservation (même logique que la colonne "extras")
ALTER TABLE public.standalone_bookings
  ADD COLUMN IF NOT EXISTS rate_option JSONB;
