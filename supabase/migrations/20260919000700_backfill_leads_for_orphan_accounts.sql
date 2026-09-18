-- Crée une fiche "account" pour chaque compte déjà existant qui n'a
-- aujourd'hui aucune fiche du tout (ni lien direct, ni email correspondant) :
-- cas des comptes créés sans jamais avoir rempli de formulaire (ex: Candero).
-- Idempotent : ne touche que les comptes sans AUCUNE fiche correspondante.
INSERT INTO public.leads (source, email, name, status, converted_user_id, linked_at, created_at)
SELECT
  'account',
  au.email,
  COALESCE(
    NULLIF(TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))), ''),
    up.display_name
  ),
  'converted',
  au.id,
  now(),
  au.created_at
FROM auth.users au
LEFT JOIN public.customers c ON c.user_id = au.id
LEFT JOIN public.user_profiles up ON up.user_id = au.id
WHERE au.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.leads l WHERE l.converted_user_id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.leads l2 WHERE l2.email_normalized = lower(btrim(au.email)));
