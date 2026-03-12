-- Remove the old category column and its enum type
ALTER TABLE public.experiences DROP COLUMN IF EXISTS category;

-- Drop the old enum type if it exists
-- Note: This will only work if no other tables are using this enum
DROP TYPE IF EXISTS experience_category CASCADE;