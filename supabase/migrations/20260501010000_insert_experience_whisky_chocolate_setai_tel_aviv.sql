-- Insert experience: Whisky & Chocolate Tasting at The Setai Tel Aviv
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_tour        UUID;
  tag_tasting     UUID;
  tag_bfast       UUID;
  tag_kosher      UUID;
  tag_spa         UUID;
  pos             INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%setai tel aviv%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%setai%' AND name ILIKE '%tel aviv%' LIMIT 1;
  END IF;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%setai%' LIMIT 1;
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
    'Whisky & Chocolate Tasting at The Setai',
    'טעימות וויסקי ושוקולד בסטאי תל אביב',
    'whisky-chocolate-tasting-setai-tel-aviv',
    'published',
    'A guided whisky and chocolate pairing, a few steps from The Setai, followed by a stay in the heart of Old Jaffa overlooking the Mediterranean.',
    'טעימת וויסקי ושוקולד בליווי מומחה, במרחק כמה צעדים מהסטאי, ולינה בלב יפו העתיקה עם נוף לים התיכון.',
    'A whisky and chocolate tasting, steps from The Setai Tel Aviv. Old Jaffa at night, and a pairing no one forgets.

The evening starts a short walk from the hotel, in the labyrinthine alleys of Old Jaffa. You sit down with a guide who knows both crafts: whisky distillation and the art of matching it with chocolate. Six single-malt whiskies arrive one by one, each paired with a square of locally crafted artisanal chocolate, kosher-certified by the Tel Aviv rabbinate. Your guide walks you through each encounter: how the smokiness of one malt softens against dark cocoa, how a lighter dram opens up beside a salted caramel piece. There is no rush, no lecture. Just the slow revelation of how two things made separately can become something entirely new together. This works as well for two people sharing a table as for a group of colleagues or friends who rarely make time for this kind of evening.

Back at The Setai, the hotel holds you differently at night. The stone arches of the original Ottoman and Crusader structures absorb the quiet. The lobby scent, the low light, the long corridors connecting centuries of architecture with a room that faces the Mediterranean coastline or the ancient port of Jaffa. The spa is available for guests who want to extend the evening with a steam room or sauna before sleep.

The Kishle restaurant and the lounge bar are available at the hotel if you arrive hungry before the tasting or want to continue the evening after. The rooftop infinity pool, should the night still be warm, is a reason to linger.

Morning at The Setai arrives with a full buffet breakfast. Local produce, warm bread, the sea somewhere beyond the window. The kind of morning that makes the decision to check out feel like the only thing standing between you and another day here.',
    'טעימת וויסקי ושוקולד, כמה צעדים מהסטאי תל אביב. יפו העתיקה בלילה, ושילוב שלא שוכחים.

הערב מתחיל בטיול קצר מהמלון, בתוך סמטאות יפו העתיקה. מדריך שמכיר את שני העולמות, ייצור וויסקי ואמנות ההתאמה עם שוקולד, מוביל אתכם דרך שישה וויסקי מולט בודד, כל אחד מלווה בשוקולד בעבודת יד מקומית, כשרה בהשגחת רבנות תל אביב. הפגישה בין הטעמים מתגלה לאט: איך עישון של מולט אחד מתרכך ליד קקאו כהה, איך וויסקי קל פותח בצד שוקולד עם קרמל ומלח. אין מהירות, אין הרצאה. רק התגלות עדינה של שני דברים שנוצרו בנפרד ונהיים יחד למשהו חדש לגמרי. הערב הזה עובד באותה מידה לזוג, לקבוצת חברים, למשפחה שמחפשת משהו שאינו רגיל, ולקולגות שמגיעים לתל אביב ורוצים לזכור למה.

בחזרה לסטאי, המלון מקבל אתכם אחרת בלילה. קשתות האבן מהתקופה העות''מאנית והצלבנית סופגות את השקט. ריח הלובי, האור הנמוך, המסדרונות המחברים בין מאות שנים של אדריכלות לבין חדר עם נוף לחוף הים התיכון או לנמל יפו העתיקה. ספא זמין לאורחים שרוצים להמשיך את הערב עם חדר אדים או סאונה לפני השינה.

