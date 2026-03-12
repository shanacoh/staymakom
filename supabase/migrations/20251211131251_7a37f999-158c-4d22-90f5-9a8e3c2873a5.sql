-- Drop the existing status check constraint
ALTER TABLE public.gift_cards DROP CONSTRAINT IF EXISTS gift_cards_status_check;

-- Create new constraint with all required status values
ALTER TABLE public.gift_cards ADD CONSTRAINT gift_cards_status_check 
CHECK (status = ANY (ARRAY[
  'active'::text,
  'scheduled'::text,
  'sent'::text,
  'redeemed'::text,
  'expired'::text,
  'cancelled'::text
]));