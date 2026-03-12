-- Add French SEO fields to categories
ALTER TABLE public.categories
ADD COLUMN seo_title_fr text,
ADD COLUMN meta_description_fr text,
ADD COLUMN og_title_fr text,
ADD COLUMN og_description_fr text;

-- Add French SEO fields to experiences
ALTER TABLE public.experiences
ADD COLUMN seo_title_fr text,
ADD COLUMN meta_description_fr text,
ADD COLUMN og_title_fr text,
ADD COLUMN og_description_fr text;

-- Add French SEO fields to hotels
ALTER TABLE public.hotels
ADD COLUMN seo_title_fr text,
ADD COLUMN meta_description_fr text,
ADD COLUMN og_title_fr text,
ADD COLUMN og_description_fr text;

-- Add French SEO fields to global_settings
ALTER TABLE public.global_settings
ADD COLUMN seo_title_fr text,
ADD COLUMN meta_description_fr text,
ADD COLUMN og_title_fr text,
ADD COLUMN og_description_fr text;