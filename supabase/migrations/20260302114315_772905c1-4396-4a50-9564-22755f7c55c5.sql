
-- Fix experience2_includes: replace permissive ALL policy with admin-only
DROP POLICY IF EXISTS "Admins can manage experience2_includes" ON public.experience2_includes;
CREATE POLICY "Admins can manage experience2_includes"
  ON public.experience2_includes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix experience2_reviews: replace permissive ALL policy with admin-only
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.experience2_reviews;
CREATE POLICY "Admins can manage reviews"
  ON public.experience2_reviews
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
