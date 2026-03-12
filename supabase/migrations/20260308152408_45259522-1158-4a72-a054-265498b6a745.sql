-- Add featured_on_home column to experiences2
ALTER TABLE public.experiences2 
ADD COLUMN featured_on_home boolean DEFAULT false;

-- Add display_order for manual sorting of featured experiences
ALTER TABLE public.experiences2 
ADD COLUMN home_display_order integer DEFAULT 0;

-- Create index for efficient homepage queries
CREATE INDEX idx_experiences2_featured_home 
ON public.experiences2 (featured_on_home, home_display_order, created_at DESC) 
WHERE status = 'published';