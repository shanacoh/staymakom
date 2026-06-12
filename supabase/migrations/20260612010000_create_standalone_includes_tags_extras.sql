-- Tables pour les badges, inclus et extras des expériences standalone
-- Miroir exact de experience2_highlight_tags, experience2_includes et hotel2_extras / experience2_extras

-- ─── Badges (highlight tags) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.standalone_experience_highlight_tags (
  experience_id  UUID NOT NULL REFERENCES public.standalone_experiences(id) ON DELETE CASCADE,
  tag_id         UUID NOT NULL REFERENCES public.highlight_tags(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (experience_id, tag_id)
);

ALTER TABLE public.standalone_experience_highlight_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standalone_highlight_tags_public_read"
  ON public.standalone_experience_highlight_tags FOR SELECT USING (true);

CREATE POLICY "standalone_highlight_tags_admin_all"
  ON public.standalone_experience_highlight_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── Inclus ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.standalone_experience_includes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id  UUID NOT NULL REFERENCES public.standalone_experiences(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  title_he       TEXT,
  icon_url       TEXT,
  published      BOOLEAN NOT NULL DEFAULT TRUE,
  order_index    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.standalone_experience_includes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standalone_includes_public_read"
  ON public.standalone_experience_includes FOR SELECT USING (published = TRUE);

CREATE POLICY "standalone_includes_admin_all"
  ON public.standalone_experience_includes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── Extras (catalogue propre à chaque expérience standalone) ───────────────
CREATE TABLE IF NOT EXISTS public.standalone_extras (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id  UUID NOT NULL REFERENCES public.standalone_experiences(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  title_fr       TEXT,
  title_he       TEXT,
  description    TEXT,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'ILS',
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.standalone_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standalone_extras_public_read"
  ON public.standalone_extras FOR SELECT USING (is_available = TRUE);

CREATE POLICY "standalone_extras_admin_all"
  ON public.standalone_extras FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
