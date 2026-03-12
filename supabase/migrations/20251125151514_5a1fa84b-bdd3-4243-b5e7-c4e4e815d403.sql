-- Add SEO fields to categories table
ALTER TABLE public.categories
ADD COLUMN seo_title_en TEXT,
ADD COLUMN seo_title_he TEXT,
ADD COLUMN meta_description_en TEXT,
ADD COLUMN meta_description_he TEXT,
ADD COLUMN og_title_en TEXT,
ADD COLUMN og_title_he TEXT,
ADD COLUMN og_description_en TEXT,
ADD COLUMN og_description_he TEXT,
ADD COLUMN og_image TEXT;

-- Add SEO fields to experiences table
ALTER TABLE public.experiences
ADD COLUMN seo_title_en TEXT,
ADD COLUMN seo_title_he TEXT,
ADD COLUMN meta_description_en TEXT,
ADD COLUMN meta_description_he TEXT,
ADD COLUMN og_title_en TEXT,
ADD COLUMN og_title_he TEXT,
ADD COLUMN og_description_en TEXT,
ADD COLUMN og_description_he TEXT,
ADD COLUMN og_image TEXT;

-- Add SEO fields to hotels table
ALTER TABLE public.hotels
ADD COLUMN seo_title_en TEXT,
ADD COLUMN seo_title_he TEXT,
ADD COLUMN meta_description_en TEXT,
ADD COLUMN meta_description_he TEXT,
ADD COLUMN og_title_en TEXT,
ADD COLUMN og_title_he TEXT,
ADD COLUMN og_description_en TEXT,
ADD COLUMN og_description_he TEXT,
ADD COLUMN og_image TEXT;

-- Create global settings table for homepage and other global SEO
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  seo_title_en TEXT,
  seo_title_he TEXT,
  meta_description_en TEXT,
  meta_description_he TEXT,
  og_title_en TEXT,
  og_title_he TEXT,
  og_description_en TEXT,
  og_description_he TEXT,
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on global_settings
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage global settings
CREATE POLICY "Admins can manage global settings"
ON public.global_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view global settings
CREATE POLICY "Anyone can view global settings"
ON public.global_settings
FOR SELECT
USING (true);

-- Insert homepage SEO row
INSERT INTO public.global_settings (key, seo_title_en, seo_title_he)
VALUES ('homepage', 'StayMakom - Curated Boutique Experiences', 'StayMakom - חוויות בוטיק מובחרות')
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at on global_settings
CREATE TRIGGER update_global_settings_updated_at
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();