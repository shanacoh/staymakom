-- Création des hôtels Pereh Hotel (Golan) et Moa Living (Arava)
-- et de leurs 4 expériences associées
-- Source : staymakom_experiences_pereh_moa.json

DO $$
DECLARE
  pereh_hotel_id  UUID;
  moa_hotel_id    UUID;

  exp_farm        UUID := gen_random_uuid();
  exp_wine        UUID := gen_random_uuid();
  exp_fire        UUID := gen_random_uuid();
  exp_couples     UUID := gen_random_uuid();

  tag_yoga        UUID;
  tag_cooking     UUID;
  tag_wine        UUID;
  tag_pool        UUID;
  tag_spa         UUID;
  tag_breakfast   UUID;
  tag_dinner      UUID;
  tag_meditation  UUID;
  tag_couples     UUID;
  tag_night       UUID;

  pos             INTEGER;
BEGIN

  -- ─────────────────────────────────────────────────────────────
  -- 1. HÔTELS
  -- ─────────────────────────────────────────────────────────────

  -- Pereh Hotel (Golan Heights)
  SELECT id INTO pereh_hotel_id FROM hotels2 WHERE slug = 'pereh-hotel-golan' LIMIT 1;
  IF pereh_hotel_id IS NULL THEN
    INSERT INTO hotels2 (
      name, name_he, slug, status,
      city, city_he, region, region_he,
      address, address_he,
      story, story_he
    ) VALUES (
      'Pereh Hotel',
      'פרה הוטל',
      'pereh-hotel-golan',
      'published',
      'Golan Heights',
      'רמת הגולן',
      'Golan',
      'גולן',
      'Golan Heights',
      'רמת הגולן',
      'A working farm hotel in the Golan Heights, built around what the volcanic land produces each season. Chef Yossi Heiv runs the kitchen at Rouge Restaurant; the wine cellar beneath the lobby holds the estate collection. An infinity pool with blue stone mosaics, jacuzzi, and saunas occupy the center of the compound.',
      'מלון חווה ברמת הגולן, שנבנה סביב מה שהקרקע הוולקנית מציעה בכל עונה. השף יוסי חייב מנהל את מסעדת רוז׳; המרתף מתחת ללובי מחזיק את אוסף היינות. בריכת אינפיניטי עם פסיפס אבן כחולה, ג׳קוזי וסאונות נמצאים במרכז המתחם.'
    )
    RETURNING id INTO pereh_hotel_id;
  END IF;

  -- Moa Living (Arava Desert, Zofar)
  SELECT id INTO moa_hotel_id FROM hotels2 WHERE slug = 'moa-living-arava' LIMIT 1;
  IF moa_hotel_id IS NULL THEN
    INSERT INTO hotels2 (
      name, name_he, slug, status,
      city, city_he, region, region_he,
      address, address_he,
      story, story_he
    ) VALUES (
      'Moa Living',
      'מואה לייבינג',
      'moa-living-arava',
      'published',
      'Zofar',
      'צופר',
      'Arava',
      'ערבה',
      'Zofar, Arava Desert',
      'צופר, מדבר ערבה',
      'An ecological desert retreat in the Arava, built around a natural lake filtered through vegetation and algae rather than chemicals. A working orchard, Canadian cedarwood hot tub, ice baths, a Mexican Temazcal sauna, and a large cooled yurt for meditations and sound journeys. The restaurant faces the open desert at sunset.',
      'מפלט מדברי אקולוגי בערבה, שנבנה סביב אגם טבעי המסונן על ידי צמחייה ואצות במקום כימיקלים. פרדס פעיל, ג׳קוזי עץ ארז קנדי, אמבטיות קרח, סאונת טמאסקל מקסיקנית ויורטה מקוררת למדיטציות ומסעות צלילים. המסעדה פונה אל המדבר הפתוח בשקיעה.'
    )
    RETURNING id INTO moa_hotel_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 2. TAGS
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO tag_yoga       FROM highlight_tags WHERE slug = 'yoga-class'        LIMIT 1;
  SELECT id INTO tag_cooking    FROM highlight_tags WHERE slug = 'cooking-class'     LIMIT 1;
  SELECT id INTO tag_wine       FROM highlight_tags WHERE slug = 'wine-tasting'      LIMIT 1;
  SELECT id INTO tag_pool       FROM highlight_tags WHERE slug = 'pool'              LIMIT 1;
  SELECT id INTO tag_spa        FROM highlight_tags WHERE slug = 'spa-access'        LIMIT 1;
  SELECT id INTO tag_breakfast  FROM highlight_tags WHERE slug = 'breakfast'         LIMIT 1;
  SELECT id INTO tag_dinner     FROM highlight_tags WHERE slug = 'dinner'            LIMIT 1;
  SELECT id INTO tag_meditation FROM highlight_tags WHERE slug = 'meditation'        LIMIT 1;
  SELECT id INTO tag_couples    FROM highlight_tags WHERE slug = 'couples-treatment' LIMIT 1;
  SELECT id INTO tag_night      FROM highlight_tags WHERE slug = 'night'             LIMIT 1;

  -- ─────────────────────────────────────────────────────────────
  -- 3. EXPÉRIENCE 1 — Farm to Table Workshop at Pereh
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_farm,
    pereh_hotel_id,
    'Farm to Table Workshop at Pereh',
    'Atelier Farm to Table au Pereh, Golan',
    'סדנת Farm to Table בפרה, גולן',
    'farm-to-table-workshop-pereh',
    'draft',

    'A morning yoga session followed by a farm to table culinary workshop at Pereh, and a stay in the Golan Heights.',
    'Une matinée de yoga suivie d''un atelier culinaire farm to table au Pereh, dans les hauteurs du Golan.',
    'שיעור יוגה בבוקר, סדנת Farm to Table בפרה, ושהייה ברמת הגולן.',

    'A farm to table culinary workshop at Pereh, in the Golan Heights. The whole day is built around what the land gave that week.

