-- La catégorie "bateaux" apparaît désormais comme un onglet à part entière sur
-- la page d'accueil (IndexV3), au même titre que les autres catégories.
-- Elle n'avait jamais reçu d'icône (colonne vide) puisqu'elle restait cachée
-- jusqu'ici. On la renseigne pour rester cohérent avec les autres lignes de
-- la table, même si l'affichage web utilise pour l'instant une icône de
-- secours codée en dur (voilier) en attendant un pictogramme sur-mesure.
UPDATE public.categories
SET icon = 'sailboat'
WHERE slug = 'bateaux';
