-- Create a secure function to get customer emails for admins
CREATE OR REPLACE FUNCTION public.get_customers_with_emails()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  address_country text,
  default_party_size integer,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  user_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.user_id,
    c.first_name,
    c.last_name,
    c.address_country,
    c.default_party_size,
    c.notes,
    c.created_at,
    c.updated_at,
    au.email as user_email
  FROM public.customers c
  INNER JOIN auth.users au ON c.user_id = au.id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY c.created_at DESC;
$$;