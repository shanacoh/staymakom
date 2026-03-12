-- Update function to use LEFT JOIN so users without profiles are still returned
CREATE OR REPLACE FUNCTION public.get_wishlist_users_with_emails()
RETURNS TABLE (
  user_id uuid,
  user_email text,
  display_name text,
  phone text,
  marketing_opt_in boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    w.user_id,
    au.email as user_email,
    COALESCE(up.display_name, au.raw_user_meta_data->>'display_name') as display_name,
    up.phone,
    COALESCE(up.marketing_opt_in, false) as marketing_opt_in,
    COALESCE(up.created_at, au.created_at) as created_at
  FROM public.wishlist w
  INNER JOIN auth.users au ON w.user_id = au.id
  LEFT JOIN public.user_profiles up ON w.user_id = up.user_id
  WHERE w.deleted_at IS NULL
    AND public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY created_at DESC;
$$;