מסעדת קישלה ובר הלאונג'' פתוחים לאורחים שמגיעים רעבים לפני הטעימה, או שרוצים להמשיך את הערב אחריה. הבריכה האינסופית בגג, אם הלילה עדיין חם, היא סיבה טובה להישאר.

הבוקר בסטאי מגיע עם ארוחת בוקר בופה מלאה. תוצרת מקומית, לחם חם, והים איפשהו מחוץ לחלון. הסוג של בוקר שגורם להחלטה לצאת להרגיש כמו הדבר היחיד שעומד בינך לבין יום נוסף כאן.',
    0, 'per_person', 'ILS',
    2, 20, 1, 3,
    'Whisky & Chocolate Tasting in Old Jaffa | The Setai Tel Aviv',
    'A guided whisky and artisanal chocolate pairing in Old Jaffa, followed by a night at The Setai Tel Aviv. Kosher. One evening that changes how you taste.',
    'Whisky, Chocolate & Old Jaffa at Night',
    'Six single-malts, locally crafted chocolate, and a stay in a hotel built on Ottoman and Crusader stone. An evening worth slowing down for.',
    'טעימת וויסקי ושוקולד ביפו | לילה בסטאי תל אביב',
    'ערב של טעימות וויסקי ושוקולד כשר בסמטאות יפו, ולינה בסטאי תל אביב עם נוף לים. חוויה שלא שוכחים.',
    'וויסקי, שוקולד ויפו בלילה',
    'שישה מולט בודד, שוקולד בעבודת יד, ולינה במלון שנבנה על אבני הצלבנים. ערב שמאט את הקצב.',
    'Dégustation Whisky & Chocolat à Jaffa | The Setai Tel Aviv',
    'Une soirée de dégustation whisky et chocolat artisanal à Jaffa, suivie d''une nuit au Setai Tel Aviv face à la Méditerranée. Casher.',
    'Whisky, Chocolat & Jaffa la nuit',
    'Six single-malts, un chocolatier local, et une nuit dans un hôtel taillé dans la pierre ottomane. Le genre de soirée qu''on ne planifie pas deux fois.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Guided whisky and chocolate pairing session',              'סשן טעימת וויסקי ושוקולד בהדרכה מקצועית',      0, true),
    (exp_id, 'Six single-malt whiskies paired with artisanal chocolate', 'שישה וויסקי מולט בודד עם שוקולד בעבודת יד',    1, true),
    (exp_id, 'Kosher-certified chocolates (Tel Aviv rabbinate)',          'שוקולדים כשרים בהשגחת רבנות תל אביב',          2, true),
    (exp_id, 'One night in a room overlooking the Mediterranean or Jaffa port', 'לילה אחד בחדר עם נוף לים התיכון או לנמל יפו', 3, true),
    (exp_id, 'Full buffet breakfast at The Setai',                        'ארוחת בוקר בופה מלאה בסטאי',                   4, true),
    (exp_id, 'Access to spa, steam room, and sauna',                      'כניסה לספא, חדר אדים וסאונה',                   5, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'        LIMIT 1;
  SELECT id INTO tag_tour    FROM highlight_tags WHERE slug = 'tour'         LIMIT 1;
  SELECT id INTO tag_tasting FROM highlight_tags WHERE slug = 'wine-tasting' LIMIT 1;
  IF tag_tasting IS NULL THEN
    SELECT id INTO tag_tasting FROM highlight_tags WHERE slug = 'tasting'    LIMIT 1;
  END IF;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'    LIMIT 1;
  SELECT id INTO tag_kosher  FROM highlight_tags WHERE slug = 'kosher'       LIMIT 1;
  SELECT id INTO tag_spa     FROM highlight_tags WHERE slug = 'spa-access'   LIMIT 1;

  pos := 0;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_tour    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,    pos); pos := pos + 1; END IF;
  IF tag_tasting IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tasting, pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); pos := pos + 1; END IF;
  IF tag_kosher  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,  pos); pos := pos + 1; END IF;
  IF tag_spa     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,     pos); END IF;

END $$;
