
-- Extend the addon_type enum with new values
ALTER TYPE public.addon_type ADD VALUE IF NOT EXISTS 'per_person_per_night';
ALTER TYPE public.addon_type ADD VALUE IF NOT EXISTS 'fixed';
ALTER TYPE public.addon_type ADD VALUE IF NOT EXISTS 'commission_room';
ALTER TYPE public.addon_type ADD VALUE IF NOT EXISTS 'commission_experience';
ALTER TYPE public.addon_type ADD VALUE IF NOT EXISTS 'commission_fixed';
