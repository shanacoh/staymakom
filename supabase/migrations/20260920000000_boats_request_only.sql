-- Bateaux : toujours "sur demande", jamais de paiement en ligne.
-- Le réglage is_bookable était resté à TRUE sur les fiches de la catégorie
-- bateaux : un visiteur arrivant sur /boat/:slug (au lieu de la pop-up de
-- /boat) aurait pu voir le tunnel de paiement normal.
UPDATE standalone_experiences
SET is_bookable = FALSE
WHERE category_id = (SELECT id FROM categories WHERE slug = 'bateaux')
  AND is_bookable IS DISTINCT FROM FALSE;
