-- Remove the stripe_secret_key column from global_settings table
-- This column should never be stored in the database as it's a sensitive secret
-- It should be stored as a backend environment variable instead
ALTER TABLE public.global_settings DROP COLUMN IF EXISTS stripe_secret_key;