-- Ajoute 3 nouvelles propositions au dossier "NAS DAILY" (swipe) : trois excursions à la journée
-- hors Tel Aviv (route des vins, Néguev intense, Rosh Hanikra). Rangées dans le chapitre
-- "ESCAPE TEL AVIV 🚗" (id 8dd76082-9295-40c3-ac44-d85e411f4465), qui contient déjà les autres
-- excursions à la journée du dossier (montgolfière, vin au cratère, dîner sous les étoiles).
-- Titres en majuscules (FR/EN) pour respecter la règle du dossier (migration 20260729080000) ;
-- traduction hébreu ajoutée pour rester cohérent avec le reste du dossier (déjà trilingue).

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, tags,
    mode_reservation, statut
  ) VALUES (
    'SUR LA ROUTE DES VINS', 'ON THE WINE ROUTE', 'בדרך היין',
    'Trois wineries, trois univers, un guide qui connaît chaque cépage. Une journée à remonter le vin israélien, entre Galilée et Judée.',
    'Three wineries, three worlds, a guide who knows every grape. A day tracing Israeli wine, through Galilee and Judea.',
    'שלושה יקבים, שלושה עולמות, מדריך שמכיר כל זן גפן. יום שמתחקה אחר היין הישראלי, בין הגליל ליהודה.',
    '8dd76082-9295-40c3-ac44-d85e411f4465', 'Galilée ou Judée', ARRAY['vin', 'dégustation', 'guide'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 15 FROM ins;

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, tags,
    mode_reservation, statut
  ) VALUES (
    'NÉGUEV, VERSION INTENSE', 'NEGEV, THE INTENSE VERSION', 'הנגב, הגרסה האינטנסיבית',
    'Chameau au lever du jour, jeep dans les canyons, sandboard sur les dunes, photos au coucher du soleil. Le Néguev en une seule journée, version intense.',
    'Camel at sunrise, jeep through canyons, sandboarding down dunes, sunset photos. The Negev in a single day, the intense version.',
    'גמל עם הזריחה, ג''יפ בקניונים, סנובורד על הדיונות, צילומי שקיעה. הנגב ביום אחד, הגרסה האינטנסיבית.',
    '8dd76082-9295-40c3-ac44-d85e411f4465', 'Néguev', ARRAY['désert', 'aventure', 'photo', 'chameau'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 16 FROM ins;

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, tags,
    mode_reservation, statut
  ) VALUES (
    'GROTTES ET EAU TURQUOISE À ROSH HANIKRA', 'GROTTOES AND TURQUOISE WATER IN ROSH HANIKRA', 'מערות ומים טורקיז בראש הנקרה',
    'Des grottes sculptées par la mer, un masque et tuba dans une eau turquoise. La Méditerranée version secrète, tout en haut du pays.',
    'Sea-carved grottoes, mask and snorkel in turquoise water. The Mediterranean''s secret side, at the very top of the country.',
    'מערות שפוסלו על ידי הים, מסכה ושנורקל במים טורקיז. הצד הסודי של הים התיכון, ממש בקצה הצפוני של הארץ.',
    '8dd76082-9295-40c3-ac44-d85e411f4465', 'Nord / Rosh Hanikra', ARRAY['grottes', 'snorkeling', 'côte'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 17 FROM ins;
