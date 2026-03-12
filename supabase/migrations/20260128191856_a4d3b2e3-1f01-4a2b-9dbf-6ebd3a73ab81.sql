
-- Create hotels2 table with HyperGuest integration
CREATE TABLE public.hotels2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- HyperGuest Integration
  hyperguest_property_id TEXT UNIQUE,
  hyperguest_imported_at TIMESTAMPTZ,
  
  -- Identity
  name TEXT NOT NULL,
  name_he TEXT,
  slug TEXT NOT NULL UNIQUE,
  status hotel_status DEFAULT 'draft',
  visibility TEXT DEFAULT 'public',
  
  -- Location
  city TEXT,
  city_he TEXT,
  region TEXT,
  region_he TEXT,
  address TEXT,
  address_he TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Content
  story TEXT,
  story_he TEXT,
  highlights TEXT[],
  highlights_he TEXT[],
  amenities TEXT[],
  amenities_he TEXT[],
  
  -- Media
  hero_image TEXT,
  photos TEXT[],
  
  -- Contact
  contact_email TEXT,
  contact_phone TEXT,
  contact_website TEXT,
  contact_instagram TEXT,
  
  -- Business
  commission_rate NUMERIC DEFAULT 18.00,
  faqs JSONB DEFAULT '[]'::jsonb,
  
  -- SEO (trilingual)
  seo_title_en TEXT,
  seo_title_he TEXT,
  seo_title_fr TEXT,
  meta_description_en TEXT,
  meta_description_he TEXT,
  meta_description_fr TEXT,
  og_title_en TEXT,
  og_title_he TEXT,
  og_title_fr TEXT,
  og_description_en TEXT,
  og_description_he TEXT,
  og_description_fr TEXT,
  og_image TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for HyperGuest lookups
CREATE INDEX idx_hotels2_hyperguest_id ON public.hotels2(hyperguest_property_id);
CREATE INDEX idx_hotels2_status ON public.hotels2(status);
CREATE INDEX idx_hotels2_slug ON public.hotels2(slug);

-- Enable RLS
ALTER TABLE public.hotels2 ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all hotels2"
ON public.hotels2 FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view published hotels
CREATE POLICY "Anyone can view published hotels2"
ON public.hotels2 FOR SELECT
USING (status = 'published' AND visibility = 'public');

-- Auto-update timestamp trigger
CREATE TRIGGER update_hotels2_updated_at
  BEFORE UPDATE ON public.hotels2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update experiences2 to reference hotels2 instead of hotels
ALTER TABLE public.experiences2
  DROP CONSTRAINT IF EXISTS experiences2_hotel_id_fkey;

ALTER TABLE public.experiences2
  ADD CONSTRAINT experiences2_hotel_id_fkey 
  FOREIGN KEY (hotel_id) REFERENCES public.hotels2(id) ON DELETE CASCADE;
