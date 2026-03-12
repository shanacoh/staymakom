-- Fix Security Definer View issue
-- The bookings_safe view should use SECURITY INVOKER to enforce RLS of the querying user

DROP VIEW IF EXISTS public.bookings_safe;

CREATE VIEW public.bookings_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  customer_id,
  hotel_id,
  experience_id,
  checkin,
  checkout,
  party_size,
  selected_room_code,
  selected_room_name,
  selected_room_rate,
  selected_room_policy,
  room_price_subtotal,
  experience_price_subtotal,
  extras_subtotal,
  total_price,
  currency,
  status,
  notes,
  created_at,
  updated_at
FROM public.bookings;