-- Add missing bilingual fields to support full Hebrew translations

-- Add good_to_know_he to experiences table
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS good_to_know_he text[];

-- Add bullets_he to categories table  
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS bullets_he text[];

COMMENT ON COLUMN public.experiences.good_to_know_he IS 'Hebrew version of good to know items';
COMMENT ON COLUMN public.categories.bullets_he IS 'Hebrew version of category bullets';