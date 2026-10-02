-- Insert experience: Supper Under the Galilee Pines, at The Setai Bayit Bagalil
DO $$
DECLARE
  exp_id        UUID := gen_random_uuid();
  hotel_uuid    UUID;
  category_uuid UUID;
  tag_dinner    UUID;
  tag_breakfast UUID;
  tag_kosher    UUID;
  pos           INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%setai bayit bagalil%' LIMIT 1;
  SELECT id INTO category_uuid FROM categories WHERE slug = 'land-of-stories' LIMIT 1;

  INSERT INTO experiences2 (
    id, hotel_id, category_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency, pricing_model,
    min_party, max_party, min_nights, max_nights,
    preferred_board_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_id,
    hotel_uuid,
    category_uuid,
    'Supper Under the Galilee Pines',
    'Dîner sous la soukka, au cœur des pins',
    'ארוחה בסוכה בין אורני הגליל',
    'supper-under-galilee-pines-setai-bayit-bagalil',
    'draft',

    'A festive kosher dinner in the sukkah at The Setai Bayit Bagalil, followed by a stay among the pines of Biriya Forest.',
    'Un dîner de fête casher sous la soukka du Setai Bayit Bagalil, suivi d''un séjour au milieu des pins de la forêt de Biriya.',
    'ארוחת חג כשרה בסוכה של סטאי בית בגליל, ואחריה שהייה בין אורני יער ביריה.',

    'A Sukkot dinner in the sukkah at The Setai Bayit Bagalil, Upper Galilee. Seven days a year when the table moves outside.

The sukkah stands in the grounds of the hotel, a Tuscan-style mansion clad in Jerusalem stone at the edge of Biriya Forest. As the evening cools, the air smells of pine resin. The kitchen cooks Galilean food from local produce: fresh vegetables, slow stews, warm breads, seasonal fruit, all strictly kosher under Badatz supervision. Through the gaps in the palm-frond roof, the first stars come out.

After dinner, the stay. The suites look out over the forest, with Mount Canaan, Rosh Pina and the Kinneret below. There are only a few dozen of them, so the silence stays intact. It is the kind of quiet you only notice once you are in it.

The days are yours. The outdoor pool is heated to 28 degrees in autumn, with wet and dry saunas beside it. There are tennis courts, a library, and a tea corner with herbal infusions and homemade pastries. Biriya''s trails start almost at the door. Spa treatments are available on request, at extra cost.

In the morning, breakfast is back in the sukkah: omelets, fresh bread, salads, good coffee, the light coming through the schach. The holiday asks you to live outside for a week. Here, that feels less like a rule and more like an invitation.',

    'Un dîner de Soukkot sous la soukka du Setai Bayit Bagalil, en Haute-Galilée. Sept jours par an, la table sort dehors.

La soukka est dressée dans le domaine de l''hôtel, une demeure d''inspiration toscane en pierre de Jérusalem, en lisière de la forêt de Biriya. Quand le soir fraîchit, l''air sent la résine de pin. En cuisine, on prépare une table galiléenne avec les produits du coin : légumes frais, plats mijotés, pains chauds, fruits de saison, le tout strictement casher sous supervision Badatz. Les premières étoiles apparaissent entre les palmes du toit.

Après le dîner, le séjour. Les suites donnent sur la forêt, avec le mont Canaan, Rosh Pina et le lac de Tibériade en contrebas. Elles ne sont que quelques dizaines, et le silence reste entier. On ne le remarque qu''une fois dedans.

Les journées vous appartiennent. La piscine extérieure est chauffée à 28 degrés en automne, avec saunas sec et humide juste à côté. Il y a aussi des courts de tennis, une bibliothèque et un coin thé avec infusions et pâtisseries maison. Les sentiers de Biriya commencent presque au pas de la porte. Soins au spa sur demande, en supplément.

Le matin, le petit-déjeuner se prend à nouveau sous la soukka : omelettes, pain frais, salades, bon café, la lumière qui filtre à travers le skhakh. La fête demande de vivre dehors pendant une semaine. Ici, ça ressemble moins à une règle qu''à une invitation.',

    'ארוחת סוכות בסוכה של סטאי בית בגליל, בגליל העליון. שבעה ימים בשנה שבהם השולחן יוצא החוצה.

הסוכה ניצבת בשטח המלון, אחוזה בהשראה טוסקנית מצופה אבן ירושלמית, בשולי יער ביריה. כשהערב מתקרר, האוויר מריח משרף אורנים. המטבח מבשל אוכל גלילי מתוצרת מקומית: ירקות טריים, תבשילים איטיים, לחמים חמים ופירות העונה, הכל בכשרות מהודרת בהשגחת בד"ץ. מבעד לסכך מתחילים להופיע הכוכבים הראשונים.

אחרי הארוחה מגיעה השהייה. הסוויטות משקיפות אל היער, ומתחתן הר כנען, ראש פינה והכנרת. יש רק כמה עשרות סוויטות, ולכן השקט נשאר שלם. שקט כזה שמרגישים רק כשכבר נמצאים בתוכו.

הימים שלכם. הבריכה החיצונית מחוממת ל-28 מעלות בסתיו, ולצידה סאונה יבשה ורטובה. יש גם מגרשי טניס, ספרייה ופינת תה עם חליטות צמחים ומאפים ביתיים. שבילי ביריה מתחילים כמעט מפתח המלון. טיפולי ספא זמינים בתוספת תשלום.

בבוקר, ארוחת הבוקר חוזרת לסוכה: חביתות, לחם טרי, סלטים, קפה טוב, והאור שמסתנן מבעד לסכך. החג מבקש לגור בחוץ שבוע שלם. כאן, זה מרגיש פחות כמו מצווה ויותר כמו הזמנה.',

    0, 'per_person', 'ILS', 'bar_rate',
    2, 5, NULL, NULL,
    'HB',

    'Free cancellation up to 7 days before arrival. From 7 days before arrival, 50% of the booking is charged. No-show: 100%.',
    'Annulation gratuite jusqu''à 7 jours avant l''arrivée. À partir de 7 jours avant l''arrivée, 50 % du montant est facturé. No-show : 100 %.',
    'ביטול ללא עלות עד 7 ימים לפני ההגעה. מ-7 ימים לפני ההגעה יחויבו 50% מסכום ההזמנה. אי הגעה: חיוב מלא.',

    'Sukkot Dinner at The Setai Bayit Bagalil | STAYMAKOM',
    'A kosher Sukkot dinner in the sukkah at The Setai Bayit Bagalil, then a stay among the pines of Biriya Forest, Upper Galilee.',
    'Supper Under the Galilee Pines',
    'Sukkot in the Upper Galilee: dinner in the sukkah, a heated pool facing the mountains, breakfast under the schach.',

    'Soukkot au Setai Bayit Bagalil | STAYMAKOM',
    'Un dîner de fête casher sous la soukka du Setai Bayit Bagalil, puis un séjour au cœur des pins de Biriya, en Haute-Galilée.',
    'Dîner sous la soukka, au cœur des pins',
    'Soukkot en Haute-Galilée : dîner sous la soukka, piscine chauffée face aux montagnes, petit-déjeuner sous le skhakh.',

    'ארוחת סוכות בסטאי בית בגליל | STAYMAKOM',
    'ארוחת חג כשרה בסוכה של סטאי בית בגליל, ולינה בין אורני יער ביריה בגליל העליון.',
    'ארוחה בסוכה בין אורני הגליל',
    'סוכות בגליל העליון: ארוחת ערב בסוכה, בריכה מחוממת מול ההרים וארוחת בוקר תחת הסכך.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Dinner in the sukkah',           'ארוחת ערב בסוכה',        0, true),
    (exp_id, 'Breakfast under the schach',     'ארוחת בוקר תחת הסכך',    1, true),
    (exp_id, 'Heated pool and saunas',         'בריכה מחוממת וסאונות',   2, true),
    (exp_id, 'Biriya Forest trails',           'שבילי יער ביריה',        3, true);

  SELECT id INTO tag_dinner    FROM highlight_tags WHERE slug = 'dinner'    LIMIT 1;
  SELECT id INTO tag_breakfast FROM highlight_tags WHERE slug = 'breakfast' LIMIT 1;
  SELECT id INTO tag_kosher    FROM highlight_tags WHERE slug = 'kosher'    LIMIT 1;

  pos := 0;
  IF tag_dinner    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_dinner,    pos); pos := pos + 1; END IF;
  IF tag_breakfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_breakfast, pos); pos := pos + 1; END IF;
  IF tag_kosher    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher,    pos); END IF;

END $$;
