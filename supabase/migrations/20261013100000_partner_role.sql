-- Chantier Partenaires, étape 2 : le rôle « partenaire ».
-- À part du reste : la base refuse d'utiliser un nouveau rôle dans la même opération que sa création.
-- Les rôles existants (admin, hotel_admin, customer) ne changent pas.
alter type public.app_role add value if not exists 'partner';
