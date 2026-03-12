-- Drop ALL existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage all gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Anyone can create gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Authenticated users can create gift cards" ON public.gift_cards;

-- Create PERMISSIVE admin policy (can manage everything)
CREATE POLICY "Admins can manage all gift cards" 
ON public.gift_cards 
AS PERMISSIVE
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create PERMISSIVE INSERT policy for anyone (public purchase)
CREATE POLICY "Anyone can create gift cards" 
ON public.gift_cards 
AS PERMISSIVE
FOR INSERT 
TO public, authenticated
WITH CHECK (true);

-- Create PERMISSIVE SELECT policy for admins only (to view in admin dashboard)
CREATE POLICY "Admins can view all gift cards" 
ON public.gift_cards 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));