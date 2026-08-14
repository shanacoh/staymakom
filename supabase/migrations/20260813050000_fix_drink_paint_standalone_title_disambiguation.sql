-- Corrige le titre de l'expérience standalone "Drink & Paint" (Tel Aviv) :
-- fixe la coquille "SUNSETT" et ajoute "— Tel Aviv" pour la distinguer de
-- l'expérience du même nom liée à l'hôtel Lake House Kinneret (table experiences2).
UPDATE standalone_experiences
SET
  title = 'DRINK & PAINT AT SUNSET — TEL AVIV',
  title_fr = 'APÉRO & PINCEAUX AU COUCHER DU SOLEIL — TEL AVIV',
  title_he = 'ציור ויין מול השקיעה — תל אביב'
WHERE id = 'c7ade269-2499-4db2-afdc-15a40fa56dd6';
