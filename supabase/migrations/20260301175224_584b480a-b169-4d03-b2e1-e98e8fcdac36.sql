
-- Drop the old policy that checks both status AND visibility
DROP POLICY "Anyone can view published hotels2" ON public.hotels2;

-- Recreate with only status check
CREATE POLICY "Anyone can view published hotels2"
ON public.hotels2
FOR SELECT
USING (status = 'published'::hotel_status);
