-- Add Revolut payment tracking columns to bookings_hg
ALTER TABLE bookings_hg
  ADD COLUMN IF NOT EXISTS revolut_order_id TEXT,
  ADD COLUMN IF NOT EXISTS revolut_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings_hg.revolut_order_id IS 'Revolut Merchant API order ID';
COMMENT ON COLUMN bookings_hg.revolut_payment_id IS 'Revolut payment transaction ID';
COMMENT ON COLUMN bookings_hg.payment_status IS 'unpaid | pending | paid | failed | refunded';
COMMENT ON COLUMN bookings_hg.payment_method IS 'card | apple_pay | google_pay | revolut_pay';
COMMENT ON COLUMN bookings_hg.paid_at IS 'Timestamp when payment was confirmed';

CREATE INDEX IF NOT EXISTS idx_bookings_hg_revolut_order ON bookings_hg (revolut_order_id) WHERE revolut_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_hg_payment_status ON bookings_hg (payment_status);
