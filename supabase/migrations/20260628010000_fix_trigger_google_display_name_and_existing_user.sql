-- 1. Corriger le déclencheur pour utiliser full_name/name en fallback (pour les futures inscriptions Google)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, locale, phone)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(CONCAT(
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(new.raw_user_meta_data->>'last_name', '')
      )), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
      new.email
    ),
    COALESCE((new.raw_user_meta_data->>'locale')::locale, 'en'),
    new.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.user_roles (user_id, role, hotel_id)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'customer'),
    (new.raw_user_meta_data->>'hotel_id')::uuid
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

-- 2. Corriger les données de l'utilisateur Google existant
UPDATE public.user_profiles
SET display_name = au.raw_user_meta_data->>'full_name'
FROM auth.users au
WHERE user_profiles.user_id = au.id
  AND au.raw_app_meta_data->>'provider' = 'google'
  AND TRIM(COALESCE(user_profiles.display_name, '')) = '';

UPDATE public.customers c
SET
  first_name = SPLIT_PART(au.raw_user_meta_data->>'full_name', ' ', 1),
  last_name   = TRIM(SUBSTRING(au.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN au.raw_user_meta_data->>'full_name') + 1))
FROM auth.users au
WHERE c.user_id = au.id
  AND au.raw_app_meta_data->>'provider' = 'google'
  AND TRIM(COALESCE(c.first_name, '')) = ''
  AND au.raw_user_meta_data->>'full_name' IS NOT NULL;
