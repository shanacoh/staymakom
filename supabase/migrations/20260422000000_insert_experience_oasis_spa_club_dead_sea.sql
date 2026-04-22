-- Insert experience: Black Gold Ritual at the Dead Sea — Oasis Spa Club
DO $$
DECLARE
  exp_id      UUID    := gen_random_uuid();
  hotel_uuid  UUID;
  tag_night   UUID;
  tag_bfast   UUID;
  tag_spa     UUID;
  tag_massage UUID;
  tag_gym     UUID;
  pos         INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%oasis spa club dead sea%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%oasis spa club%' LIMIT 1;
  END IF;
  IF hotel_uuid IS NULL THEN
    RAISE EXCEPTION 'Hotel "Oasis Spa Club Dead Sea Hotel - Adults Only" not found in hotels2 table';
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
    'Black Gold Ritual at the Dead Sea',
    'ריטואל הזהב השחור בים המלח',
    'black-gold-ritual-dead-sea',
    'published',
    'A Dead Sea float, a mud ritual, and full spa access at Oasis Spa Club, followed by a stay on the shores of the lowest point on earth.',
    'צפייה בים המלח, טיפול בוץ ושימוש מלא בספא של אואזיס, ולינה על שפת הנקודה הנמוכה בעולם.',
    'A Dead Sea float and a mud ritual at Oasis Spa Club, Ein Bokek. Saltwater, silence, and the particular weightlessness only this place can offer.

The experience begins at the shore. A few minutes from the hotel, the Dead Sea opens up in front of you. You step in, let go, and float. There is nothing quite like it: the water holds you without effort, the horizon flattens, the silence becomes physical. STAYMAKOM provides Dead Sea mud to apply directly on the shore. You let it dry in the sun, rinse it off in the water, and feel the difference on your skin immediately.

Back at the hotel, the Moroccan-inspired spa is yours for the day. A heated indoor pool filled with Dead Sea water, a Turkish hammam, wet and dry Finnish saunas, a jacuzzi, and a fitness center. Your package includes a 30-minute body massage with the spa team. You move through the rest at your own pace. There is no agenda.

The rooms at Oasis Spa Club face the Dead Sea directly. Adults only, no children, no noise. Bathrobes and slippers are waiting. The lowest point on earth, 430 meters below sea level, has a particular quality of light and silence in the late afternoon that is difficult to describe until you have been in it.

Breakfast is a full buffet. Freshly squeezed juice, healthy infusions available throughout the morning. The kind of morning where you eat slowly, look out at the water, and feel in no hurry to decide what comes next.',
    'צפייה בים המלח וטיפול בוץ במלון אואזיס ספא קלאב, עין בוקק. מים מלוחים, שקט, וקלילות שרק המקום הזה יודע לתת.

החוויה מתחילה בחוף. כמה דקות מהמלון, ים המלח נפתח מולך. אתה נכנס למים, מרפה, וצף. אין חוויה כמוה: המים נושאים אותך בלי מאמץ, האופק משתטח, והשקט הופך למשהו מוחשי. STAYMAKOM מספקת בוץ ים המלח למריחה ישירה על החוף. משאירים להתייבש בשמש, שוטפים במים, וההבדל על העור מורגש מיד.

בחזרה למלון, הספא בהשראה מרוקאית פתוח עבורך לאורך כל היום. בריכה מקורה מחוממת עם מי ים המלח, חמאם טורקי, סאונות פינית יבשה ורטובה, ג''קוזי ומרכז כושר. הפאקג'' כולל עיסוי גוף של 30 דקות עם צוות הספא. את השאר עושים בקצב שלך, ללא לחץ וללא לוח זמנים.

החדרים במלון אואזיס פונים ישירות לים המלח. מלון למבוגרים בלבד, ללא ילדים, ללא רעש. חלוקי אמבטיה ונעלי בית מחכים בחדר. לנקודה הנמוכה בעולם, 430 מטר מתחת לפני הים, יש איכות אור ושקט בשעות אחר הצהריים שקשה להסביר אותם לפני שחווית אותם בעצמך.

