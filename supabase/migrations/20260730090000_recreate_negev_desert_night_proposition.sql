-- "LA TOSCANE DU NÉGUEV" (id e8998679-49ed-4c9e-a87c-5ead530d4e58) a été supprimée entre-temps
-- (probablement par Shana, en édition simultanée dans le back office) avant que la migration
-- 20260730080000 ne puisse la mettre à jour : son UPDATE n'a donc touché aucune ligne. On recrée
-- la proposition avec le nouveau contenu ("Une nuit dans le grand désert"), même chapitre
-- "SLEEP AWAY 😴" que les autres nuits à l'hôtel du dossier.

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, ville, ville_en, ville_he,
    nom_hotel, nom_hotel_en, nom_hotel_he, tags,
    mode_reservation, statut
  ) VALUES (
    'UNE NUIT DANS LE GRAND DÉSERT', 'A NIGHT IN THE WILD NEGEV', 'לילה במדבר הגדול',
    'Le désert version grand format : chameau, jeep, dunes à dévaler en sandboard. La nuit tombe sur un dîner bédouin, sous plus d''étoiles qu''on en voit ailleurs.',
    'The desert in widescreen: camel, jeep, dunes to ride down on a sandboard. Night falls on a Bedouin dinner, under more stars than anywhere else.',
    'המדבר בגרסה גדולה: גמל, ג''יפ, דיונות לגלוש עליהן בסנובורד. הלילה יורד על ארוחת ערב בדואית, תחת יותר כוכבים משרואים בכל מקום אחר.',
    '2b78f2fe-40ba-4ae0-97b1-6536983df206', 'Néguev', 'Mitzpe Ramon', 'Mitzpe Ramon', 'מצפה רמון',
    'Beresheet ou Kedma', 'Beresheet or Kedma', 'Beresheet או Kedma',
    ARRAY['désert', 'chameau', 'jeep', 'bédouin', 'étoiles'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 23 FROM ins;