The morning opens with an outdoor yoga session, gentle and deep, while the Golan air is still cool. At 11:30, the farm to table workshop begins. Chef Yossi Heiv grew up in the Galilee and built his cooking around foraging and what the volcanic soil of the Golan actually produces. The workshop follows the same logic: guests handle the ingredients directly, understand where each one comes from, learn what is in season and why, and see how a dish is constructed from that starting point rather than from a fixed recipe. It is a hands-on session, not a demonstration, and it takes its time.

After the workshop, the afternoon opens up. The infinity pool sits at the heart of the compound, blue stone mosaics, heated through winter, with views toward the grove. The jacuzzi, open to the sky and facing the Naphtali ridge, holds eight guests at sunset. The dry and wet saunas are available for anyone who wants the heat in between. At 16:30, a wine tasting led by the in-house sommelier takes the culinary thread further, in the cellar beneath the lobby, with local cheeses alongside.

Dinner at Rouge Restaurant follows, built from the same seasonal sourcing that ran through the morning''s workshop. Breakfast the next day runs until 11:00 at Rouge, unhurried.',

    'Un atelier farm to table au Pereh, dans les hauteurs du Golan. Toute la journée tourne autour de ce que la terre a donné cette semaine-là.

La matinée commence par un cours de yoga en plein air, doux et profond, pendant que l''air du Golan est encore frais. À 11h30, l''atelier commence. Le chef Yossi Heiv a grandi en Galilée et a construit sa cuisine autour de la cueillette sauvage et de ce que le sol volcanique du Golan produit réellement. L''atelier suit la même logique : les participants touchent les ingrédients, comprennent d''où chacun vient, apprennent ce qui est de saison et pourquoi, et voient comment un plat se construit depuis ce point de départ plutôt que depuis une recette figée. C''est une session active, pas une démonstration, et elle prend le temps qu''il faut.

L''après-midi s''ouvre ensuite. La piscine à débordement, carrelée de mosaïque bleue et chauffée en hiver, occupe le cœur du domaine avec vue sur le bois. Le jacuzzi, ouvert sur le ciel et face au massif du Naphtali, accueille jusqu''à huit personnes au coucher du soleil. Les saunas sec et humide sont disponibles pour ceux qui veulent la chaleur entre les deux. À 16h30, une dégustation de vins animée par le sommelier de la maison prolonge le fil culinaire de la journée, dans la cave sous le lobby, avec des fromages locaux accordés.