ארוחת הבוקר היא בופה עשיר, עם מיצים סחוטים טריים ותה צמחים לאורך כל הבוקר. הסוג של בוקר שאוכלים בו לאט, מביטים החוצה לים, ואין שום סיבה למהר.',
    0, 'per_person', 'ILS',
    2, 4, 1, 1,
    'Dead Sea Float & Spa Stay at Oasis Spa Club, Ein Bokek',
    'Float in the Dead Sea, apply mineral mud on the shore, and unwind in a Moroccan-inspired spa. A restorative stay at Oasis Spa Club, adults only.',
    'Float, Mud, Reset. The Dead Sea at Oasis Spa Club.',
    'Dead Sea mud, salt water that holds you without effort, a hammam, and a room facing the lowest point on earth. This is what slowing down looks like.',
    'ספא וצפייה בים המלח במלון אואזיס ספא קלאב, עין בוקק',
    'לצוף בים המלח, להתמרח בבוץ מינרלי על החוף, ולהירגע בספא בהשראה מרוקאית. חופשה מרגיעה במלון למבוגרים בלבד על שפת ים המלח.',
    'לצוף, להרגיש, לנשום. ים המלח באואזיס ספא.',
    'בוץ ים המלח, מים שנושאים אותך בלי מאמץ, חמאם מרוקאי וחדר עם נוף לנקודה הנמוכה בעולם. ככה נראית חופשה אמיתית.',
    'Flotter en Mer Morte et spa à l''Oasis Spa Club',
    'Bain de boue minéral, flottaison en Mer Morte et accès complet au spa marocain. Un séjour ressourçant à l''Oasis Spa Club, adultes uniquement.',
    'Flotter, se poser. La Mer Morte à l''Oasis Spa Club.',
    'La boue minérale, l''eau qui vous porte sans effort, un hammam et une chambre face au point le plus bas de la Terre. C''est à ça que ressemble vraiment se reposer.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'One night with Dead Sea views',                                                              'לילה אחד עם נוף לים המלח',                                         0, true),
    (exp_id, 'Full breakfast buffet',                                                                      'בופה בוקר מלא',                                                    1, true),
    (exp_id, 'Dead Sea mud ritual on the shore, provided by STAYMAKOM',                                   'טיפול בוץ ים המלח על החוף, מסופק על ידי STAYMAKOM',               2, true),
    (exp_id, '30-minute body massage at the Moroccan Spa',                                                 'עיסוי גוף של 30 דקות בספא המרוקאי',                               3, true),
    (exp_id, 'Full spa access: heated Dead Sea pool, hammam, sauna, jacuzzi',                             'גישה מלאה לספא: בריכת מי ים המלח, חמאם, סאונה, ג''קוזי',          4, true),
    (exp_id, 'Fitness center access',                                                                      'גישה למרכז הכושר',                                                 5, true);

  -- Fetch existing tags
  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'      LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'  LIMIT 1;
  SELECT id INTO tag_spa     FROM highlight_tags WHERE slug = 'spa-access' LIMIT 1;

  -- Create massage tag if missing
  SELECT id INTO tag_massage FROM highlight_tags WHERE slug = 'massage' LIMIT 1;
  IF tag_massage IS NULL THEN
    INSERT INTO highlight_tags (slug, label_en, label_he, is_common, display_order)
    VALUES ('massage', 'Massage', 'עיסוי', true, 22)
    RETURNING id INTO tag_massage;
  END IF;

  -- Create gym tag if missing
  SELECT id INTO tag_gym FROM highlight_tags WHERE slug = 'gym' LIMIT 1;
  IF tag_gym IS NULL THEN
    INSERT INTO highlight_tags (slug, label_en, label_he, is_common, display_order)
    VALUES ('gym', 'Gym', 'חדר כושר', true, 23)
    RETURNING id INTO tag_gym;
  END IF;

  pos := 0;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); pos := pos + 1; END IF;
  IF tag_spa     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,     pos); pos := pos + 1; END IF;
  IF tag_massage IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_massage, pos); pos := pos + 1; END IF;
  IF tag_gym     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_gym,     pos); END IF;

END $$;
