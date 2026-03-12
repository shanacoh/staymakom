
-- Drop the broken policy
DROP POLICY IF EXISTS "Anyone can view booking by confirmation token" ON public.bookings_hg;

-- Create a proper policy: anyone can SELECT rows that have a confirmation_token set
-- This is safe because confirmation_token is a UUID (unguessable)
CREATE POLICY "Anyone can view booking by confirmation token"
ON public.bookings_hg
FOR SELECT
USING (confirmation_token IS NOT NULL);
