-- PART 1: Add UNIQUE constraint to user_roles.user_id
-- First, handle any existing duplicate roles by keeping only the highest priority role
-- Priority: admin > hotel_admin > customer

-- Delete duplicate roles, keeping the highest priority one
DELETE FROM public.user_roles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_roles
  ORDER BY user_id, 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'hotel_admin' THEN 2
      WHEN 'customer' THEN 3
    END
);

-- Add unique constraint on user_id
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- PART 2: Backfill user_profiles for all auth.users
-- Create missing user_profiles
INSERT INTO public.user_profiles (
  user_id, 
  display_name, 
  phone, 
  locale, 
  marketing_opt_in, 
  gdpr_consent_at, 
  tos_accepted_at
)
SELECT 
  au.id,
  COALESCE(au.email, 'User'),
  NULL,
  'en'::locale,
  false,
  NULL,
  now()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- PART 3: Backfill user_roles for all auth.users
-- Create missing user_roles with default 'customer' role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'customer'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;

-- PART 4: Backfill customers for all users with 'customer' role
-- Create missing customer records for users with 'customer' role
INSERT INTO public.customers (
  user_id,
  first_name,
  last_name,
  default_party_size,
  address_country,
  notes
)
SELECT 
  ur.user_id,
  '',
  '',
  2,
  NULL,
  NULL
FROM public.user_roles ur
LEFT JOIN public.customers c ON ur.user_id = c.user_id
WHERE ur.role = 'customer' 
  AND c.user_id IS NULL;