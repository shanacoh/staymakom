-- 1) Remplace le contenu de 2 propositions existantes du dossier "NAS DAILY" (chapitre
--    "SLEEP AWAY 😴", id 2b78f2fe-40ba-4ae0-97b1-6536983df206) : "WAKE UP ON THE KINNERET"
--    (qui n'avait qu'un texte anglais dans la colonne FR, sans EN/HE) et "LA TOSCANE DU NÉGUEV".
-- 2) Ajoute 4 nouvelles propositions "nuit à l'hôtel" au même dossier, même chapitre.
-- Traduction hébreu ajoutée partout pour rester cohérent avec le reste du dossier (déjà trilingue).
--
-- NOTE pour Shana : pour "Désert du Néguev", tu indiques 2 hôtels (Beresheet / Kedma) avec l'idée
-- de "bulles" à choisir. Le champ nom_hôtel actuel est un simple texte, pas une liste d'options
-- sélectionnables : j'ai mis "Beresheet ou Kedma" en attendant ta confirmation (ou construire
-- un vrai choix à bulles serait un développement à part, pas juste une migration de données).

UPDATE public.propositions SET
  titre = 'AUBE SUR LE KINNERET',
  titre_en = 'DAWN ON THE SEA OF GALILEE',
  titre_he = 'שחר על הכנרת',
  description = 'Le Kinneret pour vous tout seul, le temps d''un lever de soleil en SUP. Une ferme de lavande à quelques minutes, une nuit les pieds dans l''eau au Setai.',
  description_en = 'The Sea of Galilee all to yourself, for one sunrise on a paddleboard. A lavender farm minutes away, a night by the water at the Setai.',
  description_he = 'הכנרת כולה בשבילכם, לרגע של זריחה על גלשן SUP. חוות לבנדר במרחק דקות, לילה עם הרגליים במים בסטאי.',
  nom_hotel = 'Setai Sea of Galilee',
  nom_hotel_en = 'Setai Sea of Galilee',
  nom_hotel_he = 'Setai Sea of Galilee',
  ville = 'Tibériade',
  ville_en = 'Tiberias',
  ville_he = 'טבריה',
  region = 'Kinneret / Galilée',
  tags = ARRAY['SUP', 'lac', 'lavande', 'lever de soleil']
WHERE id = 'da1efbe6-f294-4011-9bd3-4286f80933f0';

UPDATE public.propositions SET
  titre = 'UNE NUIT DANS LE GRAND DÉSERT',
  titre_en = 'A NIGHT IN THE WILD NEGEV',
  titre_he = 'לילה במדבר הגדול',
  description = 'Le désert version grand format : chameau, jeep, dunes à dévaler en sandboard. La nuit tombe sur un dîner bédouin, sous plus d''étoiles qu''on en voit ailleurs.',
  description_en = 'The desert in widescreen: camel, jeep, dunes to ride down on a sandboard. Night falls on a Bedouin dinner, under more stars than anywhere else.',
  description_he = 'המדבר בגרסה גדולה: גמל, ג''יפ, דיונות לגלוש עליהן בסנובורד. הלילה יורד על ארוחת ערב בדואית, תחת יותר כוכבים משרואים בכל מקום אחר.',
  nom_hotel = 'Beresheet ou Kedma',
  nom_hotel_en = 'Beresheet or Kedma',
  nom_hotel_he = 'Beresheet או Kedma',
  ville = 'Mitzpe Ramon',
  ville_en = 'Mitzpe Ramon',
  ville_he = 'מצפה רמון',
  region = 'Néguev',
  tags = ARRAY['désert', 'chameau', 'jeep', 'bédouin', 'étoiles']
