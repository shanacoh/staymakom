-- Insert experience: Forest Reset at Bayit BaGalil
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_bfast       UUID;
  tag_dinner      UUID;
  tag_spa         UUID;
  tag_pool        UUID;
  tag_kosher      UUID;
  pos             INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%bayit bagalil%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%בית בגליל%' LIMIT 1;
  END IF;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%bayit%' AND name ILIKE '%galil%' LIMIT 1;
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
    'Forest Reset at Bayit BaGalil',
    'ריסט ביער בית בגליל',
    'forest-reset-bayit-bagalil',
    'published',
    'A digital detox stay at Bayit BaGalil, deep in the Birya Forest, where disconnecting from the world is the only plan.',
    'שהייה של ניתוק דיגיטלי בבית בגליל, עמוק ביער בירייה, שבה להתנתק מהעולם הוא התוכנית היחידה.',
    'A stay at Bayit BaGalil, deep in the Birya Forest. No notifications. No agenda. Just the two of you and the pines.

You arrive at a stone mansion perched above the Galilee valley. At check-in, the ritual begins: phones go into a wooden box, sealed for the stay. What replaces them is the forest, the quiet, and each other. The spa waiting area is yours from the moment you arrive: fine tea fusions, a wet and dry sauna, and an outdoor pool looking out over the Birya Forest and the valley below. A fitness center and group sessions are available for those who need to move before they can truly stop.

Your suite has a king-size bed and a fireplace. Some rooms open onto a private terrace facing the pines, others offer views of the Sea of Galilee and the Golan in the distance. Suites with a private jacuzzi or a private heated pool are available as an upgrade. The hotel has 36 suites. The quiet is real.

Dinner at the Kmahin restaurant is part of the evening: local Galilee produce, a proper sit-down meal in a room that earns back the night. Kosher.

Morning comes slowly here. Breakfast is a generous spread, served with the forest still wrapped in early light. The kind of stay that makes going back to your phone feel like something you can postpone a little longer.',
    'שהייה בבית בגליל, עמוק ביער בירייה. ללא התראות. ללא לוח זמנים. רק שניכם והאורנים.

מגיעים אל אחוזת אבן המוצבת על גבי גבעה בגליל העליון. בצ''ק-אין, הטקס מתחיל: הטלפונים נכנסים לקופסת עץ, סגורה לאורך כל השהייה. מה שמחליף אותם הוא היער, השקט, ואחד את השני. אזור ההמתנה של הספא פתוח בפניכם מרגע ההגעה: תמציות תה משובחות, סאונה יבשה ורטובה, ובריכה חיצונית הנשקפת אל יער בירייה והעמק מלמטה. חדר כושר ושיעורים קבוצתיים זמינים למי שצריך לזוז קצת לפני שהוא באמת מצליח לעצור.

הסוויטה מצוידת במיטה זוגית ואח. חלק מהחדרים פונים אל מרפסת פרטית הנשקפת אל האורנים, אחרים פותחים על נוף לכנרת ולגולן ברקע. סוויטות עם ג''קוזי פרטי או בריכה פרטית מחוממת זמינות כאפשרות שדרוג.

ארוחת הערב במסעדת כמהין היא חלק מהערב: תוצרת גליל מקומית, ארוחה של ממש בחדר שמחזיר לכם את הלילה. כשר.

הבוקר מגיע לאט. ארוחת הבוקר מוגשת כשהיער עדיין עטוף באור ראשוני. הסוג של שהייה שגורמת לכם לדחות עוד קצת את הרגע שבו תחזרו לנגן בטלפון.',
    0, 'per_person', 'ILS',
    2, 2, 1, 1,
    'Digital Detox Couples Stay, Birya Forest, Bayit BaGalil',
    'A phone-free stay in the Birya Forest. Sauna, forest pool, dinner at Kmahin, and a suite with fireplace. Reconnect in the heart of the Galilee.',
    'Leave Your Phone. Take the Forest.',
    'A wooden box for your phones, a forest for everything else. Bayit BaGalil, deep in the Galilee pines.',
    'דטוקס דיגיטלי זוגי ביער בירייה, בית בגליל',
    'שהייה ללא טלפונים ביער בירייה. סאונה, בריכה, ארוחת ערב כשרה וסוויטה עם אח. להתחבר מחדש בלב הגליל.',
    'להשאיר את הטלפון. לקחת את היער.',
    'קופסת עץ לטלפונים, יער לכל השאר. בית בגליל, עמוק בין אורני הגליל.',
    'Séjour digital detox en duo, forêt de Birya, Galilée',
    'Un séjour sans téléphone dans la forêt de Birya. Sauna, piscine, dîner kasher et suite avec cheminée. Se retrouver au coeur de la Galilée.',
    'Poser son téléphone. Prendre la forêt.',
    'Une boîte en bois pour les téléphones, une forêt pour tout le reste. Bayit BaGalil, au coeur des pins de Galilée.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Phone-free ritual: phones sealed in a wooden box at check-in',          'טקס ניתוק: טלפונים בקופסת עץ עם הגעה',                                        0, true),
    (exp_id, 'Spa access: tea lounge, wet & dry sauna, outdoor pool',                  'כניסה לספא: טרקלין תה, סאונה יבשה ורטובה, בריכה חיצונית',                    1, true),
    (exp_id, 'Suite with fireplace',                                                    'סוויטה עם אח',                                                                  2, true),
    (exp_id, 'Suite with private jacuzzi or heated pool (upgrade option)',              'סוויטה עם ג''קוזי פרטי או בריכה מחוממת (אפשרות שדרוג)',                      3, true),
    (exp_id, 'Dinner at Kmahin restaurant (kosher)',                                    'ארוחת ערב במסעדת כמהין (כשר)',                                                  4, true),
    (exp_id, 'Full Galilee breakfast served each morning',                              'ארוחת בוקר גלילית מלאה',                                                        5, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'       LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'   LIMIT 1;
  SELECT id INTO tag_dinner  FROM highlight_tags WHERE slug = 'dinner'      LIMIT 1;
  SELECT id INTO tag_spa     FROM highlight_tags WHERE slug = 'spa-access'  LIMIT 1;
  SELECT id INTO tag_pool    FROM highlight_tags WHERE slug = 'pool'        LIMIT 1;
  SELECT id INTO tag_kosher  FROM highlight_tags WHERE slug = 'kosher'      LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_bfast  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,  pos); pos := pos + 1; END IF;
  IF tag_dinner IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_dinner, pos); pos := pos + 1; END IF;
  IF tag_spa    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,    pos); pos := pos + 1; END IF;
  IF tag_pool   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,   pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

END $$;
