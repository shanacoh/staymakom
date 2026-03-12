-- Revoke all default grants on bookings table
REVOKE ALL ON public.bookings FROM PUBLIC;
REVOKE ALL ON public.bookings FROM anon;
REVOKE ALL ON public.bookings FROM authenticated;

-- Create explicit deny policy for anonymous users
CREATE POLICY "deny_anon_all_bookings"
ON public.bookings
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add UPDATE policy for customers (their own bookings)
CREATE POLICY "customer_update_own"
ON public.bookings
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Add UPDATE policy for hotel admins (their hotel bookings)
CREATE POLICY "hotel_admin_update_hotel"
ON public.bookings
FOR UPDATE
TO authenticated
USING ((hotel_id = get_user_hotel_id(auth.uid())) AND has_role(auth.uid(), 'hotel_admin'::app_role))
WITH CHECK ((hotel_id = get_user_hotel_id(auth.uid())) AND has_role(auth.uid(), 'hotel_admin'::app_role));

-- Add UPDATE policy for admins (all bookings)
CREATE POLICY "admin_update_all"
ON public.bookings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for admins only
CREATE POLICY "admin_delete_all"
ON public.bookings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create safe view without sensitive payment information
CREATE OR REPLACE VIEW public.bookings_safe AS
SELECT 
  id,
  customer_id,
  hotel_id,
  experience_id,
  checkin,
  checkout,
  party_size,
  room_price_subtotal,
  experience_price_subtotal,
  extras_subtotal,
  total_price,
  status,
  currency,
  selected_room_code,
  selected_room_name,
  selected_room_rate,
  selected_room_policy,
  notes,
  created_at,
  updated_at
FROM public.bookings;

-- Grant SELECT on safe view to authenticated users
GRANT SELECT ON public.bookings_safe TO authenticated;

-- Enable RLS on the view (inherits from base table)
ALTER VIEW public.bookings_safe SET (security_invoker = true);