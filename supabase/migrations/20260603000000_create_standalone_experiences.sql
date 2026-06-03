-- Table standalone_experiences
-- Expériences proposées sans hôtel (route "Experience Only" / mode "live" de la V3)
-- Aucune dépendance à HyperGuest, aucun hotel_id.

CREATE TABLE IF NOT EXISTS public.standalone_experiences (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT UNIQUE NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  display_order           INTEGER DEFAULT 0,

  -- Contenu multilingue
  title                   TEXT,
  title_fr                TEXT,
  title_he                TEXT,
  subtitle                TEXT,
  subtitle_fr             TEXT,
  subtitle_he             TEXT,
  long_copy               TEXT,
  long_copy_fr            TEXT,
  long_copy_he            TEXT,
  duration                TEXT,
  duration_fr             TEXT,
  duration_he             TEXT,

  -- Catégorie
  category_id             UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Tarification
  base_price              NUMERIC(10, 2) DEFAULT 0,
  base_price_type         TEXT DEFAULT 'per_person' CHECK (base_price_type IN ('per_person', 'per_person_per_night', 'fixed')),
  currency                TEXT DEFAULT 'USD',
  min_party               INTEGER DEFAULT 1,
  max_party               INTEGER DEFAULT 20,
  lead_time_days          INTEGER DEFAULT 1,

  -- Créneaux horaires (optionnel)
  has_time_slots          BOOLEAN DEFAULT FALSE,
  time_slots              JSONB DEFAULT '[]'::jsonb,

  -- Localisation
  address                 TEXT,
  address_he              TEXT,
  google_maps_link        TEXT,
  region_type             TEXT,

  -- Médias
  hero_image              TEXT,
  photos                  JSONB DEFAULT '[]'::jsonb,

  -- Contenu détaillé (tableaux multilingues)
  includes                JSONB DEFAULT '[]'::jsonb,
  includes_he             JSONB DEFAULT '[]'::jsonb,
  not_includes            JSONB DEFAULT '[]'::jsonb,
  not_includes_he         JSONB DEFAULT '[]'::jsonb,
  good_to_know            JSONB DEFAULT '[]'::jsonb,
  good_to_know_he         JSONB DEFAULT '[]'::jsonb,

  -- Politique d'annulation
  cancellation_policy     TEXT,
  cancellation_policy_he  TEXT,

  -- Accessibilité
  accessibility_info      TEXT,
  accessibility_info_he   TEXT,

  -- SEO
  seo_title_en            TEXT,
  meta_description_en     TEXT,
  seo_title_fr            TEXT,
  meta_description_fr     TEXT,
  seo_title_he            TEXT,
  meta_description_he     TEXT,
  og_image                TEXT,

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION public.update_standalone_experiences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_standalone_experiences_updated_at
  BEFORE UPDATE ON public.standalone_experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_standalone_experiences_updated_at();

-- RLS
ALTER TABLE public.standalone_experiences ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les expériences publiées
CREATE POLICY "standalone_experiences_public_read"
  ON public.standalone_experiences
  FOR SELECT
  USING (status = 'published');

-- Admin : accès complet
CREATE POLICY "standalone_experiences_admin_all"
  ON public.standalone_experiences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
