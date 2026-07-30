-- "TYROLIENNE SUR JERUSALEM" (proposition partagée par plusieurs dossiers swipe : BRAUMAN'S
-- FAMILY, NAS DAILY, SURPRISE PÈRE FILLE...) n'avait que le texte français, sans EN/HE. Ajoute
-- la traduction anglaise (demandée par Shana) et hébreu (pour rester cohérent avec le reste,
-- déjà trilingue).

UPDATE public.propositions SET
  titre_en = 'ZIPLINE OVER JERUSALEM',
  titre_he = 'זיפליין מעל ירושלים',
  description_en = 'A zipline ride above the hills of Jerusalem.',
  description_he = 'רכיבת זיפליין מעל גבעות ירושלים.'
WHERE id = '81baba4a-7231-4435-aee7-e83dcb7f80a4';
