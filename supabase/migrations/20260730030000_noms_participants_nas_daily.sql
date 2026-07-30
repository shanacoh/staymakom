-- Le dossier NAS DAILY est destiné à 2 personnes précises : au lieu de taper leur prénom, elles
-- le choisissent dans une liste.

UPDATE public.dossiers
SET noms_participants = ARRAY['Aija', 'Nusrein']
WHERE token_public = 'b89b39d676a2ead0172c978893955178';