Le dîner au Rouge suit, construit sur le même approvisionnement saisonnier que l''atelier du matin. Le lendemain, le petit-déjeuner au Rouge est servi jusqu''à 11h, sans pression.',

    '',

    0, 'per_booking', 'ILS',
    2, 10, 1, 1,

    'Farm to Table Workshop at Pereh, Golan Heights',
    'Yoga, a farm to table workshop with Chef Yossi Heiv, wine tasting and a stay at Pereh in the Golan Heights.',
    'A Day Built Around the Land, at Pereh',
    'Yoga at dawn, a farm to table workshop, wine in the cellar. A full day at Pereh, in the Golan.',

    'Atelier Farm to Table au Pereh, Golan',
    'Yoga, atelier culinaire farm to table avec le chef Yossi Heiv, dégustation de vin et séjour au Pereh, dans les hauteurs du Golan.',
    'Une journée construite autour de la terre, au Pereh',
    'Yoga au réveil, atelier farm to table, cave et dîner au Rouge. Une journée entière au Pereh, dans le Golan.',

    'סדנת Farm to Table בפרה, רמת הגולן',
    'יוגה, סדנת Farm to Table עם השף יוסי חייב, טעימת יין ושהייה בפרה, רמת הגולן.',
    'יום שנבנה סביב האדמה, בפרה',
    'יוגה בבוקר, סדנת Farm to Table, יין במרתף וארוחת ערב ברוז׳. יום שלם בפרה, בגולן.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_farm, 'Outdoor morning yoga session',                                           'שיעור יוגה בבוקר בחוץ',                                           0, true),
    (exp_farm, 'Farm to table culinary workshop with seasonal, locally sourced ingredients', 'סדנת Farm to Table עם מרכיבים עונתיים ומקומיים',              1, true),
    (exp_farm, 'Sommelier-led wine tasting with local cheeses',                          'טעימת יין מודרכת סומלייה עם גבינות מקומיות',                      2, true),
    (exp_farm, 'Dinner at Rouge Restaurant',                                             'ארוחת ערב במסעדת רוז׳',                                           3, true),
    (exp_farm, 'Access to the infinity pool, jacuzzi, dry and wet saunas, and gym',     'כניסה לבריכת אינפיניטי, ג׳קוזי, סאונות יבש ורטוב וחדר כושר',    4, true),
    (exp_farm, 'Full breakfast at Rouge Restaurant',                                     'ארוחת בוקר מלאה במסעדת רוז׳',                                    5, true);

  pos := 0;
  IF tag_yoga     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_farm, tag_yoga,    pos); pos := pos + 1; END IF;
  IF tag_cooking  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_farm, tag_cooking, pos); pos := pos + 1; END IF;
  IF tag_wine     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_farm, tag_wine,    pos); pos := pos + 1; END IF;
  IF tag_pool     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_farm, tag_pool,    pos); pos := pos + 1; END IF;
  IF tag_spa      IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_farm, tag_spa,     pos); pos := pos + 1; END IF;
  IF tag_breakfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_farm, tag_breakfast, pos); pos := pos + 1; END IF;
  IF tag_dinner   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_farm, tag_dinner,  pos); END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 4. EXPÉRIENCE 2 — Sommelier-Led Wine Tasting at Pereh
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_wine,
    pereh_hotel_id,
    'Sommelier-Led Wine Tasting at Pereh',
    'Dégustation de Vins avec le Sommelier au Pereh',
    'טעימת יינות עם סומלייה בפרה, גולן',
    'wine-tasting-pereh',
    'draft',

    'A morning yoga session followed by a sommelier-led wine tasting at Pereh, and a stay in the Golan Heights.',
    'Une matinée de yoga suivie d''une dégustation de vins animée par le sommelier, et un séjour au Pereh dans les hauteurs du Golan.',
    'שיעור יוגה בבוקר, טעימת יינות מודרכת סומלייה בפרה, ושהייה ברמת הגולן.',

    'A sommelier-led wine tasting at Pereh, in the Golan Heights. The afternoon takes place in the cellar. Everything else holds the day around it.

