-- Mettre tous les titres anglais des expériences en majuscules
UPDATE experiences2 SET title = UPPER(title) WHERE title IS NOT NULL;
