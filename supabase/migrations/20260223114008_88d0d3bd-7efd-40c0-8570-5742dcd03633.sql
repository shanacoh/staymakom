
-- Table for HyperGuest booking sync (linked to hotels2/experiences2)
CREATE TABLE public.bookings_hg (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hg_booking_id TEXT UNIQUE NOT NULL,
  hotel_id UUID REFERENCES public.hotels2(id) ON DELETE SET NULL,
  experience_id UUID REFERENCES public.experiences2(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  nights INTEGER NOT NULL DEFAULT 1,
  party_size INTEGER NOT NULL DEFAULT 2,
  room_code TEXT,
  room_name TEXT,
  board_type TEXT,
  rate_plan TEXT,
  -- Financial fields
  net_price NUMERIC NOT NULL DEFAULT 0,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'confirmed',
  hg_status TEXT,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  -- Metadata
  hg_raw_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings_hg ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage all bookings_hg"
  ON public.bookings_hg FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all bookings_hg"
  ON public.bookings_hg FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Indexes for dashboard queries
CREATE INDEX idx_bookings_hg_checkin ON public.bookings_hg(checkin);
CREATE INDEX idx_bookings_hg_hotel ON public.bookings_hg(hotel_id);
CREATE INDEX idx_bookings_hg_status ON public.bookings_hg(status);
CREATE INDEX idx_bookings_hg_created ON public.bookings_hg(created_at);

-- Auto-update updated_at
CREATE TRIGGER set_bookings_hg_updated_at
  BEFORE UPDATE ON public.bookings_hg
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
