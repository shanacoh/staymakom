-- Insert experience: Horseback Riding at Vered HaGalil
DO $$
DECLARE
  exp_id       UUID    := gen_random_uuid();
  hotel_uuid   UUID;
  tag_night    UUID;
  tag_bfast    UUID;
  tag_tour     UUID;
  tag_pool     UUID;
  tag_parking  UUID;
  tag_kids     UUID;
  pos          INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%vered%' AND name ILIKE '%galil%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%וורד הגליל%' LIMIT 1;
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
    'Horseback Riding at Vered HaGalil',
    'רכיבה על סוסים בוורד הגליל',
    'horseback-riding-vered-hagalil',
    'published',
    'A guided trail ride through the limestone hills of Ramat Korazim, departing directly from the stables of Vered HaGalil, a ranch and farm-stay above the Sea of Galilee.',
    'רכיבה מודרכת בין גבעות רמת כורזים, יוצאת ישירות מהאורוות של וורד הגליל, חווה ולינה מעל הכינרת.',
    'Horseback riding at Vered HaGalil, above the northern shore of the Kinneret. The trail starts at the stables and doesn''t stop surprising you.

Your guide leads you out from the on-site stables into the open landscape of Ramat Korazim: ancient limestone formations, wild herbs, cattle grazing along the ridge, and the Sea of Galilee spreading wide below. The horses are calm, well-trained, suited to all levels, including complete beginners. Children can join on pony rides. The pace is slow and attentive. From the saddle, the Golan Heights rise across the water, and the hills of the Galilee stretch north toward Rosh Pina. This is not a tourist circuit. It is a working farm trail with sixty years of history behind it.

Vered HaGalil was founded in 1961 by Yehuda Avni, a Chicago-born settler who built a ranch on a barren hillside above the Kinneret. The 29 cabins and suites scattered across 50 dunams are built from local wood and basalt stone, set among gardens, hammocks, and pastoral corners. No two units are identical. Some have a wood-burning fireplace. The luxury suites have a double jacuzzi facing the view, a living room, and a balcony above the Sea of Galilee. Between the cabins, spice bushes and medicinal herbs grow along the paths.

After the ride, the Hakirkara coffee cart is steps from the riding arena: fresh pastries, quality coffee, cold beers. The outdoor pool overlooks the Kinneret and is open from Passover through Sukkot. In the evening, Tibi''s Restaurant serves a menu of premium meats, fish, and fresh salads, with the Golan Heights visible through the windows. Non-kosher. Well regarded far beyond the property.

Morning at Vered HaGalil begins with an Israeli breakfast and light already moving across the water. The stables are active below. The horses are already waiting. Most guests wish they had booked another night.',
    'רכיבה על סוסים בוורד הגליל, מעל החוף הצפוני של הכינרת. השביל יוצא מהאורוות ולא מפסיק להפתיע.

המדריך מוציא אתכם מהאורוות שבחצר אל נוף פתוח של רמת כורזים: סלעי גיר עתיקים, עשבי בר, בקר על הרכס, והכינרת שנפרשת למטה. הסוסים רגועים, מיומנים, מתאימים לכל רמה, גם למתחילים לחלוטין. ילדים יכולים להצטרף לרכיבת פוני. מהאוכף נשקפת רמת הגולן מעבר למים, וגבעות הגליל מתמשכות צפונה לכיוון ראש פינה. זה לא מסלול תיירות. זה שביל עבודה של חווה בת שישים שנה.

וורד הגליל נוסד ב-1961 על ידי יהודה אבני, שבנה את החווה על גבעה שוממה מעל הכינרת. 29 צימרים וסוויטות פזורים על פני 50 דונם, בנויים מעץ ואבן בזלת מקומית, בין גנים, ערסלים וחצרות ירוקות. אף יחידה לא דומה לשנייה. יש שיש בהן אח עצים, יש שיש בהן ג''קוזי זוגי עם נוף לכינרת, סלון ומרפסת. בין הצימרים גדלים שיחי תבלינים וצמחי מרפא לאורך השבילים.