The morning opens with an outdoor yoga session, gentle and deep, while the Golan air is still cool. The rest of the day stays open until the tasting begins at 16:30, in the wine cellar beneath the lobby, kept at the temperature and humidity the bottles need. The sommelier leads guests through a selection of Israeli boutique wines, sourced from producers across the country, presenting each one in its context — the region it comes from, the year, what the soil gave. Local cheeses are chosen to match and served alongside.

The infinity pool, blue stone mosaics and heated through winter, is there for the hours before. So is the jacuzzi, open to the sky, eight guests wide, facing the Naphtali ridge at sunset. The dry and wet saunas sit nearby for anyone who wants them. For guests who want to extend the culinary day even further, the farm to table workshop runs earlier in the morning, a hands-on counterpart to the tasting''s more reflective pace.

Dinner at Rouge Restaurant follows the tasting directly, Chef Yossi Heiv''s kitchen translating the same territorial logic from glass to plate, foraging and seasonal sourcing from the Golan''s volcanic soil. Breakfast the next day runs until 11:00 at Rouge, unhurried.',

    'Une dégustation de vins avec le sommelier au Pereh, dans les hauteurs du Golan. Le moment fort de la journée se passe en cave. Le reste tient le cadre autour.

La matinée s''ouvre par un cours de yoga en plein air, doux et profond, pendant que l''air du Golan est encore frais. Le reste de la journée reste libre jusqu''à 16h30, heure à laquelle la dégustation commence dans la cave sous le lobby, maintenue à la température et au taux d''humidité qu''exigent les bouteilles. Le sommelier guide les participants à travers une sélection de vins de domaines israéliens, présentés dans leur contexte : la région d''origine, le millésime, ce que l''année a donné. Des fromages locaux sont choisis pour accompagner.

La piscine à débordement, mosaïque bleue et chauffée en hiver, est là pour les heures qui précèdent. Idem pour le jacuzzi ouvert sur le ciel, face au massif du Naphtali en fin de journée. Les saunas sec et humide sont disponibles à côté. Pour ceux qui veulent prolonger le fil culinaire dès le matin, l''atelier farm to table du chef Yossi Heiv tourne plus tôt dans la journée, version pratique et active de ce que la dégustation explore autrement.

Le dîner au Rouge suit directement la cave, la même logique de territoire traduite du verre à l''assiette, cueillette sauvage et approvisionnement saisonnier depuis le sol volcanique du Golan. Le lendemain, le petit-déjeuner au Rouge est servi jusqu''à 11h, sans se presser.',

    '',

    0, 'per_booking', 'ILS',
    2, 10, 1, 1,

    'Sommelier-Led Wine Tasting at Pereh, Golan',
    'Yoga, a sommelier-led wine tasting in the cellar, dinner at Rouge and a stay at Pereh, Golan Heights.',
    'Wine, Yoga and a Stay at Pereh',
    'From morning yoga to a cellar tasting led by the sommelier. A day at Pereh, in the Golan Heights.',

    'Dégustation de Vins avec Sommelier au Pereh, Golan',
    'Yoga, dégustation de vins israéliens en cave avec le sommelier, dîner au Rouge et séjour au Pereh, dans les hauteurs du Golan.',
    'Du yoga à la cave, au Pereh',
    'Une dégustation de vins menée par le sommelier, les hauteurs du Golan et le Rouge en soirée. Une journée au Pereh.',

    'טעימת יין עם סומלייה בפרה, גולן',
    'יוגה, טעימת יין מודרכת סומלייה במרתף, ארוחת ערב ברוז׳ ושהייה בפרה, רמת הגולן.',
    'יין, יוגה ושהייה בפרה',
    'מיוגה בבוקר עד טעימת יין במרתף מודרכת סומלייה. יום שלם בפרה, ברמת הגולן.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_wine, 'Outdoor morning yoga session',                                       'שיעור יוגה בבוקר בחוץ',                                        0, true),
    (exp_wine, 'Sommelier-led wine tasting with local cheeses',                      'טעימת יין מודרכת סומלייה עם גבינות מקומיות',                   1, true),
    (exp_wine, 'Dinner at Rouge Restaurant',                                         'ארוחת ערב במסעדת רוז׳',                                        2, true),
    (exp_wine, 'Access to the infinity pool, jacuzzi, dry and wet saunas, and gym', 'כניסה לבריכת אינפיניטי, ג׳קוזי, סאונות יבש ורטוב וחדר כושר', 3, true),
    (exp_wine, 'Full breakfast at Rouge Restaurant',                                 'ארוחת בוקר מלאה במסעדת רוז׳',                                 4, true);

  pos := 0;
  IF tag_yoga     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_wine, tag_yoga,     pos); pos := pos + 1; END IF;
  IF tag_wine     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_wine, tag_wine,     pos); pos := pos + 1; END IF;
  IF tag_pool     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_wine, tag_pool,     pos); pos := pos + 1; END IF;
  IF tag_spa      IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_wine, tag_spa,      pos); pos := pos + 1; END IF;
  IF tag_dinner   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_wine, tag_dinner,   pos); pos := pos + 1; END IF;
  IF tag_breakfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_wine, tag_breakfast, pos); END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 5. EXPÉRIENCE 3 — Fire Ritual and Sound Journey at Moa
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_fire,
    moa_hotel_id,
    'Fire Ritual and Sound Journey at Moa',
    'Rituel du Feu et Voyage Sonore à Moa',
    'טקס אש ומסע צלילים במואה, ערבה',
    'fire-ritual-sound-journey-moa',
    'draft',

    'A day of vinyasa, ice baths, fire ritual and sound journey at Moa, deep in the Arava desert.',
    'Une journée de vinyasa, bains froids, rituel du feu et voyage sonore à Moa, au cœur du désert de l''Arava.',
    'יום של ויניאסה, אמבטיות קרח, טקס אש ומסע צלילים במואה, בעומק מדבר הערבה.',

    'A fire ritual and sound journey at Moa, in the heart of the Arava. The day moves from breath to flame to silence.

