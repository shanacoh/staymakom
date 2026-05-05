-- Insert experience: Sunset Jeep Ride to Mount Joash — Play Hotel Eilat
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_bfast       UUID;
  tag_tour        UUID;
  tag_sunset      UUID;
  pos             INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%play hotel eilat%' LIMIT 1;
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
    'SUNSET JEEP RIDE TO MOUNT JOASH, EILAT',
    'רכיבת ג''יפ לשקיעה על הר יואש, אילת',
    'sunset-jeep-mount-joash-play-hotel-eilat',
    'draft',
    'A guided jeep ascent through the Eilat Mountains at sunset, with pita and herbal tea on the ridge, followed by a stay at Play Hotel, steps from the northern promenade.',
    'עלייה בג''יפ להרי אילת עם שקיעה על הר יואש, פיתה וחלבה בשטח, ולינה ב-Play Hotel צעדים מהטיילת.',
    'A sunset jeep ride through the Eilat Mountains, finishing at the summit of Mount Joash. Four countries visible from one ridge, and nowhere else to be.

The jeep picks you up from the hotel lobby and heads south into the desert. From there, the route climbs through Nahal Shlomo, Nahal Rechavam, and Nahal Yehoshaphat, the wadis opening and narrowing as the elevation rises. At 725 meters above sea level, the guide pulls over for the picnic stop: warm pita, local labneh, a cup of sage tea, and the last light of the day spreading across the valley. The guide knows these mountains closely, the geology, the biblical names of the streams, the borders visible on the horizon. Israel, Egypt, Jordan, Saudi Arabia, all in one unbroken view. The jeep descends as the sky darkens.

Back at Play Hotel, the pace shifts entirely. The hotel sits a four-minute walk from Moriah Beach and Eilat''s promenade, compact and attentive, 73 rooms. The outdoor pool terrace, with its bar and sunbeds, is the place to decompress after the desert. Order a drink, let the evening settle.

Varkada, the kosher fish restaurant on-site, is available for dinner. The Solo Sushi Bar is also there for those who prefer it. Both are separately priced but worth knowing about.

Breakfast runs from 7:00 to 10:30, buffet-style, with fresh pastries, cheese, local specialities, and strong coffee. After a night framed by the desert ridge and the Red Sea promenade, the morning feels earned. The kind of stay that makes the return journey feel premature.',
    'טיול ג''יפ בשקיעה בהרי אילת, עם סיום על פסגת הר יואש. ארבע מדינות נראות מאותה רכס, ואין מקום אחר שתרצו להיות בו.

הג''יפ אוסף אתכם מלובי המלון ונוסע דרומה אל המדבר. הנסיעה עולה דרך נחל שלמה, נחל רחבעם ונחל יהושפט, כשהוואדיות נפתחים ומתצרים ככל שהגובה עולה. ב-725 מטרים מעל פני הים, המדריך עוצר לפיקניק: פיתה חמה, לבנה מקומית, כוס תה מרווה, ואחרון האור פורש על הבקעה. המדריך מכיר את ההרים האלה לעומק, הגיאולוגיה, שמות הנחלים מהמקרא, הגבולות שנראים באופק. ישראל, מצרים, ירדן, ערב הסעודית, בנוף אחד רצוף. הג''יפ יורד כשהשמיים מחשיכים.

בחזרה ל-Play Hotel, הקצב משתנה לגמרי. המלון ממוקם ארבע דקות הליכה מחוף מוריה וטיילת אילת, אינטימי ומשפחתי, 73 חדרים. מרפסת הבריכה החיצונית, עם הבר וכסאות השיזוף, היא המקום להתפרק אחרי המדבר. הזמינו משהו לשתות, תנו לערב להשתקע.

Varkada, מסעדת הדגים הכשרה של המלון, פתוחה לארוחת ערב. Solo Sushi Bar זמין אף הוא למי שמעדיף. שניהם בתשלום נפרד, אבל שווה לדעת שהם שם.

ארוחת הבוקר מוגשת בין 7:00 ל-10:30, בופה עם מאפים טריים, גבינות, מוצרים מקומיים וקפה חזק. אחרי לילה שמוסגר על ידי רכס המדבר ושדרת ים סוף, הבוקר מרגיש כזכות שהרווחתם. הסוג של שהייה שגורם לנסיעה חזרה להרגיש מוקדמת מדי.',
    0, 'per_booking', 'ILS',
    2, 6, 1, 1,
    'Sunset Jeep Tour Eilat Mountains + Stay at Play Hotel',
    'Guided jeep ascent to Mount Joash at sunset, with pita and sage tea on the ridge. One night at Play Hotel, steps from Eilat''s promenade.',
    'Four Countries at Sunset, Play Hotel Eilat',
    'A jeep ride into the Eilat Mountains at golden hour, dinner views over four borders, and a night at Play Hotel by the Red Sea promenade.',
    'טיול ג''יפ לשקיעה בהרי אילת עם לינה ב-Play Hotel',
    'עלייה מודרכת בג''יפ להר יואש עם נוף ל-4 מדינות, פיקניק במדבר ולינה ב-Play Hotel, צעדים מהים.',
    'ארבע מדינות בשקיעה, הרי אילת',
    'ג''יפ בהרים, תה מרווה על הרכס, ולינה רומנטית ב-Play Hotel ליד טיילת ים סוף.',
    'Jeep au coucher du soleil, monts Eilat + Play Hotel',
    'Ascension guidée en jeep jusqu''au mont Joash au crépuscule, pique-nique au sommet, nuit au Play Hotel face à la promenade d''Eilat.',
    'Quatre pays au coucher du soleil, Eilat',
    'Un jeep dans les montagnes du désert, du thé aux herbes sur la crête, et une nuit au Play Hotel au bord de la mer Rouge.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Guided sunset jeep ride through the Eilat Mountains',       'טיול ג''יפ מודרך לשקיעה בהרי אילת',                    0, true),
    (exp_id, 'Picnic stop at Mount Joash with pita, labneh, and sage tea','עצירת פיקניק על הר יואש עם פיתה, לבנה ותה מרווה',       1, true),
    (exp_id, 'Hotel pickup and drop-off included',                         'איסוף והחזרה מהמלון כלולים',                             2, true),
    (exp_id, 'One night at Play Hotel, Eilat',                             'לילה אחד ב-Play Hotel, אילת',                            3, true),
    (exp_id, 'Full buffet breakfast for two',                              'ארוחת בוקר בופה לזוג',                                   4, true),
    (exp_id, 'Access to the outdoor pool terrace and pool bar',            'כניסה לחצר הבריכה החיצונית ובר הבריכה',                  5, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'          LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'      LIMIT 1;
  SELECT id INTO tag_tour    FROM highlight_tags WHERE slug = 'tour'           LIMIT 1;
  IF tag_tour IS NULL THEN
    SELECT id INTO tag_tour  FROM highlight_tags WHERE slug ILIKE '%tour%'     LIMIT 1;
  END IF;
  SELECT id INTO tag_sunset  FROM highlight_tags WHERE slug = 'sunset-drinks'  LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_bfast  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,  pos); pos := pos + 1; END IF;
  IF tag_tour   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,   pos); pos := pos + 1; END IF;
  IF tag_sunset IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_sunset, pos); END IF;

END $$;
