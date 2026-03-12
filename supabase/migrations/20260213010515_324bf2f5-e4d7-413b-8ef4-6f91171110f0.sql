
-- Add the tax foreign exempt room flag
ALTER TABLE public.experiences2
ADD COLUMN IF NOT EXISTS tax_foreign_exempt_room boolean DEFAULT true;

COMMENT ON COLUMN public.experiences2.tax_foreign_exempt_room IS 'If true, foreign visitors (non-Israeli) get 0% tax on hotel room price only';
