-- Insert experience: Sunset Jeep Adventure in the Eilat Mountains — Royal Shangri-La
DO $$
DECLARE
  exp_id      UUID    := gen_random_uuid();
  hotel_uuid  UUID;
  tag_tour    UUID;
  tag_bfast   UUID;
  tag_spa     UUID;
  pos         INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%royal shangri%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%shangri-la%' AND name ILIKE '%eilat%' LIMIT 1;
  END IF;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%shangri%la%' LIMIT 1;
  END IF;
  IF hotel_uuid IS NULL THEN
    RAISE EXCEPTION 'Hotel Royal Shangri-La not found in hotels2 table';
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
    'Sunset Jeep Adventure in the Eilat Mountains',
    'טיול ג''יפים בהרי אילת עם שקיעה',
    'sunset-jeep-adventure-eilat-mountains',
    'published',
    'A guided off-road descent through Nahal Shlomo and up to Mount Joash at 725 meters, followed by a stay at the Royal Shangri-La, set between the desert and the Red Sea.',
    'סיור ג''יפים מודרך בנחל שלמה ועד פסגת הר יואש, ואחריו לינה ברויאל שנגרי-לה, בין המדבר לים סוף.',
    'A sunset jeep tour into the Eilat Mountains Nature Reserve, and a stay at the Royal Shangri-La on Coral Beach. The desert at its most raw, and then the Red Sea at its most still.

Your guide picks you up at the hotel lobby and drives you to the jeep gathering point at the edge of the reserve. From there, the route follows the dry riverbeds of Nahal Shlomo, Nahal Rehoboam, and Nahal Yehoshaphat, climbing off-road to 725 meters above sea level. The terrain is uneven and the pace is deliberate. Along the way, your guide reads the landscape: ancient geology, the ibex trails, the silence that comes with altitude. At a mid-point stop, a small fire is lit. Pita bread, local labaneh, and herbal tea are served on a flat rock above the valley.

At the summit of Mount Joash, you look out over four countries at once: Israel, Egypt, Jordan, and Saudi Arabia, all held in the same frame by the last light of the day. The Red Sea appears below, narrow and copper-toned. You stay until the colors shift.

Back at the Royal Shangri-La, the contrast is sharp. Fifty rooms, built into the hillside above Coral Beach, with balconies angled toward the Red Sea Gulf. The spa, operated by Thai-trained therapists in the neighboring Orchid Hotel, offers treatments by appointment. The outdoor pool and hot tub face the water. The silence here is different from the mountain silence, lower and warmer.

Breakfast is a full buffet served daily from 7:00 to 10:30, with views of the desert hills behind and the sea ahead. The kind of morning that makes leaving feel like something you keep putting off.',
    'טיול ג''יפים בשקיעה אל שמורת הטבע של הרי אילת, ולינה ברויאל שנגרי-לה על חוף האלמוגים. המדבר במלוא עוצמתו, ואחריו ים סוף בשקט שלו.

המדריך מגיע לאסוף אתכם מלובי המלון ומוביל אתכם לנקודת המוצא של הג''יפים, בשולי השמורה. משם הדרך עוברת בנחל שלמה, נחל רחבעם ונחל יהושפט, ועולה בשטח פתוח עד 725 מטר מעל פני הים. השטח לא סלול והקצב מכוון. לאורך הדרך המדריך מפרש את הנוף: גיאולוגיה עתיקה, שבילי יעלים, השקט שמגיע עם הגובה. באמצע העלייה עוצרים, מדליקים אש קטנה ומגישים פיתות, לבנה מקומית ותה צמחים על סלע מעל הוואדי.

בפסגת הר יואש רואים ארבע מדינות בבת אחת: ישראל, מצרים, ירדן וערב הסעודית, כולן באותה פנורמה, עם האור האחרון של היום. ים סוף נמצא למטה, צר וצבוע בנחושת. נשארים עד שהצבעים משתנים.

חוזרים לרויאל שנגרי-לה, וההבדל מיידי. חמישים חדרים בנויים לתוך המדרון מעל חוף האלמוגים, עם מרפסות הפונות למפרץ. ספא בידי מטפלים בסגנון תאילנדי, בקאנג''ורקסמה, ברחבי המלון הסמוך. בריכה חיצונית וג''קוזי מול הים. השקט כאן שונה מזה שבפסגה, רך ונמוך יותר.

ארוחת בוקר בופה מלא מוגשת מדי יום בין 7:00 ל-10:30, עם נוף להרי המדבר מאחור ולים מלפנים. הסוג של הבוקר שגורם לעזיבה להרגיש כמו משהו שדוחים שוב ושוב.',
    0, 'per_person', 'ILS',
    2, 4, 1, 1,
    'Sunset Jeep Tour Eilat Mountains + Royal Shangri-La',
    'Off-road climb to Mount Joash at sunset, fireside picnic with labaneh and tea, then a night at the Royal Shangri-La on Eilat''s Coral Beach.',
    'Into the Eilat Mountains at Sunset',
    'Jeep through Nahal Shlomo to the top of Mount Joash. Four countries. One fire. One night at the Royal Shangri-La facing the Red Sea.',
    'טיול ג''יפים בהרי אילת בשקיעה עם לינה ברויאל שנגרי-לה',
    'סיור ג''יפים מודרך לפסגת הר יואש, מדורה עם לבנה ותה, ולינה ברויאל שנגרי-לה על חוף האלמוגים.',
    'הרי אילת בשקיעה',
    'עולים בג''יפ לפסגת הר יואש, רואים ארבע מדינות, וחוזרים לים סוף. לילה ברויאל שנגרי-לה, חוף האלמוגים.',
    'Jeep au coucher du soleil, monts d''Eilat et Shangri-La',
    'Montée hors-piste jusqu''au mont Joash, pique-nique au feu avec labaneh et thé, puis une nuit au Royal Shangri-La face à la mer Rouge.',
    'Les monts d''Eilat au crépuscule',
    'Un circuit en jeep jusqu''au sommet du mont Joash avec vue sur quatre pays, puis une nuit au Royal Shangri-La sur la plage de corail d''Eilat.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Guided sunset jeep tour through the Eilat Mountains reserve',  'סיור ג''יפים מודרך בשקיעה בהרי אילת',              0, true),
    (exp_id, 'Off-road climb to the summit of Mount Joash (725m)',           'עלייה בשטח לפסגת הר יואש (725 מ'')',                1, true),
    (exp_id, 'Fireside picnic with pita, local labaneh and herbal tea',      'ארוחת שדה ליד המדורה עם פיתות, לבנה ותה צמחים',   2, true),
    (exp_id, 'Four-country panorama at sunset',                              'פנורמת ארבע מדינות בשקיעה',                        3, true),
    (exp_id, 'One night at the Royal Shangri-La, Coral Beach',               'לילה אחד ברויאל שנגרי-לה, חוף האלמוגים',          4, true),
    (exp_id, 'Full buffet breakfast included',                               'ארוחת בוקר בופה מלא כלולה',                        5, true);

  SELECT id INTO tag_tour  FROM highlight_tags WHERE slug = 'tour'      LIMIT 1;
  SELECT id INTO tag_bfast FROM highlight_tags WHERE slug = 'breakfast' LIMIT 1;
  SELECT id INTO tag_spa   FROM highlight_tags WHERE slug = 'spa-access' LIMIT 1;

  pos := 0;
  IF tag_tour  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,  pos); pos := pos + 1; END IF;
  IF tag_bfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast, pos); pos := pos + 1; END IF;
  IF tag_spa   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,   pos); END IF;

END $$;
