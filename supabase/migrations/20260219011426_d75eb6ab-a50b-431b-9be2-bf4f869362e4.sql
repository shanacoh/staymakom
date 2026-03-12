-- Drop the existing FK constraint that limits wishlist to experiences (V1) only
ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_experience_id_fkey;

-- No new FK so the field accepts any UUID (both V1 and V2 experience IDs)
-- Add a simple check index for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_experience_id ON public.wishlist(experience_id);