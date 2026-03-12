-- Add missing fields to experiences table for detailed experience page
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS good_to_know text[] DEFAULT '{}';

-- Add highlights field to hotels table for hotel spotlight
ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]';

COMMENT ON COLUMN public.experiences.good_to_know IS 'Policy information and important details';
COMMENT ON COLUMN public.hotels.faqs IS 'Frequently asked questions as JSON array of {question, answer} objects';