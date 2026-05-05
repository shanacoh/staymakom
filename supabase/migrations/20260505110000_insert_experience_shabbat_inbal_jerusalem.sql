-- Insert experience: The Shabbat You Never Had — The Inbal Jerusalem
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_bfast       UUID;
  tag_dinner      UUID;
  tag_kosher      UUID;
  tag_tour        UUID;
  pos             INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%inbal%' AND name ILIKE '%jerusalem%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%inbal%' LIMIT 1;
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
    'The Shabbat You Never Had',
    'השבת שלא הכרתם',
    'shabbat-inbal-jerusalem',
    'draft',
    'A Kabbalat Shabbat a few minutes from the hotel, then a festive Shabbat stay at The Inbal Jerusalem, steps from the Old City walls.',
    'קבלת שבת במרחק כמה דקות הליכה, ואחריה שהייה חגיגית בשבת באינבל ירושלים, צעדים מחומות העיר העתיקה.',
    'The Shabbat you never had, in Jerusalem. For couples, families, and groups of friends.

Your Shabbat begins before you even check in. On Friday afternoon, while the city is still moving, you join a Kabbalat Shabbat a few minutes'' walk from the hotel. The setting is open-air, surrounded by ancient Jerusalem stone and the last light of the week. The music starts, live, traditional melodies woven with Israeli songs, voices joining from all directions. The Lecha Dodi rises. Strangers become a community for two hours. By the time it ends, Shabbat has already arrived inside you, before you have crossed a single threshold.

Then you walk to The Inbal. A few minutes, nothing more.

The hotel sits facing Liberty Bell Park, with a direct line of sight to the Old City walls. The Western Wall is ten minutes on foot. Jaffa Gate and Mount Zion are closer still. After the Kabbalat Shabbat, the hotel absorbs you: the lobby warm, the staff the kind that remembers your name, and the rooms wide enough to feel like you have room to breathe.

Friday night dinner is the event. The Inbal''s Shabbat table draws Jerusalem regulars for a reason: braised beef, roast chicken, Moroccan fish, cholent, a buffet that carries the memory of Jewish communities from every corner of the world. The dining room fills with noise of the good kind. Families, couples, friends. For groups travelling together, connecting rooms make the whole floor feel like yours.

Saturday morning, breakfast arrives like a second celebration. Artisan cheeses, fresh fish, eggs to order, pastries from the in-house bakery, tandoor breads that guests plan their return trips around. After breakfast, the pool and spa are there if you want them. The Old City is still there, ten minutes away, waiting for Shabbat afternoon. The kind of stay that resets something.',
    'השבת שלא הכרתם, בירושלים. לזוגות, משפחות וחבורות חברים.

השבת שלכם מתחילה עוד לפני שהגעתם למלון. ביום שישי אחר הצהריים, כשהעיר עוד פועמת, אתם מצטרפים לקבלת שבת במרחק כמה דקות הליכה מהאינבל. המקום פתוח לשמיים, אבן ירושלמית מכל עבר, ואור שעות בין-ערביים שמשתנה לאיטו. המוזיקה מתחילה, חיה, ניגונים מסורתיים שמתמזגים עם שירי ארץ ישראל, וקולות מצטרפים מכל הכיוונים. "לכה דודי" עולה. זרים הופכים לקהילה לשעתיים. כשזה נגמר, השבת כבר הגיעה אליכם פנימה, עוד לפני שחצתם סף אחד.

ואז הולכים לאינבל. כמה דקות, לא יותר.

המלון פונה לפארק המגינים, עם נוף ישיר לחומות העיר העתיקה. הכותל הוא עשר דקות הליכה. שער יפו והר ציון קרובים עוד יותר. אחרי קבלת שבת, המלון קולט אתכם: לובי חמים, צוות שזוכר את השמות, וחדרים מרווחים שנותנים לכם מקום לנשום.

