
-- Create table for predefined date options for experiences2
CREATE TABLE public.experience2_date_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  label TEXT,
  label_he TEXT,
  price_override NUMERIC,
  original_price NUMERIC,
  discount_percent INTEGER,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experience2_date_options ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view active date options"
  ON public.experience2_date_options FOR SELECT
  USING (is_active = true);

-- Admin write
CREATE POLICY "Admins can manage date options"
  ON public.experience2_date_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_experience2_date_options_updated_at
  BEFORE UPDATE ON public.experience2_date_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
