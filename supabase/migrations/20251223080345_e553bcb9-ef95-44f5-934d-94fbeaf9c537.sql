-- Create table to store AI search queries for market research
CREATE TABLE public.ai_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  lang TEXT DEFAULT 'en',
  recommended_ids UUID[] DEFAULT '{}',
  recommendation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_agent TEXT,
  session_id TEXT
);

-- Enable RLS
ALTER TABLE public.ai_search_queries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous tracking)
CREATE POLICY "Anyone can insert queries"
ON public.ai_search_queries
FOR INSERT
WITH CHECK (true);

-- Only admins can view/manage queries
CREATE POLICY "Admins can view all queries"
ON public.ai_search_queries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete queries"
ON public.ai_search_queries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for analytics
CREATE INDEX idx_ai_queries_created_at ON public.ai_search_queries(created_at DESC);
CREATE INDEX idx_ai_queries_lang ON public.ai_search_queries(lang);