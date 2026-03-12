-- Re-grant base permissions on bookings table
-- This allows RLS policies to be evaluated for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_extras TO authenticated;

-- Ensure RLS is enabled (should already be the case)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;