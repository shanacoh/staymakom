-- Add display_order column to categories table
ALTER TABLE public.categories 
ADD COLUMN display_order integer DEFAULT 0;

-- Set initial display_order values based on current created_at
UPDATE public.categories 
SET display_order = row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM public.categories
) AS numbered
WHERE categories.id = numbered.id;