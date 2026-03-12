
-- Add confirmation_token column to bookings_hg
ALTER TABLE public.bookings_hg 
ADD COLUMN confirmation_token text UNIQUE DEFAULT NULL;

-- Create index for fast lookup by token
CREATE INDEX idx_bookings_hg_confirmation_token ON public.bookings_hg (confirmation_token) WHERE confirmation_token IS NOT NULL;

-- Allow public SELECT on bookings_hg by confirmation_token (for unauthenticated access via token)
CREATE POLICY "Anyone can view booking by confirmation token"
ON public.bookings_hg
FOR SELECT
USING (confirmation_token IS NOT NULL AND confirmation_token = current_setting('request.jwt.claims', true)::json->>'confirmation_token');
