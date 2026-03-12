-- Grant base table permissions to anon and authenticated roles
-- This is REQUIRED for RLS policies to work

-- Allow anon users to insert gift cards (for public purchase)
GRANT INSERT ON public.gift_cards TO anon;

-- Allow authenticated users full access (controlled by RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_cards TO authenticated;