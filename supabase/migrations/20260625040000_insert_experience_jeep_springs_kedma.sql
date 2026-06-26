-- Insert experience: Jeep Tour to the Hidden Springs of Nahal Tzin — Kedma by Isrotel
DO $$
DECLARE
  exp_id        UUID    := gen_random_uuid();
  hotel_uuid    UUID;
  tag_night     UUID;
  tag_bfast     UUID;
  tag_tour      UUID;
  tag_pool      UUID;
  tag_spa       UUID;
  tag_kids      UUID;
  tag_kosher    UUID;
  pos           INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%kedma%' LIMIT 1;
  -- If hotel not found, hotel_uuid stays NULL and will be linked manually

  INSERT INTO experiences2 (
    id, hotel_id, title, title_he, title_fr, slug, status,
    subtitle, subtitle_he, subtitle_fr,
    long_copy, long_copy_he, long_copy_fr,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr
  ) VALUES (
    exp_id,
    hotel_uuid,
    'JEEP TOUR TO THE HIDDEN SPRINGS OF NAHAL TZIN',
    'טיול ג''יפ למעיינות הנסתרים של נחל צין',
    'Tour en jeep vers les sources cachées du Nahal Tzin',
    'jeep-hidden-springs-kedma',
    'draft',
    'A four-hour jeep tour to two hidden desert springs in the Tzin Valley, followed by a stay at Kedma, a Nabatean-style khan in Sde Boker.',
    'טיול ג''יפ של ארבע שעות לשני מעיינות נסתרים בבקעת צין, ולאחריה שהייה בקדמה, חאן בסגנון נבטי בשדה בוקר.',
    'Un tour en jeep de quatre heures vers deux sources cachées dans la vallée du Tzin, suivi d''un séjour à Kedma, un khan de style nabatéen à Sde Boker.',
    'A four-hour jeep tour to two hidden desert springs, followed by a stay at Kedma, a Nabatean-style khan in Sde Boker. The tour leaves straight from the hotel''s parking lot, and the desert keeps almost all of it hidden from the road.

The jeep climbs first to an overlook above the Tzin Valley, the kind of view that explains why water survives here when it disappears everywhere else for miles. Then down to Ein Akev, a spring falling from a high rock ledge into a deep pool, cold and clear enough to swim in if you''re up for it. The second stop, Ein Ziq, opens up wider: a desert oasis thick with palm trees, hundreds of them, an unlikely grove standing in the middle of nothing. No pool here, just the scale of the place and water where there shouldn''t be any.

Back at Kedma, the hotel takes the shape of a Nabatean khan, curved stone walls built along the same Spice Route the jeep just crossed. The courtyard pool sits surrounded by fruit trees, a quiet center the building wraps around on every side.

The hammam and Turkish bath at the Kedma spa are right there for anyone who wants the day''s heat to end in a different kind of warmth.

Breakfast on the terrace the next morning, the desert quiet again before the first jeep of the day pulls out of the lot. The kind of morning that makes you wonder what else the sand is still hiding.',
    'טיול ג''יפ של ארבע שעות לשני מעיינות נסתרים במדבר, ולאחריה שהייה בקדמה, חאן בסגנון נבטי בשדה בוקר. הסיור יוצא ישירות ממגרש החנייה של המלון, והמדבר שומר כמעט הכל נסתר מהכביש.

הג''יפ טופס קודם לנקודת תצפית מעל בקעת נחל צין, הסוג של נוף שמסביר מדוע המים שורדים כאן כשהם נעלמים בכל מקום אחר על פני קילומטרים. משם יורדים לעין עקב, מעיין שנשפך מרכס סלע גבוה לבריכה עמוקה, קרה וצלולה מספיק לשחייה אם מתחשק. העצירה השנייה, עין זיק, נפתחת לרוחב יותר: נאווה מדברית עשירה בדקלים, מאות, חורשה בלתי צפויה עומדת בתוך השממה. אין כאן בריכה, רק ממדיו של המקום ומים שלא אמורים להיות שם.

בחזרה לקדמה, המלון לובש צורה של חאן נבטי, קירות אבן מעוגלים שנבנו לאורך אותו מסלול התבלינים שהג''יפ חצה ממש עכשיו. בריכת החצר מוקפת עצי פרי, מרכז שקט שהבניין עוטף מכל עבריו.

המקווה הטורקי ובית הקיטור בספא קדמה נמצאים שם למי שרוצה לסיים את חום היום בחום אחר.

בבוקר, ארוחת בוקר על הטרסה, המדבר שוב שקט לפני שהג''יפ הראשון של היום יוצא מהחנייה. הסוג של בוקר שגורם לתהות מה עוד החול מסתיר.',
    'Un tour en jeep de quatre heures vers deux sources cachées du désert, suivi d''un séjour à Kedma, un khan de style nabatéen à Sde Boker. Le tour part directement du parking de l''hôtel, et le désert garde presque tout caché depuis la route.

La jeep grimpe d''abord vers un point de vue surplombant la vallée du Tzin, le genre de panorama qui explique pourquoi l''eau survit ici alors qu''elle disparaît partout ailleurs sur des kilomètres. Puis la descente vers Ein Akev, une source qui tombe d''une corniche rocheuse haute dans un bassin profond, froid et assez clair pour s''y baigner si l''envie est là. Le second arrêt, Ein Ziq, s''ouvre plus largement : une oasis désertique dense en palmiers, des centaines, une palmeraie improbable au milieu de rien. Pas de bassin ici, juste l''ampleur du lieu et de l''eau là où il ne devrait pas y en avoir.

Retour à Kedma, l''hôtel prend la forme d''un khan nabatéen, murs de pierre courbés construits le long de la même route des épices que la jeep vient de traverser. La piscine de la cour est entourée d''arbres fruitiers, centre tranquille que le bâtiment enveloppe de tous côtés.

Le hammam et le bain turc du spa de Kedma sont juste là pour qui veut clore la chaleur du jour dans une autre forme de chaleur.

Le matin, petit-déjeuner sur la terrasse, le désert à nouveau silencieux avant que la première jeep du jour ne quitte le parking. Le genre de matin qui donne envie de savoir ce que le sable cache encore.',
    0, 'per_booking', 'ILS',
    1, 6, 1, 1,
    'Jeep Tour to Hidden Springs + Kedma Hotel Stay',
    'A four-hour jeep tour to two hidden desert springs in the Negev, followed by a night at Kedma, a Nabatean-style khan in Sde Boker.',
    'Springs the Desert Tries to Hide',
    'A waterfall pool, a hidden palm grove, and a night inside a Nabatean-style khan on the old Spice Route.',
    'טיול ג''יפ למעיינות נסתרים ולינה בקדמה',
    'טיול ג''יפ של ארבע שעות לשני מעיינות נסתרים בנגב, ולאחריה לינה בקדמה, חאן נבטי בשדה בוקר.',
    'המעיינות שהמדבר מנסה להסתיר',
    'ברכת מפל, חורשת דקלים נסתרת, ולינה בתוך חאן נבטי על מסלול התבלינים העתיק.',
    'Tour en jeep vers sources cachées et nuit à Kedma',
    'Un tour en jeep de quatre heures vers deux sources cachées du désert du Néguev, suivi d''une nuit à Kedma, un khan nabatéen à Sde Boker.',
    'Des sources que le désert tente de cacher',
    'Un bassin de cascade, une palmeraie cachée, et une nuit dans un khan de style nabatéen sur l''ancienne route des épices.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Four-hour jeep tour to Ein Akev and Ein Ziq springs',                              'טיול ג''יפ של ארבע שעות למעיינות עין עקב ועין זיק',            0, true),
    (exp_id, 'Desert overlook above Nahal Tzin valley',                                          'תצפית מדברית מעל בקעת נחל צין',                               1, true),
    (exp_id, 'Swimming stop at Ein Akev (subject to conditions, own responsibility)',             'עצירת שחייה בעין עקב (בהתאם לתנאים, באחריות המשתתפים)',        2, true),
    (exp_id, 'A night at Kedma, Nabatean-style khan in Sde Boker',                              'לילה בקדמה, חאן בסגנון נבטי בשדה בוקר',                       3, true),
    (exp_id, 'Courtyard pool surrounded by fruit trees',                                         'בריכת חצר המוקפת עצי פרי',                                     4, true),
    (exp_id, 'Breakfast buffet on the terrace',                                                  'ארוחת בוקר בופה על הטרסה',                                     5, true);

  SELECT id INTO tag_night  FROM highlight_tags WHERE slug = 'night'          LIMIT 1;
  SELECT id INTO tag_bfast  FROM highlight_tags WHERE slug = 'breakfast'      LIMIT 1;
  SELECT id INTO tag_tour   FROM highlight_tags WHERE slug = 'guided-tour'    LIMIT 1;
  SELECT id INTO tag_pool   FROM highlight_tags WHERE slug = 'pool'           LIMIT 1;
  SELECT id INTO tag_spa    FROM highlight_tags WHERE slug = 'spa-access'     LIMIT 1;
  SELECT id INTO tag_kids   FROM highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  SELECT id INTO tag_kosher FROM highlight_tags WHERE slug = 'kosher'         LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_bfast  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,  pos); pos := pos + 1; END IF;
  IF tag_tour   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,   pos); pos := pos + 1; END IF;
  IF tag_pool   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,   pos); pos := pos + 1; END IF;
  IF tag_spa    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,    pos); pos := pos + 1; END IF;
  IF tag_kids   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids,   pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

END $$;
