-- Add 'per_booking' to base_price_type enum
ALTER TYPE base_price_type ADD VALUE IF NOT EXISTS 'per_booking';