-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create gift cards" ON public.gift_cards;

-- Create a new PERMISSIVE INSERT policy that allows anyone to create gift cards
CREATE POLICY "Anyone can create gift cards" 
ON public.gift_cards 
FOR INSERT 
TO public
WITH CHECK (true);

-- Also allow authenticated users to insert
CREATE POLICY "Authenticated users can create gift cards" 
ON public.gift_cards 
FOR INSERT 
TO authenticated
WITH CHECK (true);