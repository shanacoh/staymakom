-- Drop the incorrectly configured INSERT policy
DROP POLICY IF EXISTS "Anyone can create gift cards" ON public.gift_cards;

-- Create PERMISSIVE INSERT policy with correct Supabase roles (anon + authenticated)
CREATE POLICY "Anyone can create gift cards" 
ON public.gift_cards 
AS PERMISSIVE
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);