It begins with an outdoor vinyasa session, while the desert light is still low. Then comes the ice bath and breathing workshop in the desert wellness area of the orchard, where two ice baths between 3 and 7 degrees sit alongside a Canadian cedarwood hot tub and a traditional Mexican Temazcal sauna. This is not a treatment that relaxes — it is a contrast that resets the nervous system.

As evening falls, the fire ritual gathers guests around an open flame, a practice rooted in the older rhythms of the desert. The sound journey that follows carries the day into its final hour inside the yurt, a large cooled tent built specifically for meditations and journeys, where sound takes over from everything else.

The night is held by the ecological lake at the center of the property, filtered naturally through vegetation, algae, and specialized soil rather than chemicals, with a stone beach and shaded areas for resting. The restaurant faces west, opening onto the open desert at sunset. The menu changes daily, plant-forward, with fish and proteins drawn from what the kitchen has that evening, alongside a bar serving local Arava wines and desert-inspired cocktails.

The next morning, breakfast is a full buffet, eaten slowly, with the same view as the night before, lit differently.',

    'Un rituel du feu et un voyage sonore à Moa, au cœur de l''Arava. La journée passe du souffle à la flamme, puis au silence.

Elle commence par un cours de vinyasa en plein air, pendant que la lumière du désert est encore basse. Puis vient l''atelier de bains froids et de respiration dans l''espace de bien-être du verger, où deux bains de glace entre 3 et 7 degrés jouxtent un jacuzzi en bois de cèdre canadien et un sauna Temazcal de tradition mexicaine. Ce n''est pas un soin qui détend, c''est un contraste qui remet le système nerveux à zéro.

Avec le soir, le rituel du feu rassemble les participants autour d''une flamme ouverte, une pratique ancrée dans les rythmes plus anciens du désert. Le voyage sonore qui suit emmène la journée dans son heure finale à l''intérieur du yurt, une grande tente rafraîchie construite spécifiquement pour les méditations et les journeys, où le son prend le relais de tout le reste.

La nuit est encadrée par le lac écologique au milieu du domaine, filtré naturellement par la végétation, les algues et un sol spécifique plutôt que par des produits chimiques, avec une plage de pierres et des zones d''ombre pour s''allonger. Le restaurant, tourné à l''ouest, ouvre sur le désert ouvert au coucher du soleil. Le menu change chaque jour, centré sur le végétal, avec des poissons et des protéines selon ce que la cuisine a ce soir-là, un bar qui sert des vins de l''Arava et des cocktails inspirés de la flore locale.

