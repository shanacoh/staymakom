-- Junction table linking experiences2 to hotel2_extras (same pattern as experience_extras for V1)
CREATE TABLE public.experience2_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES public.hotel2_extras(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(experience_id, extra_id)
);

-- Enable RLS
ALTER TABLE public.experience2_extras ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage experience2_extras"
  ON public.experience2_extras
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read (for published experiences)
CREATE POLICY "Anyone can read experience2_extras"
  ON public.experience2_extras
  FOR SELECT
  USING (true);

-- Timestamp trigger
CREATE TRIGGER update_experience2_extras_updated_at
  BEFORE UPDATE ON public.experience2_extras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();