-- Ajoute les colonnes pour tracer la confirmation du remboursement Revolut
ALTER TABLE public.bookings_hg
  ADD COLUMN IF NOT EXISTS revolut_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
