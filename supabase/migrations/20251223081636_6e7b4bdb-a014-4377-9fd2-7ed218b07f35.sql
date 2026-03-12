-- Create events table for detailed AI search tracking
CREATE TABLE public.ai_search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES ai_search_queries(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'click', 'booking', 'bounce', 'new_search'
  experience_id UUID,
  booking_id UUID,
  position INTEGER, -- position in results (1, 2, 3)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_search_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (anonymous tracking)
CREATE POLICY "Anyone can insert events"
ON public.ai_search_events
FOR INSERT
WITH CHECK (true);

-- Only admins can view/manage events
CREATE POLICY "Admins can view all events"
ON public.ai_search_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events"
ON public.ai_search_events
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for analytics
CREATE INDEX idx_ai_events_search_id ON public.ai_search_events(search_id);
CREATE INDEX idx_ai_events_session_id ON public.ai_search_events(session_id);
CREATE INDEX idx_ai_events_type ON public.ai_search_events(event_type);
CREATE INDEX idx_ai_events_experience_id ON public.ai_search_events(experience_id);
CREATE INDEX idx_ai_events_created_at ON public.ai_search_events(created_at DESC);

-- Add search_id return to ai_search_queries for linking
-- Also add conversion tracking fields
ALTER TABLE public.ai_search_queries
ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_experience_id UUID,
ADD COLUMN IF NOT EXISTS conversion_booking_id UUID;