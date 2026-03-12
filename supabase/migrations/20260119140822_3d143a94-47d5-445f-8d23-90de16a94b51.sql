-- Create a secure function to get wishlist users with their emails (admin only)
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
    up.user_id,
    au.email as user_email,
    up.display_name,
    up.phone,
    up.marketing_opt_in,
    up.created_at
  FROM public.user_profiles up
  INNER JOIN auth.users au ON up.user_id = au.id
  INNER JOIN public.wishlist w ON w.user_id = up.user_id
  WHERE w.deleted_at IS NULL
    AND public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY up.created_at DESC;
$$;