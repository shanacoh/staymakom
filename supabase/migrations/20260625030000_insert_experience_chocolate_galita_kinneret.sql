-- Insert experience: Chocolate Workshop at Galita — Lake House Kinneret
DO $$
DECLARE
  exp_id        UUID    := gen_random_uuid();
  hotel_uuid    UUID;
  tag_night     UUID;
  tag_bfast     UUID;
  tag_cooking   UUID;
  tag_pool      UUID;
  tag_kids      UUID;
  tag_kosher    UUID;
  pos           INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%lake house%' AND name ILIKE '%kinneret%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%lake house kinneret%' LIMIT 1;
  END IF;
  -- If hotel not found, hotel_uuid stays NULL and will be linked manually

  INSERT INTO experiences2 (
    id, hotel_id, title, title_he, title_fr, slug, status,
    subtitle, subtitle_he, subtitle_fr,
    long_copy, long_copy_he, long_copy_fr,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr
  ) VALUES (
    exp_id,
    hotel_uuid,
    'CHOCOLATE WORKSHOP AT GALITA, SEA OF GALILEE',
    'סדנת שוקולד בגלית, ים כינרת',
    'Atelier chocolat chez Galita, lac de Tibériade',
    'chocolate-workshop-galita-kinneret',
    'draft',
    'A hands-on chocolate workshop at Galita''s farm by the Sea of Galilee, followed by a stay at Lake House Kinneret, right on the lake.',
    'סדנת שוקולד עשייתית בחווה גלית על שפת ים הכינרת, ולאחריה שהייה בלייק האוס כינרת, ישירות על האגם.',
    'Un atelier chocolat pratique à la ferme Galita, au bord du lac de Tibériade, suivi d''un séjour au Lake House Kinneret, directement sur le lac.',
    'A hands-on chocolate workshop at Galita, followed by a stay at Lake House Kinneret, right on the Sea of Galilee. The lake just outside the window, and a table covered in melted chocolate for the next hour.

It starts with a short film, the story of chocolate and of Galita itself, then the host walks you over to the workshop tables. Six workshops to pick from, pralines and truffles if you''re feeling romantic, chocolate boxes and mendiants for steadier hands, a 3D house or car if you''d rather build something. Everyone at the table picks differently and ends up with the same sticky fingers anyway. Once the chocolate sets, a puzzle sends you into the garden, where a code is waiting to be cracked between the trees.

From the farm, it''s a short drive to Lake House Kinneret, sitting right on the water. The lake stretches out from the private beach, the Golan visible on the far shore. Rooms open onto balconies looking out at the water, and the pool sits close enough you can hear it.

The hotel''s free access to the Tiberias Hot Springs next door is one of the simplest pleasures here, mineral pools warmed from below ground, open to anyone who wants to slow the day down.

Breakfast looks out at the same water that greeted you from the chocolate farm that morning. The kind of view that makes you order a second coffee just to keep looking at it.',
    'סדנת שוקולד עשייתית בגלית, ולאחריה שהייה בלייק האוס כינרת, ישירות על שפת ים כינרת. הכינרת ממש מעבר לחלון, ושולחן מכוסה שוקולד מומס לשעה הקרובה.

מתחילים בסרטון קצר, סיפור השוקולד וסיפורה של גלית, ואז המארחת מוליכה אתכם אל שולחנות הסדנה. שש סדנאות לבחירה, פרלינים וטראפלס למי שרוצה רומנטיקה, קופסאות שוקולד ומנדיאנים לידיים יציבות יותר, בית או מכונית תלת-מימד למי שמעדיף לבנות. כולם בסדנה בוחרים אחרת ומסיימים בכל זאת עם אצבעות דביקות. ברגע שהשוקולד מתמצק, פאזל שולח אתכם לגינה, שם ממתין קוד לפיצוח בין העצים.

מהחווה, נסיעה קצרה מביאה ללייק האוס כינרת, שיושב ישירות על המים. הכינרת נשקפת מהחוף הפרטי, הגולן נראה על הגדה השנייה. החדרים נפתחים למרפסות מול המים, והבריכה קרובה מספיק כדי לשמוע אותה.

הכניסה החינמית למעיינות החמים של טבריה, ממש בסמוך, היא אחד הפינוקים הפשוטים ביותר כאן, בריכות מינרלים מחוממות מהאדמה, פתוחות למי שרוצה להאט את היום.

ארוחת הבוקר מול אותם מים שקיבלו אתכם מחוות השוקולד באותו בוקר. הסוג של נוף שגורם לכם להזמין קפה נוסף רק כדי להמשיך להביט בו.',
    'Un atelier chocolat pratique chez Galita, suivi d''un séjour au Lake House Kinneret, directement sur le lac de Tibériade. Le lac juste derrière la fenêtre, et une table couverte de chocolat fondu pour l''heure qui suit.

Tout commence par un court film, l''histoire du chocolat et celle de Galita, puis l''hôte vous emmène vers les tables de l''atelier. Six ateliers au choix, pralines et truffes pour les romantiques, boîtes de chocolat et mendiants pour les mains plus précises, une maison ou une voiture en 3D pour qui préfère construire quelque chose. Chacun à table choisit autre chose et finit quand même avec les doigts collants. Une fois le chocolat figé, un puzzle vous envoie dans le jardin, où un code attend d''être déchiffré entre les arbres.

Depuis la ferme, une courte route mène au Lake House Kinneret, posé directement sur l''eau. Le lac s''étend depuis la plage privée, le Golan visible sur l''autre rive. Les chambres ouvrent sur des balcons face à l''eau, et la piscine est assez proche pour qu''on l''entende.

L''accès gratuit aux sources chaudes de Tibériade, juste à côté, est un des plaisirs les plus simples ici, des bassins minéraux chauffés depuis les profondeurs, ouverts à qui veut ralentir la journée.

Le petit-déjeuner face à la même eau qui vous a accueillis depuis la ferme de chocolat ce matin-là. Le genre de vue qui donne envie d''un second café juste pour continuer à la regarder.',
    0, 'per_booking', 'ILS',
    2, 10, 1, 1,
    'Chocolate Workshop at Galita + Lake Kinneret Stay',
    'A hands-on chocolate workshop at Galita''s farm by the Sea of Galilee, followed by a night at Lake House Kinneret on the lake.',
    'Melted Chocolate, Then a Lake View',
    'Six workshops to choose from, a garden puzzle, and a balcony over the Sea of Galilee by evening.',
    'סדנת שוקולד בגלית ולינה על הכינרת',
    'סדנת שוקולד עשייתית בחווה ליד ים הכינרת, ולאחריה לינה בלייק האוס כינרת ישירות על האגם.',
    'שוקולד מומס, ואז נוף לכינרת',
    'שש סדנאות לבחירה, פאזל בגינה, ומרפסת מול ים כינרת עם רדת הערב.',
    'Atelier chocolat chez Galita et nuit sur la Kinneret',
    'Atelier chocolat pratique à la ferme Galita au bord du lac de Tibériade, suivi d''une nuit au Lake House Kinneret sur le lac.',
    'Du chocolat fondu, puis une vue sur le lac',
    'Six ateliers au choix, un puzzle dans le jardin, et un balcon sur le lac de Tibériade le soir venu.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Short film on the story of chocolate and Galita',        'סרטון קצר על סיפור השוקולד וגלית',                          0, true),
    (exp_id, 'Hands-on chocolate workshop, choice of 6 themes',        'סדנת שוקולד עשייתית, בחירה בין 6 נושאים',                   1, true),
    (exp_id, 'Puzzle adventure in the chocolate garden',               'משחק פאזל בגינת השוקולד',                                   2, true),
    (exp_id, 'A night at Lake House Kinneret, on the Sea of Galilee',  'לילה בלייק האוס כינרת, על שפת ים כינרת',                   3, true),
    (exp_id, 'Free access to the adjacent Tiberias Hot Springs',       'כניסה חינמית למעיינות החמים של טבריה הסמוכים',             4, true),
    (exp_id, 'Breakfast buffet with a lake view',                      'ארוחת בוקר בופה עם נוף לכינרת',                            5, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'          LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'      LIMIT 1;
  SELECT id INTO tag_cooking FROM highlight_tags WHERE slug = 'cooking-class'  LIMIT 1;
  SELECT id INTO tag_pool    FROM highlight_tags WHERE slug = 'pool'           LIMIT 1;
  SELECT id INTO tag_kids    FROM highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  SELECT id INTO tag_kosher  FROM highlight_tags WHERE slug = 'kosher'         LIMIT 1;

  pos := 0;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); pos := pos + 1; END IF;
  IF tag_cooking IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_cooking, pos); pos := pos + 1; END IF;
  IF tag_pool    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,    pos); pos := pos + 1; END IF;
  IF tag_kids    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids,    pos); pos := pos + 1; END IF;
  IF tag_kosher  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,  pos); END IF;

END $$;