Le lendemain matin, le petit-déjeuner est un buffet complet servi lentement, avec la même vue que la veille au soir, éclairée autrement.',

    '',

    0, 'per_booking', 'ILS',
    2, 20, 1, 1,

    'Fire Ritual and Sound Journey at Moa, Arava',
    'Vinyasa, ice baths, a fire ritual and sound journey at Moa, with a stay deep in the Arava desert.',
    'A Day of Fire and Stillness, at Moa',
    'From morning yoga to an evening fire ritual and a sound journey in the yurt. A full day at Moa.',

    'Rituel du Feu et Voyage Sonore à Moa, Arava',
    'Vinyasa, bains de glace, rituel du feu et voyage sonore à Moa, avec un séjour au cœur du désert de l''Arava.',
    'Une journée de feu et de silence, à Moa',
    'Du yoga au rituel du feu, puis un voyage sonore dans le yurt. Une journée entière à Moa, dans le désert.',

    'טקס אש ומסע צלילים במואה, ערבה',
    'ויניאסה, אמבטיות קרח, טקס אש ומסע צלילים במואה, ושהייה בעומק מדבר הערבה.',
    'יום של אש ושקט, במואה',
    'מיוגה בבוקר עד טקס האש בערב ומסע הצלילים ביורטה. יום שלם במואה.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_fire, 'Outdoor vinyasa yoga session',                              'שיעור ויניאסה יוגה בחוץ',                          0, true),
    (exp_fire, 'Ice bath and breathing workshop in the desert wellness area', 'סדנת אמבטיות קרח ונשימה במרחב הוולנס המדברי',    1, true),
    (exp_fire, 'Evening fire ritual',                                       'טקס אש בערב',                                      2, true),
    (exp_fire, 'Sound journey in the yurt',                                 'מסע צלילים ביורטה',                                3, true),
    (exp_fire, 'Dinner at the restaurant, daily-changing plant-forward menu', 'ארוחת ערב במסעדה, תפריט יומי מבוסס צמחי',       4, true),
    (exp_fire, 'Full buffet breakfast',                                     'ארוחת בוקר בופה מלא',                              5, true);

  pos := 0;
  IF tag_yoga      IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_fire, tag_yoga,      pos); pos := pos + 1; END IF;
  IF tag_meditation IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_fire, tag_meditation, pos); pos := pos + 1; END IF;
  IF tag_dinner    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_fire, tag_dinner,    pos); pos := pos + 1; END IF;
  IF tag_breakfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_fire, tag_breakfast, pos); END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 6. EXPÉRIENCE 4 — Couples Treatment at Moa
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_couples,
    moa_hotel_id,
    'Couples Treatment at Moa',
    'Soin en Couple à Moa',
    'טיפול זוגי במואה, ערבה',
    'couples-treatment-moa',
    'draft',

    'Yoga, ice baths and a couples treatment in the desert treatment room, with a stay at Moa facing the lake.',
    'Yoga, bains de contraste et soin en couple dans la salle de soins du désert, avec un séjour à Moa face au lac.',
    'יוגה, אמבטיות קרח וטיפול זוגי בחדר הטיפולים המדברי, עם שהייה במואה מול האגם.',

    'A couples treatment at Moa, in the Arava. The day builds something together before it settles into stillness.

It starts with an outdoor vinyasa session, then the hot and cold contrasts in the orchard''s wellness area: the Canadian cedarwood hot tub heated to 38 degrees, the two ice baths between 3 and 7 degrees, the Temazcal sauna. This sequence leaves the body fully open before entering the treatment. The desert treatment room receives both guests together, where local therapists work through stress relief and physical support, a space built for two from the start.

The rest of the day belongs to the property. The ecological lake, filtered through vegetation and algae rather than chemicals, with its stone beach and shaded areas for lying down with nothing else to do. The hammocks in the orchard. The yurt for those who want to continue into meditation. In the evening, the fire ritual gathers residents around an open flame for those who want to end the day collectively.

