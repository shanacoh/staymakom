-- Add new columns for landing page lead collection
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT false;

-- Create index on marketing_opt_in for future filtering
CREATE INDEX IF NOT EXISTS idx_leads_marketing_opt_in ON public.leads(marketing_opt_in);

-- Update the source constraint to include 'landing_page'
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check 
  CHECK (source IN ('newsletter', 'contact', 'partners', 'corporate', 'win_trip', 'landing_page'));

-- Add comments for documentation
COMMENT ON COLUMN public.leads.marketing_opt_in IS 'User consent for marketing communications from landing page';
COMMENT ON COLUMN public.leads.first_name IS 'First name from landing page form';
COMMENT ON COLUMN public.leads.last_name IS 'Last name from landing page form';
COMMENT ON COLUMN public.leads.city IS 'City from B2B landing page form';