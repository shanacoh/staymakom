
-- Table: experience2_includes (mirrors experience_includes for V2)
CREATE TABLE public.experience2_includes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_he TEXT,
  description TEXT,
  description_he TEXT,
  icon_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experience2_includes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published experience2_includes"
  ON public.experience2_includes FOR SELECT USING (true);

CREATE POLICY "Admins can manage experience2_includes"
  ON public.experience2_includes FOR ALL USING (true) WITH CHECK (true);

-- Table: experience2_highlight_tags (mirrors experience_highlight_tags for V2)
CREATE TABLE public.experience2_highlight_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.highlight_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(experience_id, tag_id)
);

ALTER TABLE public.experience2_highlight_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read experience2_highlight_tags"
  ON public.experience2_highlight_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage experience2_highlight_tags"
  ON public.experience2_highlight_tags FOR ALL USING (true) WITH CHECK (true);
