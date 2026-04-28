-- Insert experience: Sunset Picnic & Dinner at Galei Kinneret
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_bfast       UUID;
  tag_dinner      UUID;
  tag_sunset      UUID;
  pos             INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%galei kinneret%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%גלי כנרת%' LIMIT 1;
  END IF;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%galei%' AND name ILIKE '%kinneret%' LIMIT 1;
  END IF;
  -- If hotel not found, hotel_uuid stays NULL and will be linked manually

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
    'Sunset Picnic & Dinner at Galei Kinneret',
    'פיקניק שקיעה וארוחת ערב בגלי כנרת',
    'sunset-picnic-dinner-galei-kinneret',
    'published',
    'A champagne picnic on the private beach at sunset, followed by dinner at Lotte and a stay at Galei Kinneret, on the shores of the Sea of Galilee.',
    'פיקניק שמפניה על החוף הפרטי בשעת השקיעה, ארוחת ערב במסעדת לוטה ולינה בגלי כנרת, על שפת הכנרת.',
    'A champagne picnic on the private beach at Galei Kinneret, Tiberias. The Sea of Galilee at golden hour, just the two of you.

A wicker basket is waiting on the sand when you arrive: a bottle of chilled champagne, two coupes, a selection of small bites, and a deck of romantic conversation cards to open between sips. The sun drops behind the Golan Heights, the water turns copper, and there is nowhere else to be. This is the only hotel in Tiberias with its own private beach, and at this hour, it belongs entirely to you.

When the sky darkens, you move inside to Lotte, the hotel''s restaurant built around the legacy of Lotte Eisenberg and the culinary direction of chef Assaf Granit. The menu draws from the Galilee and the Golan: local fish, produce grown between the hills, a house wine made in collaboration with Recanati Winery. The setting is intimate, the service unhurried.

Your room faces the lake. Rain shower, espresso machine, balcony overlooking the water. The hotel welcomes guests 12 and over, and at night the grounds are quiet in a way that only a lakeside property can be.

Breakfast at Lotte arrives as a series of small dishes: Mediterranean spreads, homemade sourdough, Galilean pastries, Nespresso. The Kinneret in the morning is a different shade entirely. The kind of morning that makes leaving feel like a decision you keep postponing.',
    'פיקניק שמפניה על החוף הפרטי של גלי כנרת, טבריה. הכנרת בשעת הזהב, רק שניכם.

סל נצרים מחכה על החול כשאתם מגיעים: בקבוק שמפניה צונן, שתי כוסות, מבחר קטן של מטעמים וחפיסת קלפים רומנטיים לפתוח בין לגימה ללגימה. השמש שוקעת מאחורי רמת הגולן, המים מקבלים גוון נחושת, ואין שום סיבה להיות במקום אחר. זהו המלון היחיד בטבריה עם חוף פרטי, ובשעה הזו הוא שלכם לגמרי.

כשהשמיים מחשיכים, עוברים אל לוטה. מסעדת המלון בנויה סביב המורשת של לוטה אייזנברג והכיוון הקולינרי של השף אסף גרניט. התפריט שואב מהגליל והגולן: דגים מקומיים, תוצרת שגדלה בין ההרים, ויין הבית שנוצר בשיתוף עם יקב רקנאטי. האווירה אינטימית, השירות רגוע.

החדר שלכם פונה אל האגם. מקלחת גשם, מכונת קפה, מרפסת עם נוף למים. המלון מקבל אורחים מגיל 12, ובלילה השטח שקט באופן שרק נכס בצד אגם יכול להיות.

ארוחת הבוקר בלוטה מגיעה כסדרה של מנות קטנות: ממרחים ים תיכוניים, לחם שאור ביתי, מאפים גליליים, נספרסו. הכנרת בבוקר היא גוון אחר לגמרי. הסוג של בוקר שגורם לעזיבה להרגיש כמו החלטה שאתם מדחים שוב ושוב.',
    0, 'per_person', 'ILS',
    2, 2, 1, 1,
    'Sunset Picnic & Dinner at Galei Kinneret, Tiberias',
    'Champagne picnic on the private beach, dinner at Lotte by Assaf Granit, lake-view room. A romantic stay on the Sea of Galilee.',
    'Sunset on the Kinneret, Just the Two of You',
    'A private picnic as the sun drops behind the Golan, then dinner by Assaf Granit. One night on the Sea of Galilee.',
    'פיקניק שקיעה וארוחת ערב בגלי כנרת, טבריה',
    'פיקניק שמפניה על החוף הפרטי, ארוחת ערב במסעדת לוטה של אסף גרניט, חדר עם נוף לכנרת. לילה רומנטי על שפת הים.',
    'שקיעה על הכנרת, רק שניכם',
    'פיקניק פרטי בשעת השקיעה, ואחריו ארוחת ערב של אסף גרניט. לילה אחד על שפת הכנרת.',
    'Pique-nique au coucher du soleil et dîner au Galei Kinneret',
    'Pique-nique champagne sur la plage privée, dîner chez Lotte by Assaf Granit, chambre vue lac. Une nuit romantique sur la mer de Galilée.',
    'Le coucher de soleil sur le Kinneret, rien que vous deux',
    'Un panier sur le sable au crépuscule, puis la table d''Assaf Granit. Une nuit sur les rives de la mer de Galilée.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Champagne picnic basket on the private beach at sunset', 'סל פיקניק שמפניה על החוף הפרטי בשקיעה',          0, true),
    (exp_id, 'Romantic conversation card deck',                        'חפיסת קלפי שיחה רומנטיים',                       1, true),
    (exp_id, 'Dinner for two at Lotte by Assaf Granit',               'ארוחת ערב לזוג במסעדת לוטה של אסף גרניט',        2, true),
    (exp_id, 'One night in a lake-view room',                          'לילה אחד בחדר עם נוף לכנרת',                     3, true),
    (exp_id, 'Breakfast at Lotte, served in small dishes',            'ארוחת בוקר בלוטה, מוגשת במנות קטנות',            4, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'          LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'      LIMIT 1;
  SELECT id INTO tag_dinner  FROM highlight_tags WHERE slug = 'dinner'         LIMIT 1;
  SELECT id INTO tag_sunset  FROM highlight_tags WHERE slug = 'sunset-drinks'  LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_bfast  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,  pos); pos := pos + 1; END IF;
  IF tag_dinner IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_dinner, pos); pos := pos + 1; END IF;
  IF tag_sunset IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_sunset, pos); END IF;

END $$;
