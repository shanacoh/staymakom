-- Nouveaux champs pour le formulaire standalone expérience (refonte pages 2, 3, 4)

ALTER TABLE public.standalone_experiences
  -- Multi-catégories : tableau d'UUIDs en plus du category_id principal
  ADD COLUMN IF NOT EXISTS category_ids           JSONB    DEFAULT '[]'::jsonb,

  -- Badges (highlight tags) stockés localement en JSONB
  ADD COLUMN IF NOT EXISTS highlight_tags         JSONB    DEFAULT '[]'::jsonb,

  -- Infos pratiques : parking, adults only, kasher, spa, fitness
  ADD COLUMN IF NOT EXISTS practical_info         JSONB    DEFAULT '{}'::jsonb,

  -- Tarification fournisseur + markup
  ADD COLUMN IF NOT EXISTS supplier_price_adult   NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_price_child   NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_child_price        BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS markup_percent         NUMERIC(5,2)  DEFAULT 0;
