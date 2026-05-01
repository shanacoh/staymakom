-- Insert experience: Paint & Play at Lake House Kinneret
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_bfast       UUID;
  tag_pool        UUID;
  tag_kids        UUID;
  tag_kosher      UUID;
  tag_parking     UUID;
  pos             INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%lake house kinneret%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%lake house%' AND name ILIKE '%kinneret%' LIMIT 1;
  END IF;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%lake house%' LIMIT 1;
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
    'Paint & Play at Lake House Kinneret',
    'שתו, צבעו ושחקו על הכינרת',
    'paint-play-lake-house-kinneret',
    'published',
    'A paint and drinks session on the shores of the Sea of Galilee, followed by a stay at Lake House Kinneret with beach, pool, and open lawns for everyone.',
    'סדנת ציור ושתייה על שפת הכינרת, ולינה במלון Lake House עם חוף, בריכה ודשאות פתוחים לכולם.',
    'A paint and drinks session at Lake House Kinneret, on the shores of the Sea of Galilee. Canvases, colors, and the Golan Heights right in front of you.

You set up wherever feels right: a table on the terrace, a corner of the lawn, a spot facing the water. The canvases come with everything you need. There is no instruction and no technique to follow. You pour a drink, you pick up a brush, and you paint what the lake looks like from where you are sitting. Two people or ten, a family weekend or a work offsite, a birthday or no occasion at all. The session holds whatever you bring to it. The light on the Kinneret shifts while you paint, and at some point the painting stops mattering as much as the afternoon does. Someone ends up with something worth keeping.

After the session, the hotel takes over. The 54-acre grounds stretch down to the water, with lawns wide enough that no one feels crowded. The private Nammos beach has sun loungers and umbrellas facing the Kinneret. The outdoor pool sits above the lake with a panoramic view. There are tennis courts and a football pitch for those who want to move, and enough green space for those who just want to sit and watch the water change color through the afternoon. The lobby bar is there whenever you need it.

Breakfast is a buffet, unhurried, with the lake in the window. The kind of morning where someone orders a second coffee and the checkout time feels further away than it is.',
    'סדנת ציור ושתייה במלון Lake House Kinneret, על שפת הכינרת. קנבסים, צבעים והגולן ממש מולכם.

מתיישבים איפה שמרגיש נכון: שולחן על המרפסת, פינה בדשא, מקום עם נוף לאגם. הקנבסים מגיעים עם כל מה שצריך. אין הדרכה ואין טכניקה לעקוב אחריה. יוצקים משקה, מרימים מברשת, ומציירים את מה שהכינרת נראית ממקום הישיבה שלכם. שניים או עשרה, סוף שבוע משפחתי או כנס עבודה, יום הולדת או סתם בגלל שרצינו. הסדנה מחזיקה כל מה שמביאים אליה. האור על הכינרת משתנה בזמן שמציירים, ובשלב מסוים הציור פחות חשוב מאשר אחר הצהריים עצמו. מישהו מסיים עם משהו ששווה לשמור.

אחרי הסדנה, המלון מדבר בעד עצמו. הדשאות משתרעים על פני יותר מ-50 דונם עד לחוף המים. חוף Nammos מציע כיסאות שמש ומטריות מול הכינרת. הבריכה החיצונית יושבת מעל האגם עם נוף פנורמי. יש מגרשי טניס ומגרש כדורגל לאלה שרוצים לזוז, ומספיק מרחב ירוק לאלה שרק רוצים לשבת ולראות את הצבע של המים משתנה במהלך אחר הצהריים. הבר בלובי פתוח מתי שצריך.

ארוחת הבוקר היא בופה, בלי לחץ, עם האגם בחלון. הסוג של בוקר שבו מזמינים קפה שני ושעת הצ''ק-אאוט מרגישה רחוקה יותר ממה שהיא באמת.',
    0, 'per_person', 'ILS',
    2, 50, 1, 4,
    'Paint & Stay at Lake House Kinneret',
    'A paint and drinks session by the Sea of Galilee, with private beach, outdoor pool, and kosher dining. A stay that works for any size, any occasion.',
    'Canvases and the Kinneret. For Everyone.',
    'Paint what the lake looks like from where you are sitting. Then spend the day on the beach, the pool, the lawns. Lake House Kinneret, Tiberias.',
    'סדנת ציור ולינה על הכינרת, Lake House',
    'סדנת ציור ושתייה על שפת הכינרת עם חוף פרטי, בריכה ואוכל כשר. מתאים לכל גודל וכל אירוע. מלון Lake House טבריה.',
    'קנבסים, צבעים והכינרת. לכולם.',
    'מציירים את מה שהכינרת נראית מהמקום שלכם. ואחר כך חוף, בריכה ודשאות. Lake House Kinneret.',
    'Séjour Peinture & Lac Kinneret, Lake House',
    'Un atelier peinture et boissons en bord de mer de Galilée, avec plage privée, piscine et restaurant casher. Pour toutes les occasions, pour tous les groupes.',
    'Toiles, couleurs et lac de Tibériade',
    'Peignez ce que le lac Kinneret ressemble de l''endroit où vous êtes assis. Puis la plage, la piscine, les pelouses. Lake House Kinneret.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Paint and drinks session with all materials included', 'סדנת ציור ושתייה עם כל הציוד כלול',         0, true),
    (exp_id, 'Access to Nammos private beach with sun loungers',    'כניסה לחוף Nammos עם כיסאות שמש',           1, true),
    (exp_id, 'Outdoor pool with panoramic view of Lake Kinneret',   'בריכה חיצונית עם נוף פנורמי לכינרת',        2, true),
    (exp_id, 'Full daily buffet breakfast',                          'ארוחת בוקר בופה יומי מלא',                  3, true),
    (exp_id, 'Free parking on site',                                 'חניה חינם באתר',                             4, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'           LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'       LIMIT 1;
  SELECT id INTO tag_pool    FROM highlight_tags WHERE slug = 'pool'            LIMIT 1;
  SELECT id INTO tag_kids    FROM highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_kids IS NULL THEN
    SELECT id INTO tag_kids  FROM highlight_tags WHERE slug = 'kids'            LIMIT 1;
  END IF;
  SELECT id INTO tag_kosher  FROM highlight_tags WHERE slug = 'kosher'          LIMIT 1;
  SELECT id INTO tag_parking FROM highlight_tags WHERE slug = 'parking'         LIMIT 1;

  pos := 0;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); pos := pos + 1; END IF;
  IF tag_pool    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,    pos); pos := pos + 1; END IF;
  IF tag_kids    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids,    pos); pos := pos + 1; END IF;
  IF tag_kosher  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,  pos); pos := pos + 1; END IF;
  IF tag_parking IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_parking, pos); END IF;

END $$;
