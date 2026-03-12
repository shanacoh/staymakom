-- Create experiences2 table linked to existing hotels table
CREATE TABLE public.experiences2 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Identity
  title text NOT NULL,
  title_he text,
  slug text NOT NULL UNIQUE,
  status public.hotel_status DEFAULT 'draft'::public.hotel_status,
  
  -- Content
  subtitle text,
  subtitle_he text,
  long_copy text,
  long_copy_he text,
  duration text,
  duration_he text,
  
  -- Pricing
  base_price numeric NOT NULL,
  base_price_type public.base_price_type DEFAULT 'per_person'::public.base_price_type,
  currency text DEFAULT 'USD'::text,
  
  -- Booking constraints
  min_party integer DEFAULT 2,
  max_party integer DEFAULT 4,
  min_nights integer DEFAULT 1,
  max_nights integer DEFAULT 4,
  lead_time_days integer DEFAULT 3,
  adult_only boolean DEFAULT false,
  
  -- Location
  address text,
  address_he text,
  google_maps_link text,
  region_type text,
  
  -- Times
  checkin_time text,
  checkout_time text,
  
  -- Arrays
  includes text[],
  includes_he text[],
  not_includes text[],
  not_includes_he text[],
  good_to_know text[] DEFAULT '{}'::text[],
  good_to_know_he text[],
  services text[],
  services_he text[],
  
  -- Media
  hero_image text,
  photos text[],
  
  -- Policies
  cancellation_policy text,
  cancellation_policy_he text,
  accessibility_info text,
  accessibility_info_he text,
  
  -- SEO - English
  seo_title_en text,
  meta_description_en text,
  og_title_en text,
  og_description_en text,
  
  -- SEO - Hebrew
  seo_title_he text,
  meta_description_he text,
  og_title_he text,
  og_description_he text,
  
  -- SEO - French
  seo_title_fr text,
  meta_description_fr text,
  og_title_fr text,
  og_description_fr text,
  
  -- SEO - Shared
  og_image text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experiences2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all experiences2"
  ON public.experiences2 FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can view published experiences2"
  ON public.experiences2 FOR SELECT
  USING (status = 'published'::public.hotel_status);

-- Indexes
CREATE INDEX idx_experiences2_hotel_id ON public.experiences2(hotel_id);
CREATE INDEX idx_experiences2_category_id ON public.experiences2(category_id);
CREATE INDEX idx_experiences2_status ON public.experiences2(status);
CREATE INDEX idx_experiences2_slug ON public.experiences2(slug);

-- Trigger for updated_at
CREATE TRIGGER update_experiences2_updated_at
  BEFORE UPDATE ON public.experiences2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();