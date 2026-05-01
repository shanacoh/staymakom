-- Ajout de l'expérience : Jeep Tour at Timna Park (Play Eilat)
DO $$
DECLARE
  exp_id      UUID    := gen_random_uuid();
  hotel_uuid  UUID;
  tag_bfast   UUID;
  tag_pool    UUID;
  tag_tour    UUID;
  pos         INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%play eilat%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%play%' AND name ILIKE '%eilat%' LIMIT 1;
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
    'JEEP TOUR AT TIMNA PARK',
    'סיור ג''יפים בפארק תמנע',
    'jeep-tour-timna-park-play-eilat',
    'draft',
    'A guided jeep adventure through the ancient copper landscapes of Timna Park, followed by a stay at Play Eilat, steps from the northern promenade of the Red Sea.',
    'סיור ג''יפים מודרך בנוף המדברי הקדום של פארק תמנע, ולינה במלון פליי אילת, צעדים מהטיילת הצפונית של ים סוף.',
    'A jeep tour through Timna Park, 25 kilometers north of Eilat. Six thousand years of copper-red desert, and the kind of silence that reorganizes something in you.

Your guide picks you up from Play Eilat and heads north into the Arava Valley. Inside the park, the landscape shifts into something older and quieter. Sandstone columns rise from the valley floor. Mushroom-shaped rocks, arches, natural sculptures shaped by wind over millennia. The guide reads the geology and the history out loud, without a script. You stop at Solomon''s Pillars, climb Borg Hill, walk the shores of Lake Timna. There is a moment at the colored sand where everyone, regardless of age or reason for being in Eilat, ends up doing the same thing: filling a small bottle, slowly, saying nothing.

Back in Eilat, Play Eilat holds the rest of the day. The outdoor pool, the poolside bar, the unhurried afternoon. Some groups take over a row of sun loungers and stay until the light goes flat. Couples find a corner. Solo guests read. The hotel sits close to Hananya Beach and the northern promenade, quiet enough to decompress, close enough to everything if the evening calls for it.

Breakfast is a full buffet, and the Arava light comes in early. The kind of morning that makes the drive back north feel, briefly, like a mistake.',
    'סיור ג''יפים בפארק תמנע, 25 קילומטר צפונית לאילת. שישה אלפי שנות מדבר אדום-נחושת, והשקט שמסדר מחדש משהו בתוכך.

המדריך אוסף אתכם ממלון פליי אילת ונוסע צפונה לעמק הערבה. בתוך הפארק הנוף משתנה למשהו ישן ושקט יותר. עמודי אבן-חול מתנשאים מרצפת הבקעה. סלעי פטרייה, קשתות, פסלי טבע שרוח עיצבה לאורך אלפי שנים. המדריך קורא את הגאולוגיה ואת ההיסטוריה בקול, בלי תסריט. עוצרים ליד עמודי שלמה, עולים על Borg Hill, מטיילים לאורך חוף אגם תמנע. יש רגע ליד החול הצבעוני שבו כולם, בלי קשר לגיל או לסיבה שהביאה אותם לאילת, עושים את אותו הדבר: ממלאים בקבוקון קטן, לאט, בשקט.

בחזרה באילת, פליי אילת מחכה לשאר היום. הבריכה החיצונית, בר הבריכה, אחר הצהריים הנינוח. יש קבוצות שתופסות שורת כסאות שיזוף ולא זזות עד שהאור נגמר. זוגות מוצאים פינה. נוסעים יחידים קוראים. המלון ממוקם קרוב לחוף חנניה ולטיילת הצפונית, שקט מספיק כדי להתאושש, קרוב מספיק לכל דבר אם הערב קורא.

ארוחת הבוקר היא בופה מלא, ואור הערבה נכנס מוקדם. הסוג של בוקר שגורם לנסיעה חזרה לצפון להרגיש, לרגע קצר, כמו טעות.',
    0, 'per_stay', 'ILS',
    2, 6, 1, 1,
    'Timna Park Jeep Tour & Stay in Eilat | STAYMAKOM',
    'A guided jeep tour through Timna''s ancient copper canyons, park entrance included, followed by a stay at Play Eilat on the Red Sea.',
    'Jeep Through the Copper Desert of Timna',
    'Solomon''s Pillars, Bedouin tea, and the Arava at its most elemental. Then back to Eilat and the pool.',
    'סיור ג''יפים בפארק תמנע ולינה באילת | STAYMAKOM',
    'סיור ג''יפים מודרך דרך הנוף הקדום של תמנע, כולל כרטיס כניסה לפארק, ולינה במלון פליי אילת על חוף ים סוף.',
    'ג''יפ בין צוקי הנחושת של תמנע',
    'עמודי שלמה, תה בדואי, והערבה במיטבה. ואחר כך חזרה לאילת ולבריכה.',
    'Jeep au Parc Timna et séjour à Eilat | STAYMAKOM',
    'Une excursion en jeep guidée dans les canyons de cuivre de Timna, entrée incluse, suivie d''un séjour au Play Eilat face à la mer Rouge.',
    'Jeep dans le désert de cuivre de Timna',
    'Les Piliers de Salomon, un thé bédouin, et la lumière de l''Arava. Retour à Eilat, piscine et mer Rouge.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Park entrance ticket to Timna Park',                      'כרטיס כניסה לפארק תמנע',                         0, true),
    (exp_id, '4-hour guided jeep tour with hotel pickup and drop-off',  'סיור ג''יפים מודרך 4 שעות עם העברה מהמלון',      1, true),
    (exp_id, 'Bedouin tea break during the tour',                        'הפסקת תה בדואי במהלך הסיור',                     2, true),
    (exp_id, 'Colored sand souvenir bottle',                             'בקבוקון חול צבעוני כמזכרת',                      3, true),
    (exp_id, 'One night in a boutique room at Play Eilat',               'לילה אחד בחדר בוטיק במלון פליי אילת',            4, true),
    (exp_id, 'Full buffet breakfast for two',                            'ארוחת בוקר בופה מלאה לשניים',                    5, true);

  SELECT id INTO tag_bfast FROM highlight_tags WHERE slug = 'breakfast' LIMIT 1;
  SELECT id INTO tag_pool  FROM highlight_tags WHERE slug = 'pool'      LIMIT 1;
  SELECT id INTO tag_tour  FROM highlight_tags WHERE slug = 'tour'      LIMIT 1;
  IF tag_tour IS NULL THEN
    SELECT id INTO tag_tour FROM highlight_tags WHERE slug ILIKE '%tour%' LIMIT 1;
  END IF;

  pos := 0;
  IF tag_bfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast, pos); pos := pos + 1; END IF;
  IF tag_pool  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,  pos); pos := pos + 1; END IF;
  IF tag_tour  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,  pos); END IF;

END $$;
