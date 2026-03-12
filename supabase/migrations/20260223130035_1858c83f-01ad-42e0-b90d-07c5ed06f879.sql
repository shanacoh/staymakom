
-- Add user_id column to bookings_hg so users can query their own reservations
ALTER TABLE public.bookings_hg ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for efficient user lookups
CREATE INDEX idx_bookings_hg_user_id ON public.bookings_hg(user_id);

-- Enable RLS (if not already)
ALTER TABLE public.bookings_hg ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own hg bookings"
  ON public.bookings_hg
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own bookings (for cancel status)
CREATE POLICY "Users can update their own hg bookings"
  ON public.bookings_hg
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own bookings
CREATE POLICY "Users can insert their own hg bookings"
  ON public.bookings_hg
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all hg bookings
CREATE POLICY "Admins can manage all hg bookings"
  ON public.bookings_hg
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
