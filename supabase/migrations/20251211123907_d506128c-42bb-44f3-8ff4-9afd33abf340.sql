-- Add missing columns to gift_cards table for enhanced Gift Card system
ALTER TABLE public.gift_cards 
ADD COLUMN IF NOT EXISTS recipient_name text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'now';

-- Update existing records to have delivery_type based on delivery_date
UPDATE public.gift_cards 
SET delivery_type = CASE 
  WHEN delivery_date <= now() THEN 'now'
  ELSE 'scheduled'
END
WHERE delivery_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.gift_cards.delivery_type IS 'Delivery type: now or scheduled';
COMMENT ON COLUMN public.gift_cards.language IS 'Language preference: en or he';
COMMENT ON COLUMN public.gift_cards.sent_at IS 'Timestamp when the gift card email was actually sent';