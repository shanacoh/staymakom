-- Extend global_settings table to support general site configuration
ALTER TABLE public.global_settings
ADD COLUMN IF NOT EXISTS site_name TEXT,
ADD COLUMN IF NOT EXISTS site_tagline TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS partners_email TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS default_commission_rate NUMERIC DEFAULT 18.00,
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT;

-- Insert default settings row if it doesn't exist
INSERT INTO public.global_settings (key, site_name, site_tagline, contact_email, partners_email, instagram_handle)
VALUES ('site_config', 'STAYMAKOM', 'Israel... differently.', 'hello@staymakom.com', 'partners@staymakom.com', '@staymakom')
ON CONFLICT (key) DO NOTHING;