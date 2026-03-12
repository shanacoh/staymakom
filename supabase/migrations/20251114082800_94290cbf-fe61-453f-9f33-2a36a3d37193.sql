-- Create experience_includes table
CREATE TABLE public.experience_includes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_he text,
  description text,
  description_he text,
  icon_url text,
  order_index integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create experience_reviews table
CREATE TABLE public.experience_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add important information fields to experiences table
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS checkin_time text,
ADD COLUMN IF NOT EXISTS checkout_time text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS address_he text,
ADD COLUMN IF NOT EXISTS google_maps_link text,
ADD COLUMN IF NOT EXISTS accessibility_info text,
ADD COLUMN IF NOT EXISTS accessibility_info_he text,
ADD COLUMN IF NOT EXISTS services text[],
ADD COLUMN IF NOT EXISTS services_he text[];

-- Add image_url to extras table if not exists
ALTER TABLE public.extras
ADD COLUMN IF NOT EXISTS image_url text;

-- Enable RLS on new tables
ALTER TABLE public.experience_includes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for experience_includes
CREATE POLICY "Anyone can view published includes"
ON public.experience_includes
FOR SELECT
USING (
  published = true 
  AND experience_id IN (
    SELECT id FROM public.experiences WHERE status = 'published'
  )
);

CREATE POLICY "Admins can manage all includes"
ON public.experience_includes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hotel admins can manage their includes"
ON public.experience_includes
FOR ALL
USING (
  experience_id IN (
    SELECT id FROM public.experiences 
    WHERE hotel_id = get_user_hotel_id(auth.uid())
  )
  AND has_role(auth.uid(), 'hotel_admin'::app_role)
);

-- RLS policies for experience_reviews
CREATE POLICY "Anyone can view published reviews"
ON public.experience_reviews
FOR SELECT
USING (
  published = true 
  AND experience_id IN (
    SELECT id FROM public.experiences WHERE status = 'published'
  )
);

CREATE POLICY "Customers can create reviews for their bookings"
ON public.experience_reviews
FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  AND experience_id IN (
    SELECT DISTINCT experience_id FROM public.bookings 
    WHERE customer_id = auth.uid() AND status = 'confirmed'
  )
);

CREATE POLICY "Customers can update their own reviews"
ON public.experience_reviews
FOR UPDATE
USING (customer_id = auth.uid());

CREATE POLICY "Admins can manage all reviews"
ON public.experience_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_experience_includes_updated_at
BEFORE UPDATE ON public.experience_includes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experience_reviews_updated_at
BEFORE UPDATE ON public.experience_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_experience_includes_experience_id ON public.experience_includes(experience_id);
CREATE INDEX idx_experience_includes_order ON public.experience_includes(experience_id, order_index);
CREATE INDEX idx_experience_reviews_experience_id ON public.experience_reviews(experience_id);
CREATE INDEX idx_experience_reviews_customer_id ON public.experience_reviews(customer_id);