אחרי הרכיבה, עגלת הקפה הכירקרה ממוקמת צעדים מאצטדיון הרכיבה: מאפים טריים, קפה איכותי, בירה קרה. הבריכה החיצונית משקיפה על הכינרת ופתוחה מפסח עד סוכות. בערב, מסעדת טיבי מגישה תפריט בשרים, דגים וסלטים טריים עם נוף לגולן מבעד לחלונות. לא כשרה. ידועה הרבה מעבר לגבולות החווה.

בוקר בוורד הגליל מתחיל עם ארוחת בוקר ישראלית והאור כבר זורם על פני המים. האורוות פעילות למטה. הסוסים כבר מחכים. רוב האורחים מתחרטים שלא הזמינו לילה נוסף.',
    0, 'per_person', 'ILS',
    1, 8, 1, 1,
    'Horseback Riding & Stay at Vered HaGalil, Galilee',
    'Guided trail ride from the on-site stables above the Sea of Galilee, then a night in a basalt cabin at Vered HaGalil. Breakfast included.',
    'Ride from the stables. Sleep above the Kinneret.',
    'A working ranch above the Sea of Galilee since 1961. Trail ride through Ramat Korazim, cabins of wood and basalt, breakfast, and the Golan at dawn.',
    'רכיבה על סוסים ולינה בוורד הגליל מעל הכינרת',
    'רכיבה מודרכת מהאורוות של החווה ברמת כורזים, לינה בצימר בזלת עם נוף לכינרת. כולל ארוחת בוקר.',
    'לרכב מהאורוות. לישון מעל הכינרת.',
    'חווה פעילה מעל הכינרת משנת 1961. שביל רכיבה, צימרי עץ ובזלת, ארוחת בוקר והגולן עם שחר.',
    'Randonnée à cheval et séjour à Vered HaGalil, Galilée',
    'Balade guidée depuis les écuries de la ferme au-dessus du lac de Tibériade, nuit dans un chalet en bois et basalte. Petit-déjeuner inclus.',
    'Partir des écuries. Dormir au-dessus du Kinneret.',
    'Un ranch fondé en 1961 au-dessus de la mer de Galilée. Trail à cheval, chalets rustiques, petit-déjeuner et le Golan à l''aube.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Guided horseback trail ride from the on-site stables', 'רכיבה מודרכת מהאורוות של החווה',                       0, true),
    (exp_id, 'One night in a wood-and-basalt cabin or suite',        'לינה בצימר או סוויטה מעץ ובזלת',                       1, true),
    (exp_id, 'Israeli breakfast served at the farm',                 'ארוחת בוקר ישראלית בחווה',                              2, true),
    (exp_id, 'Access to the seasonal outdoor pool overlooking the Kinneret', 'גישה לבריכה עם נוף לכינרת',                   3, true),
    (exp_id, 'Free parking on site',                                 'חניה חינם באתר',                                        4, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'           LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'       LIMIT 1;
  SELECT id INTO tag_tour    FROM highlight_tags WHERE slug = 'tour'            LIMIT 1;
  SELECT id INTO tag_pool    FROM highlight_tags WHERE slug = 'pool'            LIMIT 1;
  SELECT id INTO tag_parking FROM highlight_tags WHERE slug = 'parking'         LIMIT 1;
  SELECT id INTO tag_kids    FROM highlight_tags WHERE slug = 'kids-activities' LIMIT 1;

  pos := 0;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); pos := pos + 1; END IF;
  IF tag_tour    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,    pos); pos := pos + 1; END IF;
  IF tag_pool    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,    pos); pos := pos + 1; END IF;
  IF tag_parking IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_parking, pos); pos := pos + 1; END IF;
  IF tag_kids    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids,    pos); END IF;

END $$;
