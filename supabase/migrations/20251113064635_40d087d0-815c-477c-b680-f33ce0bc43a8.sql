-- Add min_nights and max_nights columns to experiences table
ALTER TABLE public.experiences
ADD COLUMN min_nights integer DEFAULT 1,
ADD COLUMN max_nights integer DEFAULT 4;

-- Add check constraints to ensure valid values
ALTER TABLE public.experiences
ADD CONSTRAINT check_min_nights_positive CHECK (min_nights >= 1),
ADD CONSTRAINT check_max_nights_positive CHECK (max_nights >= 1),
ADD CONSTRAINT check_nights_range CHECK (max_nights >= min_nights);