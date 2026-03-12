-- Add explicit SELECT policy for admins to see all hotels
-- This ensures admins can view hotels in any status (draft, published, pending, archived)
DROP POLICY IF EXISTS "Admins can view all hotels" ON public.hotels;

CREATE POLICY "Admins can view all hotels"
ON public.hotels
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: The existing "Admins can manage all hotels" policy with command ALL
-- remains for INSERT, UPDATE, DELETE operations