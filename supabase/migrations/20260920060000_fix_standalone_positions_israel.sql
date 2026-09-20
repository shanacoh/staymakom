-- Corrige la position de 9 expériences publiées dont la latitude et la longitude étaient des valeurs par
-- défaut aberrantes (1, 1 / 1, 2 / 1, 3, en plein océan). Sur le site public, la page de ces fiches affichait
-- une carte au mauvais endroit et un lien « itinéraire » qui y menait.
--
-- Positions retrouvées à partir de l'adresse écrite sur chaque fiche (OpenStreetMap), validées par Shana :
--  - positions sûres : numéro de rue, ou nom du lieu trouvé sur la carte ;
--  - approximatives : port de Jaffa (le centre Na Laga'at lui-même n'est pas sur la carte) ;
--  - centre-ville : Eilat (plage « Hananya » introuvable) et Tel Aviv (aucune adresse sur la fiche).
--
-- Garde-fou : chaque ligne n'est modifiée que si sa position actuelle est encore hors d'Israël. Si Shana a
-- corrigé une fiche entre-temps, rien n'est écrasé, et la migration peut être rejouée sans effet.
-- Les 5 brouillons concernés ne sont pas touchés (invisibles pour les clients).

UPDATE public.standalone_experiences AS s
SET latitude = v.lat, longitude = v.lng
FROM (VALUES
  ('b25b2e60-040a-40d1-b626-c6ea8a1227d4'::uuid, 32.07270, 34.76568),  -- BEAT THE JET LAG ON A BIKE (HaYarkon 41, Tel Aviv)
  ('00d3095c-e92d-4bb0-a317-08e95a00e2b9'::uuid, 29.52607, 34.93705),  -- FIRST DIVE AT DOLPHIN REEF
  ('fd622cc6-9a16-43cb-ae11-d014f02445e9'::uuid, 29.52607, 34.93705),  -- SWIM WITH DOLPHINS
  ('ea5973ac-bd0f-465c-9a18-784bbe575a6d'::uuid, 32.73284, 35.01347),  -- HORSEBACK RIDING IN THE CARMEL
  ('5d8e2527-9897-4c75-a5e4-067fb87824a0'::uuid, 31.77689, 35.22628),  -- JERUSALEM THROUGH TIME (Mamilla Mall)
  ('ba9eeb6a-d9e2-4d1b-807d-de71a22df5ad'::uuid, 32.05398, 34.75027),  -- CHOCOLATE IN THE DARK (port de Jaffa, approximatif)
  ('0d27ad3d-eafc-410a-97a2-a6a4a2f69964'::uuid, 32.05398, 34.75027),  -- DINNER IN THE DARK (port de Jaffa, approximatif)
  ('a16b034e-8ac5-4e1c-816b-0e3c9340c950'::uuid, 29.55403, 34.94527),  -- SEE THROUGH THE SEA, EILAT (centre d'Eilat)
  ('43248f5b-f0fb-4d8f-b124-f86aa49971f1'::uuid, 32.08530, 34.78181)   -- A MORNING IN A TEL AVIV KITCHEN (centre de Tel Aviv)
) AS v(id, lat, lng)
WHERE s.id = v.id
  AND s.latitude IS NOT NULL
  AND s.longitude IS NOT NULL
  AND NOT (s.latitude BETWEEN 29.4 AND 33.4 AND s.longitude BETWEEN 34.2 AND 35.9);
