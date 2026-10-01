-- Applique les prix de vente validés par Shana sur les variantes de prix créées
-- à l'étape précédente. Corrige aussi la durée du Catamaran Tel Aviv (3h, pas "2 à 3h").
-- Le "Catamaran Herzliya 21 pers / 2h / 3900₪" n'est volontairement pas traité ici :
-- il ne correspond à aucune fiche existante (le Catamaran Herzliya en base fait 14 pers,
-- Shana a confirmé que ce sont deux bateaux différents) ; à traiter une fois précisé.

update public.standalone_experience_price_variants v
set sale_price = 1990
from public.standalone_experiences se
where v.experience_id = se.id and se.title = 'COZY SAILING HERZLIYA';

update public.standalone_experience_price_variants v
set sale_price = 3900, duration_label = '3 hours', duration_minutes = 180
from public.standalone_experiences se
where v.experience_id = se.id and se.title = 'CATAMARAN TEL AVIV';
