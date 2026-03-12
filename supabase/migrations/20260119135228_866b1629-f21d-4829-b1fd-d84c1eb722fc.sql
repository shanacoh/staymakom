-- Add RLS policy for admins to view all wishlist items
CREATE POLICY "Admins can view all wishlist items"
  ON public.wishlist FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));