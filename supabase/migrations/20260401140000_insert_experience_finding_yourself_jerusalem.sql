-- Insert experience: Finding Yourself in Jerusalem (Inbal Hotel)
DO $$
DECLARE
  exp_id UUID := gen_random_uuid();
  hotel_uuid UUID;
  tag_night UUID;
  tag_breakfast UUID;
  tag_spa UUID;
  tag_massage UUID;
  tag_kosher UUID;
  pos INTEGER := 0;
BEGIN

  -- Find Inbal hotel by name (case-insensitive, partial match)
  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%inbal jerusalem%' LIMIT 1;

  IF hotel_uuid IS NULL THEN
    RAISE EXCEPTION 'Hotel Inbal not found in hotels2 table';
  END IF;

  -- Insert the experience
  INSERT INTO experiences2 (
    id, hotel_id, title, title_he, slug, status,
    subtitle, subtitle_he,
    long_copy, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    -- SEO EN
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    -- SEO HE
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    -- SEO FR
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr
  ) VALUES (
    exp_id,
    hotel_uuid,
    'Finding Yourself in Jerusalem',
    'למצוא את עצמך בירושלים',
    'finding-yourself-in-jerusalem',
    'published',
    'A solo day drifting through Jerusalem''s quarters, followed by a massage and a stay at the Inbal Jerusalem, in the heart of Talbieh.',
    'יום של נדידה ברובעי ירושלים, עיסוי ולילה במלון אינבל ירושלים, בלב שכונת טלביה.',
    'Finding yourself in Jerusalem, at the Inbal, Talbieh. Ten minutes from Jaffa Gate. The Old City is not a backdrop here. It is the point.

You walk to the Kotel in the morning, when the plaza is quiet and the stones carry the weight of everything that has happened in front of them. From there, down to the Davidson Center, the excavations at the foot of the southern Temple Mount wall open to the sky, the city two thousand years deep under your feet. Then into the markets: Souq el-Attarin for spices and cardamom coffee, the covered alleys of the Muslim Quarter, a ceramic workshop in the Armenian Quarter that most people walk past. The STAYMAKOM Jerusalem guide points you to the specific addresses. The rest is yours.

You come back to the Inbal in the afternoon. A solo massage at the Inbal Spa is waiting: one treatment, a quiet room, no conversation required. Sauna before if you want it. You surface slowly, and the rooftop pool is there when you are ready. The Old City walls on the horizon, the Jerusalem light doing what it does at four in the afternoon.

The evening is yours. The Lobby serves kosher dinner if you want to stay close. The Talbieh streets are quiet enough to walk without purpose.

Breakfast the next morning is a full kosher buffet at The Lobby, unhurried. Jerusalem outside the window, already moving. You leave with the feeling that you scratched something. Not solved, not finished. Just scratched. That is usually enough.',
    'למצוא את עצמך בירושלים, באינבל, טלביה. עשר דקות משער יפו. העיר העתיקה היא לא הרקע כאן. היא הנקודה.

אתה הולך לכותל בבוקר, כשהרחבה שקטה והאבנים נושאות את כובד כל מה שקרה לפניהן. משם, למטה למרכז דוידסון, החפירות בשולי החומה הדרומית של הר הבית פתוחות לשמיים, העיר עמוקה אלפיים שנה מתחת לרגליך. ואז לשווקים: שוק אל-עטארין לתבלינים וקפה הל, הסמטאות המקורות של הרובע המוסלמי, סדנת קרמיקה ברובע הארמני שרוב האנשים עוברים לידה. מדריך ירושלים של STAYMAKOM מצביע על הכתובות הספציפיות. השאר שלך.

אתה חוזר לאינבל אחר הצהריים. עיסוי סולו בספא אינבל מחכה: טיפול אחד, חדר שקט, ללא צורך בשיחה. סאונה לפני אם רוצים. יוצאים לאט, ובריכת הגג שם כשמוכנים. חומות העיר העתיקה באופק, אור ירושלים עושה את שלו בארבע אחר הצהריים.

הערב שלך. The Lobby מגיש ארוחת ערב כשרה אם רוצים להישאר קרוב. רחובות טלביה שקטים מספיק כדי ללכת בהם בלי מטרה.

ארוחת הבוקר למחרת היא בופה כשר מלא ב-The Lobby, ללא מהירות. ירושלים מבעד לחלון, כבר בתנועה. אתה עוזב עם התחושה שגירדת משהו. לא פתרת, לא סיימת. רק גירדת. זה בדרך כלל מספיק.',
    0, 'per_person', 'ILS',
    1, 1, 1, 2,
    -- SEO EN
    'Solo Retreat in Jerusalem | Inbal Hotel | STAYMAKOM',
    'One night at the Inbal Jerusalem with a solo massage, spa access, and a STAYMAKOM guide to the Old City''s quieter layers.',
    'Finding Yourself in Jerusalem',
    'The Kotel at dawn, the spice markets, a massage at the Inbal Spa, and a rooftop pool facing the Old City walls. Solo travel, done right.',
    -- SEO HE
    'נסיגה סולו בירושלים | מלון אינבל | STAYMAKOM',
    'לילה אחד באינבל ירושלים עם עיסוי סולו, גישה לספא ומדריך STAYMAKOM לשכבות השקטות של העיר העתיקה.',
    'למצוא את עצמך בירושלים',
    'הכותל בשחר, שווקי התבלינים, עיסוי בספא אינבל ובריכת גג מול חומות העיר העתיקה. טיול סולו, כמו שצריך.',
    -- SEO FR
    'Retraite solo à Jérusalem | Inbal Hotel | STAYMAKOM',
    'Une nuit à l''Inbal Jerusalem avec massage solo, accès spa et un guide STAYMAKOM pour explorer la Vieille Ville à son rythme.',
    'Se retrouver à Jérusalem',
    'Le Kotel à l''aube, les marchés aux épices, un massage à l''Inbal Spa et une piscine sur les toits face aux remparts. Le voyage solo, autrement.'
  );

  -- Insert includes
  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'One night in a park or city-view room',           'לילה אחד בחדר עם נוף לפארק או לעיר',          0, true),
    (exp_id, 'Full kosher buffet breakfast at The Lobby',       'ארוחת בוקר בופה כשרה מלאה ב-The Lobby',        1, true),
    (exp_id, 'One solo massage at the Inbal Spa',               'עיסוי סולו אחד בספא אינבל',                    2, true),
    (exp_id, 'Sauna access before or after treatment',          'גישה לסאונה לפני או אחרי הטיפול',              3, true),
    (exp_id, 'Rooftop pool access',                             'גישה לבריכת הגג',                               4, true),
    (exp_id, 'STAYMAKOM Jerusalem solo guide',                  'מדריך ירושלים סולו של STAYMAKOM',               5, true);

  -- Link highlight tags (by slug)
  SELECT id INTO tag_night     FROM highlight_tags WHERE slug = 'night'      LIMIT 1;
  SELECT id INTO tag_breakfast FROM highlight_tags WHERE slug = 'breakfast'  LIMIT 1;
  SELECT id INTO tag_spa       FROM highlight_tags WHERE slug = 'spa-access' LIMIT 1;
  SELECT id INTO tag_massage   FROM highlight_tags WHERE slug = 'massage'    LIMIT 1;

  -- Kosher tag — create if missing
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
  IF tag_massage   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_massage,   pos); pos := pos + 1; END IF;
  IF tag_kosher    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,    pos); END IF;

END $$;
