-- Retire le nom du prestataire "Seamona" du texte visible par le client
-- (sous-titre et description longue) pour les 2 fiches yacht Herzliya.
-- Le nom reste stocké dans la colonne interne supplier_boat_name, jamais
-- affichée côté client.

UPDATE public.standalone_experiences
SET
  subtitle = 'A private cruise aboard a yacht out of Herzliya marina, decorated with a balloon arch and a "mazal tov" sign. Soft drinks, a powerful Bluetooth speaker, and a swim stop with a towable tube and rope pool when the sea and skipper allow.',
  subtitle_fr = $t$Une croisière privée à bord d'un yacht, au départ de la marina d'Herzliya, décorée d'une arche de ballons et d'un panneau "mazal tov". Boissons soft, enceinte Bluetooth puissante, et arrêt baignade avec bouée tractée et rope pool selon la mer et l'accord du skipper.$t$,
  long_copy = '<p>A private cruise aboard a yacht out of Herzliya marina, decorated with a balloon arch and a "mazal tov" sign. Soft drinks, a powerful Bluetooth speaker, and a swim stop with a towable tube and rope pool when the sea and skipper allow.</p>',
  long_copy_fr = $t$<p>Une croisière privée à bord d'un yacht, au départ de la marina d'Herzliya, décorée d'une arche de ballons et d'un panneau "mazal tov". Boissons soft, enceinte Bluetooth puissante, et arrêt baignade avec bouée tractée et rope pool selon la mer et l'accord du skipper.</p>$t$
WHERE slug IN ('seamona-private-yacht-6-guests', 'seamona-private-yacht-13-guests');