Dinner is served facing the desert as the light fades, a daily-changing menu built around plant proteins and fish, alongside a bar pouring Arava wines and cocktails made from desert flora.

The next morning, the breakfast buffet is eaten slowly with the same desert in front, now in morning light. The kind of stay where you forget to write to anyone.',

    'Un soin en couple à Moa, dans l''Arava. La journée construit quelque chose ensemble avant de poser le tempo.

Elle commence par un cours de vinyasa en plein air, puis les contrastes chaud-froid dans l''espace de bien-être du verger : le jacuzzi en cèdre canadien chauffé à 38 degrés, les deux bains de glace entre 3 et 7 degrés, le sauna Temazcal. Ce passage-là laisse le corps pleinement disponible avant d''entrer dans le soin. La salle de soins du désert accueille les deux personnes ensemble, des thérapeutes de la région travaillent sur la libération des tensions et le soutien physique, la pièce pensée pour deux dès le départ.

Le reste de la journée appartient au domaine. Le lac écologique, filtré par la végétation et les algues plutôt que par des produits chimiques, avec sa plage de pierres et ses zones d''ombre pour s''allonger. Les hammacs dans le verger. Le yurt pour ceux qui veulent prolonger dans la méditation. Le soir, le rituel du feu rassemble les résidents autour d''une flamme ouverte pour ceux qui souhaitent terminer la journée collectivement.

Le dîner est servi face au désert qui s''assombrit, un menu qui change chaque jour construit autour du végétal, des poissons et de ce que le marché du matin a donné, avec un bar qui sert des vins de producteurs de l''Arava et des cocktails à base de plantes du désert.

Le lendemain matin, le buffet du petit-déjeuner se mange lentement avec le même désert devant soi, cette fois dans la lumière du matin. Le genre de séjour où on oublie d''écrire à qui que ce soit.',

    '',

    0, 'per_booking', 'ILS',
    2, 2, 1, 1,

    'Couples Treatment at Moa, Arava Desert',
    'Yoga, ice baths, a couples treatment and a stay by the lake at Moa, in the Arava desert.',
    'Just the Two of You, at Moa',
    'A couples treatment, the desert''s hot and cold contrasts, and a stay by the lake. A day at Moa.',

    'Soin en Couple à Moa, Désert de l''Arava',
    'Yoga, bains de contraste et soin en couple dans la salle de soins du désert, avec un séjour à Moa face au lac dans l''Arava.',
    'Rien que vous deux, à Moa',
    'Yoga, jacuzzi, bains de glace, soin en couple. Un séjour à Moa, au bord du lac dans le désert de l''Arava.',

    'טיפול זוגי במואה, מדבר הערבה',
    'יוגה, אמבטיות קרח, טיפול זוגי ושהייה מול האגם במואה, במדבר הערבה.',
    'רק שניכם, במואה',
    'טיפול זוגי, ניגודי חום-קור של המדבר ושהייה מול האגם. יום במואה.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_couples, 'Outdoor vinyasa yoga session',                         'שיעור ויניאסה יוגה בחוץ',                        0, true),
    (exp_couples, 'Access to the cedarwood hot tub and ice baths',        'כניסה לג׳קוזי עץ ארז ואמבטיות קרח',             1, true),
    (exp_couples, 'Couples treatment at the desert treatment room',       'טיפול זוגי בחדר הטיפולים המדברי',               2, true),
    (exp_couples, 'One night in a stone-built room',                      'לילה אחד בחדר עשוי אבן',                        3, true),
    (exp_couples, 'Dinner at the restaurant, daily-changing menu',        'ארוחת ערב במסעדה, תפריט משתנה',                 4, true),
    (exp_couples, 'Full buffet breakfast',                                'ארוחת בוקר בופה מלא',                           5, true);

  pos := 0;
  IF tag_couples   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_couples, tag_couples,   pos); pos := pos + 1; END IF;
  IF tag_yoga      IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_couples, tag_yoga,      pos); pos := pos + 1; END IF;
  IF tag_night     IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_couples, tag_night,     pos); pos := pos + 1; END IF;
  IF tag_dinner    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_couples, tag_dinner,    pos); pos := pos + 1; END IF;
  IF tag_breakfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_couples, tag_breakfast, pos); END IF;

END $$;
