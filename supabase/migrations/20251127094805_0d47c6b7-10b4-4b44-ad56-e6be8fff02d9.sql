-- Add icon column to categories table for dynamic icon management
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;

-- Update existing categories with their icons
UPDATE public.categories SET icon = 'heart' WHERE slug = 'romantic';
UPDATE public.categories SET icon = 'users' WHERE slug = 'family';
UPDATE public.categories SET icon = 'sparkles' WHERE slug = 'golden-age';
UPDATE public.categories SET icon = 'leaf' WHERE slug = 'nature';
UPDATE public.categories SET icon = 'wine' WHERE slug = 'taste';
UPDATE public.categories SET icon = 'zap' WHERE slug = 'active';
UPDATE public.categories SET icon = 'laptop' WHERE slug = 'work-unplugged';
UPDATE public.categories SET icon = 'brain' WHERE slug = 'mindful-reset';