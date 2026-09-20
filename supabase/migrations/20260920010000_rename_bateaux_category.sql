-- Catégorie Bateaux : nom aligné sur le titre de la vitrine /boat et sur le format
-- des autres puces (2 à 3 mots, coupés sur deux lignes).
UPDATE categories
SET name = 'On the Water',
    name_fr = 'Prendre le Large',
    name_he = 'יוצאים לים'
WHERE slug = 'bateaux';