ארוחת שישי בלילה היא האירוע. שולחן השבת של האינבל ידוע בירושלים: בשר בקר מבושל, עוף בתנור, דג מרוקאי, חמין, בופה שנושא את זיכרון הקהילות היהודיות מכל קצות הגלות. חדר האוכל מתמלא ברעש מהסוג הטוב. משפחות, זוגות, חברים. לקבוצות, יש חדרים מחוברים שהופכים את הקומה לשלכם.

בוקר שבת, ארוחת הבוקר מגיעה כמו חגיגה שנייה. גבינות אומן, דגים טריים, ביצים לפי הזמנה, מאפים ממאפיית המלון, לחמי תנדור שאורחים מתכננים סביבם טיול חוזר. אחרי ארוחת הבוקר, הבריכה והספא ממתינים. והעיר העתיקה עדיין שם, עשר דקות, מחכה לאחר הצהריים של שבת. הסוג של שהייה שמאפסת משהו.',
    0, 'per_booking', 'ILS',
    2, 20, 1, 1,
    'Shabbat Experience at The Inbal Jerusalem | STAYMAKOM',
    'Kabbalat Shabbat in the Valley of Hinnom, then a festive Shabbat dinner and stay at The Inbal Jerusalem, steps from the Old City walls.',
    'Shabbat Like Never Before at The Inbal Jerusalem',
    'Begin Shabbat with live singing in the Valley of Hinnom. Return to The Inbal: festive dinner, the Old City at walking distance, and Saturday breakfast worth staying for.',
    'חוויית שבת באינבל ירושלים | STAYMAKOM',
    'קבלת שבת בגיא בן הינום, ארוחת שישי חגיגית ולינה באינבל ירושלים, צעדים מחומות העיר העתיקה.',
    'שבת כמו שלא חוויתם באינבל ירושלים',
    'מתחילים עם קבלת שבת עם מוזיקה חייה בגיא בן הינום, וחוזרים לאינבל: ארוחה חגיגית, נוף לחומות, בוקר שבת שאי אפשר לשכוח.',
    'Shabbat à l''Inbal Jerusalem | STAYMAKOM',
    'Kabbalat Shabbat dans la vallée de Ben Hinnom, dîner festif et nuit à l''Inbal Jerusalem, à quelques pas des remparts de la Vieille Ville.',
    'Un Shabbat d''exception à Jérusalem',
    'Chants et musique dans la vallée de Ben Hinnom, puis retour à l''Inbal: dîner de Shabbat, vue sur les remparts, et un petit-déjeuner qui vaut le voyage.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Kabbalat Shabbat experience at the Farm in the Valley of Hinnom', 'קבלת שבת בחווה בגיא בן הינום',                          0, true),
    (exp_id, 'Festive Friday night Shabbat dinner at The Inbal',               'ארוחת שישי חגיגית באינבל',                                1, true),
    (exp_id, 'One night accommodation at The Inbal Jerusalem',                  'לילה אחד במלון האינבל ירושלים',                          2, true),
    (exp_id, 'The Inbal''s celebrated breakfast buffet on Saturday morning',    'ארוחת הבוקר המפורסמת של האינבל ביום שבת',                3, true),
    (exp_id, 'Access to the pool and spa facilities',                           'גישה לבריכה ולמתקני הספא',                               4, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'     LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast' LIMIT 1;
  SELECT id INTO tag_dinner  FROM highlight_tags WHERE slug = 'dinner'    LIMIT 1;
  SELECT id INTO tag_kosher  FROM highlight_tags WHERE slug = 'kosher'    LIMIT 1;
  SELECT id INTO tag_tour    FROM highlight_tags WHERE slug = 'tour'      LIMIT 1;

  pos := 0;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); pos := pos + 1; END IF;
  IF tag_dinner  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_dinner,  pos); pos := pos + 1; END IF;
  IF tag_kosher  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,  pos); pos := pos + 1; END IF;
  IF tag_tour    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,    pos); END IF;

END $$;
