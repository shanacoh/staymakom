-- Add bilingual and SEO fields to journal_posts table

-- Rename existing single-language fields to _en versions
ALTER TABLE public.journal_posts 
  RENAME COLUMN title TO title_en;

ALTER TABLE public.journal_posts 
  RENAME COLUMN excerpt TO excerpt_en;

ALTER TABLE public.journal_posts 
  RENAME COLUMN content TO content_en;

-- Add Hebrew language fields
ALTER TABLE public.journal_posts 
  ADD COLUMN title_he TEXT,
  ADD COLUMN excerpt_he TEXT,
  ADD COLUMN content_he TEXT;

-- Add SEO fields for all three languages (EN, HE, FR)
ALTER TABLE public.journal_posts 
  ADD COLUMN seo_title_en TEXT,
  ADD COLUMN seo_title_he TEXT,
  ADD COLUMN seo_title_fr TEXT,
  ADD COLUMN meta_description_en TEXT,
  ADD COLUMN meta_description_he TEXT,
  ADD COLUMN meta_description_fr TEXT,
  ADD COLUMN og_title_en TEXT,
  ADD COLUMN og_title_he TEXT,
  ADD COLUMN og_title_fr TEXT,
  ADD COLUMN og_description_en TEXT,
  ADD COLUMN og_description_he TEXT,
  ADD COLUMN og_description_fr TEXT,
  ADD COLUMN og_image TEXT;