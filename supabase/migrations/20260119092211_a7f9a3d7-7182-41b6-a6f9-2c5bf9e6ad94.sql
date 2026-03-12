-- Add address fields to hotels table
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS address_he text;