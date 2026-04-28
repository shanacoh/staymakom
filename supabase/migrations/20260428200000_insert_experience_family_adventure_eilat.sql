-- Insert experience: Family Adventure in Eilat — Vert Hotel Eilat
DO $$
DECLARE
  exp_id       UUID    := gen_random_uuid();
  hotel_uuid   UUID;
  tag_night    UUID;
  tag_bfast    UUID;
  tag_kids     UUID;
  tag_pool     UUID;
  tag_kosher   UUID;
  tag_parking  UUID;
  pos          INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%vert%' AND name ILIKE '%eilat%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%vert hotel eilat%' LIMIT 1;
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
    'Family Adventure in Eilat',
    'הרפתקה משפחתית באילת',
    'family-adventure-eilat',
    'published',
    'A family stay at Vert Hotel Eilat by AFI Hotels and an escape room adventure ten minutes away, the perfect combination for a full family escape in Eilat.',
    'לינה משפחתית במלון ורט אילת והרפתקת חדר בריחה במרחק עשר דקות הליכה, הקומבינציה המושלמת לחופשה משפחתית מלא באילת.',
    'A family stay at Vert Hotel Eilat, on the northern beach promenade. The Red Sea at the end of the street, and everything else within walking distance.

Ten minutes on foot from the hotel sits one of the most well-known escape room venues in Israel. The room is designed for children aged 8 to 13, in English or Hebrew, for groups of 2 to 8 players. The scenario is adventure-based: your mission is to stop an evil video game developer before he takes over the world. Parents can play alongside the kids, or let them handle it from age 10. Sixty minutes of collective problem-solving that tends to stay in the family conversation long after it''s over.

Back at the hotel, Vert Eilat is built for families who want to actually enjoy the time together. The adults'' pool and children''s pool sit side by side, with a lifeguard on duty and a pool kiosk for cold drinks and ice cream. The PlayZone complex keeps older kids going: PlayStation, Sony VR headsets, air hockey, pinball, and arcade machines, open daily from morning until evening. Younger children have supervised art workshops and games at the Freckles Club.

By the time dinner is over and the children have recounted the escape room story for the third time, the day has that rare feeling of having been genuinely full.

Breakfast is a full kosher buffet, generous and unhurried. The kind of morning that belongs to the whole family before Eilat starts pulling you back outside.',
    'לינה משפחתית במלון ורט אילת, על טיילת חוף הצפון. ים סוף בסוף הרחוב, והכל בהליכה.

עשר דקות ברגל מהמלון נמצא אחד ממתחמי חדרי הבריחה המוכרים ביותר בישראל. החדר מתוכנן לילדים בגילאי 8-13, בעברית או באנגלית, לקבוצות של 2 עד 8 שחקנים. הסצנריו הרפתקני: המשימה היא לעצור מפתח משחקים נבזי לפני שהוא משתלט על העולם. הורים יכולים לשחק לצד הילדים, או להניח להם לקחת אחריות מגיל 10. שישים דקות של פתרון בעיות משותף שנשארות בשיחות המשפחה עוד הרבה אחרי שנגמרות.

בחזרה למלון, ורט אילת בנוי למשפחות שרוצות באמת ליהנות מהזמן ביחד. בריכת המבוגרים ובריכת הילדים צמודות, עם מציל וקיוסק עם שתייה קרה וגלידות. קומפלקס ה-PlayZone מעסיק את הגדולים יותר: פלייסטיישן, קסדות VR של סוני, הוקי אוויר, פינבול ומכונות ארקייד, פתוח כל יום מהבוקר עד הערב. הקטנים יותר מוזמנים למועדון פרקלס עם סדנאות יצירה ומשחקים בפיקוח.

עד שהארוחת הערב נגמרת והילדים סיפרו את סיפור חדר הבריחה בפעם השלישית, ליום יש את התחושה הנדירה הזו של יום שהיה באמת מלא.

ארוחת הבוקר היא בופה כשר, נדיב ולא ממהר. הסוג של בוקר ששייך לכל המשפחה לפני שאילת מתחילה למשוך אתכם החוצה שוב.',
    0, 'per_person', 'ILS',
    2, 8, 1, 1,
    'Kids Escape Room and Family Hotel in Eilat',
    'A 60-minute escape room for kids at Herods Hotel, then a family stay at Vert Eilat with pools, PlayZone, and full kosher breakfast.',
    'Eilat Family Stay with Kids Escape Room',
    'Stop Dr. Bubbles, then hit the pool. An escape room mission for kids aged 8–13 and a family night at Vert Hotel Eilat by AFI Hotels.',
    'חדר בריחה לילדים ולינה משפחתית באילת',
    'משחק בריחה של 60 דקות לילדים בגילאי 8-13 במלון הרודס, ולאחריו לינה משפחתית במלון ורט עם בריכה, PlayZone וארוחת בוקר כשרה.',
    'חופשה משפחתית באילת עם חדר בריחה לילדים',
    'לעצור את ד"ר בועות ואז לצנוח לבריכה. חדר בריחה לילדים ולינה במלון ורט אילת.',
    'Escape Room enfants et hôtel famille à Eilat',
    '60 minutes d''escape game pour enfants de 8 à 13 ans, puis une nuit en famille au Vert Hotel Eilat avec piscine, PlayZone et petit-déjeuner kasher.',
    'Séjour famille à Eilat avec escape room pour enfants',
    'Une mission d''escape room pour les enfants, puis la piscine, le PlayZone et une nuit au Vert Hotel Eilat.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Escape room session for children aged 8–13 (English or Hebrew)', 'חדר בריחה לילדים בגילאי 8-13 (עברית או אנגלית)',                         0, true),
    (exp_id, 'Family room with Red Sea or lagoon view and private balcony',    'חדר משפחתי עם נוף לים האדום או ללגונה ומרפסת פרטית',                    1, true),
    (exp_id, 'Access to PlayZone complex with PlayStation, VR and arcade',     'גישה לקומפלקס PlayZone עם פלייסטיישן, VR ומשחקי ארקייד',               2, true),
    (exp_id, 'Adults pool and dedicated children''s pool with lifeguard',      'בריכת מבוגרים ובריכת ילדים עם מציל',                                    3, true),
    (exp_id, 'Full kosher breakfast buffet',                                   'ארוחת בוקר בופה כשר מלא',                                               4, true),
    (exp_id, 'Free underground parking',                                       'חניה תת-קרקעית חינמית',                                                  5, true);

  -- Ensure kosher tag exists (added in later migrations)
  INSERT INTO highlight_tags (slug, label_en, label_he, is_common, display_order)
    VALUES ('kosher', 'Kosher', 'כשר', true, 21)
    ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'           LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'       LIMIT 1;
  SELECT id INTO tag_kids    FROM highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  SELECT id INTO tag_pool    FROM highlight_tags WHERE slug = 'pool'            LIMIT 1;
  SELECT id INTO tag_kosher  FROM highlight_tags WHERE slug = 'kosher'          LIMIT 1;
  SELECT id INTO tag_parking FROM highlight_tags WHERE slug = 'parking'         LIMIT 1;

  pos := 0;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); pos := pos + 1; END IF;
  IF tag_kids    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids,    pos); pos := pos + 1; END IF;
  IF tag_pool    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,    pos); pos := pos + 1; END IF;
  IF tag_kosher  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,  pos); pos := pos + 1; END IF;
  IF tag_parking IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_parking, pos); END IF;

END $$;
