-- Add presentation_title columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS presentation_title TEXT,
ADD COLUMN IF NOT EXISTS presentation_title_he TEXT;

COMMENT ON COLUMN public.categories.presentation_title IS 'Main title displayed on the left side of the category page';
COMMENT ON COLUMN public.categories.presentation_title_he IS 'Hebrew translation of the presentation title';