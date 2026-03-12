
-- Create experience2_reviews table for V2 experiences
CREATE TABLE IF NOT EXISTS public.experience2_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  is_visible boolean DEFAULT true
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_experience2_review_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_experience2_review_rating
BEFORE INSERT OR UPDATE ON public.experience2_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_experience2_review_rating();

-- Enable RLS
ALTER TABLE public.experience2_reviews ENABLE ROW LEVEL SECURITY;

-- Public read for visible reviews
CREATE POLICY "Anyone can view visible reviews"
ON public.experience2_reviews
FOR SELECT
USING (is_visible = true);

-- Admin insert/update/delete (no auth restriction for admin-managed reviews)
CREATE POLICY "Admins can manage reviews"
ON public.experience2_reviews
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_experience2_reviews_experience_id ON public.experience2_reviews(experience_id);
