-- Crée les lignes customers manquantes pour les utilisateurs avec le rôle "customer"
-- qui n'en ont pas encore (suite au court-circuit entre le trigger et provisionUser).
INSERT INTO public.customers (user_id, first_name, last_name, default_party_size)
SELECT ur.user_id, '', '', 2
FROM public.user_roles ur
LEFT JOIN public.customers c ON c.user_id = ur.user_id
WHERE ur.role = 'customer' AND c.user_id IS NULL;
