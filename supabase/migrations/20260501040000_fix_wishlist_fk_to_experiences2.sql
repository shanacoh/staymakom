-- Drop the old FK constraint pointing to the legacy experiences table
ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_experience_id_fkey;

-- Add new FK pointing to experiences2 (the active table)
ALTER TABLE public.wishlist
  ADD CONSTRAINT wishlist_experience_id_fkey
  FOREIGN KEY (experience_id)
  REFERENCES public.experiences2(id)
  ON DELETE CASCADE;
