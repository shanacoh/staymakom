-- Create leads table for comprehensive lead tracking
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('newsletter', 'contact', 'partners', 'corporate', 'win_trip')),
  cta_id TEXT,
  
  -- Contact information (common to all)
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  
  -- General contact fields
  subject TEXT,
  message TEXT,
  
  -- B2C fields (ContactDialog)
  interests TEXT[],
  
  -- B2B fields (Partners & Corporate)
  is_b2b BOOLEAN DEFAULT false,
  company_name TEXT,
  property_name TEXT,
  property_type TEXT,
  
  -- Corporate specific
  request_type TEXT,
  group_size TEXT,
  preferred_dates TEXT,
  
  -- Lead management
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'rejected')),
  assigned_to UUID,
  notes TEXT,
  
  -- Flexible metadata for future data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_status ON public.leads(status);

-- Add trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated users can insert leads
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read leads
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update leads
CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));