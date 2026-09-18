-- Fonction dédiée pour lister les comptes admin/hotel_admin avec leur email,
-- sans dépendre de la table "customers" (réservée aux profils clients, pas toujours
-- créée pour les comptes équipe) : évite les lignes vides "—" dans l'onglet Équipe.
CREATE OR REPLACE FUNCTION public.get_team_members_with_emails()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  user_email text,
  account_created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    ur.user_id,
    up.display_name,
    au.email as user_email,
    au.created_at as account_created_at
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.user_profiles up ON up.user_id = ur.user_id
  WHERE ur.role IN ('admin', 'hotel_admin')
    AND public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY au.created_at DESC;
$$;
