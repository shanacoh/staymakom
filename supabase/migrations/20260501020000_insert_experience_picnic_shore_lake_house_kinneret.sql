-- Insert experience: Picnic on the Shore at Lake House Kinneret
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_bfast       UUID;
  tag_kosher      UUID;
  tag_pool        UUID;
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
    'Picnic on the Shore',
    'פיקניק על שפת הכנרת',
    'picnic-on-the-shore-lake-house-kinneret',
    'published',
    'A private picnic basket on the shore of the Sea of Galilee, followed by a stay at Lake House Kinneret, Tiberias.',
    'פיקניק פרטי על חוף הכנרת, ולילה במלון לייק האוס כנרת, טבריה.',
    'A private picnic on the shore of the Sea of Galilee, at Lake House Kinneret, Tiberias. The water, the light, the two of you.

The hotel prepares a curated picnic basket and sets up your spot on the private beach: a blanket, cushions, a parasol facing the lake. The Golan Heights rise across the water. The light shifts from noon white to a slow amber. There is nothing to do but be there.

Lake House Kinneret sits directly on the shores of the Kinneret, spread across 54 acres of lawn and garden that slope quietly down to the water. Your room comes with a balcony and a lake view. In the late afternoon, when the picnic is done and the sun drops behind the hills, the room is waiting.

The outdoor pool overlooks the lake. If the evening calls for it, a dip before dinner is easy. The hotel restaurant serves a full kosher menu, the kind of dinner that asks nothing of you.

Breakfast arrives in the morning as a full buffet, with the lake still and silver through the window. The kind of morning where you look at each other and decide, without saying it, to stay a little longer.',
    'פיקניק פרטי על חוף הכנרת, במלון לייק האוס כנרת, טבריה. המים, האור, ואתם.

המלון מכין סל פיקניק מוכן ומסודר ומציב את המקום שלכם על החוף הפרטי: שמיכה, כריות, שמשייה מול האגם. רמת הגולן עולה מן הצד השני של המים. האור עובר מלבן של צהריים לענבר איטי של אחר הצהריים. אין מה לעשות חוץ מלהיות שם.

לייק האוס כנרת יושב ממש על שפת הכנרת, על 54 דונם של דשא וגינות שיורדים בשקט אל המים. החדר שלכם כולל מרפסת ונוף לאגם. אחר הצהריים המאוחר, כשהפיקניק נגמר והשמש שוקעת מאחורי הגבעות, החדר מחכה לכם.

הבריכה החיצונית משקיפה על הכנרת. אם הערב קורא לזה, אפשר לצלול לפני ארוחת הערב בלי מאמץ. מסעדת המלון מגישה תפריט כשר מלא, סוג של ארוחת ערב שלא דורשת שום דבר מכם.

ארוחת הבוקר מגיעה בבוקר כבופה מלא, עם הכנרת שקטה וכסופה מבעד לחלון. הסוג של בוקר שבו מסתכלים אחד על השני ומחליטים, בלי לומר זאת, להישאר עוד קצת.',
    0, 'per_person', 'ILS',
    2, 2, 1, 2,
    'Picnic on the Shore — Lake House Kinneret, Tiberias',
    'A private picnic on the private beach of Lake House Kinneret, a lake-view room, and a slow morning by the Sea of Galilee.',
    'A Picnic on the Kinneret Shore',
    'Your basket is ready. The lake is right there. A private picnic on the shore of the Sea of Galilee at Lake House Kinneret, Tiberias.',
    'פיקניק רומנטי על הכנרת — לייק האוס כנרת',
    'פיקניק פרטי על החוף, חדר עם נוף לכנרת וארוחת בוקר מול האגם. חופשה זוגית בטבריה.',
    'פיקניק על שפת הכנרת',
    'הסל מוכן. הכנרת ממש שם. פיקניק פרטי על החוף של לייק האוס כנרת, לשניים בלבד.',
    'Pique-nique au bord du lac de Tibériade — Lake House Kinneret',
    'Un panier pique-nique privé sur la plage du Lake House Kinneret, une chambre vue lac et un matin au bord de la mer de Galilée.',
    'Un pique-nique romantique au bord du Kinneret',
    'Le panier est prêt. Le lac est là. Un moment suspendu sur la rive de la mer de Galilée, rien que pour deux.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Curated picnic basket for two, set up on the private beach', 'סל פיקניק מוכן לשניים, מסודר על החוף הפרטי',        0, true),
    (exp_id, 'Private beach setup: blanket, cushions, parasol facing the lake', 'סידור על החוף: שמיכה, כריות ושמשייה מול האגם', 1, true),
    (exp_id, 'One night in a lake-view room with balcony',                 'לילה אחד בחדר עם נוף לכנרת ומרפסת',                  2, true),
    (exp_id, 'Access to the outdoor pool overlooking the Sea of Galilee',  'כניסה לבריכה החיצונית עם נוף לכנרת',                 3, true),
    (exp_id, 'Full kosher buffet breakfast',                               'ארוחת בוקר בופה כשרה מלאה',                           4, true);

  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'     LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast' LIMIT 1;
  SELECT id INTO tag_kosher  FROM highlight_tags WHERE slug = 'kosher'    LIMIT 1;
  SELECT id INTO tag_pool    FROM highlight_tags WHERE slug = 'pool'      LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_bfast  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,  pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); pos := pos + 1; END IF;
  IF tag_pool   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,   pos); END IF;

END $$;
