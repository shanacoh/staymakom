-- Insert experience: Ceramic Workshop and Stay at the Inbal Jerusalem
DO $$
DECLARE
  exp_id UUID := gen_random_uuid();
  hotel_uuid UUID;
  tag_night UUID;
  tag_breakfast UUID;
  tag_spa UUID;
  tag_kosher UUID;
  pos INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%inbal jerusalem%' LIMIT 1;

  IF hotel_uuid IS NULL THEN
    RAISE EXCEPTION 'Hotel Inbal Jerusalem not found in hotels2 table';
  END IF;

  INSERT INTO experiences2 (
    id, hotel_id, title, title_he, slug, status,
    subtitle, subtitle_he,
    long_copy, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr
  ) VALUES (
    exp_id,
    hotel_uuid,
    'Ceramic Workshop and Stay at the Inbal Jerusalem',
    'סדנת קרמיקה ולילה באינבל ירושלים',
    'ceramic-workshop-inbal-jerusalem',
    'published',
    'A hands-on ceramic workshop in a Jerusalem studio, followed by spa access and a stay at the Inbal Jerusalem, in the heart of Talbieh.',
    'סדנת קרמיקה בסטודיו ירושלמי, גישה לספא ולילה במלון אינבל ירושלים, בלב שכונת טלביה.',
    'A ceramic workshop in Jerusalem, and a stay at the Inbal, Talbieh. The city that invented patience, and a craft that requires it.

In the afternoon, you go to the studio. A Jerusalem ceramicist, a wheel or a slab, and two hours with your hands in clay. No experience needed. The point is not to make something perfect. The point is to make something with your hands, slowly, in a city where everything around you was also made by hand, over centuries. The studio is small, the group is small, and the instructor works with you directly. You leave with a piece to take home, still warm from the kiln.

You come back to the Inbal as the light drops over Talbieh. The Inbal Spa is yours: steam room, sauna, the particular quiet of a spa at the end of a day spent making. No treatment scheduled, no clock to watch. Just the water and the stillness.

The rooftop pool after, if you want it. The Old City walls on the horizon, Jerusalem at night. The Lobby serves kosher dinner if you want to stay close.

Breakfast the next morning is a full kosher buffet at The Lobby. Jerusalem outside, already moving. You leave carrying something you made with your own hands. That does not happen often enough.',
    'סדנת קרמיקה בירושלים, ולילה באינבל, טלביה. העיר שהמציאה סבלנות, ומלאכה שדורשת אותה.

אחר הצהריים, אתם הולכים לסטודיו. קרמיקאי ירושלמי, גלגל או לוח, ושעתיים עם הידיים בחימר. אין צורך בניסיון. המטרה היא לא לייצר משהו מושלם. המטרה היא לייצר משהו עם הידיים, לאט, בעיר שבה כל מה שסביבכם גם הוא נוצר ביד, לאורך מאות שנים. הסטודיו קטן, הקבוצה קטנה, והמדריך עובד איתכם ישירות. אתם עוזבים עם חתיכה לקחת הביתה, עוד חמה מהכבשן.

אתם חוזרים לאינבל כשהאור יורד על טלביה. ספא אינבל פתוח: חדר אדים, סאונה, השקט המיוחד של ספא בסוף יום של יצירה. אין טיפול מתוזמן, אין שעון לעקוב אחריו. רק המים והדממה.

בריכת הגג אחר כך, אם רוצים. חומות העיר העתיקה באופק, ירושלים בלילה. The Lobby מגיש ארוחת ערב כשרה אם רוצים להישאר קרוב.

ארוחת הבוקר למחרת היא בופה כשר מלא ב-The Lobby. ירושלים בחוץ, כבר בתנועה. אתם עוזבים עם משהו שיצרתם בידיים שלכם. זה לא קורה מספיק פעמים.',
    0, 'per_person', 'ILS',
    2, 4, 1, 2,
    'Ceramic Workshop & Stay at the Inbal Jerusalem | STAYMAKOM',
    'A hands-on ceramic workshop in a Jerusalem studio, spa access, and a night at the Inbal Jerusalem. A stay built around making something slow.',
    'Make Something in Jerusalem',
    'Clay, a Jerusalem studio, the Inbal Spa, and a rooftop pool facing the Old City. A stay for those who travel to create, not just to see.',
    'סדנת קרמיקה ולילה באינבל ירושלים | STAYMAKOM',
    'סדנת קרמיקה בסטודיו ירושלמי, גישה לספא ולילה באינבל ירושלים. שהייה שנבנתה סביב יצירה איטית.',
    'לייצר משהו בירושלים',
    'חימר, סטודיו ירושלמי, ספא אינבל ובריכת גג מול חומות העיר העתיקה. לטיילנים שבאים ליצור, לא רק לראות.',
    'Atelier céramique & séjour à l''Inbal Jerusalem | STAYMAKOM',
    'Un atelier céramique dans un studio jérusalémite, accès spa et une nuit à l''Inbal Jerusalem. Un séjour construit autour du faire.',
    'Créer quelque chose à Jérusalem',
    'De l''argile, un studio à Jérusalem, le spa de l''Inbal et une piscine sur les toits face aux remparts. Pour ceux qui voyagent pour créer.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'One night at the Inbal Jerusalem',                  'לילה אחד במלון אינבל ירושלים',                  0, true),
    (exp_id, 'Full kosher buffet breakfast at The Lobby',         'ארוחת בוקר בופה כשרה מלאה ב-The Lobby',          1, true),
    (exp_id, 'Hands-on ceramic workshop in a Jerusalem studio',   'סדנת קרמיקה עם הידיים בסטודיו ירושלמי',          2, true),
    (exp_id, 'Your ceramic piece to take home',                   'יצירת הקרמיקה שלכם לקחת הביתה',                  3, true),
    (exp_id, 'Full access to the Inbal Spa',                      'גישה מלאה לספא אינבל',                            4, true),
    (exp_id, 'Rooftop pool access',                               'גישה לבריכת הגג',                                 5, true);

  SELECT id INTO tag_night     FROM highlight_tags WHERE slug = 'night'      LIMIT 1;
  SELECT id INTO tag_breakfast FROM highlight_tags WHERE slug = 'breakfast'  LIMIT 1;
  SELECT id INTO tag_spa       FROM highlight_tags WHERE slug = 'spa-access' LIMIT 1;

  SELECT id INTO tag_kosher FROM highlight_tags WHERE slug = 'kosher' LIMIT 1;
  IF tag_kosher IS NULL THEN
    INSERT INTO highlight_tags (slug, label_en, label_he, is_common, display_order)
    VALUES ('kosher', 'Kosher', 'כשר', true, 21)
    RETURNING id INTO tag_kosher;
  END IF;

  pos := 0;
  IF tag_night     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,     pos); pos := pos + 1; END IF;
  IF tag_breakfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_breakfast, pos); pos := pos + 1; END IF;
  IF tag_spa       IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,       pos); pos := pos + 1; END IF;
  IF tag_kosher    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,    pos); END IF;

END $$;
