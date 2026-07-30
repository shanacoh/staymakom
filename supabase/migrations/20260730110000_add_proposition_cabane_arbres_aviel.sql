-- Ajoute une proposition "Cabane à Aviel" au dossier "NAS DAILY" (swipe), chapitre "SLEEP AWAY 😴"
-- (id 2b78f2fe-40ba-4ae0-97b1-6536983df206) : nuit dans une cabane perchée, comme les autres
-- propositions romantiques "nuit à l'hôtel" déjà dans ce chapitre (Bat Shlomo, Ein Gedi, Kinneret...).
-- Ordre placé après la dernière proposition existante (16) : à retrier par catégorie via le back
-- office si besoin d'un emplacement précis dans le chapitre.

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, ville, ville_en, ville_he,
    nom_hotel, nom_hotel_en, nom_hotel_he, tags,
    mode_reservation, statut
  ) VALUES (
    'CABANE DANS LES ARBRES À AVIEL', 'TREEHOUSE IN AVIEL', 'בית עץ באביאל',
    'Une cabane perchée au milieu des vignes, un jacuzzi extérieur, des sources et ruisseaux à explorer à pied. Nuit hors du temps à Moshav Aviel.',
    'A treehouse perched among the vines, an outdoor hot tub, springs and streams to explore on foot. A night out of time in Moshav Aviel.',
    'בית עץ המתנשא בין הכרמים, ג''קוזי חיצוני, מעיינות ונחלים לגלות ברגל. לילה מחוץ לזמן במושב אביאל.',
    '2b78f2fe-40ba-4ae0-97b1-6536983df206', 'Haïfa / Zichron Yaakov', 'Moshav Aviel', 'Moshav Aviel', 'מושב אביאל',
    'On the Tree · Treehouse Aviel', 'On the Tree · Treehouse Aviel', 'On the Tree · Treehouse Aviel',
    ARRAY['cabane', 'nature', 'jacuzzi', 'vignes', 'romantique'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 17 FROM ins;