WHERE id = 'e8998679-49ed-4c9e-a87c-5ead530d4e58';

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, ville, ville_en, ville_he,
    nom_hotel, nom_hotel_en, nom_hotel_he, tags,
    mode_reservation, statut
  ) VALUES (
    'VIGNES ET CHEF PRIVÉ À BAT SHLOMO', 'VINES AND A PRIVATE CHEF IN BAT SHLOMO', 'כרמים ושף פרטי בבת שלמה',
    'Un chef privé aux fourneaux, du vin de la maison au coucher du soleil, les vignes à perte de vue. La Farmhouse Bat Shlomo, en mode intime.',
    'A private chef in the kitchen, house wine at sunset, vines as far as the eye can see. Farmhouse Bat Shlomo, the intimate version.',
    'שף פרטי במטבח, יין הבית בשקיעה, כרמים עד קצה האופק. פארמהאוס בת שלמה, בגרסה האינטימית.',
    '2b78f2fe-40ba-4ae0-97b1-6536983df206', 'Carmel', 'Bat Shlomo', 'Bat Shlomo', 'בת שלמה',
    'Farmhouse Bat Shlomo', 'Farmhouse Bat Shlomo', 'Farmhouse Bat Shlomo',
    ARRAY['vin', 'gastronomie', 'chef privé', 'romantique'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 19 FROM ins;

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, ville, ville_en, ville_he,
    nom_hotel, nom_hotel_en, nom_hotel_he, tags,
    mode_reservation, statut
  ) VALUES (
    'LE DROIT DE NE RIEN FAIRE', 'PERMISSION TO DO NOTHING', 'הזכות לא לעשות כלום',
    'Pas de programme, pas d''horaire. Juste le spa, la forêt de Jérusalem, et le droit de ne rien faire.',
    'No program, no schedule. Just the spa, the Jerusalem hills, and permission to do nothing.',
    'בלי תוכנית, בלי לוח זמנים. רק הספא, הרי ירושלים, והזכות לא לעשות כלום.',
    '2b78f2fe-40ba-4ae0-97b1-6536983df206', 'Jérusalem / Judée', 'Ma''ale HaHamisha', 'Ma''ale HaHamisha', 'מעלה החמישה',
    'Ma''ale HaHamisha', 'Ma''ale HaHamisha', 'מעלה החמישה',
    ARRAY['spa', 'détente', 'calme'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 20 FROM ins;

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, ville, ville_en, ville_he,
    nom_hotel, nom_hotel_en, nom_hotel_he, tags,
    mode_reservation, statut
  ) VALUES (
    'ROOTS À EIN GEDI', 'GOING ROOTS IN EIN GEDI', 'רוטס בעין גדי',
    'Dormir en caravane face au désert, la mer Morte à cinq minutes, Massada au réveil. Ein Gedi Camp Lodge, la version authentique.',
    'Sleep in a caravan facing the desert, the Dead Sea five minutes away, Masada waiting at sunrise. Ein Gedi Camp Lodge, the raw version.',
    'לישון בקרוואן מול המדבר, ים המלח במרחק חמש דקות, מצדה מחכה עם הבוקר. עין גדי קמפ לודג'', הגרסה האותנטית.',
    '2b78f2fe-40ba-4ae0-97b1-6536983df206', 'Mer Morte', 'Ein Gedi', 'Ein Gedi', 'עין גדי',
    'Ein Gedi Camp Lodge', 'Ein Gedi Camp Lodge', 'Ein Gedi Camp Lodge',
    ARRAY['mer morte', 'Massada', 'roots', 'nature'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 21 FROM ins;

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, ville, ville_en, ville_he,
    nom_hotel, nom_hotel_en, nom_hotel_he, tags,
    mode_reservation, statut
  ) VALUES (
    'VIN SOUS LES ÉTOILES', 'WINE UNDER THE STARS', 'יין תחת הכוכבים',
    'Cinq vins dégustés en cave, plateau de fromages face au désert. La nuit, le ciel du Néguev sans aucune lumière, à observer à l''œil nu. Pizzas au feu de bois, nuit à Carmey Avdat.',
    'Five wines tasted in the cellar, a cheese platter facing the desert. At night, the Negev sky with zero light pollution, yours to watch. Wood-fired pizza, night at Carmey Avdat.',
    'חמישה יינות בטעימה במרתף, מגש גבינות מול המדבר. בלילה, שמי הנגב ללא שום זיהום אור, לצפייה בעין בלתי מזוינת. פיצות מתנור עצים, לילה בכרמי עבדת.',
    '2b78f2fe-40ba-4ae0-97b1-6536983df206', 'Néguev (Avdat)', 'Avdat', 'Avdat', 'עבדת',
    'Carmey Avdat', 'Carmey Avdat', 'כרמי עבדת',
    ARRAY['vin', 'étoiles', 'désert', 'astronomie', 'winery'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 22 FROM ins;
