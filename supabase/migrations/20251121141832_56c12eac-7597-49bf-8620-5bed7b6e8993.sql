-- Create experience_extras join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.experience_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES public.extras(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(experience_id, extra_id)
);

-- Enable RLS
ALTER TABLE public.experience_extras ENABLE ROW LEVEL SECURITY;

-- Admins can manage all links
CREATE POLICY "Admins can manage all experience_extras"
ON public.experience_extras
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Hotel admins can manage their experience extras
CREATE POLICY "Hotel admins can manage their experience_extras"
ON public.experience_extras
FOR ALL
TO authenticated
USING (
  experience_id IN (
    SELECT id FROM public.experiences 
    WHERE hotel_id = get_user_hotel_id(auth.uid())
  )
  AND has_role(auth.uid(), 'hotel_admin')
);

-- Anyone can view extras for published experiences
CREATE POLICY "Anyone can view extras for published experiences"
ON public.experience_extras
FOR SELECT
TO authenticated
USING (
  experience_id IN (
    SELECT id FROM public.experiences 
    WHERE status = 'published'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_experience_extras_updated_at
BEFORE UPDATE ON public.experience_extras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_experience_extras_experience_id ON public.experience_extras(experience_id);
CREATE INDEX idx_experience_extras_extra_id ON public.experience_extras(extra_id);