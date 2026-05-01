-- Hotel admins can view bookings for their hotel in bookings_hg
CREATE POLICY "Hotel admins can view their hotel bookings in bookings_hg"
  ON public.bookings_hg
  FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM public.hotel_admins WHERE user_id = auth.uid()
    )
  );

-- Hotel admins can update bookings for their hotel (e.g. mark refund done)
CREATE POLICY "Hotel admins can update their hotel bookings in bookings_hg"
  ON public.bookings_hg
  FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM public.hotel_admins WHERE user_id = auth.uid()
    )
  );

-- Column to store the refund amount owed to the client after cancellation
ALTER TABLE public.bookings_hg
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC NOT NULL DEFAULT 0;
