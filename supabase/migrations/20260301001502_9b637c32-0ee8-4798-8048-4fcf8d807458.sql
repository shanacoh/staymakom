
-- ============================================================
-- Fix RLS policies for experiences2 and experience2_hotels
-- ============================================================

-- ---- experiences2 ----

DROP POLICY IF EXISTS "Admins can manage all experiences2" ON public.experiences2;
DROP POLICY IF EXISTS "Anyone can view published experiences2" ON public.experiences2;

-- Admin: full access
CREATE POLICY "Admins can manage all experiences2"
ON public.experiences2 FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Public: only published experiences whose hotel is also published
CREATE POLICY "Anyone can view published experiences2"
ON public.experiences2 FOR SELECT
TO anon, authenticated
USING (
  status = 'published'::hotel_status
  AND (
    hotel_id IS NULL
    OR hotel_id IN (SELECT id FROM public.hotels2 WHERE status = 'published'::hotel_status)
  )
);

-- Hotel admins: manage experiences linked to their hotel
CREATE POLICY "Hotel admins can manage their experiences2"
ON public.experiences2 FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'hotel_admin'::app_role)
  AND hotel_id = public.get_user_hotel_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'hotel_admin'::app_role)
  AND hotel_id = public.get_user_hotel_id(auth.uid())
);

-- ---- experience2_hotels ----

DROP POLICY IF EXISTS "Anyone can view experience hotels" ON public.experience2_hotels;
DROP POLICY IF EXISTS "Authenticated users can manage experience hotels" ON public.experience2_hotels;

-- Public: read experience-hotel links for published experiences
CREATE POLICY "Anyone can view experience2 hotels"
ON public.experience2_hotels FOR SELECT
TO anon, authenticated
USING (
  experience_id IN (
    SELECT id FROM public.experiences2 WHERE status = 'published'::hotel_status
  )
);

-- Admin: full access
CREATE POLICY "Admins can manage experience2 hotels"
ON public.experience2_hotels FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Hotel admins: manage links for their experiences
CREATE POLICY "Hotel admins can manage their experience2 hotels"
ON public.experience2_hotels FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'hotel_admin'::app_role)
  AND experience_id IN (
    SELECT id FROM public.experiences2
    WHERE hotel_id = public.get_user_hotel_id(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'hotel_admin'::app_role)
  AND experience_id IN (
    SELECT id FROM public.experiences2
    WHERE hotel_id = public.get_user_hotel_id(auth.uid())
  )
);
